// content.js

let currentObserver = null;
let currentCompletedMap = new Set();

/*
 * waitForElements(selector, callback, map)
 * ----------------------------------------
 * Scans the DOM for all elements matching the given selector and applies
 * the provided callback to each. Then sets up a MutationObserver that keeps
 * watching the document for new elements being added (e.g., YouTube dynamically
 * rendering playlist items).
 *
 * Ensures only one observer exists at a time by disconnecting any previous one.
 * This prevents memory leaks and duplicate button injections.
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

/*
 * getUrlForItem(item)
 * --------------------
 * Extracts the video URL from a YouTube playlist DOM item. YouTube may use
 * different anchor IDs ("wc-endpoint" or "thumbnail"), so both are checked.
 *
 * Converts the extracted href into a fully qualified URL object. Returns null
 * if the URL can't be parsed or is missing.
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

/*
 * buildCompletedMap(playlists)
 * -----------------------------
 * Builds a Set containing the IDs of all completed videos across all playlists.
 * The Set allows O(1) lookup for checking whether a particular video is marked
 * as completed.
 *
 * Expected structure:
 *   playlists = [{ completedVideos: [{ id, title }, ...] }, ...]
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

/*
 * getTitleForItem(item)
 * ----------------------
 * Extracts the video title from the DOM.
 * Preferred source is the 'title' attribute of the #video-title element,
 * as it contains the full string without truncation or extra whitespace.
 */
function getTitleForItem(item) {
  const titleEl = item.querySelector("#video-title");

  if (!titleEl) return "Unknown Title";

  return titleEl.getAttribute("title") || titleEl.textContent.trim();
}

/*
 * addCompletionButton(item, completedMap)
 * ----------------------------------------
 * Injects a completion button next to a playlist item if not already injected.
 * - Determines the video's URL and ID.
 * - Checks whether the video is completed using completedMap.
 * - Adds a "+" or "✓" button depending on completion state.
 *
 * Button click:
 * Sends a message to the background script requesting to mark the item complete.
 * If the background script confirms success, the button updates visually.
 *
 * Includes full error handling for missing URLs, invalid IDs,
 * and sendMessage failures.
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

  const isCompleted = completedMap.has(videoId);

  const btn = document.createElement("custom-trackhero-button");
  styleButton(btn, isCompleted);

  btn.addEventListener("click", async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "MARK_ITEM_COMPLETE",
        url: urlForThatVideo,
        title: videoTitle,
      });

      if (!response || response.success !== true) {
        console.error(
          "addCompletionButton: Background script returned failure for videoId:",
          videoId,
          response
        );
        return;
      }

      styleButton(btn, true);
    } catch (err) {
      console.error("addCompletionButton: sendMessage failed:", err);
    }
  });

  item.insertAdjacentElement("beforeend", btn);
}

/*
 * styleButton(btn, completed)
 * ----------------------------
 * Applies visual styling to the injected completion button.
 * - If completed → green circular "✓"
 * - If not completed → light gray circular "+"
 *
 * All styling is inline to guarantee consistent appearance across YouTube.
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
    btn.style.color = "#ffffff";
  } else {
    btn.textContent = "+";
    btn.style.background = "#e5e5e5";
    btn.style.color = "#555";
  }
}

/*
 * cleanup()
 * ----------
 * Safely disconnects the MutationObserver and cleans internal references.
 * Called during beforeunload to prevent observers from persisting
 * across navigation or tab closure.
 */
function cleanup() {
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }
}

/*
 * Initial storage load:
 * ----------------------
 * Reads playlists from chrome.storage.local, builds the completedMap,
 * and begins scanning + injecting buttons into #playlist-items elements.
 */
chrome.storage.local.get(["playlists"], (result) => {
  const playlists = result.playlists || [];
  currentCompletedMap = buildCompletedMap(playlists);

  waitForElements("#playlist-items", addCompletionButton, currentCompletedMap);
});

/*
 * Storage listener:
 * ------------------
 * When playlists change (e.g., user completes a video), rebuilds the completedMap
 * and updates all injected buttons so the UI stays in sync.
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.playlists) {
    const newPlaylists = changes.playlists.newValue || [];
    currentCompletedMap = buildCompletedMap(newPlaylists);

    updateAllButtons();
  }
});

/*
 * updateAllButtons()
 * -------------------
 * Refreshes every already-injected button by:
 * - Re-reading each video's ID
 * - Checking if it is completed in the current map
 * - Re-applying the correct styling
 *
 * Ensures UI state stays accurate even if completion happens elsewhere.
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
