// modules/storage.js

export const getPlaylists = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["playlists"], (result) => {
      resolve(result.playlists || []);
    });
  });
};

export const savePlaylist = async (playlistId, data) => {
  const playlists = await getPlaylists();

  const existingIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  const newEntry = {
    playlistId: playlistId,
    playlistTitle: data.title,
    channelName: data.channelName,
    totalVideos: data.total,
    completedVideos: data.completed,
    lastUpdated: new Date().toISOString(),
  };

  let updatedPlaylists;
  if (existingIndex > -1) {
    updatedPlaylists = [...playlists];
    updatedPlaylists[existingIndex] = newEntry;
  } else {
    updatedPlaylists = [...playlists, newEntry];
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};
