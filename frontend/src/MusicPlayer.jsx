import React, { useState, useRef, useEffect } from 'react';

const MusicPlayer = ({ tracks = [] }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const audioRef = useRef(null);

  // Sample tracks with royalty-free music URLs
  const sampleTracks = [
    {
      id: 1,
      title: "Acoustic Breeze",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3"
    },
    {
      id: 2,
      title: "Sunny",
      artist: "Benjamin Tissot", 
      url: "https://www.bensound.com/bensound-music/bensound-sunny.mp3"
    },
    {
      id: 3,
      title: "Better Days",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-betterdays.mp3"
    },
    {
      id: 4,
      title: "Ukulele",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3"
    },
    {
      id: 5,
      title: "Creative Minds",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-creativeminds.mp3"
    },
    {
      id: 6,
      title: "Little Idea",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-littleidea.mp3"
    },
    {
      id: 7,
      title: "Jazzy Frenchy",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-jazzyfrenchy.mp3"
    },
    {
      id: 8,
      title: "Funky Suspense",
      artist: "Benjamin Tissot",
      url: "https://www.bensound.com/bensound-music/bensound-funkysuspense.mp3"
    }
  ];

  // Transform tracks to match our format and use provided tracks or fall back to sample tracks
  const transformTracks = (tracks) => {
    return tracks.map((track, index) => ({
      id: track.id || Math.random(),
      title: track.name || track.title || 'Unknown Track',
      artist: Array.isArray(track.artists) ? track.artists.join(', ') : (track.artist || 'Unknown Artist'),
      url: track.preview_url || track.url || sampleTracks[index % sampleTracks.length].url
    }));
  };

  const playlistTracks = tracks.length > 0 ? transformTracks(tracks) : sampleTracks;

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.volume = volume / 100;

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    nextSong();
  };

  const playPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Audio play failed:', error);
        // Fallback to sample track if current track fails
        if (currentTrack && !currentTrack.url.includes('bensound.com')) {
          const fallbackTrack = sampleTracks[currentSongIndex % sampleTracks.length];
          audio.src = fallbackTrack.url;
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {
            console.log('Fallback audio also failed');
          });
        }
      });
    }
  };

  const nextSong = () => {
    const nextIndex = (currentSongIndex + 1) % playlistTracks.length;
    setCurrentSongIndex(nextIndex);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  const prevSong = () => {
    const prevIndex = (currentSongIndex - 1 + playlistTracks.length) % playlistTracks.length;
    setCurrentSongIndex(prevIndex);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    if (isPlaying) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.log('Audio play failed on song select:', error);
        setIsPlaying(false);
      });
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    audioRef.current.volume = newVolume / 100;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrack = playlistTracks[currentSongIndex];
  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{
      marginTop: '40px',
      padding: '30px',
      background: '#1a1a1a',
      border: '2px solid #9980c7',
      borderRadius: '12px'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        color: '#d4a5ff',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        🎵 Music Player
      </h3>

      {/* Now Playing Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '25px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px' }}>
          Now Playing
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
          {currentTrack?.title || 'Select a song'}
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>
          {currentTrack?.artist || ''}
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        preload="metadata"
      />

      {/* Progress Bar */}
      <div style={{
        marginBottom: '20px'
      }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#333',
            borderRadius: '10px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={handleProgressClick}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #ff69eb, #c8b5ff)',
              width: `${progress}%`,
              transition: 'width 0.1s ease',
              borderRadius: '10px'
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '8px',
          fontSize: '0.9rem',
          color: '#b8a0d6'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <button
          onClick={prevSong}
          style={{
            background: 'linear-gradient(135deg, #ff69eb, #c8b5ff)',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 20px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Courier New', monospace"
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
          ⏮️ Previous
        </button>

        <button
          onClick={playPause}
          style={{
            background: 'linear-gradient(135deg, #ff69eb, #c8b5ff)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 8px 25px rgba(255, 105, 235, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={nextSong}
          style={{
            background: 'linear-gradient(135deg, #ff69eb, #c8b5ff)',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 20px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontFamily: "'Courier New', monospace"
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
          Next ⏭️
        </button>
      </div>

      {/* Volume Control */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <span style={{ color: '#d4a5ff', fontSize: '1.2rem' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: '150px',
            height: '8px',
            background: 'linear-gradient(90deg, #ff69eb 0%, #c8b5ff 100%)',
            borderRadius: '10px',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <span style={{ color: '#d4a5ff', fontSize: '0.9rem', minWidth: '40px' }}>
          {volume}%
        </span>
      </div>

      {/* Playlist */}
      <div>
        <h4 style={{
          fontSize: '1.2rem',
          color: '#d4a5ff',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          Playlist ({playlistTracks.length} tracks)
        </h4>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          background: '#0a0a0a',
          borderRadius: '8px',
          padding: '15px'
        }}>
          {playlistTracks.map((track, index) => (
            <div
              key={track.id || index}
              onClick={() => selectSong(index)}
              style={{
                padding: '12px 16px',
                margin: '8px 0',
                background: index === currentSongIndex ? '#2a2a2a' : 'transparent',
                border: index === currentSongIndex ? '2px solid #ff69eb' : '2px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseOver={(e) => {
                if (index !== currentSongIndex) {
                  e.currentTarget.style.background = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#9980c7';
                }
              }}
              onMouseOut={(e) => {
                if (index !== currentSongIndex) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  color: index === currentSongIndex ? '#ff69eb' : '#c8b5ff',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {track.title}
                </div>
                <div style={{
                  color: '#b8a0d6',
                  fontSize: '0.9rem'
                }}>
                  {track.artist}
                </div>
              </div>
              <div style={{
                color: index === currentSongIndex ? '#ff69eb' : '#9980c7',
                fontSize: '1.2rem',
                marginLeft: '15px'
              }}>
                {index === currentSongIndex && isPlaying ? '♪' : '▶️'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
