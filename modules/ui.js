/**
 * generateProgressHTML(completed, total)
 * --------------------------------------
 * Builds progress bar markup showing watched counts and percentage, handling empty totals and marking completion at 100%.
 */
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

/**
 * generateVideoNavigationHTML(lastWatched, upcomingVideo)
 * --------------------------------------------------------
 * Generates the "Previous" and "Next" video navigation UI in a row layout with disabled states when no links exist.
 * Each video section is clickable and opens the corresponding YouTube video when available.
 */
const generateVideoNavigationHTML = (lastWatched, upcomingVideo) => {
  let navHtml = '<div class="video-navigation">';

  if (lastWatched && lastWatched.url) {
    navHtml += `
      <a href="${lastWatched.url}" target="_blank" class="video-nav-item">
        <div class="video-nav-label">Last watched video</div>
        <div class="video-nav-title">${lastWatched.title}</div>
      </a>
    `;
  } else {
    navHtml += `
      <div class="video-nav-item disabled">
        <div class="video-nav-label">Last watched video</div>
        <div class="video-nav-title">Nothing to see here.</div>
      </div>
    `;
  }

  if (upcomingVideo && upcomingVideo.url) {
    navHtml += `
      <a href="${upcomingVideo.url}" target="_blank" class="video-nav-item">
        <div class="video-nav-label">Upcoming video</div>
        <div class="video-nav-title">${upcomingVideo.title}</div>
      </a>
    `;
  } else {
    navHtml += `
      <div class="video-nav-item disabled">
        <div class="video-nav-label">Upcoming video</div>
        <div class="video-nav-title">All clear for now.</div>
      </div>
    `;
  }

  navHtml += "</div>";
  return navHtml;
};

/**
 * renderUI(currentId, currentData, playlists, onSave, onReset, onDelete)
 * ---------------------------------------------------------------------
 * Renders the active playlist card with tracking actions and the saved playlists list with expandable details.
 * Handles empty states for missing active or saved playlists while wiring up reset/delete callbacks and progress displays.
 */
export const renderUI = (
  currentId,
  currentData,
  playlists,
  onSave,
  onReset,
  onDelete
) => {
  const currentContainer = document.getElementById("current-section");
  const savedContainer = document.getElementById("saved-list");

  currentContainer.innerHTML = "";
  savedContainer.innerHTML = "";

  const playlistIndex = playlists.findIndex((p) => p.playlistId === currentId);
  const isAlreadySaved = playlists.some((p) => p.playlistId === currentId);

  if (!currentId) {
    currentContainer.innerHTML =
      '<div class="empty-state-playlist">No active playlist found</div>';
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

          <button class="go-btn">Go to Playlist</button>

          <div class="watched-list-container">
            ${generateVideoNavigationHTML(
              playlist.lastWatched,
              playlist.upcomingVideo
            )}

            <div class="card-footer">
                <button class="reset-btn">Reset Playlist</button>
                <button class="delete-btn">Delete Playlist</button>
            </div>
          </div>
        `;

        const header = card.querySelector(".card-header");
        header.addEventListener("click", () => {
          card.classList.toggle("expanded");
        });

        const resetBtn = card.querySelector(".reset-btn");
        resetBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onReset(playlist.playlistId);
        });

        const deleteBtn = card.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onDelete(playlist.playlistId);
        });

        savedContainer.appendChild(card);
      });
  }
};
