chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "NEW") {
    console.log("Received video update:", msg);
    chrome.storage.local.set({ playlistId: msg.playlistId || null });
  }
});
