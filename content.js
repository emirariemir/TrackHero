chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "NEW" && msg.hasPlaylist) {
    const playlistLink = document.querySelector(
      `a[href^="/playlist?list=${msg.playlistId}"]`
    );

    let playlistTitle = null;
    if (playlistLink) {
      playlistTitle = playlistLink.textContent.trim();
    } else {
      await new Promise((r) => setTimeout(r, 1000));
      const retry = document.querySelector(
        `a[href^="/playlist?list=${msg.playlistId}"]`
      );
      playlistTitle = retry?.textContent?.trim() || null;
    }

    console.log("Detected playlist title:", playlistTitle);

    chrome.storage.local.set({
      playlistId: msg.playlistId,
      playlistTitle: playlistTitle,
    });
  }
});
