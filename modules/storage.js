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

export const markVideoAsWatched = async (playlistId, videoId) => {
  console.log("starting as video as watched:", playlistId, videoId);

  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return;

  let completedVideos = playlists[playlistIndex].completedVideos;

  if (!completedVideos.includes(videoId)) {
    completedVideos.push(videoId);
  }

  const newEntry = {
    playlistId: playlistId,
    playlistTitle: playlists[playlistIndex].title,
    channelName: playlists[playlistIndex].channelName,
    totalVideos: playlists[playlistIndex].total,
    completedVideos: completedVideos,
    lastUpdated: new Date().toISOString(),
  };

  console.log("new entry:", newEntry);

  let updatedPlaylists;
  updatedPlaylists = [...playlists];
  updatedPlaylists[playlistIndex] = newEntry;

  console.log("updated playlists:", updatedPlaylists);

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      console.log("storage updated");
      resolve(updatedPlaylists);
    });
  });
};
