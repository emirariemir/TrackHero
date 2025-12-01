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
      ${channelHtml}
      <div class="playlist-id">ID: ${currentId}</div>
      ${generateProgressHTML(completed, total)}
    `;

    if (isAlreadySaved) {
      activeCard.innerHTML = cardHtml;

      const markButton = document.createElement("button");
      markButton.className = "action-btn";
      markButton.textContent = "Mark Video as Watched";

      markButton.onclick = () => onMark(currentId, videoId);

      activeCard.appendChild(markButton);

      //if (currentData) onSave(currentId, currentData);
    } else {
      activeCard.innerHTML = cardHtml;
      const saveBtn = document.createElement("button");
      saveBtn.className = "action-btn";
      saveBtn.textContent = "Track this Playlist";

      // Attach the click handler
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
        card.className = "playlist-item";

        const pChannel = playlist.channelName
          ? `<div class="channel-name">${playlist.channelName}</div>`
          : "";

        card.innerHTML = `
        <div class="playlist-title" title="${playlist.playlistTitle}">
            ${playlist.playlistTitle}
        </div>
        ${pChannel}
        ${generateProgressHTML(
          playlist.completedVideos.length,
          playlist.totalVideos
        )}
      `;
        savedContainer.appendChild(card);
      });
  }
};
