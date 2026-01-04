/**
 * generateCertificate(playlistTitle, channelName, totalVideos)
 * -----------------------------------------------------------
 * Generates and downloads a PDF certificate for completing a playlist
 * Using HTML Canvas approach - no external library needed
 */
const generateCertificate = (playlistTitle, channelName, totalVideos) => {
  // Create a hidden canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1357; // A4 landscape ratio
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f0f0fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = "#9c98ff";
  ctx.lineWidth = 10;
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

  ctx.lineWidth = 3;
  ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);

  // Certificate title
  ctx.fillStyle = "#3e3e3e";
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Certificate of Completion", canvas.width / 2, 320);

  // Decorative line
  ctx.strokeStyle = "#9c98ff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(480, 400);
  ctx.lineTo(canvas.width - 480, 400);
  ctx.stroke();

  // Main text
  ctx.fillStyle = "#666666";
  ctx.font = "48px Arial";
  ctx.fillText("This is to certify that", canvas.width / 2, 520);

  // Recipient name
  ctx.fillStyle = "#3e3e3e";
  ctx.font = "bold 80px Arial";
  ctx.fillText("YouTube Learner", canvas.width / 2, 630);

  // Achievement text
  ctx.fillStyle = "#666666";
  ctx.font = "48px Arial";
  ctx.fillText("has successfully completed", canvas.width / 2, 730);

  // Playlist title (with text wrapping)
  ctx.fillStyle = "#9c98ff";
  ctx.font = "bold 64px Arial";
  const maxWidth = 1500;
  const words = playlistTitle.split(" ");
  let line = "";
  let y = 850;
  const lineHeight = 80;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);
  y += lineHeight + 20;

  // Channel and video count
  ctx.fillStyle = "#666666";
  ctx.font = "42px Arial";

  if (channelName) {
    ctx.fillText(`by ${channelName}`, canvas.width / 2, y);
    y += 60;
  }

  ctx.fillText(`${totalVideos} videos completed`, canvas.width / 2, y);

  // Date
  ctx.fillStyle = "#999999";
  ctx.font = "36px Arial";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillText(`Issued on ${today}`, canvas.width / 2, canvas.height - 100);

  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const sanitizedTitle = playlistTitle
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 50);
    a.href = url;
    a.download = `Certificate_${sanitizedTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
};

/**
 * Updated generateProgressHTML with certificate button action
 */
const generateProgressHTML = (completed, total) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isFinished = percentage === 100;

  let html = `
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

  if (isFinished) {
    html += `
      <button class="complete-btn" data-action="generate-certificate">
        Claim Your Certificate!
      </button>
    `;
  }

  return html;
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

        const gotToBtn = card.querySelector(".go-btn");
        gotToBtn.addEventListener("click", () => {
          const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.playlistId}`;
          window.open(playlistUrl, "_blank");
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

        const certificateBtn = card.querySelector(
          '[data-action="generate-certificate"]'
        );
        if (certificateBtn) {
          certificateBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            generateCertificate(
              playlist.playlistTitle,
              playlist.channelName || "",
              playlist.totalVideos
            );
          });
        }

        savedContainer.appendChild(card);
      });
  }
};
