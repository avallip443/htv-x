(function () {
  const detectStock = () => {   
    const nameElement = document.querySelector('[data-attrid][role="heading"]');
    if (nameElement) {
      const stockName = nameElement.innerText.trim();
      // console.log("[content.js] 🟢 Detected stock name:", stockName);
      chrome.storage.local.set({ stockName });
    }

    const tickerElement = document.querySelector('[data-attrid="subtitle"][role="heading"]');
    if (tickerElement) {
      const stockTicker = tickerElement.innerText.trim().split(": ")[1];
      // console.log("[content.js] 🟢 Detected stock ticker:", stockTicker);
      chrome.storage.local.set({ stockTicker });
    }

    if (!nameElement && !tickerElement) {
      requestAnimationFrame(detectStock);
    }
  };

  detectStock();

  const observer = new MutationObserver((mutations) => {
    const shouldDetect = mutations.some(mutation => 
      mutation.type === 'childList' || 
      (mutation.type === 'attributes' && mutation.target.matches('[data-attrid], [role="heading"]'))
    );
    
    if (shouldDetect) {
      detectStock();
    }
  });

  observer.observe(document, { 
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-attrid', 'role']
  });
})();

(function () {
  let isDragging = false;
  let hoverObserver = null;
  let lastTimeRange = null;
  let lastChange = null;

  document.addEventListener("mousedown", (e) => {
    if (
      !document.querySelector(".knowledge-finance-wholepage-chart__hover-card")
    ) {
      console.log(
        "[content.js] Mouse down — no chart hover element found yet, but will watch..."
      );
    }

    isDragging = true;

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
      }
    });

    hoverObserver.observe(document.body, { childList: true, subtree: true });
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;

    isDragging = false;

    if (hoverObserver) {
      hoverObserver.disconnect();
      hoverObserver = null;
    }

     const val = document.querySelector(
        ".knowledge-finance-wholepage-chart__hover-card-value"
      );

      const endPrice = val.innerText.trim();
      const cleanedEndPrice = endPrice.split(" ")[0];

    if (lastTimeRange && lastChange) {
      const parsedRange = parseDateOrTimeRange(lastTimeRange);

      let priceChange = null;
      let percentageChange = null;
      const changeMatch = lastChange.match(/([+-]?\d+\.?\d*)\s*\(([+-]?\d+\.?\d*)%\)/);
      if (changeMatch) {
        priceChange = parseFloat(changeMatch[1]);
        percentageChange = parseFloat(changeMatch[2]);
        console.log("[content.js] 📊 Price change:", priceChange, "Percentage:", percentageChange + "%");
      }

      const stockRange = {
        stockTimeRange: parsedRange,
        stockChange: lastChange,
        priceChange: priceChange,
        percentageChange: percentageChange,
        endPrice: cleanedEndPrice, 
      };

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
    return `${today} to ${today}`;
  }

  // case 2: "Jan 14, 2025-Feb 6, 2025"
  if (rangeText.match(/\d{4}/g)) {
    const [start, end] = rangeText.split("-");
    const startDate = new Date(start.trim());
    const endDate = new Date(end.trim());
    return `${formatPrettyDate(startDate)} to ${formatPrettyDate(endDate)}`;
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