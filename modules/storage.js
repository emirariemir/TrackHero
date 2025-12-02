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
    completedVideos: [],
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

export const markVideoAsWatched = async (playlistId, videoId, videoTitle) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return;

  const currentPlaylist = playlists[playlistIndex];

  // Create a copy of the completed array to avoid direct mutation issues
  const updatedCompletedVideos = [...currentPlaylist.completedVideos];

  if (!updatedCompletedVideos.includes(videoId)) {
    updatedCompletedVideos.push({ id: videoId, title: videoTitle });
  }
  const newEntry = {
    ...currentPlaylist,
    completedVideos: updatedCompletedVideos,
    lastUpdated: new Date().toISOString(),
  };

  const updatedPlaylists = [...playlists];
  updatedPlaylists[playlistIndex] = newEntry;

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};
