// background.js

import {
  markVideoAsWatched,
  removeVideoFromWatched,
} from "./modules/storage.js";

/**
 * parseYouTubeParams(urlStr)
 * -------------------------
 * Tries to read a YouTube watch URL and pull out the video and playlist IDs, noting whether a playlist is present.
 * Returns null for non-YouTube or malformed links so callers can skip unnecessary work.
 */
function parseYouTubeParams(urlStr) {
  try {
    const url = new URL(urlStr);
    if (url.hostname.includes("youtube.com") && url.pathname === "/watch") {
      const videoId = url.searchParams.get("v");
      const playlistId = url.searchParams.get("list");
      return { videoId, playlistId, hasPlaylist: !!playlistId };
    }
  } catch (e) {}
  return null;
}

/**
 * onInstalled listener
 * --------------------
 * After installation, watches tab updates and notifies the content script when a YouTube watch page finishes loading.
 * Ensures messages are only sent once the page is complete so the content script can safely inject UI.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url) return;

    const info = parseYouTubeParams(tab.url);
    if (!info) return;

    if (changeInfo.status && changeInfo.status !== "complete") return;

    chrome.tabs
      .sendMessage(tabId, { type: "NEW", ...info })
      .catch((err) => console.warn("Content script not ready:", err));
  });
});

/**
 * onMessage listener
 * ------------------
 * Responds to content script messages to mark or unmark a video as watched when a playlist context exists.
 * Delegates to storage helpers and replies with success or failure so the UI can reflect the latest state.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const info = request.url ? parseYouTubeParams(request.url) : null;

  if (!info || !info.hasPlaylist || !info.videoId) {
    return false;
  }

  if (request.type === "MARK_ITEM_COMPLETE" && request.title) {
    markVideoAsWatched(info.playlistId, info.videoId, request.title, {
      lastWatchedUrl: request.lastWatchedUrl,
      lastWatchedTitle: request.lastWatchedTitle,
      upcomingVideoUrl: request.upcomingVideoUrl,
      upcomingVideoTitle: request.upcomingVideoTitle,
    })
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("Mark watched failed", err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (request.type === "REMOVE_ITEM_FROM_WATCHED") {
    removeVideoFromWatched(info.playlistId, info.videoId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("Remove watched failed", err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
