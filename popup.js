// update the popup view with the current playlist ID
const updateUI = (playlistId) => {
  const container = document.getElementById("playlist");
  container.innerHTML = "";

  if (!playlistId) {
    container.innerHTML = '<i class="row">No playlist detected</i>';
    return;
  } else {
    const titleElement = document.createElement("div");
    titleElement.className = "playlist-id";
    titleElement.textContent = `${playlistId}`;

    container.appendChild(titleElement);
  }
};

// get the currently active tab
const getActiveTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

// when the popup loads, fetch the active tab and update the UI
document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTab();
  const urlParameters = activeTab.url.split("?")[1];
  const urlParams = new URLSearchParams(urlParameters);

  const currentPlaylistId = urlParams.get("list");
  console.log("Current playlist ID:", currentPlaylistId);

  updateUI(currentPlaylistId);
});
