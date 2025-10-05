# mood_to_playlist.py
"""
Mood to Playlist Interpreter (hybrid LLM + deterministic fallback)

Public API:
  interpret_mood(emotion_text, activity_text, music_text, user_scores, explicit_flag, preferred_genres)

Return:
  playlist_spec (dict) - validated JSON spec version 1.0.0
"""

from __future__ import annotations
import json
import re
import time
import uuid
import html
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from math import floor

# External libs (ensure installed in your environment)
# pip install pydantic openai
from pydantic import BaseModel, Field, field_validator, ValidationError

# OPTIONAL: uncomment if you'll call OpenAI
import openai
import os
openai.api_key = os.getenv("OPENAI_API_KEY")

# --------------------------
# CONFIG
# --------------------------
SCHEMA_VERSION = "1.0.0"
USE_LLM = True  # set False to force deterministic fallback
LLM_MODEL = "gpt-4o-mini"  # or gpt-4o, adjust as needed
LLM_TEMP = 0.2
LLM_TIMEOUT_SECONDS = 5.0
LLM_MAX_RETRIES = 1
FALLBACK_CONFIDENCE_PENALTY = 0.15
CONFIDENCE_THRESHOLD = 0.60

# Allowed numeric bounds
MIN_FLOAT = 0.0
MAX_FLOAT = 1.0
MIN_TEMPO = 50
MAX_TEMPO = 200

# --------------------------
# SIMPLE SAMPLE MAP (expand offline)
# --------------------------
# This small starter map demonstrates format. Expand with a CSV file for production.
SAMPLE_KEYWORD_MAP = {
    "study": {
        "genres": ["lo-fi", "ambient"],
        "descriptors": ["focused", "calm"],
        "audio_features": {
            "energy": [0.20, 0.45],
            "valence": [0.30, 0.55],
            "danceability": [0.10, 0.35],
            "acousticness": [0.4, 0.8],
            "instrumentalness": [0.6, 0.95],
            "tempo_bpm": [60, 80],
        },
        "weight": 1.0,
    },
    "workout": {
        "genres": ["electronic", "pop"],
        "descriptors": ["energetic", "pump"],
        "audio_features": {
            "energy": [0.75, 1.0],
            "valence": [0.5, 0.9],
            "danceability": [0.6, 1.0],
            "acousticness": [0.0, 0.2],
            "instrumentalness": [0.0, 0.3],
            "tempo_bpm": [120, 170],
        },
        "weight": 1.0,
    },
    "sad": {
        "genres": ["indie", "acoustic"],
        "descriptors": ["melancholic", "sad"],
        "audio_features": {
            "energy": [0.1, 0.45],
            "valence": [0.0, 0.35],
            "danceability": [0.1, 0.4],
            "acousticness": [0.3, 0.8],
            "instrumentalness": [0.0, 0.6],
            "tempo_bpm": [60, 100],
        },
        "weight": 0.9,
    },
    "rain": {
        "genres": [],
        "descriptors": ["rainy"],
        "audio_features": {
            "acousticness": [0.5, 0.9],
            # using deltas is possible; here we treat as absolute for simplicity
        },
        "weight": 0.4,
    },
}

# Very small genre normalization map starter (expand outside)
GENRE_NORMALIZATION = {
    "hiphop": "hip-hop",
    "hip hop": "hip-hop",
    "rnb": "r-n-b",
    "lofi": "lo-fi",
    "lo-fi": "lo-fi",
    "electro": "electronic",
    "edm": "electronic",
}

