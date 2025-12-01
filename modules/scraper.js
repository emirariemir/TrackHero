// modules/scraper.js

export const scrapePlaylistData = (playlistId) => {
  // A. Get Title
  const titleSelector = `a[href*="${playlistId}"].yt-simple-endpoint.style-scope.yt-formatted-string`;
  const titleEl = document.querySelector(titleSelector);
  const title = titleEl ? titleEl.textContent.trim() : "Unknown Playlist";

  // B. Get Channel Name
  const channelSelector = "ytd-playlist-panel-renderer span#byline";
  const channelEl = document.querySelector(channelSelector);
  const channelName = channelEl ? channelEl.textContent.trim() : "";

  // C. Get Total Video Count
  let totalVideos = 0;
  const indexElement = document.querySelector(
    ".index-message-wrapper .index-message"
  );
  if (indexElement) {
    const text = indexElement.textContent.trim();
    const parts = text.split("/");
    if (parts.length > 1) {
      totalVideos = parseInt(parts[1].trim(), 10) || 0;
    }
  }

  return {
    title,
    channelName,
    total: totalVideos,
  };
};
