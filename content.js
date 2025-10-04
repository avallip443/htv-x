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
let lastChange = null;

document.addEventListener("mousedown", () => {
  isDragging = true;
  console.log("🟢 Started drag observation");

  hoverObserver = new MutationObserver(() => {
    const val = document.querySelector(
      ".knowledge-finance-wholepage-chart__hover-card"
    );

    if (!val) return;

    const text = val.innerText.trim();
    const parts = text.split("\n");

    const capturedStockChange = parts[0];
    const capturedStockRange = parts[1];

    const cleanCapturedRange = capturedStockRange.replace(/\u200E/g, "").replace(/\u202F/g, "");

    if (cleanCapturedRange.includes("–") || cleanCapturedRange.includes("-")) {
      lastRange = cleanCapturedRange.trim();
      lastChange = capturedStockChange.trim();
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

    if (lastRange && lastChange) {
      const data = { stockRange: lastRange, stockChange: lastChange, stockTimeSpan: timeSpan };
      chrome.storage.local.set(data);
      lastRange = null;
      lastChange = null;
    } else {
      console.log("No information detected.");
    }
  }
});
