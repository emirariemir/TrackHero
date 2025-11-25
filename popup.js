// popup.js

/**
 * 1. DOM SCRAPER (Runs inside the YouTube page)
 * Returns: { title: string, total: number, completed: number }
 */
const scrapePlaylistData = (playlistId) => {
  // A. Get Title
  const titleSelector = `a[href*="${playlistId}"].yt-simple-endpoint.style-scope.yt-formatted-string`;
  const titleEl = document.querySelector(titleSelector);
  const title = titleEl ? titleEl.textContent.trim() : "Unknown Playlist";

  // B. Get Total Video Count
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

  // C. Count Completed Videos (Red full bar)
  // We scope this to the playlist panel renderer to be safe
  const progressBars = document.querySelectorAll(
    "ytd-playlist-panel-video-renderer #progress"
  );
  let completedCount = 0;

  progressBars.forEach((bar) => {
    // YouTube sets this inline style to 100% when finished
    if (bar.style.width === "100%") {
      completedCount++;
    }
  });

  return {
    title: title,
    total: totalVideos,
    completed: completedCount,
  };
};

/**
 * 2. CORE FUNCTIONS
 */

// Helper to calculate percentage and generate HTML for progress
const generateProgressHTML = (completed, total) => {
  // Avoid division by zero
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isFinished = percentage === 100;

  return `
    <div class="stats-row">
      <span>${completed} / ${total} watched</span>
      <span>${percentage}%</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill ${
        isFinished ? "completed" : ""
      }" style="width: ${percentage}%"></div>
    </div>
  `;
};

const handleSave = (playlistId, data) => {
  chrome.storage.local.get(["playlists"], (result) => {
    const playlists = result.playlists || [];

    // Check if exists
    const existingIndex = playlists.findIndex(
      (p) => p.playlistId === playlistId
    );

    const newEntry = {
      playlistId: playlistId,
      playlistTitle: data.title,
      totalVideos: data.total,
      completedVideos: data.completed,
      lastUpdated: new Date().toISOString(),
    };

    let updatedPlaylists;

    if (existingIndex > -1) {
      // Update existing
      updatedPlaylists = [...playlists];
      updatedPlaylists[existingIndex] = newEntry;
    } else {
      // Add new
      updatedPlaylists = [...playlists, newEntry];
    }

    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      updateUI(playlistId, data, updatedPlaylists);
    });
  });
};

// Refined Update UI
const updateUI = (currentId, currentData, playlists) => {
  const currentContainer = document.getElementById("current-section");
  const savedContainer = document.getElementById("saved-list");

  currentContainer.innerHTML = "";
  savedContainer.innerHTML = "";

  const isAlreadySaved = playlists.some((p) => p.playlistId === currentId);

  // --- 1. RENDER CURRENT SECTION ---
  if (!currentId) {
    currentContainer.innerHTML =
      '<div class="empty-state">No active playlist found</div>';
  } else {
    // Use scraped data if available, otherwise defaults
    const title = currentData?.title || "Loading...";
    const total = currentData?.total || 0;
    const completed = currentData?.completed || 0;

    const activeCard = document.createElement("div");
    activeCard.className = "playlist-item active-card";

    let cardHtml = `
      <span class="status-badge">Now Watching</span>
      <div class="playlist-title" title="${title}">${title}</div>
      <div class="playlist-id">ID: ${currentId}</div>
      ${generateProgressHTML(completed, total)}
    `;

    if (isAlreadySaved) {
      cardHtml += `<div class="saved-indicator">Tracking in library</div>`;
      activeCard.innerHTML = cardHtml;

      // Since we have fresh data, let's silently update the storage
      // so the saved list is always accurate.
      if (currentData) {
        handleSave(currentId, currentData);
      }
    } else {
      activeCard.innerHTML = cardHtml;
      const saveBtn = document.createElement("button");
      saveBtn.className = "action-btn";
      saveBtn.textContent = "Track this Playlist";
      saveBtn.onclick = () => handleSave(currentId, currentData);
      activeCard.appendChild(saveBtn);
    }

    currentContainer.appendChild(activeCard);
  }

  // --- 2. RENDER SAVED LIST ---
  if (playlists.length === 0) {
    savedContainer.innerHTML =
      '<div class="empty-state">No saved playlists yet</div>';
  } else {
    // Sort by lastUpdated if available, or just reverse
    playlists
      .slice()
      .reverse()
      .forEach((playlist) => {
        const card = document.createElement("div");
        card.className = "playlist-item";

        // Fallback for old data that might not have stats yet
        const pTotal = playlist.totalVideos || 0;
        const pCompleted = playlist.completedVideos || 0;

        card.innerHTML = `
        <div class="playlist-title" title="${playlist.playlistTitle}">
            ${playlist.playlistTitle}
        </div>
        ${generateProgressHTML(pCompleted, pTotal)}
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

  const urlParams = new URLSearchParams(activeTab.url.split("?")[1]);
  const currentPlaylistId = urlParams.get("list");

  // Default data object
  let currentData = null;

  if (activeTab.url.includes("youtube.com/watch") && currentPlaylistId) {
    try {
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: scrapePlaylistData,
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

  chrome.storage.local.get(["playlists"], (result) => {
    const playlists = result.playlists || [];
    updateUI(currentPlaylistId, currentData, playlists);
  });
});
