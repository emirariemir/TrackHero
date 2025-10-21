const updatePlaylistView = (playlistId) => {
  const container = document.getElementById("playlist");
  container.innerHTML = "";

  if (playlistId) {
    const playlistElement = document.createElement("div");
    playlistElement.className = "playlist-item";
    playlistElement.textContent = `Current Playlist ID: ${playlistId}`;
    container.appendChild(playlistElement);
  } else {
    container.innerHTML = '<i class="row">No playlist detected</i>';
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const { playlistId } = await chrome.storage.local.get("playlistId");
  updatePlaylistView(playlistId);
});
