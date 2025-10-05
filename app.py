import streamlit as st
st.markdown(
    ("<p style='"
     "font-weight: bold; "
     "text-align: center; "
     "color: #6e58b9; "
     "font-size: 50px; "
     "font-family: Courier;"
     "'> Welcome to VibeChef </p>"
    ),
    unsafe_allow_html=True
)
all_moods = [
    "Happy", "Energetic", "Upbeat", "Chill", "Relaxed", "Mellow", "Calm", "Peaceful",
    "Focused", "Motivated", "Inspired", "Confident", "Groovy", "Playful", "Cozy",
    "Romantic", "Nostalgic", "Melancholic", "Sad", "Somber", "Reflective", "Introspective",
    "Dreamy", "Hyped", "Aggressive", "Dark", "Soothing", "Sleepy", "Study", "Party",
    "Workout", "Rainy Day", "Late Night", "Morning", "Road Trip", "Sunset"
]

all_genres = [
    "Pop", "Dance Pop", "Indie Pop", "Rock", "Alternative", "Indie Rock", "Classic Rock",
    "Metal", "Punk", "Hip Hop", "Rap", "R&B", "Soul", "Funk", "Disco", "Jazz", "Blues",
    "Country", "Folk", "Singer-Songwriter", "Latin", "Reggaeton", "Afrobeats", "Reggae",
    "Dancehall", "Electronic", "House", "Techno", "Trance", "Drum And Bass", "Dubstep",
    "Ambient", "Lo-Fi", "Synthwave", "K-Pop", "J-Pop", "Classical", "Soundtrack"
]
with st.container(border=True):
    moods = st.multiselect("Moods", all_moods)
    genres = st.multiselect("Genres", all_genres)
