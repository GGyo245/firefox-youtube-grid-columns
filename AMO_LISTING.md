# AMO Listing Copy

## Add-on Name
- YouTube Grid Columns Controller

## Summary (KO)
- 유튜브 홈/주요 피드에서 그리드 열(2~8)을 조절하고 쇼츠 선반과 스폰서 타일을 숨기는 확장.

## Summary (EN)
- Control YouTube grid columns (2 to 8) on Home/main feed pages and hide Shorts shelves and sponsored tiles.

## Description (KO)
유튜브 홈/주요 피드 화면에서 한 줄에 보이는 영상 개수를 원하는 값으로 바꿀 수 있습니다.

주요 기능:
- 한 줄 영상 개수 2~8개 조절
- 팝업 슬라이더로 즉시 적용
- 설정 자동 저장
- 쇼츠 선반 섹션 숨김
- 스폰서/광고 타일 숨김

필수 권한:
- 브라우저 탭에 접근
- www.youtube.com에서 사용자의 데이터에 접근

개인정보:
- 데이터 수집 없음
- 외부 서버 통신 없음

## Description (EN)
Adjust how many videos appear in each row on YouTube Home and main feed pages.

Features:
- Set 2 to 8 columns
- Apply instantly from popup slider
- Setting is saved automatically
- Shorts shelves are hidden
- Sponsored/ad tiles are hidden

Required permissions:
- Access browser tabs
- Access your data for www.youtube.com

Privacy:
- No data collection
- No external network requests

## Category Suggestion
- Shopping / Search Tools / Appearance

## Release Notes (0.1.10)
- Hide the Shorts, Relevance, and Latest shelves on the Subscriptions page
- Improve SPA handling for Subscriptions page shelf hiding

## Release Notes (0.1.9)
- Keep the selected grid layout when navigating from Home variants such as `/?bp=...` back to the main Home page
- Fixed a bug that could reset the stored column setting to the default 4-column layout during Home navigation

## Release Notes (0.1.8)
- Apply the grid layout across YouTube feed-style pages, including Home variants such as `/?bp=...`
- Exclude non-feed pages and the You page (`/feed/you`) from grid styling

## Release Notes (0.1.7)
- Hide Russian breaking news shelves (for example, "Срочные новости")

## Release Notes (0.1.6)
- Hide German breaking news shelves (for example, "Eilmeldungen")
- Hide the top masthead sponsored video section on supported pages

## Release Notes (0.1.5)
- Show a refresh hint when the popup cannot connect to the YouTube page

## Release Notes (0.1.4)
- Scope extension to YouTube home and main feed pages only (reduced match patterns)
- Theme popup UI to match YouTube dark/light mode
- Hide in-feed sponsored/ad tiles on supported pages
- Improve popup UI (cleaner styling and clearer slider feedback)

## Release Notes (0.1.3)
- Hide additional home shelf sections such as news shelf blocks
- Add left/right feed padding adjustment (left 20px, right 30px) for better spacing
