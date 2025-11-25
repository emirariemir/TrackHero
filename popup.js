// popup.js

/**
 * 1. DOM SCRAPER (Runs inside the page)
 */
const fetchPlaylistTitleFromDOM = (playlistId) => {
  const selector = `a[href*="${playlistId}"].yt-simple-endpoint.style-scope.yt-formatted-string`;
  const titleElement = document.querySelector(selector);
  return titleElement ? titleElement.textContent.trim() : null;
};

/**
 * 2. CORE FUNCTIONS
 */

// Function to handle saving the playlist
const handleSave = (playlistId, playlistTitle) => {
  chrome.storage.local.get(["playlists"], (result) => {
    const playlists = result.playlists || [];

    // Check if already saved to prevent duplicates
    const exists = playlists.some((p) => p.playlistId === playlistId);

    if (!exists) {
      const newPlaylist = {
        playlistId: playlistId,
        playlistTitle: playlistTitle || "Unknown Playlist",
      };

      const updatedPlaylists = [...playlists, newPlaylist];

      chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
        // Refresh the UI with the new data
        updateUI(playlistId, playlistTitle, updatedPlaylists);
      });
    }
  });
};

// Function to update the DOM
const updateUI = (currentId, currentTitle, playlists) => {
  const currentContainer = document.getElementById("current-section");
  const savedContainer = document.getElementById("saved-list");

  // Reset containers
  currentContainer.innerHTML = "";
  savedContainer.innerHTML = "";

  // Check if the current playlist is already in our saved list
  const isAlreadySaved = playlists.some((p) => p.playlistId === currentId);

  // --- RENDER CURRENT SECTION ---
  if (!currentId) {
    currentContainer.innerHTML =
      '<div class="empty-state">No active playlist found</div>';
  } else {
    const displayName = currentTitle || "Loading title...";

    const activeCard = document.createElement("div");
    activeCard.className = "playlist-item active-card";

    // Base HTML for the card
    let cardHtml = `
      <span class="status-badge">Now Watching</span>
      <div class="playlist-title" title="${displayName}">${displayName}</div>
      <div class="playlist-id">ID: ${currentId}</div>
    `;

    // Logic: If saved, show "Checkmark", if not, show "Button"
    if (isAlreadySaved) {
      cardHtml += `
        <div class="saved-indicator">
          Saved to library!
        </div>
      `;
      activeCard.innerHTML = cardHtml;
    } else {
      activeCard.innerHTML = cardHtml;

      // Create the button programmatically so we can attach the event listener easily
      const saveBtn = document.createElement("button");
      saveBtn.className = "action-btn";
      saveBtn.textContent = "Track this Playlist";

      // Attach the click event
      saveBtn.onclick = () => handleSave(currentId, displayName);

      activeCard.appendChild(saveBtn);
    }

    currentContainer.appendChild(activeCard);
  }

  // --- RENDER SAVED LIST ---
  if (playlists.length === 0) {
    savedContainer.innerHTML =
      '<div class="empty-state">No saved playlists yet</div>';
  } else {
    // Reverse the array so newest added shows at the top
    playlists
      .slice()
      .reverse()
      .forEach((playlist) => {
        const card = document.createElement("div");
        card.className = "playlist-item";
        card.innerHTML = `
        <div class="playlist-title" title="${playlist.playlistTitle}">
            ${playlist.playlistTitle}
        </div>
        <div class="playlist-id">${playlist.playlistId}</div>
      `;
        savedContainer.appendChild(card);
      });
  }
};

const getActiveTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

/**
 * 3. INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTab();

  if (!activeTab || !activeTab.url) return;

  const urlParameters = activeTab.url.split("?")[1];
  const urlParams = new URLSearchParams(urlParameters);
  const currentPlaylistId = urlParams.get("list");

  let currentPlaylistTitle = null;

  // If we are on a YouTube watch page with a list param
  if (activeTab.url.includes("youtube.com/watch") && currentPlaylistId) {
    try {
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: fetchPlaylistTitleFromDOM,
        args: [currentPlaylistId],
      });

      if (injectionResults && injectionResults[0]) {
        currentPlaylistTitle = injectionResults[0].result;
      }
    } catch (e) {
      console.error("Script injection failed", e);
    }
  }

  // Initial Load of Storage
  chrome.storage.local.get(["playlists"], (result) => {
    const playlists = result.playlists || [];
    updateUI(currentPlaylistId, currentPlaylistTitle, playlists);
  });
});
