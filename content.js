let hoverObserver = null;
let latestHover = { value: null, time: null };

function startHoverObserver() {
  if (hoverObserver) return; // avoid duplicates

  hoverObserver = new MutationObserver(() => {
    const valueEl = document.querySelector('.knowledge-finance-wholepage-chart__hover-card-value');
    const timeEl = document.querySelector('.knowledge-finance-wholepage-chart__hover-card-time');

    if (valueEl && timeEl) {
      latestHover.value = valueEl.innerText.trim();
      latestHover.time = timeEl.innerText.trim();
    }
  });

  hoverObserver.observe(document.body, { childList: true, subtree: true });
}

function stopHoverObserverAndSave() {
  if (hoverObserver) {
    hoverObserver.disconnect();
    hoverObserver = null;

    if (latestHover.value && latestHover.time) {
      console.log("💾 Final Hover Snapshot →", latestHover);
      chrome.storage.local.set({ stockHover: { ...latestHover } });
    }

    // Reset for next drag
    latestHover = { value: null, time: null };
  }
}

// --- Attach triggers ---
document.addEventListener("mousedown", () => {
  console.log("🟢 mousedown: observing hover data...");
  startHoverObserver();
});

document.addEventListener("mouseup", () => {
  console.log("🔴 mouseup: stopping observer and saving latest value/time...");
  stopHoverObserverAndSave();
});
