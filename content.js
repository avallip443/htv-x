(function () {
  const detectStockName = () => {
    const element = document.querySelector('[data-attrid][role="heading"]');
    if (element) {
      const stockName = element.innerText.trim();
      console.log("[content.js] 🟢 Detected stock name:", stockName);
      chrome.storage.local.set({ stockName });
    }
  };

  detectStockName();
  const observer = new MutationObserver(detectStockName);
  observer.observe(document.body, { childList: true, subtree: true });
})();

(function () {
  const detectStockTicker = () => {
    const element = document.querySelector(
      '[data-attrid="subtitle"][role="heading"]'
    );
    if (element) {
      const stockTicker = element.innerText.trim().split(": ")[1];
      console.log("[content.js] 🟢 Detected stock ticker:", stockTicker);
      chrome.storage.local.set({ stockTicker });
    }
  };

  detectStockTicker();
  const observer = new MutationObserver(detectStockTicker);
  observer.observe(document.body, { childList: true, subtree: true });
})();

(function () {
  let isDragging = false;
  let hoverObserver = null;
  let lastTimeRange = null;
  let lastChange = null;

  console.log("[content.js] ✅ Range detector initialized");

  document.addEventListener("mousedown", (e) => {
    if (
      !document.querySelector(".knowledge-finance-wholepage-chart__hover-card")
    ) {
      console.log(
        "[content.js] Mouse down — no chart hover element found yet, but will watch..."
      );
    }

    isDragging = true;
    console.log("[content.js] 🟢 Drag started");

    hoverObserver = new MutationObserver(() => {
      const val = document.querySelector(
        ".knowledge-finance-wholepage-chart__hover-card"
      );
      if (!val) return;

      const text = val.innerText.trim();
      const parts = text.split("\n");

      if (parts.length < 2) return;

      const capturedStockChange = parts[0];
      const capturedStockRange = parts[1];

      const cleanCapturedRange = capturedStockRange
        .replace(/\u200E/g, "")
        .replace(/\u202F/g, "");

      if (
        cleanCapturedRange.includes("–") ||
        cleanCapturedRange.includes("-")
      ) {
        lastTimeRange = cleanCapturedRange.trim();
        lastChange = capturedStockChange.trim();
        console.log("[content.js] ⏱ Capturing range:", lastTimeRange);
        console.log("[content.js] 💹 Capturing change:", lastChange);
      }
    });

    hoverObserver.observe(document.body, { childList: true, subtree: true });
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    console.log("[content.js] 🛑 Mouse released");
    isDragging = false;

    if (hoverObserver) {
      hoverObserver.disconnect();
      hoverObserver = null;
    }

    if (lastTimeRange && lastChange) {
      const parsedRange = parseDateOrTimeRange(lastTimeRange);

      const stockRange = {
        stockTimeRange: parsedRange,
        stockChange: lastChange,
      };

      console.log("[content.js] ✅ Saving to chrome.storage:", stockRange);
      chrome.storage.local.set({ stockRange }, () => {
        console.log("[content.js] 🟢 Saved successfully");
      });

      lastTimeRange = null;
      lastChange = null;
    } else {
      console.log("[content.js] ⚠️ No time range detected on mouseup");
      chrome.storage.local.set({ stockRange: null });
    }
  });
})();

function parseDateOrTimeRange(rangeText) {
  rangeText = rangeText
    .replace(/\u200E/g, "")
    .replace(/\u202F/g, "")
    .trim();
  const currentYear = new Date().getFullYear();

  // case 1: "9:30 AM-10:30 AM"
  if (rangeText.match(/\d{1,2}:\d{2}\s?[APMapm]{2}/)) {
    const today = formatPrettyDate(new Date());
    return `${today} → ${today}`;
  }

  // case 2: "Jan 14, 2025-Feb 6, 2025"
  if (rangeText.match(/\d{4}/g)) {
    const [start, end] = rangeText.split("-");
    const startDate = new Date(start.trim());
    const endDate = new Date(end.trim());
    return `${formatPrettyDate(startDate)} → ${formatPrettyDate(endDate)}`;
  }

  // case 3: "Tue, Apr 22-Wed, May 21"
  const parts = rangeText.split("-");
  if (parts.length === 2) {
    const start = parts[0].replace(/^[A-Za-z]+,\s*/, "").trim(); // remove weekday if present
    const end = parts[1].replace(/^[A-Za-z]+,\s*/, "").trim();

    const startDate = parseMonthDay(start, currentYear);
    const endDate = parseMonthDay(end, currentYear);

    if (endDate < startDate) {
      endDate.setFullYear(currentYear + 1);
    }

    return `${formatPrettyDate(startDate)} to ${formatPrettyDate(endDate)}`;
  }

  console.warn("[content.js] ⚠️ Unrecognized range format:", rangeText);
  return rangeText;
}

function parseMonthDay(text, year) {
  const [monthStr, dayStr] = text.split(" ");
  const month = new Date(`${monthStr} 1, ${year}`).getMonth();
  const day = parseInt(dayStr);
  return new Date(year, month, day);
}

function formatPrettyDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