# --------------------------
# SCHEMA USING Pydantic
# --------------------------
class AudioFeatures(BaseModel):
    energy: Tuple[float, float]
    valence: Tuple[float, float]
    danceability: Tuple[float, float]
    acousticness: Tuple[float, float]
    instrumentalness: Tuple[float, float]
    tempo_bpm: Tuple[int, int]

    @field_validator("*")
    @classmethod
    def check_ranges(cls, v, info):
        field_name = info.field_name
        if field_name == "tempo_bpm":
            mn, mx = v
            if mn < MIN_TEMPO:
                mn = MIN_TEMPO
            if mx > MAX_TEMPO:
                mx = MAX_TEMPO
            if mn > mx:
                mn, mx = mx, mn
            return (int(mn), int(mx))
        else:
            mn, mx = v
            # clamp floats
            mn = max(MIN_FLOAT, min(MAX_FLOAT, float(mn)))
            mx = max(MIN_FLOAT, min(MAX_FLOAT, float(mx)))
            if mn > mx:
                mn, mx = mx, mn
            return (mn, mx)

class Constraints(BaseModel):
    avoid_explicit: bool = False
    release_year_range: Optional[Tuple[int, int]] = None
    popularity_min: Optional[int] = None

class Metadata(BaseModel):
    interpretation_confidence: float = Field(..., ge=0.0, le=1.0)
    suggested_playlist_name: str
    mood_summary: str
    processing_notes: str
    fallback_used: Optional[bool] = False

class PlaylistSpec(BaseModel):
    version: str
    genres: List[str] = Field(..., min_items=1, max_items=5)
    mood_descriptors: List[str] = Field(..., min_items=1, max_items=6)
    audio_features: AudioFeatures
    constraints: Constraints
    metadata: Metadata

# --------------------------
# UTIL: Sanitization helpers
# --------------------------
def sanitize_text(s: str) -> str:
    if s is None:
        return ""
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    # Remove obvious PII forms (email, phone) - redact
    s = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", "<REDACTED_EMAIL>", s)
    s = re.sub(r"\b(\+?\d[\d\-\s]{6,}\d)\b", "<REDACTED_PHONE>", s)
    # escape HTML to avoid display issues
    s = html.escape(s)
    return s[:500]  # hard cap

def snippet(s: str, length=80) -> str:
    return (s[:length] + "...") if len(s) > length else s

# --------------------------
# UTIL: genre normalization
# --------------------------
def normalize_genre(g: str) -> str:
    if not g:
        return ""
    key = g.lower().strip()
    return GENRE_NORMALIZATION.get(key, key)

# --------------------------
# UTIL: simple tokenizer for fallback
# --------------------------
STOPWORDS = set([
    "with", "and", "the", "a", "an", "but", "for", "on", "in", "at", "to", "of", "my", "is"
])

def tokenize(text: str) -> List[str]:
    text = text.lower()
    # simple split and preserve 2-grams
    words = re.findall(r"[a-z0-9]+", text)
    tokens = []
    for i, w in enumerate(words):
        if w in STOPWORDS:
            continue
        tokens.append(w)
        # 2-grams
        if i+1 < len(words):
            bigram = f"{w} {words[i+1]}"
            if bigram not in STOPWORDS:
                tokens.append(bigram)
    return tokens

