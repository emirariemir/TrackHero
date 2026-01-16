# TrackHero

TrackHero is a Chrome extension that helps you track your progress through YouTube playlists and celebrate completion with a simple certificate.

## Technologies

- JavaScript, HTML, CSS
- Chrome Extension (Manifest V3)
- Chrome storage + content scripts

## How It Works (High Level)

- Detects YouTube playlist watch pages.
- Lets you save a playlist to track progress.
- Adds a quick toggle button beside each playlist item to mark it watched.
- Updates progress and shows last watched / upcoming videos.
- Generates a completion certificate when you finish a playlist.

## How To Use

1. Load the extension in Chrome.
   - Go to `chrome://extensions`.
   - Enable Developer mode.
   - Click "Load unpacked" and select this project folder.
   <!-- Screenshot: Chrome extensions load unpacked -->

2. Open a YouTube video that is part of a playlist.
   <!-- Screenshot: YouTube playlist watch page -->

3. Click the TrackHero icon in the toolbar to open the popup and click "Track Playlist."
   <!-- Screenshot: TrackHero popup with Track Playlist button -->

4. On the playlist page, use the small + / check button next to each video to mark it watched.
   <!-- Screenshot: Playlist item with TrackHero toggle button -->

5. Watch your progress update in the popup, and open last watched / upcoming videos from there.
   <!-- Screenshot: Popup progress + navigation section -->

6. When the playlist reaches 100%, claim your certificate from the popup.
   <!-- Screenshot: Certificate button and/or generated certificate -->

## Notes

- Works on YouTube watch pages with a playlist.
- Progress is stored locally in your browser.
