// modules/ui.js

const generateProgressHTML = (completed, total) => {
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

// Helper to generate the list of videos
const generateVideoListHTML = (videos) => {
  if (!videos || videos.length === 0)
    return '<div class="empty-state" style="padding:10px 0;">No videos watched yet</div>';

  return videos
    .map((video) => {
      // Handle both old format (string) and new format (object)
      const title = typeof video === "string" ? "Unknown Title" : video.title;

      return `
      <div class="watched-video-item">
        <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <div class="video-item-title">${title}</div>
      </div>
    `;
    })
    .join("");
};

export const renderUI = (
  currentId,
  videoId,
  currentData,
  playlists,
  onSave,
  onMark
) => {
  const currentContainer = document.getElementById("current-section");
  const savedContainer = document.getElementById("saved-list");

  currentContainer.innerHTML = "";
  savedContainer.innerHTML = "";

  const playlistIndex = playlists.findIndex((p) => p.playlistId === currentId);
  const isAlreadySaved = playlists.some((p) => p.playlistId === currentId);

  // --- Render Current Section ---
  if (!currentId) {
    currentContainer.innerHTML =
      '<div class="empty-state">No active playlist found</div>';
  } else {
    const title = currentData?.title || "Loading...";
    const channel = currentData?.channelName || "";
    const currentVideoTitle = currentData?.currentVideoTitle || "";
    const total = currentData?.total || 0;
    const completed = playlists[playlistIndex]?.completedVideos.length || 0;

    const activeCard = document.createElement("div");
    activeCard.className = "playlist-item active-card";

    const channelHtml = channel
      ? `<div class="channel-name">${channel}</div>`
      : "";

    let cardHtml = `
      <span class="status-badge">Now Watching</span>
      <div class="playlist-title" title="${title}">${title}</div>
      <div class="current-video-title" title="${currentVideoTitle}">${currentVideoTitle}</div>
      ${channelHtml}
      <div class="playlist-id">ID: ${currentId}</div>
      ${generateProgressHTML(completed, total)}
    `;

    if (isAlreadySaved) {
      activeCard.innerHTML = cardHtml;
      const markButton = document.createElement("button");
      markButton.className = "action-btn";
      markButton.textContent = "Mark Video as Watched";
      markButton.onclick = () => onMark(currentId, videoId, currentVideoTitle);
      activeCard.appendChild(markButton);
    } else {
      activeCard.innerHTML = cardHtml;
      const saveBtn = document.createElement("button");
      saveBtn.className = "action-btn";
      saveBtn.textContent = "Track this Playlist";
      saveBtn.onclick = () => onSave(currentId, currentData);
      activeCard.appendChild(saveBtn);
    }
    currentContainer.appendChild(activeCard);
  }

  // --- Render Saved List ---
  if (playlists.length === 0) {
    savedContainer.innerHTML =
      '<div class="empty-state">No saved playlists yet</div>';
  } else {
    playlists
      .slice()
      .reverse()
      .forEach((playlist) => {
        const card = document.createElement("div");
        card.className = "playlist-item"; // toggle 'expanded' class

        const pChannel = playlist.channelName
          ? `<div class="channel-name">${playlist.channelName}</div>`
          : "";

        card.innerHTML = `
          <div class="card-header">
            <div style="flex: 1; min-width: 0;">
                <div class="playlist-title" title="${playlist.playlistTitle}">
                    ${playlist.playlistTitle}
                </div>
                ${pChannel}
            </div>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          ${generateProgressHTML(
            playlist.completedVideos.length,
            playlist.totalVideos
          )}

          <div class="watched-list-container">
            ${generateVideoListHTML(playlist.completedVideos)}
          </div>
        `;

        // target the 'card-header' specifically so clicking the header toggles it
        const header = card.querySelector(".card-header");
        header.addEventListener("click", () => {
          card.classList.toggle("expanded");
        });

        savedContainer.appendChild(card);
      });
  }
};
