// modules/storage.js

/**
 * getPlaylists()
 * --------------
 * Retrieves playlists from local storage, returning an empty array when none are saved.
 */
export const getPlaylists = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["playlists"], (result) => {
      resolve(result.playlists || []);
    });
  });
};

/**
 * savePlaylist async(playlistId, data)
 * -------------------------------------
 * Saves a new playlist entry into local storage with initial tracking data.
 * Initializes lastWatched and upcomingVideo placeholders to null, ready for later updates.
 */
export const savePlaylist = async (playlistId, data) => {
  const playlists = await getPlaylists();

  const newEntry = {
    playlistId: playlistId,
    playlistTitle: data.title,
    channelName: data.channelName,
    totalVideos: data.total,
    completedVideos: [],
    lastWatched: null,
    upcomingVideo: null,
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
 * resetPlaylistProgress async(playlistId)
 * ---------------------------------------
 * Clears completed videos and last watched/upcoming details for a playlist while refreshing lastUpdated.
 * Leaves other playlist metadata intact and returns the updated collection.
 */
export const resetPlaylistProgress = async (playlistId) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return playlists;

  const updatedPlaylists = playlists.map((playlist, index) =>
    index === playlistIndex
      ? {
          ...playlist,
          completedVideos: [],
          lastWatched: null,
          upcomingVideo: null,
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
 * deletePlaylist async(playlistId)
 * ---------------------------------
 * Deletes a playlist from storage using its playlist ID and returns the remaining items.
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
 * markVideoAsWatched async(playlistId, videoId, videoTitle, trackingData)
 * ----------------------------------------------------------------------
 * Marks a video as watched, skipping duplicates, and refreshes lastWatched/upcoming details plus lastUpdated.
 * Accepts trackingData to populate navigation metadata for the current and next videos in the playlist.
 */
export const markVideoAsWatched = async (
  playlistId,
  videoId,
  videoTitle,
  trackingData = {}
) => {
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
          lastWatched: {
            title: trackingData.lastWatchedTitle || videoTitle,
            url: trackingData.lastWatchedUrl || null,
          },
          upcomingVideo: trackingData.upcomingVideoUrl
            ? {
                title: trackingData.upcomingVideoTitle,
                url: trackingData.upcomingVideoUrl,
              }
            : null,
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
 * --------------------------------------------------
 * Removes a previously watched video from a playlist and updates tracking timestamps.
 * Clears lastWatched when the removed video matches that record while leaving upcomingVideo unchanged.
 */
export const removeVideoFromWatched = async (playlistId, videoId) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return playlists;

  const currentPlaylist = playlists[playlistIndex];

  const removingLastWatched =
    currentPlaylist.lastWatched &&
    currentPlaylist.lastWatched.url &&
    currentPlaylist.lastWatched.url.includes(`v=${videoId}`);

  const updatedPlaylists = playlists.map((playlist, index) =>
    index === playlistIndex
      ? {
          ...playlist,
          completedVideos: playlist.completedVideos.filter(
            (v) => v.id !== videoId
          ),
          lastWatched: removingLastWatched ? null : playlist.lastWatched,
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
