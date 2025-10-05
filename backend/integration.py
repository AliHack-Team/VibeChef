from __future__ import annotations
from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import List, Dict, Any, Optional

from .mood_to_playlist import interpret_mood, PlaylistSpec
from .spotify_client import SpotifyClient


app = FastAPI(title="VibeChef API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class InterpretRequest(BaseModel):  # type: ignore[misc]
    mood: str
    activity: Optional[str] = ""
    music: Optional[str] = ""
    avoid_explicit: bool = False
    genres: Optional[List[str]] = None
    scores: Optional[Dict[str, Any]] = None


class SearchRequest(BaseModel):  # type: ignore[misc]
    spec: Dict[str, Any]
    count: int = 30


class CreatePlaylistRequest(BaseModel):  # type: ignore[misc]
    name: str
    description: Optional[str] = ""
    public: bool = True
    tracks: List[Dict[str, Any]]


spotify = SpotifyClient()  # type: ignore[call-arg]


@app.post("/api/interpret-mood")
def api_interpret(req: InterpretRequest) -> Dict[str, Any]:  # type: ignore[misc]
    spec: PlaylistSpec = interpret_mood(
        emotion_text=req.mood,
        activity_text=req.activity or "",
        music_text=req.music or "",
        user_scores=req.scores or {},
        explicit_flag=req.avoid_explicit,
        preferred_genres=req.genres or [],
    )
    return spec.model_dump()


@app.post("/api/search-tracks")
def api_search(req: SearchRequest) -> Dict[str, Any]:  # type: ignore[misc]
    try:
        tracks = spotify.search_tracks(playlist_spec=req.spec, target_count=req.count)
        return {"tracks": tracks, "count": len(tracks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/create-playlist")
def api_create_playlist(req: CreatePlaylistRequest) -> Dict[str, Any]:  # type: ignore[misc]
    try:
        playlist = spotify.create_playlist(
            name=req.name,
            description=req.description or "",
            tracks=req.tracks,
            public=req.public,
        )
        if not playlist:
            raise HTTPException(status_code=502, detail="Failed to create playlist")
        return playlist
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
def api_health() -> Dict[str, Any]:  # type: ignore[misc]
    return {"status": "ok"}


