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
 * Saves a new playlist entry into local storage with initial tracking data.
 *
 * Now includes lastWatched and upcomingVideo fields (both null initially).
 */
export const savePlaylist = async (playlistId, data) => {
  const playlists = await getPlaylists();

  const newEntry = {
    playlistId: playlistId,
    playlistTitle: data.title,
    channelName: data.channelName,
    totalVideos: data.total,
    completedVideos: [],
    lastWatched: null, // { title, url }
    upcomingVideo: null, // { title, url }
    lastUpdated: new Date().toISOString(),
  };

  const updatedPlaylists = [...playlists, newEntry];

  return new Promise((resolve) => {
    chrome.storage.local.set({ playlists: updatedPlaylists }, () => {
      resolve(updatedPlaylists);
    });
  });
};

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
 * Deletes a playlist from storage using its playlist ID.
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
 * Marks a video as watched and updates tracking information.
 *
 * trackingData contains:
 * - lastWatchedUrl: URL of the video just marked as watched
 * - lastWatchedTitle: Title of the video just marked as watched
 * - upcomingVideoUrl: URL of the next unwatched video (can be null)
 * - upcomingVideoTitle: Title of the next unwatched video (can be null)
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

  // Don't add duplicate videos
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
 * Removes a previously watched video from a playlist.
 *
 * Also clears lastWatched if the removed video was the last watched one.
 */
export const removeVideoFromWatched = async (playlistId, videoId) => {
  const playlists = await getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.playlistId === playlistId);

  if (playlistIndex === -1) return playlists;

  const currentPlaylist = playlists[playlistIndex];

  // Check if we're removing the last watched video
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
          // Clear lastWatched if we're removing that video
          lastWatched: removingLastWatched ? null : playlist.lastWatched,
          // Note: upcomingVideo stays as-is since removing a video doesn't affect what's upcoming
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