# --------------------------
# FALLBACK: deterministic specification builder
# --------------------------
def build_spec_from_keywords(
    tokens: List[str],
    explicit_flag: bool,
    user_genres: Optional[List[str]],
    user_scores: Dict[str, Any]
) -> PlaylistSpec:
    # aggregate weights and ranges
    collected_genres = []
    collected_descriptors = []
    feature_accumulators = {
        "energy": [],
        "valence": [],
        "danceability": [],
        "acousticness": [],
        "instrumentalness": [],
        "tempo_bpm": [],
    }
    weights = []

    for t in tokens:
        if t in SAMPLE_KEYWORD_MAP:
            entry = SAMPLE_KEYWORD_MAP[t]
            w = entry.get("weight", 1.0)
            weights.append(w)
            collected_genres.extend(entry.get("genres", []))
            collected_descriptors.extend(entry.get("descriptors", []))
            af = entry.get("audio_features", {})
            for k, v in af.items():
                feature_accumulators.setdefault(k, []).append((v, w))

    # If user provided preferred genres, put them first
    final_genres = []
    if user_genres:
        final_genres = [normalize_genre(g) for g in user_genres if g]
    # Add aggregated genres
    final_genres.extend(collected_genres)
    # dedupe preserving order
    seen = set()
    final_genres_unique = []
    for g in final_genres:
        if g and g not in seen:
            seen.add(g)
            final_genres_unique.append(g)
    if not final_genres_unique:
        final_genres_unique = ["indie", "pop"]  # safe defaults

    # merge features (weighted average of midpoints)
    def merge_feature(acc_list, default_range, is_tempo=False):
        if not acc_list:
            return default_range
        total_w = 0.0
        weighted_mid = 0.0
        for v, w in acc_list:
            # v is either [min,max] or a single value; assume range
            mn, mx = v
            mid = (mn + mx) / 2.0
            weighted_mid += mid * w
            total_w += w
        mid = weighted_mid / total_w if total_w > 0 else (default_range[0] + default_range[1]) / 2.0
        # produce a +-20% window around mid, clamped
        if is_tempo:
            lo = max(MIN_TEMPO, int(mid * 0.85))
            hi = min(MAX_TEMPO, int(mid * 1.15))
            return (lo, hi)
        else:
            lo = max(MIN_FLOAT, mid - 0.15)
            hi = min(MAX_FLOAT, mid + 0.15)
            if lo > hi:
                lo, hi = hi, lo
            return (round(lo, 3), round(hi, 3))

    # defaults for different moods (neutral)
    default_audio = {
        "energy": (0.4, 0.6),
        "valence": (0.4, 0.6),
        "danceability": (0.3, 0.6),
        "acousticness": (0.2, 0.6),
        "instrumentalness": (0.0, 0.4),
        "tempo_bpm": (80, 110),
    }

    audio_features = {}
    for k in feature_accumulators.keys():
        acc = feature_accumulators.get(k, [])
        audio_features[k] = merge_feature(acc, default_audio[k], is_tempo=(k == "tempo_bpm"))

    # Merge user numeric scores if provided (they override or nudge)
    # Expect user_scores keys: energy, valence, danceability, instrumentalness, tempo_bpm
    if user_scores:
        # Map numeric user scores [0-1] or BPM (tempo)
        for f in ["energy", "valence", "danceability", "instrumentalness"]:
            v = user_scores.get(f)
            if v is not None:
                # nudge existing range towards user value by 40%
                lo, hi = audio_features[f]
                mid = (lo + hi) / 2.0
                new_mid = mid * 0.6 + float(v) * 0.4
                lo = max(MIN_FLOAT, new_mid - (hi - lo) / 2.0)
                hi = min(MAX_FLOAT, new_mid + (hi - lo) / 2.0)
                audio_features[f] = (round(lo, 3), round(hi, 3))
        tempo_user = user_scores.get("tempo_bpm")
        if tempo_user:
            lo, hi = audio_features["tempo_bpm"]
            mid = (lo + hi) / 2.0
            new_mid = int(mid * 0.6 + int(tempo_user) * 0.4)
            lo = max(MIN_TEMPO, int(new_mid * 0.85))
            hi = min(MAX_TEMPO, int(new_mid * 1.15))
            audio_features["tempo_bpm"] = (lo, hi)

    # Build mood_descriptors
    descriptors = list(dict.fromkeys(collected_descriptors))[:5]
    if not descriptors:
        descriptors = ["neutral", "background"]

    constraints = {
        "avoid_explicit": bool(explicit_flag),
        "release_year_range": None,
        "popularity_min": None,
    }

    metadata = {
        "interpretation_confidence": round(max(0.15, 0.45 - FALLBACK_CONFIDENCE_PENALTY), 3),  # low by default
        "suggested_playlist_name": "Custom Mix",
        "mood_summary": "Deterministic fallback spec generated from keywords.",
        "processing_notes": "Deterministic fallback used; tokens matched: " + ", ".join(tokens[:10]),
        "fallback_used": True,
    }

    # Assemble spec dict and validate via Pydantic
    spec_dict = {
        "version": SCHEMA_VERSION,
        "genres": final_genres_unique[:5],
        "mood_descriptors": descriptors,
        "audio_features": {
            "energy": audio_features["energy"],
            "valence": audio_features["valence"],
            "danceability": audio_features["danceability"],
            "acousticness": audio_features["acousticness"],
            "instrumentalness": audio_features["instrumentalness"],
            "tempo_bpm": audio_features["tempo_bpm"],
        },
        "constraints": constraints,
        "metadata": metadata,
    }

    # Validate
    try:
        spec = PlaylistSpec(**spec_dict)
        return spec
    except ValidationError as e:
        # Fallback to safe defaults if validation fails
        safe_spec = {
            "version": SCHEMA_VERSION,
            "genres": ["lo-fi", "indie"],
            "mood_descriptors": ["neutral"],
            "audio_features": default_audio,
            "constraints": constraints,
            "metadata": {
                "interpretation_confidence": 0.25,
                "suggested_playlist_name": "Everyday Mix",
                "mood_summary": "Fallback default due to validation error.",
                "processing_notes": f"Validation error: {str(e)}",
                "fallback_used": True,
            },
        }
        return PlaylistSpec(**safe_spec)

