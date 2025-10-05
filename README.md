# VibeChef 🎵

Transform your mood into the perfect music playlist with VibeChef! Describe your mood or activity, and our app instantly generates a personalized playlist with a built-in music player.

## Features

- **🎭 Mood-Based Playlist Generation**: Describe your mood in plain English (e.g., "energetic workout session", "chill study vibes")
- **🎨 Genre Selection**: Choose from 40+ music genres including Pop, Rock, Electronic, Jazz, and more
- **⚡ Energy Level Control**: Adjust the energy level from 1-10 to fine-tune your playlist
- **🎵 Built-in Music Player**: Play your generated playlists directly in the app with full controls
- **📱 Responsive Design**: Beautiful dark theme with purple/pink gradients and smooth animations
- **🎧 Sample Music Library**: Enjoy royalty-free tracks while testing the app

## How to Use

1. **Describe Your Mood**: Enter your mood or activity in the text area
2. **Select Genres** (Optional): Choose your preferred music genres
3. **Set Energy Level**: Use the slider to adjust energy from 1-10
4. **Choose Track Count**: Select how many tracks you want (1-50)
5. **Generate Playlist**: Click the generate button to create your playlist
6. **Play Music**: Use the built-in music player to enjoy your playlist

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd VibeChef
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Tech Stack

- **Frontend**: React, Vite, JavaScript
- **Styling**: CSS-in-JS with custom dark theme
- **Audio**: HTML5 Audio API with fallback system
- **Icons**: Lucide React

## Project Structure

```
VibeChef/
├── frontend/
│   ├── src/
│   │   ├── MusicPlayer.jsx    # Music player component
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── app.jsx                # Main application component
│   ├── package.json           # Dependencies and scripts
│   └── vite.config.js         # Vite configuration
├── backend/                   # Backend components (not used in current version)
└── README.md
```

## Features in Detail

### Smart Playlist Generation
- Analyzes mood keywords to select appropriate artists and track titles
- Energy level influences track selection (high energy = energetic titles)
- Genre selection filters artist pools for more targeted results

### Music Player
- Full-featured HTML5 audio player with play/pause, next/previous controls
- Progress bar with click-to-seek functionality
- Volume control slider
- Auto-play next track when current track ends
- Visual feedback for current playing track

### Sample Music
- 8 royalty-free tracks from Bensound
- Covers multiple genres: acoustic, jazz, electronic, ambient
- Fallback system ensures music always plays

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
