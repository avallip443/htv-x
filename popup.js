const stockNameEl = document.getElementById("stock-name");
const stockTickerEl = document.getElementById("stock-ticker");
const stockRangeEl = document.getElementById("stock-range");

function updateStockName(name) {
  console.log("[popup.js] Updating stock name:", name);

  stockNameEl.textContent = name || "Not detected";
}

function updateStockTicker(ticker) {
  console.log("[popup.js] Updating stock ticker:", name);

  stockTickerEl.textContent = ticker || "";
}

function updateStockRange(rangeData) {
  console.log("[popup.js] Updating stock range:", rangeData);

  if (rangeData && rangeData.stockTimeRange && rangeData.stockChange) {
    stockRangeEl.textContent = `${rangeData.stockTimeRange} (${rangeData.stockChange})`;
  } else {
    stockRangeEl.textContent =
      "Click and drag your mouse over the graph to select a time range.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[popup.js] Loaded");

  chrome.storage.local.get(
    ["stockName", "stockTicker", "stockRange"],
    (data) => {
      updateStockName(data.stockName);
      updateStockTicker(data.stockTicker);
      updateStockRange(data.stockRange);
    }
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      console.log("[popup.js] Storage changed:", changes);

      if (changes.stockName) {
        updateStockName(changes.stockName.newValue);
      }
      if (changes.stockTicker) {
        updateStockTicker(changes.stockTicker.newValue);
      }
      if (changes.stockRange) {
        updateStockRange(changes.stockRange.newValue);
      }
    }
  });
});
