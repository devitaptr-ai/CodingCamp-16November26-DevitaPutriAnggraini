# Implementation Plan: Personal Dashboard

## Overview

The Personal Dashboard is a zero-backend, zero-framework single-page web app built from exactly three deliverable files — `index.html`, `css/style.css`, and `js/app.js` — plus an optional `manifest.json` for browser-extension packaging. `js/app.js` is organized as one namespaced object containing a shared Storage module and four widget modules (Greeting, Focus_Timer, Task_List, Quick_Links_Widget), wired together by an App Controller that initializes each widget on `DOMContentLoaded`. Pure logic (time/date formatting, greeting mapping, drift-compensated timer computation, task/link validation and mutation, serialization) is isolated from DOM rendering so it can be reasoned about and, optionally, covered by property-based tests. All persistent data lives in Local Storage under two distinct keys, and every load degrades gracefully to an empty list on missing or corrupt data.

## Tasks

- [ ] 1. Set up project structure and HTML entry point
  - [ ] 1.1 Create directory structure, index.html, and file stubs
    - Create `css/` and `js/` directories at the repository root
    - Create `index.html` at the repository root as the single entry point, loading `css/style.css` (blocking, in `<head>`) and `js/app.js` (deferred, end of `<body>`) via relative paths
    - Add the static markup for all four widgets and their controls, each with stable IDs the JS will query: Greeting container (time, date, greeting elements); Focus_Timer container (time display, start/stop/reset buttons, session-ended message); Task_List container (Task_Entry input + add button, list element); Quick_Links_Widget container (display-name input, URL input, add button, button bar)
    - Create empty `css/style.css` and `js/app.js` stubs so later tasks fill them
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.1, 17.2_

- [ ] 2. Apply visual design via CSS
  - [ ] 2.1 Implement css/style.css layout, spacing, typography, and contrast
    - Lay out the four widgets stacked on one page with at least 16px of spacing between adjacent widgets
    - Set a minimum font size of 16px for all widget text
    - Choose foreground/background colors that achieve at least 4.5:1 contrast for all text
    - Style done tasks with strikethrough text decoration; leave not-done tasks unstyled
    - Hide the Focus_Timer "session ended" message by default (JS will reveal it)
    - Use only standard, non-vendor-prefixed CSS properties
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 7.2, 13.1_

- [ ] 3. Implement the shared Storage module
  - [ ] 3.1 Implement Storage module in js/app.js
    - Define the namespace object and the `KEYS` constants: `personalDashboard.tasks` and `personalDashboard.quickLinks` (two distinct keys)
    - `loadTasks()` / `loadQuickLinks()`: `getItem` → if `null` return `[]`; else `JSON.parse` inside try/catch; validate the result is an array of objects with the expected fields, otherwise return `[]`
    - `saveTasks(tasks)` / `saveQuickLinks(links)`: `JSON.stringify` then `setItem` inside try/catch, returning `false` on `QuotaExceededError` without throwing
    - Isolate all `localStorage` access here so widgets never call it directly
    - _Requirements: 9.3, 9.5, 11.3, 11.5, 12.1, 12.2, 12.3_

