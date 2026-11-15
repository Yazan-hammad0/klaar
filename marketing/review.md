# Marketing review (15 Nov 2026)

Checked `marketing/` and `welcome/` against the app as it is today. Nothing was rewritten or posted.

## Verdict
The material sells a finished, polished product. The app is a good product in the middle of a fix. The gap you feel is real: the copy promises "a plan, not a pile of questions" and "learn the rule and the reason", and testers just told us the opposite (confusing, quizzed on things it never taught). Until the five-tab layout and the lesson work land, every picture shows a screen that is about to go.

## Overclaimed
- **"300+ practice questions"** (welcome, Reddit). 341 exist, but about 89 driving questions are held back in practice until their lesson teaches the fact. Practice sees roughly 250. Say "250+" or drop the number.
- **"16 topics, each with a short animated lesson"**. Lessons exist, but several still do not cover their own questions (see `js/untaught.js`). "Each" and "animated" both invite a check we fail.
- **"Each new topic starts with a short lesson"** and **"teach before you quiz"** in spirit: only true for the topics already fixed (Road markings, Priority turning and pedestrians, Lane use, Signs, Motorway).
- **"With more added every week"** and "I add more every week" (Reddit, driving school email). A promise of cadence for a one-person project. Cut it.
- **"Pass the full mock three times in a row and you are ready to book"**. Sounds like a validated threshold. We have no pass data. Keep the advice, drop "you are ready".
- **"It tells you what to do today"** and "plans back from your exam date". Works, but testers found Home confusing. Do not lead with it until the Today tab ships.
- **"Stores nothing about the student"** (university email). True for us, but the app is on GitHub Pages; say "no account, progress stays on the phone" instead, which is what messaging.md allows.
- **"Free"** everywhere, with paid launch on 15 Dec. A beta tester recruited on "free" who hits a paywall two weeks later feels tricked. Say "free during the beta".

## Looks unfinished
- `posts.md` has `[your reason]` and `[your name]` placeholders, and the Reddit post asks you to say you took the exam yourself. Only post what is true.
- The web address is `yazan-hammad0.github.io/klaar`. It reads as a hobby page and carries a personal handle. Fine for a beta; not for the paid launch.
- Reel script needs 5 recordings of screens that are about to change.
- Six-slide carousel, a story, a LinkedIn post, a Reel, two outreach emails and a landing page with eight sections: too much surface for a product with zero beta feedback loops yet.
- Inburgering is mentioned on the landing page FAQ and in messaging, but its own lessons are also being held back. Keep it out of beta marketing.

## Old screens
All screenshots were taken at 16:41 on 15 Nov 2026, before 14 commits, and all show the current single-Home layout that the five tabs (Today, Learn, Practice, Exams, car mode) will replace.
- `1-plan.png`, `2-topics.png`: Home and topic grid. Both go away with Today and Learn.
- `6-mock-exams.png`, `7-licence-plan.png`: will move under Exams and Today.
- `3-question.png`, `4-explained.png`: missing the new "Review the lesson" button and right-answer encouragement.
- `5-hazard.png`: probably still accurate, recheck.
- `8-inburgering.png`, `8b-stamps.png`, `9-route.png`: not needed for beta.
- `social/carousel-*.png`, `story.png`, `welcome/img/*.jpg` and `icons/og.png` are built from these, so they are all old too.
Do not retake anything until the five tabs ship; then run `make_assets.js` once.

## Cut for now
- The six-slide carousel, the story and the Reel script.
- The LinkedIn post (it reads as a launch, and this is a beta).
- The driving school and university emails. Send those after the paid launch, when you have tester quotes.
- The stats row on the landing page (300+, 16, 50).
- Inburgering mentions in beta posts.

## Recommendation for the beta on 1 Dec 2026
Ship three pieces only, all labelled beta:
1. **The landing page, trimmed**: hero, one section on "learn the rule, then practise it", the mock exam section, the FAQ. Text says "free during the beta". No stats row.
2. **One Reddit post** reworded as a request for testers ("I am looking for 20 people with a theory exam in the next two months"), no question count, no "every week".
3. **One WhatsApp message** with the same ask.
Retake three screenshots after the five tabs ship (Today, a lesson step, a question with its explanation) and use only those. Everything else waits until testers have said the app is clear and teaches what it tests.
