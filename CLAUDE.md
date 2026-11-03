# Working on Klaar

Read README.md first for the file map.

## Rules
- Small changes only: one problem, one fix, shipped the same day. No rewrites, no frameworks, no build tools.
- Every change ends with `python3 release.py "<one line for users>"`, then commit and push. Without it, installed apps never update.
- Test before pushing: serve the folder (`python3 -m http.server 8765`) and load it in Playwright with an iPhone viewport, light and dark. Check there are no page errors, and walk through the screen you changed. To test the home-screen app layout, fake `navigator.standalone = true` in an init script.
- The home-screen app uses a screen-tall shell (`html.shell` in css/app.css and js/shell.js): content scrolls inside `<main>`, not the page. Use `scroller()` / `scrollTop0()` in app.js, never `window.scrollTo`.
- New questions: give each a `source` URL from an official page (rijksoverheid.nl, cbr.nl, duo.nl, inburgeren.nl, ind.nl, wetten.overheid.nl and similar), and check the right answer isn't usually the longest option. Questions with a date or amount that changes yearly need a recheck note.
- Copy for users: plain, direct English (Dutch only inside the Dutch-language questions). No em dashes.
- This repo is public. Never put personal details of the owner or users in it.
