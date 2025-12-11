// content.js

function waitForElements(selector, callback, map) {
  document.querySelectorAll(selector).forEach((el) => callback(el, map));

  const obs = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => callback(el, map));
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
}

function getUrlForItem(item) {
  const link =
    item.querySelector("a#wc-endpoint") || item.querySelector("a#thumbnail");

  if (!link) return null;

  const href = link.getAttribute("href");

  const url = new URL(href, "https://www.youtube.com");
  return url;
}

function buildCompletedMap(playlists) {
  const map = new Set();
  playlists.forEach((pl) => {
    (pl.completedVideos || []).forEach((video) => {
      map.add(video.id);
    });
  });
  return map;
}

function addTestButton(item, completedMap) {
  if (item.dataset.trackheroInjected === "true") return;

  item.dataset.trackheroInjected = "true";

  const urlForThatVideo = getUrlForItem(item);

  const videoId = urlForThatVideo.searchParams.get("v");

  const isCompleted = completedMap.has(videoId);

  const btn = document.createElement("button");

  if (isCompleted) {
    btn.textContent = "-";
    btn.style.background = "#8fffb6";
    btn.style.color = "#ffffff";
  } else {
    btn.textContent = "+";
    btn.style.background = "#e5e5e5";
    btn.style.color = "#555";
  }

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
  btn.style.transition = "background 0.2s";

  btn.onmouseenter = () => (btn.style.background = "#8fffb6ff");
  btn.onmouseleave = () => (btn.style.background = "#e5e5e5");

  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "MARK_ITEM_COMPLETE",
      url: urlForThatVideo,
    });
  });

  item.insertAdjacentElement("beforeend", btn);
}

chrome.storage.local.get(["playlists"], (result) => {
  const playlists = result.playlists || [];
  const completedMap = buildCompletedMap(playlists);

  waitForElements("#playlist-items", addTestButton, completedMap);
});
