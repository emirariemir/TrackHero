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
    console.log("onUpdated:", { tabId, changeInfo, url: tab?.url });

    if (!tab.url) return;

    const info = parseYouTubeParams(tab.url);
    if (!info) return;

    if (changeInfo.status && changeInfo.status !== "complete") return;

    chrome.tabs
      .sendMessage(tabId, { type: "NEW", ...info })
      .then(() => console.log("Sent to content script:", info))
      .catch((err) => console.warn("Content script not ready:", err));
  });
});
