import os
import time
from typing import List, Dict, Optional, Any
import spotipy  # type: ignore
from spotipy.oauth2 import SpotifyOAuth  # type: ignore
from dotenv import load_dotenv  # type: ignore

load_dotenv()


class SpotifyClient:
    def __init__(self) -> None:
        self.scope = "playlist-modify-public playlist-modify-private user-read-private"
        self.sp = None
        self.auth_manager = None
        self.setup_auth()

    def setup_auth(self) -> None:
        """Set up Spotify authentication"""
        # TEMPORARY FOR HACKATHON - hardcode if .env isn't working
        client_id = "83a214a81029477fab98caf30fb4b000"
        client_secret = "818e5489a1364f82b191e18a056d4f5e"
        redirect_uri = "vibechef://callback"

        try:
        # Use CLIENT CREDENTIALS - no user login needed!
            from spotipy.oauth2 import SpotifyClientCredentials

            auth_manager = SpotifyClientCredentials(
                client_id=client_id,
                client_secret=client_secret
            )
            self.sp = spotipy.Spotify(auth_manager=auth_manager)
            print("✅ Spotify client initialized (no login needed)!")

        except Exception as e:
            print(f"❌ Failed to initialize: {e}")
            self.sp = None

            if not client_id or client_id == "YOUR_ACTUAL_CLIENT_ID_HERE":
                print("❌ ERROR: No Spotify credentials!")
                print("Please set up your Spotify app at https://developer.spotify.com/dashboard")
                return

        try:
            self.auth_manager = SpotifyOAuth(
                client_id=client_id,
                client_secret=client_secret,
                redirect_uri=redirect_uri,
                scope=self.scope,
                cache_path=".spotify_cache",
                open_browser=False  # Don't auto-open browser
            )
            self.sp = spotipy.Spotify(auth_manager=self.auth_manager)
            print("✅ Spotify client initialized successfully!")
        except Exception as e:
            print(f"❌ Failed to initialize Spotify: {e}")
            self.sp = None
            self.auth_manager = None

    def get_auth_url(self) -> Any:
        """Get the URL for user to authorize"""
        if not self.auth_manager:
            raise RuntimeError("Spotify auth manager not initialized")
        return self.auth_manager.get_authorize_url()

    def handle_callback(self, code: str) -> None:
        """Handle the callback from Spotify"""
        if not self.auth_manager:
            raise RuntimeError("Spotify auth manager not initialized")
        self.auth_manager.get_access_token(code)
        self.sp = spotipy.Spotify(auth_manager=self.auth_manager)

    def search_tracks(self, playlist_spec: Dict[str, Any], target_count: int = 20,
                     search_config: Optional[Dict[Any,Any]] = None) -> List[Dict[str, Any]]:
        """
        Main function: Convert playlist spec to actual tracks
        Returns: List of track objects with all metadata
        """
        tracks: List[Dict[str, Any]] = []

        # Extract from spec (supports Dev2 PlaylistSpec and legacy flat)
        genres = playlist_spec.get('genres', ['pop'])
        audio = playlist_spec.get('audio_features') or {}
        constraints = playlist_spec.get('constraints') or {}
        # Use midpoints for target features
        def mid(v: Any, default: float) -> float:
            try:
                if isinstance(v, (list, tuple)) and len(v) == 2:
                    return (float(v[0]) + float(v[1])) / 2.0
                return float(v)
            except Exception:
                return default
        energy = mid(audio.get('energy', playlist_spec.get('energy', 0.5)), 0.5)
        valence = mid(audio.get('valence', playlist_spec.get('valence', 0.5)), 0.5)
        avoid_explicit = bool(constraints.get('avoid_explicit', playlist_spec.get('avoid_explicit', False)))
        # Keywords fallback from mood descriptors
        keywords = playlist_spec.get('mood_descriptors') or playlist_spec.get('keywords') or []

        # Print for debugging
        print(f"Searching with genres: {genres}, energy: {energy}, valence: {valence}")

        try:
            # Layer 1: Get recommendations based on genres and features
            if not self.sp:
                raise RuntimeError("Spotify client not initialized")
            recommendations = self.sp.recommendations(
                seed_genres=[g for g in genres if isinstance(g, str)][:5],  # Max 5 genres
                target_energy=energy,
                target_valence=valence,
                limit=min(target_count * 2, 100)  # Get extra to filter
            )

            # Process each track
            for track in recommendations['tracks']:
                # Skip explicit if needed
                if avoid_explicit and track.get('explicit', False):
                    continue

                # Format track data
                track_data = {
                    'uri': track['uri'],
                    'id': track['id'],
                    'name': track['name'],
                    'artists': [artist['name'] for artist in track['artists']],
                    'explicit': track.get('explicit', False),
                    'preview_url': track.get('preview_url'),
                    'popularity': track.get('popularity', 0)
                }

                tracks.append(track_data)

                if len(tracks) >= target_count:
                    break

            # Layer 2: If not enough tracks, do keyword search
            if len(tracks) < target_count:
                if not keywords:
                    keywords = ['happy', 'chill']
                print(f"Need more tracks, searching keywords: {keywords}")

                for keyword in keywords:
                    search_results = self.sp.search(
                        q=keyword,
                        type='track',
                        limit=10
                    )

                    for track in search_results['tracks']['items']:
                        if avoid_explicit and track.get('explicit', False):
                            continue

                        # Check if already added (deduplication)
                        if any(t['id'] == track['id'] for t in tracks):
                            continue

                        track_data = {
                            'uri': track['uri'],
                            'id': track['id'],
                            'name': track['name'],
                            'artists': [artist['name'] for artist in track['artists']],
                            'explicit': track.get('explicit', False),
                            'preview_url': track.get('preview_url'),
                            'popularity': track.get('popularity', 0)
                        }
                        tracks.append(track_data)

                        if len(tracks) >= target_count:
                            break

                if len(tracks) >= target_count:
                    pass

            print(f"Found {len(tracks)} tracks")
            return tracks[:target_count]

        except Exception as e:
            print(f"Error searching tracks: {e}")
            return tracks  # Return what we have

    def create_playlist(self, name: str, description: str, tracks: List[Dict[str, Any]],
                       public: bool = True) -> Optional[Dict[str, Any]]:
        """
        Create a Spotify playlist and add tracks
        Returns: playlist metadata with URL
        """
        try:
            # Get user ID
            if not self.sp:
                raise RuntimeError("Spotify client not initialized")
            user = self.sp.current_user()
            user_id = user['id']

            # Create playlist
            playlist = self.sp.user_playlist_create(
                user=user_id,
                name=name,
                public=public,
                description=description
            )

            # Add tracks in batches (max 100 per request)
            track_uris = [track['uri'] for track in tracks]

            for i in range(0, len(track_uris), 100):
                batch = track_uris[i:i+100]
                self.sp.playlist_add_items(playlist['id'], batch)
                time.sleep(0.1)  # Rate limiting

            return {
                'id': playlist['id'],
                'url': playlist['external_urls']['spotify'],
                'name': playlist['name'],
                'track_count': len(tracks)
            }

        except Exception as e:
            print(f"Error creating playlist: {e}")
            return None

    def get_user_profile(self) -> Optional[Dict[str, Any]]:
        """Get current user profile"""
        try:
            if not self.sp:
                raise RuntimeError("Spotify client not initialized")
            return self.sp.current_user()
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None


