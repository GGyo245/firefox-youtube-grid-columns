const DEFAULT_COLUMNS = 4;
const valueText = document.getElementById("valueText");
const columnRange = document.getElementById("columnRange");
const applyBtn = document.getElementById("applyBtn");
const statusText = document.getElementById("statusText");

function isConnectionError(message) {
  if (!message) return false;
  return /could not establish connection|receiving end does not exist|message port closed/i.test(message);
}

function setRangeFill(value) {
  const min = Number(columnRange.min) || 0;
  const max = Number(columnRange.max) || 100;
  const num = Number(value);
  if (!Number.isFinite(num) || max <= min) return;

  const pct = ((num - min) / (max - min)) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  document.documentElement.style.setProperty("--ytgc-range-pct", `${clamped}%`);
}

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("theme-dark", isDark);
  document.body.classList.toggle("theme-light", !isDark);
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderValue(value) {
  valueText.textContent = String(value);
  setRangeFill(value);
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

async function applyThemeFromActiveTab() {
  try {
    const tabId = await getActiveYouTubeTabId();
    const response = await browser.tabs.sendMessage(tabId, { type: "get_theme" });
    if (response && response.ok === true && (response.theme === "dark" || response.theme === "light")) {
      setTheme(response.theme);
      return;
    }
  } catch {
    // Ignore and fall back to OS preference.
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
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
    const message = error instanceof Error ? error.message : String(error);
    if (isConnectionError(message)) {
      setStatus("Please refresh the YouTube page and try again.");
      return;
    }
    setStatus(`Failed: ${message}`);
  }
});

loadSavedColumns().catch((error) => {
  setStatus(`Init failed: ${error.message}`);
});

applyThemeFromActiveTab();
