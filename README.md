# Klaar

Practice for the Dutch CBR car theory exam and the Dutch integration exam (KNM and A2), one question at a time. A home-screen web app: free, no account, works offline.

Live: https://yazan-hammad0.github.io/klaar/

Questions are original and written in the style of the real exams. They are not official CBR or DUO material.

## How it's built
No framework and no build step. GitHub Pages serves this folder as-is.

| File | What it holds |
|---|---|
| `index.html` | Page markup: header (goal switch, profile button), three tabs (Home, Feed, Exams), menu bar |
| `css/app.css` | All styles, light and dark |
| `js/content.js` | Question banks, road-sign drawings, glossaries. `EXTRA` holds the sourced questions added in Nov 2026 |
| `js/lessons.js` | Topic lessons: short steps with an animated scene, the rule and why. Shown once before a topic's first questions. Driving: Priority, Signs, Road markings, Speed limits, Distances, Lane use, Stopping & parking, Lights & visibility, Railway crossings, Motorway, Hazard perception. Inburgering: Dutch (Listening: times and numbers, Reading, Grammar: word order, niet/geen, de/het) and KNM (Administration, Healthcare, Work life). Dutch steps can have `say` phrases you tap to hear; `LESSON_ALIAS` lets exam sections share a skill lesson |
| `js/view.js` | Driver's-eye pictures for hazard-perception questions: the road ahead in perspective, with every object placed in metres. Each question has a `view` spec |
| `js/map.js` | Top-down pictures for driving questions: the junction or road from above, your car marked "You", other road users and arrows for where each one goes. Each question has a `map` spec |
| `js/glossary.js` | Words to know: every term with its meaning and the logic behind it, one page per goal |
| `js/app.js` | The app: feed with spaced repetition and teach-first lessons, mock exams, progress, home, journey steps |
| `js/i18n.js` | Language switch (English, Arabic). Translates the screen as text appears, sets `dir="rtl"` for Arabic |
| `js/i18n-data.js` | The Arabic strings, one row `[English, Arabic]` per English string |
| `js/shell.js` | Screen-tall layout for the home-screen app, the "new version" card, service worker registration |
| `js/setup.js` | Step-by-step setup: language, name, goals, exam dates, a short placement check, time per day, then a plan. Existing users see it once |
| `js/onboard.js` | Install guide per device and browser; hands over to the setup |
| `audio/` | Recorded Dutch audio for the listening questions (two speakers that take turns: Piper's ronnie voice, and a female voice made by converting ronnie's speech into the sound of Piper's nathalie with kNN-VC; voices CC0, kNN-VC MIT). `audio/make_audio.py` records any new ones; `js/audio.js` lists what exists |
| `sw.js` | Offline cache |
| `release.py` | Stamps a new version so installed apps show the update card |

Progress lives in the browser's localStorage on each phone (`klaarStateV1`). Nothing is sent anywhere.

## Making a change
1. Edit the files.
2. `python3 release.py "One line on what's new"` (users see this line in the update card).
3. Commit and push. Pages deploys in about a minute.
