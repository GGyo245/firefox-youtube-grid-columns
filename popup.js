const DEFAULT_COLUMNS = 4;
const valueText = document.getElementById("valueText");
const columnRange = document.getElementById("columnRange");
const applyBtn = document.getElementById("applyBtn");
const statusText = document.getElementById("statusText");

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
    setStatus(`Failed: ${error.message}`);
  }
});

loadSavedColumns().catch((error) => {
  setStatus(`Init failed: ${error.message}`);
});

applyThemeFromActiveTab();
