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
  if (!tabs.length) throw new Error("활성 탭을 찾지 못했습니다.");

  const tab = tabs[0];
  if (!tab.url || !tab.url.includes("youtube.com")) {
    throw new Error("유튜브 탭에서만 적용할 수 있습니다.");
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

    setStatus("적용되었습니다.");
  } catch (error) {
    setStatus(`실패: ${error.message}`);
  }
});

loadSavedColumns().catch((error) => {
  setStatus(`초기화 실패: ${error.message}`);
});