# --------------------------
# LLM PROMPT BUILDERS
# --------------------------
SYSTEM_PROMPT = """
You are a Music-Curation Assistant. Given user inputs (emotion, activity, music description, numeric scores, explicit flag, and preferred genres),
return EXACTLY ONE JSON object that matches schema version 1.0.0. DO NOT return any prose or explanation.
Schema rules:
- genres: 1-5 normalized genres (lowercase).
- mood_descriptors: 1-6 short words.
- audio_features: ranges for energy/valence/danceability/acousticness/instrumentalness as floats 0.0-1.0; tempo_bpm as integers 50-200.
- constraints: include avoid_explicit boolean.
- metadata: include interpretation_confidence (0.0-1.0), suggested_playlist_name, mood_summary, processing_notes, fallback_used (bool).
Clamp out-of-range numeric values and describe the clamp in processing_notes.
Return only JSON.
""".strip()

FEW_SHOT_EXAMPLE = None  # optional: keep small or omitted to reduce tokens

def build_user_prompt(
    emotion_text: str,
    activity_text: str,
    music_text: str,
    user_scores: Dict[str, Any],
    explicit_flag: bool,
    preferred_genres: Optional[List[str]],
) -> str:
    # sanitized snippets included for traceability (not full PII)
    return json.dumps({
        "emotion_text": snippet(emotion_text, 120),
        "activity_text": snippet(activity_text, 120),
        "music_text": snippet(music_text, 120),
        "user_scores": user_scores,
        "explicit": bool(explicit_flag),
        "preferred_genres": preferred_genres or [],
        "instructions": "Return a single JSON PlaylistSpec per schema version 1.0.0. No commentary."
    }, ensure_ascii=False)

# --------------------------
# INTERPRETATION CONFIDENCE CALCULATOR
# --------------------------
def compute_confidence_from_response(parsed_json: Dict[str, Any], llm_used: bool, fallback_used: bool) -> float:
    score = 0.0
    # Clarity: presence of descriptors and genres
    if parsed_json.get("genres"):
        score += 0.35
    if parsed_json.get("mood_descriptors"):
        score += 0.25
    # Completeness: has audio_features
    if parsed_json.get("audio_features"):
        score += 0.2
    # Consistency: check ranges sensible
    try:
        af = parsed_json["audio_features"]
        # if values within expected bounds, add points
        valid = True
        for k, v in af.items():
            if k == "tempo_bpm":
                mn, mx = int(v[0]), int(v[1])
                if mn > mx or mn < MIN_TEMPO or mx > MAX_TEMPO:
                    valid = False
            else:
                mn, mx = float(v[0]), float(v[1])
                if mn > mx or mn < MIN_FLOAT or mx > MAX_FLOAT:
                    valid = False
        score += 0.15 if valid else 0.0
    except Exception:
        score += 0.0
    # Normalization success objective surrogate
    if not fallback_used:
        score += 0.05
    # Bound and return
    if fallback_used:
        score = max(0.0, score - FALLBACK_CONFIDENCE_PENALTY)
    return round(min(1.0, score), 3)

