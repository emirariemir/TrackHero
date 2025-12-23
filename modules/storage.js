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

  const newEntry = {
    playlistId: playlistId,
    playlistTitle: data.title,
    channelName: data.channelName,
    totalVideos: data.total,
    completedVideos: [],
    lastUpdated: new Date().toISOString(),
  };

  const updatedPlaylists = [...playlists, newEntry];

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

  const isAlreadyWatched = updatedCompletedVideos.some((video) => {
    return video.id === videoId;
  });

  if (!isAlreadyWatched) {
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

export const removeVideoFromWatched = async (playlistId, videoId) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  // If the playlist doesn't exist, return the current state without changes
  if (playlistIndex === -1) return playlists;

  const currentPlaylist = playlists[playlistIndex];

  // Filter out the video that matches the given videoId
  // This creates a new array, preserving immutability
  const updatedCompletedVideos = currentPlaylist.completedVideos.filter(
    (video) => video.id !== videoId
  );

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

export const deletePlaylist = async (playlistId) => {
  const playlists = await getPlaylists();

  // Filter out the playlist with the matching ID
  const updatedPlaylists = playlists.filter((p) => p.playlistId !== playlistId);

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};
