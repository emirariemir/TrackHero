// content.js

function waitForElements(selector, callback) {
  document.querySelectorAll(selector).forEach((el) => callback(el));

  const obs = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => callback(el));
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });
}

function addTestButton(item) {
  if (item.dataset.trackheroInjected === "true") return;

  item.dataset.trackheroInjected = "true";

  const btn = document.createElement("button");
  btn.textContent = "⭐ Test";
  btn.style.marginLeft = "8px";
  btn.style.cursor = "pointer";
  btn.style.padding = "4px 6px";
  btn.style.borderRadius = "6px";
  btn.style.background = "#ffd54f";
  btn.style.border = "none";
  btn.style.fontSize = "12px";

  item.insertAdjacentElement("beforeend", btn);

  btn.addEventListener("click", () => {
    console.log("TrackHero button clicked for:", item);
  });
}

waitForElements("#index-container", addTestButton);
