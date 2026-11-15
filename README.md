# Klaar

Practice for the Dutch CBR car theory exam and the Dutch integration exam (KNM and A2), one question at a time. A home-screen web app: free, no account, works offline.

Live: https://yazan-hammad0.github.io/klaar/

Questions are original and written in the style of the real exams. They are not official CBR or DUO material.

## How it's built
No framework and no build step. GitHub Pages serves this folder as-is.

## Where things are
| Folder | What is in it |
|---|---|
| (top level) | `index.html`, `manifest.webmanifest` and `sw.js` must stay here: they are the app's front door. `release.py` stamps a new version |
| `js/` | The app's code and all questions and lessons (see the table below) |
| `css/` | The one stylesheet |
| `audio/` | Recorded Dutch audio and the script that makes it |
| `icons/` | App icons and `og.png`, the picture shown next to the link when someone shares it |
| `fonts/` | Overpass, the app's font (open licence, in `OFL.txt`). Served from here so no outside font service is contacted |
| `welcome/` | The landing page for people who do not know Klaar yet |
| `privacy/` | The privacy page, linked from the landing page and the profile. Update it whenever the app starts sending or storing something new |
| `marketing/` | Messaging, ready-to-post copy, app screenshots and social pictures. Start with `marketing/README.md` |

## The app's files

| File | What it holds |
|---|---|
| `index.html` | Page markup: header (current goal, profile button), three tabs (Home, Feed, Exams), menu bar |
| `css/app.css` | All styles, light and dark |
| `js/content.js` | Question banks, road-sign drawings, glossaries. `EXTRA` holds the sourced questions added in Nov 2026, one question per line; the block right under it adds more, each checked on its page of the RVV booklet |
| `js/lessons.js` | Topic lessons: short steps with an animated scene, the rule and why. Shown once before a topic's first questions. Driving: Priority, Signs, Road markings, Speed limits, Distances, Lane use, Stopping & parking, Lights & visibility, Railway crossings, Motorway, Seatbelts, Mobile phones, Alcohol limit, Vehicle condition, Safety, Hazard perception. Inburgering: Dutch (Listening: times and numbers, Reading, Grammar: word order, niet/geen, de/het) and KNM (Administration, Healthcare, Work life). Dutch steps can have `say` phrases you tap to hear; `LESSON_ALIAS` lets exam sections share a skill lesson |
| `js/untaught.js` | Questions practice holds back because their lesson does not teach the fact yet, with the missing fact. Mock exams still use them |
| `js/view.js` | Driver's-eye pictures for hazard-perception questions: the road ahead in perspective, with every object placed in metres. Each question has a `view` spec |
| `js/map.js` | Top-down pictures for driving questions: the junction or road from above, your car marked "You", other road users and arrows for where each one goes. Each question has a `map` spec. Order questions (`kind:"order"`, like the CBR drag question) give road users an `id` and `name` and list the right order in `ans` Spot questions (`kind:"spot"`, the CBR single-drag question) add `spots:[[x, y, name]]` to the map: lettered places to tap, with `c` the right one. Multi questions (`kind:"multi"`) have several right answers in `cs`. |
| `js/glossary.js` | Words to know: every term with its meaning and the logic behind it, one page per goal |
| `js/app.js` | The app: the plan (exam date, readiness, pace, what to do next), feed with spaced repetition, topic drills and teach-first lessons, mock exams, home, journey steps |
| `js/i18n.js` | Language switch (English, Arabic). Arabic is switched off for now (`ARABIC = false`). Translates the screen as text appears, sets `dir="rtl"` for Arabic |
| `js/i18n-data.js` | The Arabic strings, one row `[English, Arabic]` per English string |
| `js/shell.js` | Screen-tall layout for the home-screen app, the "new version" card, service worker registration |
| `js/setup.js` | Step-by-step setup: language, name, goals, exam dates, a short placement check, time per day, then a plan. Existing users see it once |
| `js/onboard.js` | Install guide per device and browser; hands over to the setup |
| `audio/` | Recorded Dutch audio for the listening questions (two speakers that take turns: Piper's ronnie voice, and a female voice made by converting ronnie's speech into the sound of Piper's nathalie with kNN-VC; voices CC0, kNN-VC MIT). `audio/make_audio.py` records any new ones; `js/audio.js` lists what exists |
| `js/stats.js` | Anonymous usage counts to GoatCounter (no cookies, no personal data). Site code: klaar (https://klaar.goatcounter.com) |
| `sw.js` | Offline cache |
| `release.py` | Stamps a new version so installed apps show the update card |

Progress lives in the browser's localStorage on each phone (`klaarStateV1`). Progress is never sent anywhere. `js/stats.js` sends anonymous counts (screens, right/wrong per question, lessons finished, mock results) to GoatCounter, only on the live site, and each user can turn it off in their profile.

## Making a change
1. Edit the files.
2. `python3 release.py "One line on what's new"` (users see this line in the update card).
3. Commit and push. Pages deploys in about a minute.
