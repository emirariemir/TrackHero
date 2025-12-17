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
  onMark,
  onDelete
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
    const total = currentData?.total || 0;
    const completed = playlists[playlistIndex]?.completedVideos.length || 0;

    const totalMinutes = total * 10;
    const totalHours = Math.round(totalMinutes / 60);

    const activeCard = document.createElement("div");
    activeCard.className = "playlist-item active-card";

    const channelHtml = channel
      ? `<div class="channel-name">${channel}</div>`
      : "";

    let cardHtml = `
      <div class="active-card-title">I've detected a Playlist!</div>
      <div class="active-card-inner">
        <div class="playlist-title">${title}</div>
        ${channelHtml}
    `;

    if (isAlreadySaved) {
      const videosLeft = total - completed;
      cardHtml += `
        <div class="videos-left">You have ${videosLeft} videos left to cover!</div>
        ${generateProgressHTML(completed, total)}
      `;
    } else {
      cardHtml += `
        <div class="video-count">Total of ${total} videos (${totalHours} hours)</div>
      `;
    }

    cardHtml += `</div>`;

    activeCard.innerHTML = cardHtml;

    if (!isAlreadySaved) {
      const saveBtn = document.createElement("button");
      saveBtn.className = "action-btn";
      saveBtn.textContent = "Track Playlist";
      saveBtn.onclick = () => onSave(currentId, currentData);

      const innerCard = activeCard.querySelector(".active-card-inner");
      innerCard.appendChild(saveBtn);
    }

    currentContainer.appendChild(activeCard);
  }

  if (playlists.length === 0) {
    savedContainer.innerHTML =
      '<div class="empty-state">No saved playlists yet</div>';
  } else {
    savedContainer.innerHTML = `<div class="saved-list-title">Currently Tracking (${playlists.length})</div>`;

    playlists
      .slice()
      .reverse()
      .forEach((playlist) => {
        const card = document.createElement("div");
        card.className = "playlist-item";

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

            <div class="card-footer">
                <button class="delete-btn">Delete Playlist</button>
            </div>
          </div>
        `;

        const header = card.querySelector(".card-header");
        header.addEventListener("click", () => {
          card.classList.toggle("expanded");
        });

        const deleteBtn = card.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
          onDelete(playlist.playlistId);
        });

        savedContainer.appendChild(card);
      });
  }
};
