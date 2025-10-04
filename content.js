(function () {
  const detectStockName = () => {
    const element = document.querySelector('[data-attrid][role="heading"]');
    if (element) {
      const stockName = element.innerText.trim();
      chrome.storage.local.set({ stockName });
    }
  };

  detectStockName();

  const observer = new MutationObserver(detectStockName);
  observer.observe(document.body, { childList: true, subtree: true });
})();

let isDragging = false;
let hoverObserver = null;
let lastRange = null;

document.addEventListener("mousedown", () => {
  isDragging = true;
  console.log("🟢 Started drag observation");

  hoverObserver = new MutationObserver(() => {
    const valueEl = document.querySelector('.knowledge-finance-wholepage-chart__hover-card-value');
    const timeEl = document.querySelector('.knowledge-finance-wholepage-chart__hover-card-time');

    console.log("timeEl:", timeEl)
    console.log("check", timeEl.innerText.includes("-"))
    if (timeEl && timeEl.innerText.includes("-")) { 
      lastRange = timeEl.innerText.trim();
        console.log("last time:", lastRange)
    }
  });

  hoverObserver.observe(document.body, { childList: true, subtree: true });
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    if (hoverObserver) {
      hoverObserver.disconnect();
      hoverObserver = null;
    }
    if (lastRange) {
      console.log("💾 Final range snapshot:", lastRange);
      chrome.storage.local.set({ stockRange: lastRange });
      lastRange = null;
    } else {
      console.log("No range detected.");
    }
  }
});
