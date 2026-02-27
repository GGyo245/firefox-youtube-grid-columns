const DEFAULT_COLUMNS = 4;
const valueText = document.getElementById("valueText");
const columnRange = document.getElementById("columnRange");
const applyBtn = document.getElementById("applyBtn");
const statusText = document.getElementById("statusText");

function setStatus(message) {
  statusText.textContent = message;
}

function renderValue(value) {
  valueText.textContent = String(value);
}

async function getActiveYouTubeTabId() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) throw new Error("Could not find the active tab.");

  const tab = tabs[0];
  if (!tab.url || !tab.url.includes("youtube.com")) {
    throw new Error("This works only on YouTube tabs.");
  }

  return tab.id;
}

async function loadSavedColumns() {
  const data = await browser.storage.local.get({ youtubeColumns: DEFAULT_COLUMNS });
  const columns = Number(data.youtubeColumns) || DEFAULT_COLUMNS;
  columnRange.value = String(columns);
  renderValue(columns);
}

columnRange.addEventListener("input", () => {
  renderValue(columnRange.value);
});

applyBtn.addEventListener("click", async () => {
  try {
    const columns = Number(columnRange.value);
    await browser.storage.local.set({ youtubeColumns: columns });

    const tabId = await getActiveYouTubeTabId();
    await browser.tabs.sendMessage(tabId, {
      type: "set_columns",
      columns
    });

    setStatus("Applied.");
  } catch (error) {
    setStatus(`Failed: ${error.message}`);
  }
});

loadSavedColumns().catch((error) => {
  setStatus(`Init failed: ${error.message}`);
});
