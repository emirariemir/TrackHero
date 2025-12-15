// background.js

import {
  markVideoAsWatched,
  removeVideoFromWatched,
} from "./modules/storage.js";

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
