const DEFAULT_COLUMNS = 4;
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;
const STYLE_ID = "yt-grid-columns-controller-style";
const FULL_WIDTH_CLASS = "yt-grid-columns-controller-full-width";
const HIDE_SHORTS_CLASS = "yt-grid-columns-controller-hide-shorts";
const HIDE_ADS_CLASS = "yt-grid-columns-controller-hide-ads";
let gridObserver = null;
let rootObserver = null;
let currentColumns = DEFAULT_COLUMNS;
let hasLoadedColumns = false;
const EXCLUDED_PATH_PREFIXES = [
  "/feed/you",
  "/watch",
  "/shorts",
  "/playlist",
  "/results",
  "/channel",
  "/c/",
  "/@",
  "/live",
  "/clip",
  "/post",
  "/hashtag"
];

function parseRgbColor(value) {
  if (!value) return null;
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if (![r, g, b].every((n) => Number.isFinite(n))) return null;
  return { r, g, b };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function detectYouTubeTheme() {
  const app = document.querySelector("ytd-app");
  if (app?.hasAttribute("dark")) return "dark";
  if (document.documentElement?.hasAttribute("dark")) return "dark";

  const candidates = [app, document.body, document.documentElement].filter(Boolean);
  for (const node of candidates) {
    const color = parseRgbColor(getComputedStyle(node).backgroundColor);
    if (!color) continue;
    return relativeLuminance(color) < 0.2 ? "dark" : "light";
  }

  return "light";
}

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

function getGridContainer() {
  return document.querySelector("ytd-rich-grid-renderer > #contents");
}

function isExcludedPath(pathname = window.location.pathname) {
  return EXCLUDED_PATH_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isEligiblePage() {
  return !isExcludedPath();
}

function cleanupGridStyles() {
  if (gridObserver) {
    gridObserver.disconnect();
    gridObserver = null;
  }

  document.getElementById(STYLE_ID)?.remove();

  const container = getGridContainer();
  if (!container) return;

  for (const child of Array.from(container.children)) {
    child.classList.remove(HIDE_SHORTS_CLASS, HIDE_ADS_CLASS, FULL_WIDTH_CLASS);
    child.style.removeProperty("display");
  }
}

function applyColumns(columns) {
  if (!isEligiblePage()) {
    cleanupGridStyles();
    return;
  }

  const container = getGridContainer();
  if (!container) return;

  const safeColumns = clampColumns(columns);
  currentColumns = safeColumns;
  const styleTag = ensureStyleTag();

  styleTag.textContent = `
    ytd-rich-grid-renderer {
      --yt-grid-columns-controller-count: ${safeColumns};
      --yt-grid-columns-controller-column-gap: 16px;
      --yt-grid-columns-controller-row-gap: 24px;
    }

    ytd-rich-grid-renderer > #contents {
      display: grid !important;
      grid-template-columns: repeat(var(--yt-grid-columns-controller-count), minmax(0, 1fr)) !important;
      column-gap: var(--yt-grid-columns-controller-column-gap) !important;
      row-gap: var(--yt-grid-columns-controller-row-gap) !important;
      padding-left: 20px !important;
      padding-right: 30px !important;
      box-sizing: border-box !important;
      align-items: start !important;
    }

    ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer {
      width: auto !important;
      max-width: none !important;
      min-width: 0 !important;
      grid-column: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    ytd-rich-grid-renderer > #contents > ytd-rich-item-renderer.${FULL_WIDTH_CLASS} {
      grid-column: 1 / -1 !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    ytd-rich-grid-renderer > #contents > .${HIDE_SHORTS_CLASS} {
      display: none !important;
    }

    ytd-rich-grid-renderer > #contents > .${HIDE_ADS_CLASS} {
      display: none !important;
    }

    ytd-rich-grid-renderer > #masthead-ad,
    ytd-rich-grid-renderer > #masthead-ad ytd-ad-slot-renderer,
    ytd-rich-grid-renderer > #masthead-ad ytd-page-top-ad-layout-renderer {
      display: none !important;
    }
  `;

  markSpecialItems();
  ensureGridObserver();
}

async function syncColumnsFromStorage() {
  const result = await browser.storage.local.get({ youtubeColumns: DEFAULT_COLUMNS });
  const safeColumns = clampColumns(result.youtubeColumns);
  currentColumns = safeColumns;
  hasLoadedColumns = true;
  applyColumns(safeColumns);
}

function isFullWidthItem(item) {
  return Boolean(
    item.querySelector("ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-statement-banner-renderer")
  );
}

function isShortsItem(item) {
  if (!item) return false;
  const tagName = item.tagName?.toLowerCase();

  if (tagName === "ytd-rich-section-renderer") {
    const shelfTitle = item
      .querySelector(":scope > #content > ytd-rich-shelf-renderer #title")
      ?.textContent?.trim()
      ?.toLowerCase();
    const isNewsShelf = Boolean(
      shelfTitle &&
        [
          "뉴스 속보",
          "breaking news",
          "top news",
          "news",
          "ニュース速報",
          "速報ニュース",
          "eilmeldungen",
          "schlagzeilen",
          "top-meldungen",
          "срочные новости"
        ].some((keyword) =>
          shelfTitle.includes(keyword)
        )
    );

    return Boolean(
      item.querySelector(
        ":scope > #content > ytd-rich-shelf-renderer[is-shorts], :scope > #content > ytd-chips-shelf-with-video-shelf-renderer"
      ) || isNewsShelf
    );
  }

  if (tagName === "ytd-rich-item-renderer") {
    return Boolean(
      item.querySelector(
        ":scope ytd-rich-shelf-renderer[is-shorts], :scope ytm-shorts-lockup-view-model-v2, :scope ytm-shorts-lockup-view-model, :scope a[href*='/shorts/']"
      )
    );
  }

  if (item.matches("ytd-reel-shelf-renderer")) return true;
  return false;
}

function isAdItem(item) {
  if (!item) return false;
  return Boolean(
    item.querySelector(
      // Home/feed in-grid ads are typically rendered via ytd-ad-slot-renderer.
      ":scope ytd-ad-slot-renderer, :scope ytd-in-feed-ad-layout-renderer, :scope ytd-display-ad-renderer, :scope ytd-promoted-sparkles-web-renderer"
    )
  );
}

function markSpecialItems() {
  if (!isEligiblePage()) return;

  const container = getGridContainer();
  if (!container) return;

  const children = Array.from(container.children);
  for (const child of children) {
    const shorts = isShortsItem(child);
    const ad = isAdItem(child);
    child.classList.toggle(HIDE_SHORTS_CLASS, shorts);
    child.classList.toggle(HIDE_ADS_CLASS, ad);
    if (shorts || ad) {
      child.style.setProperty("display", "none", "important");
    } else {
      child.style.removeProperty("display");
    }
  }

  const items = children.filter(
    (node) => node.tagName && node.tagName.toLowerCase() === "ytd-rich-item-renderer"
  );
  for (const item of items) {
    if (item.classList.contains(HIDE_SHORTS_CLASS) || item.classList.contains(HIDE_ADS_CLASS)) {
      item.classList.remove(FULL_WIDTH_CLASS);
      continue;
    }
    item.classList.toggle(FULL_WIDTH_CLASS, isFullWidthItem(item));
  }
}

function ensureGridObserver() {
  if (!isEligiblePage()) {
    if (gridObserver) {
      gridObserver.disconnect();
      gridObserver = null;
    }
    return;
  }

  const container = getGridContainer();
  if (!container) return;

  if (gridObserver) {
    gridObserver.disconnect();
  }

  gridObserver = new MutationObserver(() => {
    markSpecialItems();
  });

  gridObserver.observe(container, {
    childList: true,
    subtree: true
  });
}

function ensureRootObserver() {
  if (rootObserver) return;

  rootObserver = new MutationObserver(() => {
    if (!isEligiblePage()) {
      cleanupGridStyles();
      return;
    }

    if (hasLoadedColumns && getGridContainer()) {
      applyColumns(currentColumns);
    }
  });

  rootObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

async function loadAndApply() {
  await syncColumnsFromStorage();
}

browser.runtime.onMessage.addListener((message) => {
  if (!message) return;

  if (message.type === "set_columns") {
    applyColumns(message.columns);
    return;
  }

  if (message.type === "get_theme") {
    return Promise.resolve({ ok: true, theme: detectYouTubeTheme() });
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!changes.youtubeColumns) return;
  hasLoadedColumns = true;
  applyColumns(changes.youtubeColumns.newValue);
});

document.addEventListener("yt-navigate-finish", async () => {
  if (!isEligiblePage()) {
    cleanupGridStyles();
    return;
  }
  if (!hasLoadedColumns) {
    await syncColumnsFromStorage();
    return;
  }
  await syncColumnsFromStorage();
});

ensureRootObserver();
loadAndApply().catch(() => {
  hasLoadedColumns = true;
  applyColumns(DEFAULT_COLUMNS);
});