# --------------------------
# LLM CALL (wrapper)
# --------------------------
def call_llm(prompt_system: str, prompt_user: str) -> Tuple[Optional[Dict[str, Any]], Optional[str], float]:
    """
    Calls the LLM and returns (parsed_json_or_none, raw_text_or_none, latency_ms).
    Retries once if parse failure.
    """
    if not USE_LLM:
        return None, None, 0.0

    # The actual implementation depends on your OpenAI client.
    # Example with ChatCompletions (pseudo):
    # messages = [
    #   {"role":"system","content":prompt_system},
    #   {"role":"user","content":prompt_user},
    # ]
    # start = time.time()
    # try:
    #     resp = openai.ChatCompletion.create(model=LLM_MODEL,
    #                                         messages=messages,
    #                                         temperature=LLM_TEMP,
    #                                         max_tokens=600,
    #                                         timeout=LLM_TIMEOUT_SECONDS)
    #     text = resp.choices[0].message.content
    # except Exception as e:
    #     return None, None, (time.time()-start)*1000
    # latency = (time.time() - start) * 1000
    # # Try parse
    # try:
    #     parsed = json.loads(text)
    #     return parsed, text, latency
    # except json.JSONDecodeError:
    #     # retry once with stricter settings (not implemented here)
    return None, None, 0.0

def interpret_mood(
    emotion_text: str,
    activity_text: str,
    music_text: str,
    user_scores: Dict[str, Any],
    explicit_flag: bool = False,
    preferred_genres: Optional[List[str]] = None
) -> PlaylistSpec:
    """
    Main public API function for mood interpretation.

    Args:
        emotion_text: User's emotional state description
        activity_text: User's current/p planned activity
        music_text: User's music style preferences
        user_scores: Dict with keys: valence, energy, danceability, instrumentalness, tempo_bpm
        explicit_flag: Whether to allow explicit content
        preferred_genres: Optional list of preferred genres

    Returns:
        PlaylistSpec: Validated playlist specification
    """
    # Sanitize inputs
    emotion_clean = sanitize_text(emotion_text)
    activity_clean = sanitize_text(activity_text)
    music_clean = sanitize_text(music_text)

    # Combine all text for processing
    combined_text = f"{emotion_clean} {activity_clean} {music_clean}".strip()

    if not combined_text:
        # Return safe default if no input
        return build_spec_from_keywords(
            tokens=[],
            explicit_flag=explicit_flag,
            user_genres=preferred_genres,
            user_scores=user_scores or {}
        )

    # Try LLM first if enabled
    if USE_LLM:
        prompt_user = build_user_prompt(
            emotion_text=emotion_clean,
            activity_text=activity_clean,
            music_text=music_clean,
            user_scores=user_scores or {},
            explicit_flag=explicit_flag,
            preferred_genres=preferred_genres
        )

        parsed_json, raw_text, latency = call_llm(SYSTEM_PROMPT, prompt_user)

        if parsed_json:
            # Validate and return LLM result
            try:
                # Compute confidence
                confidence = compute_confidence_from_response(parsed_json, llm_used=True, fallback_used=False)
                parsed_json["metadata"]["interpretation_confidence"] = confidence

                spec = PlaylistSpec(**parsed_json)
                return spec
            except ValidationError as e:
                # LLM result invalid, fall through to fallback
                pass

    # Fallback to deterministic processing
    tokens = tokenize(combined_text)
    spec = build_spec_from_keywords(
        tokens=tokens,
        explicit_flag=explicit_flag,
        user_genres=preferred_genres,
        user_scores=user_scores or {}
    )

    return spec