# Test functions for your teammates
def create_mock_response() -> List[Dict[str, Any]]:
    """Create mock data for testing"""
    return [
        {
            'uri': 'spotify:track:mock1',
            'id': 'mock1',
            'name': 'Mock Song 1',
            'artists': ['Mock Artist'],
            'explicit': False,
            'preview_url': 'http://example.com',
            'popularity': 80
        }
    ]


# Quick test if running directly
if __name__ == "__main__":
    # Test the client
    print("Testing Spotify Client...")

    # Check if credentials are set
    if not os.getenv('SPOTIFY_CLIENT_ID'):
        print("❌ Missing SPOTIFY_CLIENT_ID in .env file")
        print("Please set up your .env file with Spotify credentials")
    else:
        print("✅ Credentials found")

        # Initialize client
        client = SpotifyClient()

        # Test with a sample spec
        test_spec = {
            'genres': ['pop', 'rock'],
            'energy': 0.7,
            'valence': 0.8,
            'avoid_explicit': True,
            'keywords': ['happy', 'upbeat']
        }

        print("\nSearching for tracks...")
        tracks = client.search_tracks(test_spec, target_count=30)

        if tracks:
            print(f"\n✅ Found {len(tracks)} tracks:")
            for i, track in enumerate(tracks, 1):
                print(f"{i}. {track['name']} by {', '.join(track['artists'])}")
        else:
            print("❌ No tracks found - check your Spotify credentials")