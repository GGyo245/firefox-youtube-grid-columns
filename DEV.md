# Development Guide

## Load Locally (Firefox)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on...`.
3. Select `manifest.json` from this folder.

## Manual Test

1. Open `youtube.com`.
2. Open the extension popup.
3. Set columns and click `Apply`.
4. Confirm layout updates and setting persistence after refresh.

## Package for AMO

```bash
cd /home/geegun/firefox-youtube-grid-control
zip -r youtube-grid-columns.xpi manifest.json content.js popup.html popup.css popup.js icon.svg README.md DEV.md AMO_LISTING.md
```

## Publish

1. Sign in to AMO Developer Hub.
2. Submit the `.xpi` package.
3. Fill listing fields using `AMO_LISTING.md`.
