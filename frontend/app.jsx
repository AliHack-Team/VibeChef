import React, { useState } from 'react';
import { AlertCircle, Loader2, Music, ExternalLink, Copy, Check } from 'lucide-react';

export default function VibeChef() {
  const [moodInput, setMoodInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [numTracks, setNumTracks] = useState(30);
  const [avoidExplicit, setAvoidExplicit] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const allGenres = [
    "Pop", "Dance Pop", "Indie Pop", "Rock", "Alternative", "Indie Rock", "Classic Rock",
    "Metal", "Punk", "Hip Hop", "Rap", "R&B", "Soul", "Funk", "Disco", "Jazz", "Blues",
    "Country", "Folk", "Singer-Songwriter", "Latin", "Reggaeton", "Afrobeats", "Reggae",
    "Dancehall", "Electronic", "House", "Techno", "Trance", "Drum And Bass", "Dubstep",
    "Ambient", "Lo-Fi", "Synthwave", "K-Pop", "J-Pop", "Classical", "Soundtrack"
  ];

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const removeGenre = (genre) => {
    setSelectedGenres(selectedGenres.filter(g => g !== genre));
  };

  const handleGenerate = async () => {
    if (!moodInput.trim()) {
      setError('Please describe your mood or activity');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Stage 1: Interpreting mood
      setStage('Interpreting your mood...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual API call
      // const moodResponse = await fetch('/api/interpret-mood', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     mood: moodInput, 
      //     genres: selectedGenres,
      //     energy: energyLevel,
      //     avoidExplicit 
      //   })
      // });
      // const moodSpec = await moodResponse.json();

      const moodSpec = {
        genres: selectedGenres.length > 0 ? selectedGenres : ['indie', 'electronic'],
        moodTags: ['relaxed', 'focus'],
        audioFeatures: {
          energy: energyLevel / 10,
          valence: 0.6,
          acousticness: 0.4
        }
      };

      // Stage 2: Searching tracks
      setStage('Searching for tracks...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Replace with actual API call
      // const tracksResponse = await fetch('/api/search-tracks', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     moodSpec, 
      //     numTracks,
      //     avoidExplicit 
      //   })
      // });
      // const tracks = await tracksResponse.json();

      const tracks = generateMockTracks(numTracks);

      // Stage 3: Creating playlist
      setStage('Creating your playlist...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual API call
      // const playlistResponse = await fetch('/api/create-playlist', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     name: `${moodInput} Vibes`,
      //     trackUris: tracks.map(t => t.uri)
      //   })
      // });
      // const playlist = await playlistResponse.json();

      const playlistUrl = 'https://open.spotify.com/playlist/example';
      const playlistName = `${moodInput} Vibes`;
      
      setResults({
        playlistUrl,
        playlistName,
        tracks,
        moodSpec,
        summary: `Created a ${playlistName} playlist with ${tracks.length} tracks featuring ${moodSpec.genres.join(', ')} vibes at energy level ${energyLevel}/10.`
      });

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setStage('');
    }
  };

  const generateMockTracks = (count) => {
    const mockArtists = ['Tycho', 'ODESZA', 'Bonobo', 'Chrome Sparks', 'Emancipator', 'Rufus Du Sol', 'Lane 8', 'Jon Hopkins'];
    const mockTitles = ['Awake', 'Dive', 'Bloom', 'Still Life', 'Meridian', 'Echo', 'Horizon', 'Dawn'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      artist: mockArtists[i % mockArtists.length],
      title: mockTitles[i % mockTitles.length] + (i > 7 ? ` ${Math.floor(i / 8) + 1}` : ''),
      uri: `spotify:track:${i}`
    }));
  };

  const handleCopySummary = () => {
    if (results?.summary) {
      navigator.clipboard.writeText(results.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#e0d0ff',
      fontFamily: "'Courier New', monospace",
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{
          fontSize: '90px',
          fontWeight: '900',
          textAlign: 'center',
          background: 'linear-gradient(270deg, #c8b5ff, #ff69eb, #ffa5d8, #d4a5ff, #c8b5ff)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'gradientShift 4s linear infinite',
          marginBottom: '20px'
        }}>
          Welcome to VibeChef
        </h1>

        <p style={{
          textAlign: 'center',
          fontSize: '1.1rem',
          color: '#b8a0d6',
          marginBottom: '50px'
        }}>
          Transform your mood into the perfect Spotify playlist
        </p>

        {/* Main Container */}
        <div style={{
          background: '#0a0a0a',
          border: '2px solid #b8a0d6',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(184, 160, 214, 0.2)'
        }}>
          {/* Mood Input */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.2rem',
              color: '#d4a5ff',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Describe your mood or activity
            </label>
            <textarea
              value={moodInput}
              onChange={(e) => setMoodInput(e.target.value)}
              placeholder="e.g., chill focus with rainy vibes, energetic workout session, late night studying..."
              rows={3}
              style={{
                width: '100%',
                padding: '15px 20px',
                background: '#1a1a1a',
                border: '2px solid #9980c7',
                borderRadius: '12px',
                color: '#c8b5ff',
                fontSize: '1rem',
                fontFamily: "'Courier New', monospace",
                outline: 'none',
                resize: 'vertical',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff69eb';
                e.target.style.boxShadow = '0 0 20px rgba(255, 105, 235, 0.4)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#9980c7';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Genre Selector */}
          <div style={{ marginBottom: '30px', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '1.2rem',
              color: '#d4a5ff',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              Select Genres
            </label>
            
            {/* Dropdown Toggle */}
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                padding: '15px 20px',
                background: '#1a1a1a',
                border: '2px solid #9980c7',
                borderRadius: '12px',
                color: '#c8b5ff',
                fontSize: '1rem',
                fontFamily: "'Courier New', monospace",
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#d4a5ff';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 165, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#9980c7';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>
                {selectedGenres.length === 0 
                  ? 'Choose options' 
                  : `${selectedGenres.length} selected`}
              </span>
              <span style={{ 
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                padding: '15px',
                background: '#1a1a1a',
                border: '2px solid #9980c7',
                borderRadius: '12px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 8px 25px rgba(184, 160, 214, 0.3)'
              }}>
                {allGenres.map(genre => (
                  <div
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    style={{
                      padding: '10px 12px',
                      margin: '4px 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.2s ease',
                      background: selectedGenres.includes(genre) ? '#2a2a2a' : 'transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#2a2a2a'}
                    onMouseOut={(e) => {
                      if (!selectedGenres.includes(genre)) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => {}}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: '#ff69eb'
                      }}
                    />
                    <span style={{ color: '#c8b5ff' }}>{genre}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Genre Tags */}
            {selectedGenres.length > 0 && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {selectedGenres.map(genre => (
                  <div
                    key={genre}
                    style={{
                      padding: '6px 12px',
                      background: '#9980c7',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{genre}</span>
                    <button
                      onClick={() => removeGenre(genre)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: 0,
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Energy Level Slider */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              fontSize: '1.3rem',
              background: 'linear-gradient(90deg, #c8b5ff 0%, #ff69eb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}>
              Energy Level: {energyLevel}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '12px',
                background: 'linear-gradient(90deg, #ff69eb 0%, #d4a5ff 25%, #c8b5ff 50%, #b8a0d6 75%, #9980c7 100%)',
                borderRadius: '10px',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(212, 165, 255, 0.3)'
              }}
            />
          </div>

          {/* Options Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '25px',
            marginBottom: '30px'
          }}>
            {/* Number of Tracks */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '1rem',
                color: '#d4a5ff',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Number of Tracks
              </label>
              <input
                type="number"
                value={numTracks}
                onChange={(e) => setNumTracks(Math.max(1, Math.min(50, parseInt(e.target.value) || 30)))}
                min="1"
                max="50"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a1a',
                  border: '2px solid #9980c7',
                  borderRadius: '12px',
                  color: '#c8b5ff',
                  fontSize: '1rem',
                  fontFamily: "'Courier New', monospace"
                }}
              />
            </div>

            {/* Avoid Explicit Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: '#1a1a1a',
              border: '2px solid #9980c7',
              borderRadius: '12px'
            }}>
              <input
                type="checkbox"
                id="explicit"
                checked={avoidExplicit}
                onChange={(e) => setAvoidExplicit(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#ff69eb'
                }}
              />
              <label htmlFor="explicit" style={{
                fontSize: '1rem',
                color: '#d4a5ff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                Avoid explicit content
              </label>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading ? '#6d5a8f' : 'linear-gradient(135deg, #ff69eb, #c8b5ff)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              fontFamily: "'Courier New', monospace",
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(255, 105, 235, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {loading ? (
              <>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                {stage}
              </>
            ) : (
              <>
                <Music size={24} />
                Generate Playlist
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div style={{
              marginTop: '20px',
              padding: '15px 20px',
              background: 'rgba(255, 69, 58, 0.1)',
              border: '2px solid rgba(255, 69, 58, 0.5)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ff6b6b'
            }}>
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div style={{
              marginTop: '40px',
              padding: '30px',
              background: '#1a1a1a',
              border: '2px solid #9980c7',
              borderRadius: '12px'
            }}>
              <h2 style={{
                fontSize: '2rem',
                background: 'linear-gradient(90deg, #c8b5ff 0%, #ff69eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '20px'
              }}>
                {results.playlistName}
              </h2>

              {/* Summary with Copy Button */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '25px',
                padding: '15px',
                background: '#0a0a0a',
                borderRadius: '8px'
              }}>
                <p style={{ flex: 1, margin: 0, color: '#b8a0d6' }}>
                  {results.summary}
                </p>
                <button
                  onClick={handleCopySummary}
                  style={{
                    padding: '8px 12px',
                    background: copied ? '#4caf50' : '#9980c7',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Playlist Link */}
              <a
                href={results.playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #ff69eb, #c8b5ff)',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  marginBottom: '30px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(255, 105, 235, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Open in Spotify
                <ExternalLink size={18} />
              </a>

              {/* Track List */}
              <h3 style={{
                fontSize: '1.3rem',
                color: '#d4a5ff',
                marginBottom: '15px',
                marginTop: '30px'
              }}>
                Track List ({results.tracks.length} tracks)
              </h3>
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                background: '#0a0a0a',
                borderRadius: '8px',
                padding: '15px'
              }}>
                {results.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    style={{
                      padding: '12px',
                      borderBottom: index < results.tracks.length - 1 ? '1px solid #333' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      color: '#9980c7',
                      fontSize: '0.9rem',
                      minWidth: '30px'
                    }}>
                      {index + 1}.
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#c8b5ff', fontWeight: 'bold' }}>
                        {track.title}
                      </div>
                      <div style={{ color: '#b8a0d6', fontSize: '0.9rem' }}>
                        {track.artist}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 30px;
          height: 30px;
          background: #ffa5d8;
          border: 3px solid #ff69eb;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 105, 235, 0.6);
          transition: all 0.3s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 105, 235, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 30px;
          height: 30px;
          background: #ffa5d8;
          border: 3px solid #ff69eb;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 105, 235, 0.6);
          transition: all 0.3s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(255, 105, 235, 0.8);
        }
      `}</style>
    </div>
  );
}