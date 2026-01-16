# TrackHero – YouTube Playlist Progress Tracker

TrackHero is a Chrome extension that helps you _actually finish_ YouTube playlists.

Instead of losing track of where you left off, TrackHero integrates directly into YouTube’s playlist UI, lets you mark videos as completed, keeps persistent progress across sessions, and even rewards you with a downloadable certificate once you finish a playlist.

This README is written for developers and curious GitHub visitors who want to understand how TrackHero works under the hood.

---

## What TrackHero Does (High-Level)

- Detects when you’re watching a YouTube playlist
- Injects a lightweight completion toggle next to each playlist item
- Tracks watched videos **locally** (no servers, no analytics)
- Shows playlist progress, last watched, and upcoming videos in the popup UI
- Generates a personalized completion certificate when you finish a playlist

All of this is done using **standard Chrome Extension APIs**, clean module boundaries, and DOM-driven integration with YouTube.

---

## Architecture Overview

TrackHero follows a classic **Chrome Extension (Manifest V3)** architecture:

```
┌───────────────────┐
│  Popup (UI Layer) │◄───────────────┐
└─────────▲─────────┘                │
          │                          │
┌─────────┴─────────┐      ┌─────────┴─────────┐
│  Content Script   │◄────►│ Background Script │
│  (YouTube DOM)    │      │ (State + Storage) │
└───────────────────┘      └───────────────────┘

        ┌────────────────────────┐
        │ chrome.storage (local) │
        └────────────────────────┘
```

Each layer has a **single responsibility**:

| Layer          | Responsibility                                         |
| -------------- | ------------------------------------------------------ |
| Background     | Message routing + persistent state updates             |
| Content Script | DOM observation & UI injection inside YouTube          |
| Popup          | Playlist overview, progress, navigation & certificates |
| Storage Module | Canonical data model for playlists                     |

---

## Background Script (`background.js`)

The background script acts as **the coordination layer** between YouTube pages and persistent storage.

### URL Parsing & Context Detection

A small helper extracts `videoId` and `playlistId` from YouTube watch URLs. If the user isn’t watching a playlist, TrackHero does nothing.

This keeps the extension dormant unless it’s relevant.

### Tab Lifecycle Awareness

The extension listens for tab updates and only sends messages **once the page is fully loaded**. This prevents race conditions where the content script tries to inject UI before YouTube finishes rendering.

### Message Handling

The background script responds to two core messages:

- `MARK_ITEM_COMPLETE`
- `REMOVE_ITEM_FROM_WATCHED`

It delegates the actual data mutation to the storage module and replies with success/failure so the UI can stay in sync.

> **Design choice:** All state changes go through the background script. Content scripts never mutate storage directly.

---

## Content Script (`content.js`)

This is where TrackHero integrates with YouTube.

### DOM Observation (MutationObserver)

YouTube dynamically re-renders playlist items as you scroll or navigate. To stay resilient, TrackHero uses a `MutationObserver` that:

- Watches for playlist rows
- Injects completion buttons when new items appear
- Avoids double-injection using `data-trackhero-injected`

Only **one observer** is kept alive at a time to avoid performance issues.

### Completion State Mapping

Instead of querying storage for every item, the content script builds a **Set of completed video IDs** once and keeps it updated via `chrome.storage.onChanged`.

This makes button rendering and toggling O(1).

### Injected UI Button

Each playlist row receives a minimal custom element:

- `+` → not completed
- `✓` → completed

Clicking the button sends a message to the background script, which updates storage and broadcasts the change back.

### Next-Unwatched Discovery

When marking a video as completed, the script walks forward in the playlist DOM to find the **next unwatched video**. This metadata is saved so the popup UI can provide smart navigation.

---

## Popup UI (`popup.html` + `popup.js`)

The popup is a **read-only dashboard + action surface**.

### Environment Awareness

On open, the popup:

1. Detects the active tab
2. Checks whether it’s a YouTube playlist watch page
3. Injects a scraper function into the page (using `chrome.scripting.executeScript`)

This avoids duplicating DOM parsing logic inside the popup.

### Playlist Scraping

The injected scraper extracts:

- Playlist title
- Channel name
- Total video count
- Current video title

All scraping is **non-invasive** and read-only.

### UI Rendering Strategy

Rendering is handled by a dedicated `renderUI` function that:

- Displays the active playlist (if detected)
- Shows tracked playlists with expandable details
- Separates active vs finished playlists

No framework is used — everything is built with vanilla JS and predictable DOM updates.

---

## Storage Model (`modules/storage.js`)

All persistent data lives in `chrome.storage.local`.

### Playlist Schema

```ts
{
  playlistId: string
  playlistTitle: string
  channelName: string
  totalVideos: number
  completedVideos: { id, title }[]
  lastWatched: { title, url } | null
  upcomingVideo: { title, url } | null
  isFinished: boolean
  lastUpdated: ISODateString
}
```

### Design Principles

- **Immutable updates** (map + filter)
- No duplicate video entries
- Graceful handling of edge cases
- Timestamped updates for future extensibility

Storage helpers are intentionally async and promise-based to keep the API clean.

---

## Certificate Generation (`utils.js`)

Once a playlist reaches 100%, TrackHero unlocks a feature: certificate generation.

### How It Works

- Custom fonts are loaded dynamically using `FontFace`
- A high-resolution `<canvas>` is created
- Text is centered, wrapped, and styled programmatically
- The result is exported as a downloadable PNG

No external libraries. No server rendering.

Everything happens locally, instantly.

---

## Privacy & Permissions

TrackHero is designed with a **privacy-first mindset**:

- No external APIs
- No analytics
- No remote servers
- All data stays on your machine

Permissions are limited to what’s strictly necessary:

- `tabs` – detect the active YouTube tab
- `storage` – persist playlist progress
- `scripting` – inject safe, read-only scrapers

---

## Why This Architecture?

TrackHero intentionally avoids frameworks and over-engineering.

The goal is:

- Predictable behavior
- Easy debugging
- Clear separation of concerns
- Full compatibility with Chrome Web Store policies

If you’re reading this as a developer: yes — this extension is deliberately boring in the best possible way.

---

## Contributing / Feedback

If you’re exploring this repo:

- Feel free to open issues
- Suggest architectural improvements
- Or just steal ideas for your own extensions

Happy tracking!
