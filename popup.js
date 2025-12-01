// popup.js
import { getActiveTab } from "./modules/utils.js";
import { scrapePlaylistData } from "./modules/scraper.js";
import { getPlaylists, savePlaylist } from "./modules/storage.js";
import { renderUI } from "./modules/ui.js";
import { markVideoAsWatched } from "./modules/storage.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Get Environment Data
  const activeTab = await getActiveTab();
  let currentPlaylistId = null;
  let videoId = null;
  let currentData = null;

  // 2. Try to scrape if we are on YouTube
  if (
    activeTab &&
    activeTab.url &&
    activeTab.url.includes("youtube.com/watch")
  ) {
    const urlParams = new URLSearchParams(activeTab.url.split("?")[1]);
    currentPlaylistId = urlParams.get("list");

    videoId = urlParams.get("v");

    if (currentPlaylistId) {
      try {
        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: scrapePlaylistData, // Imported from scraper.js
          args: [currentPlaylistId],
        });

        if (injectionResults && injectionResults[0]) {
          currentData = injectionResults[0].result;
          console.log("Scraped Data:", currentData);
        }
      } catch (e) {
        console.error("Script injection failed", e);
      }
    }
  }

  // 3. Define what happens when the user clicks "Save"
  const handleSaveAction = async (id, data) => {
    const updatedList = await savePlaylist(id, data);
    // Re-render with the new list
    renderUI(
      id,
      videoId,
      data,
      updatedList,
      handleSaveAction,
      handleMarkAction
    );
  };

  const handleMarkAction = async (playlistId, videoId) => {
    const updatedList = await markVideoAsWatched(playlistId, videoId);
    // Re-render with the new list
    renderUI(
      playlistId,
      videoId,
      currentData,
      updatedList,
      handleSaveAction,
      handleMarkAction
    );
  };

  // 4. Initial Load & Render
  const savedPlaylists = await getPlaylists();
  renderUI(
    currentPlaylistId,
    videoId,
    currentData,
    savedPlaylists,
    handleSaveAction,
    handleMarkAction
  );
});
