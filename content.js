chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "NEW" && msg.hasPlaylist) {
    const playlistDivElement = document.querySelector(
      `a[href^="/playlist?list=${msg.playlistId}"]`
    );

    let playlistTitle = null;

    if (playlistDivElement) {
      playlistTitle = playlistDivElement.textContent.trim();
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      const retryPlaylistDivElement = document.querySelector(
        `a[href^="/playlist?list=${msg.playlistId}"]`
      );
      playlistTitle = retryPlaylistDivElement?.textContent?.trim() || null;
    }

    console.log("Detected playlist title:", playlistTitle);

    // get existing playlists from storage and
    // add/update the current playlist array
    chrome.storage.local.get(["playlists"], (result) => {
      const playlists = result.playlists || [];

      const existingIndex = playlists.findIndex(
        (p) => p.playlistId === msg.playlistId
      );

      if (existingIndex !== -1) {
        playlists[existingIndex] = {
          playlistId: msg.playlistId,
          playlistTitle: playlistTitle,
          lastUpdated: new Date().toISOString(),
        };
      } else {
        playlists.unshift({
          playlistId: msg.playlistId,
          playlistTitle: playlistTitle,
          addedAt: new Date().toISOString(),
        });
      }

      chrome.storage.local.set({ playlists: playlists }, () => {
        console.log("Playlist saved:", playlistTitle);
      });
    });
  }
});