- [ ] 4. Implement the Greeting Widget
  - [ ] 4.1 Implement Greeting Widget time, date, and greeting logic with a 1-second tick
    - Implement a pure 12-hour time formatter: `h12 = h % 12 || 12`, zero-pad minutes and seconds to two digits, append `AM` if hour < 12 else `PM`
    - Implement a pure date formatter producing the full weekday name, full month name, numeric day, and four-digit year
    - Implement a pure greeting function mapping hour ranges to "Good morning" (5–11), "Good afternoon" (12–16), "Good evening" (17–20), "Good night" (21–23 or 0–4)
    - On init, start a 1000ms `setInterval` that re-reads `new Date()` and updates the time, date, and greeting text content each tick (wall-clock reads give free midnight and greeting-boundary updates within one second)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_
  - [ ]* 4.2 Write property test for 12-hour time formatting
    - Create `test/greeting.properties.test.js` using fast-check, at least 100 iterations per property
    - **Property 1: 12-hour time formatting** — format always matches `HH:MM:SS AM/PM` with hour in 1–12, midnight mapping to 12 AM and noon to 12 PM, minutes and seconds zero-padded
    - **Validates: Requirements 1.1**
  - [ ]* 4.3 Write property test for date formatting completeness
    - Add to `test/greeting.properties.test.js`
    - **Property 2: Date formatting completeness** — output contains the correct weekday, month, numeric day, and four-digit year matching that date's actual values
    - **Validates: Requirements 1.2**
  - [ ]* 4.4 Write property test for greeting mapping totality
    - Add to `test/greeting.properties.test.js`
    - **Property 3: Greeting mapping is total and matches the spec table** — every hour 0–23 maps to exactly one greeting per the boundary table
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 5. Implement the Focus Timer
  - [ ] 5.1 Implement Focus_Timer countdown, state machine, and controls
    - Initialize `remainingMs = 25 * 60 * 1000`, `status = Idle`
    - On start (from Idle or Paused): set `endTimestamp = Date.now() + remainingMs`, start a 1000ms tick that recomputes `remainingMs = max(0, endTimestamp - Date.now())` and displays `Math.ceil(remainingMs / 1000)` seconds as zero-padded MM:SS
    - On stop (from Running): freeze `remainingMs` from the last tick, clear the interval, set `status = Paused`
    - On reset (any status): clear the interval, set `remainingMs` to 25:00, set `status = Idle`, hide the session-ended message
    - When a tick reaches zero: display 00:00, clear the interval, set `status = Finished`, show the "session ended" message
    - Derive control enable/disable purely from status: start enabled unless Running; stop enabled only when Running; reset always enabled
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 5.2 Write property test for timer remaining monotonicity
    - Create `test/timer.properties.test.js` using fast-check, at least 100 iterations per property
    - **Property 4: Timer remaining decreases with elapsed time and never goes negative** — remaining equals initial minus elapsed clamped at 0, and stays 0 once elapsed reaches or exceeds the initial
    - **Validates: Requirements 3.2, 3.4**
  - [ ]* 5.3 Write property test for MM:SS display formatting
    - Add to `test/timer.properties.test.js`
    - **Property 5: Timer display is zero-padded MM:SS** — for any remaining-seconds value in 0–1500, minutes equal `floor(s/60)` and seconds equal `s mod 60`, zero-padded
    - **Validates: Requirements 3.3**
  - [ ]* 5.4 Write property test for control enable/disable
    - Add to `test/timer.properties.test.js`
    - **Property 6: Timer control enable/disable is a pure function of status** — start enabled iff not Running, stop enabled iff Running, reset always enabled
    - **Validates: Requirements 4.4, 4.5**
  - [ ]* 5.5 Write property test for state-transition contract
    - Add to `test/timer.properties.test.js`
    - **Property 7: Timer state transitions preserve the countdown contract** — start from Idle/Paused sets Running and preserves remaining; stop from Running sets Paused and preserves remaining; reset from any status sets Idle and restores 25:00
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6. Implement the Task List
  - [ ] 6.1 Implement Task_List add, edit, toggle, delete, persistence, and rendering
    - Keep `tasks[]` as the in-memory source of truth, loaded from Storage on init; each Task has a stable generated `id`, `text`, and `done`
    - Add: trim the entry value; if non-empty, append `{ id, text, done: false }` at the end and clear the entry; if empty, reject and keep state
    - Edit: enter in-place edit pre-filled with the current text, preserving position; save updates the text (trimmed) only if it contains a non-whitespace character, preserving `done`; an empty/whitespace save is rejected; Escape key or the cancel control discards the edit and keeps the previous text
    - Toggle done: flip `done`; render done tasks with strikethrough
    - Delete: remove the targeted Task by `id`
    - After every mutation, call `saveTasks(tasks)` and re-render the list (synchronous re-render keeps updates within 100ms)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 9.4, 14.2_
  - [ ]* 6.2 Write property test for the task add contract
    - Create `test/task.properties.test.js` using fast-check, at least 100 iterations per property
    - **Property 8: Task add contract** — non-empty trimmed input grows the list by exactly one at the end with the trimmed text and done=false and clears the entry; empty input leaves the list and entry unchanged
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  - [ ]* 6.3 Write property test for the task edit contract
    - Add to `test/task.properties.test.js`
    - **Property 9: Task edit contract** — edit preserves length, order, and existing texts and starts the buffer at the current text; a non-whitespace save updates only that task's text keeping done and position; an empty/whitespace save or a cancel/Escape keeps the previous text
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  - [ ]* 6.4 Write property test for completion toggle involution
    - Add to `test/task.properties.test.js`
    - **Property 10: Task completion toggle is an involution** — toggling twice returns the task to its original text and done status
    - **Validates: Requirements 7.1**
  - [ ]* 6.5 Write property test for task delete
    - Add to `test/task.properties.test.js`
    - **Property 11: Task delete removes exactly the targeted task** — length drops by one and every other task's text, completion status, and relative order are unchanged
    - **Validates: Requirements 8.1**
  - [ ]* 6.6 Write property test for task serialization round-trip
    - Add to `test/task.properties.test.js`
    - **Property 12: Task serialization round-trip** — saving then loading restores the same text, completion status, and order; after a delete, the round-tripped list excludes the deleted task
    - **Validates: Requirements 8.2, 8.3, 9.1, 9.2, 9.4**
  - [ ]* 6.7 Write property test for invalid/missing task storage
    - Add to `test/task.properties.test.js`
    - **Property 13: Invalid or missing task storage loads empty** — null, unparseable JSON, non-array, or wrong-shape values return an empty list without throwing
    - **Validates: Requirements 9.3, 9.5**

