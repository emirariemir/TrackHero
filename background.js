import { markVideoAsWatched } from "./modules/storage.js";

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
  if (request.type === "MARK_ITEM_COMPLETE" && request.url && request.title) {
    const info = parseYouTubeParams(request.url);
    if (info && info.hasPlaylist && info.videoId) {
      markVideoAsWatched(info.playlistId, info.videoId, request.title).catch(
        (err) => console.error("Failed to mark video as watched:", err)
      );
    }
  }
});
