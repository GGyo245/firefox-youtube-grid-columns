const DEFAULT_COLUMNS = 4;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;
const STYLE_ID = "yt-grid-columns-controller-style";
const FULL_WIDTH_CLASS = "yt-grid-columns-controller-full-width";
let gridObserver = null;

function clampColumns(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_COLUMNS;
  return Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, Math.round(number)));
}

function ensureStyleTag() {
  let styleTag = document.getElementById(STYLE_ID);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = STYLE_ID;
    document.documentElement.appendChild(styleTag);
  }
  return styleTag;
}

function applyColumns(columns) {
  const safeColumns = clampColumns(columns);
  const styleTag = ensureStyleTag();

  styleTag.textContent = `
    ytd-rich-grid-renderer {
      --yt-grid-columns-controller-count: ${safeColumns};
      --yt-grid-columns-controller-gap: 16px;
    }

    ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer {
      display: grid !important;
      grid-template-columns: repeat(var(--yt-grid-columns-controller-count), minmax(0, 1fr)) !important;
      gap: var(--yt-grid-columns-controller-gap) !important;
      align-items: start !important;
    }

    ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      grid-column: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer.${FULL_WIDTH_CLASS} {
      grid-column: 1 / -1 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;

  markFullWidthItems();
  ensureGridObserver();
}

function isFullWidthItem(item) {
  return Boolean(
    item.querySelector("ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-statement-banner-renderer")
  );
}

function markFullWidthItems() {
  const items = document.querySelectorAll(
    "ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer"
  );

  for (const item of items) {
    item.classList.toggle(FULL_WIDTH_CLASS, isFullWidthItem(item));
  }
}

function ensureGridObserver() {
  const container = document.querySelector("ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer");
  if (!container) return;

  if (gridObserver) {
    gridObserver.disconnect();
  }

  gridObserver = new MutationObserver(() => {
    markFullWidthItems();
  });

  gridObserver.observe(container, {
    childList: true,
    subtree: true
  });
}

async function loadAndApply() {
  const result = await browser.storage.local.get({ youtubeColumns: DEFAULT_COLUMNS });
  applyColumns(result.youtubeColumns);
}

browser.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "set_columns") return;
  applyColumns(message.columns);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!changes.youtubeColumns) return;
  applyColumns(changes.youtubeColumns.newValue);
});

loadAndApply().catch(() => {
  applyColumns(DEFAULT_COLUMNS);
});
