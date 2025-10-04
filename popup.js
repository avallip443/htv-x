const stockNameEl = document.getElementById("stock-name");

function updateStockName(name) {
  stockNameEl.textContent = name || "Not detected";
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("stockName", (data) => {
    updateStockName(data.stockName);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.stockName) {
      updateStockName(changes.stockName.newValue);
    }
  });
});

document.addEventListener("dblclick", () => {
  console.log("Started observing hover values...");
  observeStockHover();
});
