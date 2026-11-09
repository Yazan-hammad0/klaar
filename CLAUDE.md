# Working on Klaar

Read README.md first for the file map.

## Rules
- Small changes only: one problem, one fix, shipped the same day. No rewrites, no frameworks, no build tools.
- Every change ends with `python3 release.py "<one line for users>"`, then commit and push. Without it, installed apps never update.
- Test before pushing: serve the folder (`python3 -m http.server 8765`) and load it in Playwright with an iPhone viewport, light and dark. Check there are no page errors, and walk through the screen you changed. To test the home-screen app layout, fake `navigator.standalone = true` in an init script.
- The home-screen app uses a screen-tall shell (`html.shell` in css/app.css and js/shell.js): content scrolls inside `<main>`, not the page. Use `scroller()` / `scrollTop0()` in app.js, never `window.scrollTo`.
- Driving rules: cite the page of the English RVV booklet on government.nl (`...Netherlands.pdf#page=N`, `SRC.gov(N)` in lessons) after checking the rule on that page; hazard-perception choices cite the CBR. Source lines in the app are links, so check every new URL opens.
- New questions: give each a `source` URL from an official page (rijksoverheid.nl, cbr.nl, duo.nl, inburgeren.nl, ind.nl, wetten.overheid.nl and similar), and check the right answer isn't usually the longest option. Questions with a date or amount that changes yearly need a recheck note.
- Topic lessons (`js/lessons.js`): every step needs a `src` from an official or well-known source, a rule a learner can apply, and a one-line why. Scenes are SVG with right-hand traffic; check them in light, dark and with reduced motion (cars then stand still mid-scene).
- New listening questions and new lesson `say` phrases: record them with `audio/make_audio.py` (setup steps are in the file). Listening clips alternate a male and a female voice; phrases use the male voice only. Without a recording they fall back to the phone's robotic voice.
- Driving questions about a situation (junctions, lanes, roundabouts, crossings, signs) get a picture: a top-down `map` spec (js/map.js) or a `sign`. A text-only situation question is not finished. The picture shows the situation, never the answer.
- Hazard-perception questions get a driver's-eye `view` spec (js/view.js): objects at their real distance in metres, showing the situation, never the answer.
- Copy for users: plain, direct English (Dutch only inside the Dutch-language questions). No em dashes.
- Audience: expats and international students in the Netherlands who want a Dutch driving licence. The app is English only for now: Arabic is switched off (`ARABIC = false` in `js/i18n.js`), so new strings do not need an Arabic row until it is switched back on. The rest of this rule and the next one apply again then.
- One goal at a time: the app shows only the goal you are on (driving or inburgering). No header switch; you change goal in the profile.
- Home is the plan (`plan()` in app.js): exam date, readiness, daily pace, one "do this next", then topics weakest first. New Home content has to earn its place there.
- Languages: the code holds English only. Arabic lives in `js/i18n-data.js` as rows `[English, Arabic]` (Turkish was dropped in Nov 2026; do not add it back) (numbers go in a pattern with `$1`). Every new or changed UI string needs a row, and so does the `release.py` line, or that text shows in English. Questions and their explanations are not translated yet. The translations are not reviewed by native speakers.
- Arabic is right to left. Use `text-align:start` and `margin-inline-*` in new CSS, never `letter-spacing` or italics on text that can be Arabic, and keep English or Dutch question text left to right. After a UI change also look at it with `localStorage.klaarLang = "ar"`. Wrap Dutch or English inside Arabic text in \u2066…\u2069 so it stays in order.
- This repo is public. Never put personal details of the owner or users in it.
