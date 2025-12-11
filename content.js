// content.js

function waitForElements(selector, callback) {
  document.querySelectorAll(selector).forEach((el) => callback(el));

  const obs = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => callback(el));
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

function addTestButton(item) {
  if (item.dataset.trackheroInjected === "true") return;

  item.dataset.trackheroInjected = "true";

  const btn = document.createElement("button");
  btn.textContent = "+";
  btn.style.width = "28px";
  btn.style.height = "28px";
  btn.style.borderRadius = "50%";
  btn.style.display = "flex";
  btn.style.alignItems = "center";
  btn.style.justifyContent = "center";
  btn.style.background = "#e5e5e5";
  btn.style.border = "none";
  btn.style.color = "#555";
  btn.style.fontSize = "18px";
  btn.style.fontWeight = "700";
  btn.style.cursor = "pointer";
  btn.style.marginLeft = "8px";
  btn.style.transition = "background 0.2s";
  btn.onmouseenter = () => (btn.style.background = "#8fffb6ff");
  btn.onmouseleave = () => (btn.style.background = "#e5e5e5");

  const urlForThatVideo = getUrlForItem(item);

  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "MARK_ITEM_COMPLETE",
      url: urlForThatVideo,
    });
  });

  item.insertAdjacentElement("beforeend", btn);
}

waitForElements("#playlist-items", addTestButton);
