const updatePlaylistView = (playlistId, playlistTitle) => {
  const container = document.getElementById("playlist");
  container.innerHTML = "";

  if (playlistId) {
    const titleEl = document.createElement("div");
    titleEl.className = "playlist-title";
    titleEl.textContent = playlistTitle
      ? `${playlistTitle}`
      : "(Unknown title)";

    const idEl = document.createElement("div");
    idEl.className = "playlist-id";
    idEl.textContent = `ID: ${playlistId}`;

    container.appendChild(titleEl);
    container.appendChild(idEl);
  } else {
    container.innerHTML = '<i class="row">No playlist detected</i>';
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const { playlistId, playlistTitle } = await chrome.storage.local.get([
    "playlistId",
    "playlistTitle",
  ]);
  updatePlaylistView(playlistId, playlistTitle);
});