- [ ] 7. Implement the Quick Links Widget
  - [ ] 7.1 Implement Quick_Links_Widget render, open, add, remove, and persistence
    - Keep `links[]` as the in-memory source of truth, loaded from Storage on init; each QuickLink has a stable generated `id`, `name`, and `url`
    - Render exactly one button per link, labeled with the link's `name`
    - Activate button: `window.open(url, "_blank", "noopener")`
    - Add: if both display name and URL are non-empty after trimming, append `{ id, name, url }` and render its button; if either is empty, reject and add nothing
    - Remove: delete the targeted link and its button
    - After add/remove, call `saveQuickLinks(links)` and re-render the button bar (synchronous re-render keeps updates within 100ms)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.4, 14.2_
  - [ ]* 7.2 Write property test for one-button-per-link rendering
    - Create `test/quicklinks.properties.test.js` using fast-check, at least 100 iterations per property
    - **Property 14: Quick Links render one button each labeled with the display name** — exactly one button per link and each label equals the link's name
    - **Validates: Requirements 10.1, 10.3**
  - [ ]* 7.3 Write property test for the Quick Link add contract
    - Add to `test/quicklinks.properties.test.js`
    - **Property 15: Quick Link add contract** — both non-empty after trim grows the list by one with the trimmed name and URL; either empty leaves the list unchanged
    - **Validates: Requirements 10.4, 10.5**
  - [ ]* 7.4 Write property test for Quick Link remove
    - Add to `test/quicklinks.properties.test.js`
    - **Property 16: Quick Link remove removes exactly the targeted link** — length drops by one and every other link's name, URL, and relative order are unchanged
    - **Validates: Requirements 10.6**
  - [ ]* 7.5 Write property test for Quick Link serialization round-trip
    - Add to `test/quicklinks.properties.test.js`
    - **Property 17: Quick Link serialization round-trip** — saving then loading restores the same display name, URL, and order
    - **Validates: Requirements 11.1, 11.2, 11.4**
  - [ ]* 7.6 Write property test for invalid/missing Quick Link storage
    - Add to `test/quicklinks.properties.test.js`
    - **Property 18: Invalid or missing Quick Link storage loads empty** — null, unparseable JSON, non-array, or wrong-shape values return an empty list without throwing and without blocking other widgets
    - **Validates: Requirements 11.3, 11.5**

- [ ] 8. Wire widgets together with the App Controller
  - [ ] 8.1 Implement the App Controller and DOMContentLoaded initialization
    - On `DOMContentLoaded`, call `init()` on each widget, passing its root container queried by ID
    - Wrap each widget init in its own try/catch so an error in one widget is logged to the console but does not block the others (Requirement 11.5 isolation)
    - Confirm all four widgets are visible on load with no network request or build step, satisfying the one-second display budget
    - _Requirements: 14.1, 11.5, 13.1_

- [ ] 9. Add browser-extension packaging
  - [ ] 9.1 Create manifest.json at the repository root
    - Add a `manifest.json` (packaging metadata only — not CSS or JS, so it does not violate the single-file rule) pointing at `index.html` so the same app loads as an extension with identical features, persistence, and rendering
    - _Requirements: 13.2_

- [ ] 10. Checkpoint — Verify all widgets and persistence
  - Ensure all implemented widget features work as specified and any enabled optional tests pass, ask the user if questions arise.

- [ ] 11. Final checkpoint — Verify deployment readiness
  - Confirm the repo-root layout (`index.html`, `css/style.css`, `js/app.js`) uses relative paths with no build step, so pushing to the main branch serves the Dashboard via GitHub Pages with all widgets operating without additional server configuration; ask the user if questions arise.
  - _Requirements: 17.1, 17.2, 17.3_

## Notes

- Tasks marked with `*` are optional property-based tests; they live in a `test/` directory outside the three deliverable app files and can be skipped for a faster MVP, per the project's "no test setup required" constraint.
- Each task references specific acceptance criteria for traceability to the requirements.
- Checkpoints validate incremental progress; the final checkpoint confirms GitHub Pages readiness via the repo-root file layout — the enabling of Pages itself is a user action, not a coding task.
- Property tests validate the universal correctness properties from the design; unit, integration, and smoke tests for UI, timing, and structure are likewise optional and outside the deliverable files.
- `js/app.js` is a single namespaced file by design (Requirement 16.2); the implementation tasks build it up module by module in dependency order, and tasks writing to the same file are sequenced across waves in the dependency graph.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["5.1", "4.2"] },
    { "id": 4, "tasks": ["6.1", "4.3", "5.2"] },
    { "id": 5, "tasks": ["7.1", "4.4", "5.3", "6.2"] },
    { "id": 6, "tasks": ["8.1", "9.1", "5.4", "6.3", "7.2"] },
    { "id": 7, "tasks": ["5.5", "6.4", "7.3"] },
    { "id": 8, "tasks": ["6.5", "7.4"] },
    { "id": 9, "tasks": ["6.6", "7.5"] },
    { "id": 10, "tasks": ["6.7", "7.6"] }
  ]
}
```
