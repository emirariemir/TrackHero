// background.js

import {
  markVideoAsWatched,
  removeVideoFromWatched,
} from "./modules/storage.js";

/*
 * parseYouTubeParams(urlStr)
 * ---------------------------
 * Utility function to extract 'videoId' and 'playlistId' from a raw URL string.
 *
 * Checks if the URL belongs to "youtube.com/watch".
 * Returns an object containing the IDs and a boolean 'hasPlaylist' flag.
 * Returns null if the URL is invalid or not a YouTube watch page.
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

/*
 * Navigation & Tab Update Listener
 * --------------------------------
 * Detects when the user navigates within YouTube.
 *
 * Since YouTube is a Single Page Application (SPA), the page doesn't always
 * reload when switching videos. We listen for 'onUpdated' events to catch
 * URL changes.
 *
 * Logic:
 * 1. Checks if the new URL is a valid YouTube video with a playlist.
 * 2. Waits for the page status to be 'complete' to ensure the DOM is ready.
 * 3. Sends a "NEW" message to the content script to trigger a re-scan of the page.
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

/*
 * Message Listener
 * ----------------
 * Handles asynchronous requests sent from the content script.
 *
 * Supports two main operations:
 * 1. MARK_ITEM_COMPLETE: Saves the video to the completed list in storage.
 * 2. REMOVE_ITEM_FROM_WATCHED: Removes the video from the completed list.
 *
 * Return value:
 * Returns 'true' to keep the message channel open, allowing for
 * asynchronous responses (sendResponse) after the storage operations finish.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const info = request.url ? parseYouTubeParams(request.url) : null;

  if (!info || !info.hasPlaylist || !info.videoId) {
    return false;
  }

  // Handle ADD
  if (request.type === "MARK_ITEM_COMPLETE" && request.title) {
    markVideoAsWatched(info.playlistId, info.videoId, request.title)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error("Mark watched failed", err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  // Handle REMOVE
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
