// modules/storage.js

export const getPlaylists = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["playlists"], (result) => {
      resolve(result.playlists || []);
    });
  });
};

/**
 * savePlaylist async(playlistId, data)
 * Saves a new playlist entry into local storage.
 *
 * The function first loads existing playlists, then constructs
 * a normalized playlist object using the provided metadata.
 * It initializes the playlist with zero completed videos and
 * timestamps the creation/update time.
 *
 * Finally, it appends the new playlist to the existing list
 * and persists everything back into Chrome storage.
 */
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

/**
 * deletePlaylist async(playlistId)
 * Deletes a playlist from storage using its playlist ID.
 *
 * The function loads all playlists, removes the one that matches
 * the given ID, and then saves the updated list back to storage.
 *
 * The resolved value is the updated playlist array, which makes
 * it easy for the UI or state layer to stay in sync.
 */
export const deletePlaylist = async (playlistId) => {
  const playlists = await getPlaylists();

  const updatedPlaylists = playlists.filter((p) => p.playlistId !== playlistId);

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};

/**
 * markVideoAsWatched async(playlistId, videoId, videoTitle)
 * Marks a video as watched inside a specific playlist.
 *
 * The function locates the target playlist by ID and ensures
 * the same video is not added twice. If the playlist cannot
 * be found or the video already exists, it exits early.
 *
 * When a new video is added, the playlist's `lastUpdated`
 * timestamp is refreshed and the updated playlists are
 * persisted back into local storage.
 */
export const markVideoAsWatched = async (playlistId, videoId, videoTitle) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return;

  const currentPlaylist = playlists[playlistIndex];

  if (currentPlaylist.completedVideos.some((v) => v.id === videoId)) {
    return playlists;
  }

  const updatedPlaylists = playlists.map((playlist, index) =>
    index === playlistIndex
      ? {
          ...playlist,
          completedVideos: [
            ...playlist.completedVideos,
            { id: videoId, title: videoTitle },
          ],
          lastUpdated: new Date().toISOString(),
        }
      : playlist
  );

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};

/**
 * removeVideoFromWatched async(playlistId, videoId)
 * Removes a previously watched video from a playlist.
 *
 * This function is essentially the inverse of marking a video
 * as watched. It finds the correct playlist and filters out
 * the target video from the completed list.
 *
 * After the update, the playlist timestamp is refreshed and
 * the new state is saved back into Chrome storage.
 */
export const removeVideoFromWatched = async (playlistId, videoId) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return playlists;

  const updatedPlaylists = playlists.map((playlist, index) =>
    index === playlistIndex
      ? {
          ...playlist,
          completedVideos: playlist.completedVideos.filter(
            (v) => v.id !== videoId
          ),
          lastUpdated: new Date().toISOString(),
        }
      : playlist
  );

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};
