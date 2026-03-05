# Development Guide

## Build Environment

- OS: Linux/macOS/Windows (any OS that can run `zip`)
- Runtime tools: none required to build the add-on package
- Optional local syntax check: Node.js 18+ (`node --check`)
- Packaging tool: `zip` command

## Exact Build Steps

This project does not use transpilers, bundlers, concatenation, or minification.
The distributed add-on is built by zipping the source files as-is.

1. Open a terminal in this folder:
   `cd /home/geegun/firefox-youtube-grid-control`
2. Build add-on package:
   `zip -r youtube-grid-columns.xpi manifest.json content.js popup.html popup.css popup.js icon.svg README.md DEV.md AMO_LISTING.md CHANGELOG.md LICENSE`
3. Build source archive for AMO review:
   `zip -r source-code.zip .editorconfig .gitignore manifest.json content.js popup.html popup.css popup.js icon.svg README.md DEV.md AMO_LISTING.md CHANGELOG.md LICENSE`

## Load Locally (Firefox)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on...`.
3. Select `manifest.json` from this folder.
