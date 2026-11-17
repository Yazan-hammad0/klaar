# Marketing

| File or folder | What it is |
|---|---|
| `messaging.md` | The "Green light" idea, who Klaar is for, what we may and may not claim, colours and fonts. Start here |
| `posts.md` | Copy-paste text for Reddit, WhatsApp, LinkedIn, Instagram, a story, a Reel script and two outreach emails |
| `screenshots/` | Real app screens at iPhone size (1170 x 2532): driving Today, Learn (the lessons in order), a lesson step, a junction question and its explanation, hazard question, mock exams, the licence plan, inburgering Home, exam stamps and the official route |
| `social/` | Instagram and LinkedIn carousel (1080 x 1350, six slides) and a story (1080 x 1920) |
| `make_assets.js` | Remakes every picture from the live app |
| `../welcome/` | The landing page (https://yazan-hammad0.github.io/klaar/welcome/) |
| `../icons/og.png` | The picture that WhatsApp, LinkedIn and Reddit show next to the link |

## Remake the pictures after the app changes
One time only:

```bash
cd marketing && npm install playwright-core
```

Every time:

1. In the Klaar folder, start the app: `python3 -m http.server 8765`
2. In a second terminal: `cd marketing && node make_assets.js`
3. Look at the new pictures, then commit them.

Only changed the look or the words on the pictures, not the app? Skip the server and keep today's screenshots:

```bash
cd marketing && node make_assets.js --no-shots
```

The pictures use the brand fonts from `../fonts/` (Familjen Grotesk and Atkinson Hyperlegible Next). The script stops with an error if they do not load.

The learner in the pictures ("Sara") is made up by the script. Never use a real person's progress.

## When Klaar moves to its own domain
Change the address in four places, then remake the pictures: `SITE` at the top of `make_assets.js`, the `og:` lines in `index.html` and `welcome/index.html`, and the links in `posts.md`.
