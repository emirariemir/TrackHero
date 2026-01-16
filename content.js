// content.js

let currentObserver = null;
let currentCompletedMap = new Set();

/**
 * waitForElements(selector, callback, map)
 * ----------------------------------------
 * Watches the page for matching elements, runs the callback on each one immediately, and re-runs when the DOM changes.
 * Keeps one mutation observer alive at a time so buttons stay in sync as YouTube reshuffles items.
 */
function waitForElements(selector, callback, map) {
  document.querySelectorAll(selector).forEach((el) => callback(el, map));

  if (currentObserver) {
    currentObserver.disconnect();
  }

  const obs = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => callback(el, map));
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
  currentObserver = obs;
}

/**
 * getUrlForItem(item)
 * -------------------
 * Looks inside a playlist item for its link and returns a full YouTube URL, falling back cleanly when missing.
 */
function getUrlForItem(item) {
  const link =
    item.querySelector("a#wc-endpoint") || item.querySelector("a#thumbnail");

  if (!link) return null;

  const href = link.getAttribute("href");

  let url;
  try {
    url = new URL(href, "https://www.youtube.com");
  } catch (e) {
    return null;
  }

  return url;
}

/**
 * buildCompletedMap(playlists)
 * -----------------------------
 * Walks through saved playlists and collects watched video IDs into a Set so we can quickly ask, “is this one done?”
 */
function buildCompletedMap(playlists) {
  const map = new Set();
  playlists.forEach((pl) => {
    (pl.completedVideos || []).forEach((video) => {
      map.add(video.id);
    });
  });
  return map;
}

/**
 * getTitleForItem(item)
 * ---------------------
 * Grabs the visible title text from a playlist row, using a friendly default if YouTube doesn’t expose one.
 */
function getTitleForItem(item) {
  const titleEl = item.querySelector("#video-title");

  if (!titleEl) return "Unknown Title";

  return titleEl.getAttribute("title") || titleEl.textContent.trim();
}

/**
 * getNextUnwatchedVideo(currentItem, completedMap)
 * ------------------------------------------------
 * Starting from the current playlist row, walks forward until it finds the next video not marked as watched.
 * Returns that video’s title and link, or null if you’ve reached the end.
 */
function getNextUnwatchedVideo(currentItem, completedMap) {
  let nextItem = currentItem.nextElementSibling;

  while (nextItem) {
    if (nextItem.querySelector("#video-title")) {
      const url = getUrlForItem(nextItem);
      if (!url) {
        nextItem = nextItem.nextElementSibling;
        continue;
      }

      const videoId = url.searchParams.get("v");
      if (!videoId) {
        nextItem = nextItem.nextElementSibling;
        continue;
      }

      if (!completedMap.has(videoId)) {
        return {
          title: getTitleForItem(nextItem),
          url: url.href,
        };
      }
    }

    nextItem = nextItem.nextElementSibling;
  }

  return null;
}

/**
 * addCompletionButton(item, completedMap)
 * ---------------------------------------
 * Injects a toggle button beside each playlist item, wiring it to mark a video watched or undo that state.
 * Talks to the background script to update storage, then restyles the button to reflect the new status.
 */
function addCompletionButton(item, completedMap) {
  if (item.dataset.trackheroInjected === "true") return;

  item.dataset.trackheroInjected = "true";

  const urlForThatVideo = getUrlForItem(item);
  if (!urlForThatVideo) {
    console.error("addCompletionButton: Could not resolve URL for item:", item);
    return;
  }

  const videoId = urlForThatVideo.searchParams.get("v");
  if (!videoId) {
    console.warn(
      "addCompletionButton: Could not extract videoId from URL:",
      urlForThatVideo
    );
    return;
  }

  const videoTitle = getTitleForItem(item);

  const isInitiallyCompleted = completedMap.has(videoId);

  const btn = document.createElement("custom-trackhero-button");
  styleButton(btn, isInitiallyCompleted);

  btn.addEventListener("click", async (e) => {
    const isCurrentlyCompleted = currentCompletedMap.has(videoId);

    if (isCurrentlyCompleted) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "REMOVE_ITEM_FROM_WATCHED",
          url: urlForThatVideo.href,
        });

        if (!response || response.success !== true) {
          console.error("Background script failed for REMOVE:", response);
          return;
        }

        styleButton(btn, false);
      } catch (err) {
        console.error("sendMessage failed:", err);
      }
    } else {
      const upcomingVideo = getNextUnwatchedVideo(item, currentCompletedMap);

      try {
        const response = await chrome.runtime.sendMessage({
          type: "MARK_ITEM_COMPLETE",
          url: urlForThatVideo.href,
          title: videoTitle,
          lastWatchedUrl: urlForThatVideo.href,
          lastWatchedTitle: videoTitle,
          upcomingVideoUrl: upcomingVideo?.url || null,
          upcomingVideoTitle: upcomingVideo?.title || null,
        });

        if (!response || response.success !== true) {
          console.error(
            "Background script failed for MARK_ITEM_COMPLETE:",
            response
          );
          return;
        }

        styleButton(btn, true);
      } catch (err) {
        console.error("sendMessage failed:", err);
      }
    }
  });

  item.insertAdjacentElement("beforeend", btn);
}

/**
 * styleButton(btn, completed)
 * ---------------------------
 * Shapes the tracking button and flips its icon and colors depending on whether the video is marked done.
 */
function styleButton(btn, completed) {
  btn.style.width = "28px";
  btn.style.height = "28px";
  btn.style.borderRadius = "50%";
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.border = "none";
  btn.style.fontSize = "18px";
  btn.style.fontWeight = "700";
  btn.style.cursor = "pointer";
  btn.style.marginLeft = "8px";

  if (completed) {
    btn.textContent = "✓";
    btn.style.background = "#8fffb6";
    btn.style.color = "#1d1d1dff";
  } else {
    btn.textContent = "+";
    btn.style.background = "#e5e5e5";
    btn.style.color = "#555";
  }
}

/**
 * cleanup()
 * ---------
 * Turns off the mutation observer when the page is closing to avoid lingering work.
 */
function cleanup() {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }
}

chrome.storage.local.get(["playlists"], (result) => {
  const playlists = result.playlists || [];
  currentCompletedMap = buildCompletedMap(playlists);

  waitForElements("#playlist-items", addCompletionButton, currentCompletedMap);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.playlists) {
    const newPlaylists = changes.playlists.newValue || [];
    currentCompletedMap = buildCompletedMap(newPlaylists);

    updateAllButtons();
  }
});

/**
 * updateAllButtons()
 * ------------------
 * Sweeps through every injected button and updates its appearance based on the latest watched list.
 */
function updateAllButtons() {
  document
    .querySelectorAll('[data-trackhero-injected="true"]')
    .forEach((item) => {
      const urlForThatVideo = getUrlForItem(item);
      if (!urlForThatVideo) return;

      const videoId = urlForThatVideo.searchParams.get("v");
      const isCompleted = currentCompletedMap.has(videoId);

      const btn = item.querySelector("custom-trackhero-button");
      if (btn) {
        styleButton(btn, isCompleted);
      }
    });
}

window.addEventListener("beforeunload", cleanup);
