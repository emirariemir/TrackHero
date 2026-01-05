// popup.js
import {
  getActiveTab,
  getUserName,
  setUserName,
  showSettingsModal,
} from "./modules/utils.js";
import { scrapePlaylistData } from "./modules/scraper.js";
import {
  getPlaylists,
  savePlaylist,
  resetPlaylistProgress,
  deletePlaylist,
} from "./modules/storage.js";
import { renderUI } from "./modules/ui.js";

// Initialize greeting on load
const initGreeting = async () => {
  const userName = await getUserName();
  const greetingEl = document.getElementById("user-greeting");
  greetingEl.textContent = `Hello there, ${userName}`;
};

// Setup settings icon click handler
const setupSettingsHandler = () => {
  const settingsIcon = document.getElementById("settings-icon");
  const greetingEl = document.getElementById("user-greeting");

  const openSettings = async () => {
    const currentName = await getUserName();
    showSettingsModal(currentName, async (newName) => {
      await setUserName(newName);
      greetingEl.textContent = `Hello there, ${newName}`;
    });
  };

  settingsIcon.addEventListener("click", openSettings);
  greetingEl.addEventListener("click", openSettings);
};

document.addEventListener("DOMContentLoaded", async () => {
  await initGreeting();
  setupSettingsHandler();

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
      data,
      updatedList,
      handleSaveAction,
      handleResetPlaylistAction,
      handleDeleteAction
    );
  };

  const handleResetPlaylistAction = async (playlistId) => {
    const confirmReset = confirm(
      "Are you sure you want to reset progress for this playlist?"
    );
    if (confirmReset) {
      const updatedList = await resetPlaylistProgress(playlistId);

      renderUI(
        currentPlaylistId,
        currentData,
        updatedList,
        handleSaveAction,
        handleResetPlaylistAction,
        handleDeleteAction
      );
    }
  };

  const handleDeleteAction = async (playlistId) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this playlist?"
    );
    if (confirmDelete) {
      const updatedList = await deletePlaylist(playlistId);
      // Re-render UI with the updated list
      renderUI(
        currentPlaylistId,
        currentData,
        updatedList,
        handleSaveAction,
        handleResetPlaylistAction,
        handleDeleteAction
      );
    }
  };

  // 4. Initial Load & Render
  const savedPlaylists = await getPlaylists();
  renderUI(
    currentPlaylistId,
    currentData,
    savedPlaylists,
    handleSaveAction,
    handleResetPlaylistAction,
    handleDeleteAction
  );
});
