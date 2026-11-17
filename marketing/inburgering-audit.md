# Inburgering audit (17 Nov 2026)

Inburgering against driving, measured in the app (Playwright, iPhone size, both modes) and counted from the question banks.

## Where it stood

| | Driving | Inburgering |
|---|---|---|
| Lessons in Learn | 16 lessons, 72 steps | 6 lessons, 22 steps |
| Questions in the bank | 309 | 224 |
| Questions practice can actually show (teach-first) | 220 (71%) | 56 (25%) |
| KNM questions practice can show | n/a | 20 of 118 |
| Pictures on situation questions | 150 of 242 sourced questions | 0 |
| Audio | none needed | 24 listening clips, 21 lesson phrases |
| Mock exams | 3, timed like the CBR exam | 4 exam parts, untimed |

## Gaps, biggest learner impact first

1. **Three quarters of the inburgering questions never show up in practice.** Teach-first holds back every question whose fact no lesson teaches yet, and inburgering has no lessons on government, elections, history, holidays, society, housing or education. A learner who finishes all six lessons has seen almost everything practice can offer, and has met only 20 KNM questions. Fix: KNM lessons for each missing theme, each step with an official source and a why, and delete the untaught lines they cover.
2. **Listening and writing are almost empty in practice.** Listening shows 5 of 24 questions, writing and grammar 5 of 22, because the lessons skip days, times, phone menus, verb forms and formal letters. Fix: more Listening and Grammar steps (with recorded `say` phrases), and a Writing lesson.
3. **Mock exams do not feel like the DUO exam.** The real exams are timed (KNM 45 min, Lezen 65 min, Luisteren 45 min, Schrijven 40 min, source: inburgeren.nl), the app's inburgering mocks have no clock, and the screen says "85%+" while the pass mark used is 75%. Fix: give each exam-part mock the DUO time and say it on the row; make the copy match the scoring.
4. **Spreken has nothing.** One line says it can't be graded. The A2 speaking exam (35 min, video questions) is one of the four parts. Fix: a Speaking lesson with the phrases you need (introduce yourself, ask, say you don't understand), each one recorded to listen and repeat.
5. **No pictures on KNM situations.** Driving situation questions have a map or a sign; KNM situation questions (a letter from the Belastingdienst, a broken window, a sick child at night) are text only. Fix: later, simple flat drawings like the lesson scenes.
6. **B1 to C1 reading is locked and held back.** Not part of the A2 exam, so lower priority. Fix: later, a short reading-strategy lesson for B1+.

## What shipped (17 Nov 2026, four releases, all live)

1. Government, Housing and Education lessons. KNM exam questions are now tagged by theme, so theme lessons can teach them.
2. Listening (5 new steps), a new "Words you hear" lesson, Grammar (5 new steps) and a new Writing lesson. 36 new Dutch phrases recorded with `audio/make_audio.py`.
3. Mock exams timed like DUO (KNM 45 min, Lezen 65, Luisteren 45, Schrijven 40). KNM asks theme by theme. "Ready" now means 85% on a mock, matching the screen copy.
4. Society, and History and holidays lessons.

Every new step has an official or well-known source (rijksoverheid.nl, kiesraad.nl, duo.nl, wetten.overheid.nl, rijkswaterstaat.nl, 4en5mei.nl, Onze Taal, Taaladvies, Wiktionary for word meanings), each opened and checked on 17 Nov 2026.

## Inburgering now, in numbers (for the landing page)

| | Before | Now |
|---|---|---|
| Lessons | 6 (22 steps) | 13 (68 steps) |
| Questions in the bank | 224 | 224 |
| Questions practice can show | 56 | 135 |
| KNM questions practice can show | 20 | 64 |
| Listening questions practice can show | 5 of 24 | 23 of 24 |
| Writing and grammar questions practice can show | 5 of 22 | 22 of 22 |
| Recorded Dutch audio | 45 clips | 81 clips (24 listening questions, 58 lesson phrases; one phrase shares a clip) |
| Mock exams | 4 exam parts, untimed | 4 exam parts, timed like DUO, plus B1, B2, C1 reading |

Safe landing-page lines: "13 lessons for KNM, reading, listening and writing", "Over 130 practice questions with an official source behind every lesson", "81 Dutch audio clips by two voices", "Mock exams for KNM, reading, listening and writing, timed like the real DUO exams".
Do not claim speaking practice or ONA/MAP: neither exists yet.

## Still open
- Speaking (gap 4): no lesson yet. A Speaking part needs its own place in Learn and questions, not just phrases.
- 89 inburgering questions are still held back (`js/untaught.js`): the English basics (c0 to c46: vocabulary, provinces, polder model, coffeeshops), the remaining Work life, Healthcare and Administration facts, Dutch habits (punctuality, neighbours), and B1 to C1 reading.
- Pictures on KNM situation questions (gap 5).
- `SRC.clock` and `SRC.numbers` in js/lessons.js point to ANS pages about other number topics; find the ANS page on telling the time.
