/* Makes every picture in this folder from the real app, so they never show an old design.

   Setup (once):   cd marketing && npm install playwright-core     (uses the Chrome already on this Mac)
   Run:            1. in the Klaar folder:  python3 -m http.server 8765
                   2. in another terminal:  cd marketing && node make_assets.js
   Only the social pictures and og.png, keeping today's app screenshots (no server needed):
                   cd marketing && node make_assets.js --no-shots

   Output: screenshots/ (real app screens), social/ (carousel, story), ../welcome/img/ (small copies for the
   landing page) and ../icons/og.png (the picture WhatsApp, LinkedIn and Reddit show next to the link).
   Change SITE below when Klaar moves to its own domain, then run again. */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');

const SITE = 'yazan-hammad0.github.io/klaar';          // shown on the pictures
const ARGS = process.argv.slice(2), SHOTS = !ARGS.includes('--no-shots');
const BASE = ARGS.find(a => !a.startsWith('--')) || 'http://localhost:8765/';
const HERE = __dirname, ROOT = path.join(HERE, '..');
const DIRS = { shots: path.join(HERE, 'screenshots'), social: path.join(HERE, 'social'), web: path.join(ROOT, 'welcome', 'img') };
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/* A made-up learner, 12 days in, exam in 9 days. Runs inside the page; uses the question bank only. */
function seed(){
  var rnd = (function(s){ return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; }; })(7);
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function dayKey(d){ return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hashId(s){ var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function freshTrack(){ return {xp:0, ans:0, ok:0, level:1, recent:[], topics:{}, seen:{}, primers:{}, wrong:[], mocks:{}, combo:0, aiOk:false, days:{}, right:{}, last:{}, drill:{}}; }
  var S = {v:1, updated:Date.now(), track:"drive", view:"home", t:{drive:freshTrack(), civic:freshTrack()}, days:{}, goal:30, plan:{}};
  S.prof = {v:2, name:"Sara", goals:["drive"], style:"learn", drive:"abroad", at:Date.now() - 12 * 86400000, exam:{drive:{date:dayKey(new Date(Date.now() + 9 * 86400000))}}};
  var level = {"Signs":0.95, "Speed limits":0.93, "Seatbelts":0.95, "Alcohol limit":0.92, "Mobile phones":0.95, "Motorway":0.9, "Lights & visibility":0.86, "Distances":0.84, "Priority":0.72, "Hazard perception":0.62, "Road markings":0.8, "Lane use":0.78, "Stopping & parking":0.7, "Railway crossings":0.9, "Vehicle condition":0.88, "Safety":0.9};
  var qs = DRIVE.QUESTIONS.map(function(q, i){ return {id:"d" + i, topic:q.t}; }).concat(EXTRA.drive.map(function(q){ return {id:"x-d-" + hashId(q.q), topic:q.t}; }));
  var tr = S.t.drive;
  qs.forEach(function(q){ if (rnd() > 0.93) return; var ok = rnd() < (level[q.topic] || 0.8);
    tr.ans++; if (ok) tr.ok++; var tp = tr.topics[q.topic] || (tr.topics[q.topic] = {a:0, ok:0}); tp.a++; if (ok) tp.ok++;
    tr.seen[q.id] = Date.now(); tr.last[q.id] = ok ? 1 : 0; if (!ok && tr.wrong.length < 20) tr.wrong.push({id:q.id, due:tr.ans + 40}); });
  tr.xp = 2140; tr.level = 3;
  for (var d = 0; d < 12; d++){ var k = dayKey(new Date(Date.now() - d * 86400000)); var n = d === 0 ? 18 : 22 + Math.floor(rnd() * 20); tr.days[k] = n + 6; tr.right[k] = n; S.days[k] = n + 6; }
  Object.keys(LESSONS.drive).forEach(function(k){ if (k !== "Vehicle condition" && k !== "Safety") tr.primers[k] = 1; });
  var day = 86400000, now = Date.now();
  tr.mocks = {quick:[{s:15,n:20,p:false,at:now-6*day},{s:18,n:20,p:true,at:now-4*day}], full:[{s:39,n:50,p:false,at:now-3*day},{s:43,n:50,p:false,at:now-2*day},{s:45,n:50,p:true,at:now-day}]};
  localStorage.setItem("klaarStateV1", JSON.stringify(S));
  localStorage.setItem("klaarInstallSeen", "1"); localStorage.setItem("klaarInstallHint", "no"); localStorage.setItem("klaarStats", "off");
}

/* The same learner, also doing inburgering: moved here a little over 2 years ago for work, wants to become Dutch. */
function seedCivic(){
  var S = JSON.parse(localStorage.getItem("klaarStateV1")), day = 86400000, now = Date.now();
  function pad(n){ return (n < 10 ? "0" : "") + n; }
  var a = new Date(now - 800 * day); S.arrived = a.getFullYear() + "-" + pad(a.getMonth() + 1) + "-" + pad(a.getDate());
  S.track = "civic"; S.prof.goals = ["civic"]; S.prof.civ = {why:"work", goal:"citizen"};
  var tr = S.t.civic; tr.topics = {"KNM":{a:64, ok:52}, "A2 Lezen":{a:40, ok:33}, "A2 Luisteren":{a:24, ok:15}};
  tr.ans = 128; tr.ok = 100; tr.xp = 980;
  tr.mocks = {"knm":[{s:36, n:40, p:true, at:now - 20 * day}], "a2-lezen":[{s:22, n:25, p:true, at:now - 3 * day}], "a2-luisteren":[{s:15, n:25, p:false, at:now - day}]};
  S.plan = Object.assign({}, S.plan, {"c-knm":true});
  localStorage.setItem("klaarStateV1", JSON.stringify(S));
}

async function appShots(browser){
  const ctx = await browser.newContext({ viewport: {width:390, height:844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, colorScheme: 'light', serviceWorkers: 'block' });
  /* home-screen layout, and no news card (news.json changes; the pictures should not) */
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', {get: () => true}); });
  await ctx.route('**/news.json*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  const page = await ctx.newPage();
  await page.goto(BASE); await page.waitForTimeout(500);
  await page.evaluate(seed); await page.evaluate(() => { var S = JSON.parse(localStorage.getItem("klaarStateV1")); S.prof.lic = {from:"none", by:6, at:Date.now() - 12 * 86400000}; S.onboarded = true; localStorage.setItem("klaarStateV1", JSON.stringify(S)); });
  await page.reload(); await page.waitForTimeout(2500);
  const shot = async name => { await page.screenshot({ path: path.join(DIRS.shots, name + '.png') }); console.log('screenshot', name); };
  const scrollMain = y => page.evaluate(y => { document.querySelector('main').scrollTop = y; }, y);
  const home = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(400); await page.click('.tab[data-view="home"]'); await page.waitForTimeout(500); await scrollMain(0); };

  await home(); await page.waitForTimeout(2200); await shot('1-plan');

  /* Learn: the lessons in order, most done, the next one marked */
  await page.click('.tab[data-view="learn"]'); await page.waitForTimeout(800); await scrollMain(0); await shot('2-learn');
  /* a lesson step with its scene: read the Priority lesson again */
  await page.click('#v-learn [data-ln="Priority"]'); await page.waitForTimeout(700);
  await page.click('[data-act="ln-read"]'); await page.waitForTimeout(2600); await scrollMain(0); await shot('2b-lesson');

  /* Practice: the picker, then one topic */
  const openTopic = async name => { await page.reload(); await page.waitForTimeout(1800);
    await page.click('.tab[data-view="feed"]'); await page.waitForTimeout(500);
    if (!(await page.$('#v-feed [data-pk-topic]'))){ await page.click('.tab[data-view="feed"]'); await page.waitForTimeout(500); }
    await scrollMain(0); await page.click('#v-feed [data-pk-topic="' + name + '"]'); await page.waitForTimeout(1300); await scrollMain(0); };
  await openTopic('Priority'); await shot('3-question');
  /* a wrong answer, so the picture shows the right one and the rule. Options are shuffled: try until one is wrong. */
  for (let i = 0; i < 8; i++){
    const opts = await page.$$('#v-feed .opt'); if (!opts.length) break;
    await opts[0].click(); await page.waitForTimeout(1100);
    if (await page.$('#v-feed .verdict.no')) break;
    const nx = await page.$('#v-feed [data-act="next"], #v-feed [data-act="u-next"]'); if (!nx) break; await nx.click(); await page.waitForTimeout(1300); await scrollMain(0);
  }
  if (await page.$('#v-feed .verdict')){ await page.evaluate(() => { var v = document.querySelector('#v-feed .verdict'), m = document.querySelector('main'); if (v) m.scrollTop += v.getBoundingClientRect().top - 150; }); await page.waitForTimeout(400); await shot('4-explained'); }
  await openTopic('Hazard perception'); await shot('5-hazard');

  await page.click('.tab[data-view="exams"]'); await page.waitForTimeout(700); await shot('6-mock-exams');

  await home(); await page.click('#v-home [data-act="your-plan"]'); await page.waitForTimeout(800);
  await page.evaluate(() => { var r = document.querySelector('.lp-card:nth-of-type(2)'), m = document.querySelector('main'); if (r) m.scrollTop += r.getBoundingClientRect().top - 110; });
  await page.waitForTimeout(400); await shot('7-licence-plan');

  await page.evaluate(seedCivic); await page.reload(); await page.waitForTimeout(2500);
  await home(); await page.waitForTimeout(1500);
  await page.evaluate(() => { var h = document.querySelector('#v-home .cv-hero'), m = document.querySelector('main'); if (h) m.scrollTop += h.getBoundingClientRect().top - 110; });
  await page.waitForTimeout(400); await shot('8-inburgering');
  await page.evaluate(() => { var h = document.querySelector('#v-home .stamps'), m = document.querySelector('main'); if (h) m.scrollTop += h.getBoundingClientRect().top - 200; });
  await page.waitForTimeout(400); await shot('8b-stamps'); await scrollMain(0);
  await page.click('#v-home [data-act="civic-route"]'); await page.waitForTimeout(800); await shot('9-route');
  await ctx.close();
}

const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(DIRS.shots, f + '.png')).toString('base64');
const font = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');

/* The "Green light" brand: ink, ground, green light. Familjen Grotesk for headings, Atkinson Hyperlegible Next for the rest. */
const C = { ink:'#0E1726', ground:'#F3F4F1', green:'#19B35C', go:'#0B8A43', greenText:'#0A6B34', amber:'#F2A51A', red:'#E5533D', muted:'#5B6474' };
const CSS = `
@font-face{font-family:'Familjen Grotesk';src:url(${font('familjen-grotesk-latin.woff2')}) format('woff2');font-weight:400 700}
@font-face{font-family:'Atkinson Hyperlegible Next';src:url(${font('atkinson-next-latin.woff2')}) format('woff2');font-weight:200 800}
*{box-sizing:border-box;margin:0}
body{font-family:'Atkinson Hyperlegible Next',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.s{position:relative;overflow:hidden;width:100vw;height:100vh;padding:84px 84px 0;display:flex;flex-direction:column}
.ink{background:${C.ink};color:#fff}.ground{background:${C.ground};color:${C.ink}}
.top{display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:28px;opacity:.9}
.brand{display:flex;align-items:center;gap:18px}
.wm{font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:56px;letter-spacing:-.03em;line-height:1}
h1{font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:92px;line-height:1.04;letter-spacing:-.025em;margin-top:60px;max-width:900px}
h1 em{font-style:normal;color:${C.green}}.ground h1 em{color:${C.greenText}}
p{font-size:38px;line-height:1.3;font-weight:500;margin-top:28px;max-width:860px;opacity:.85}
.phone{position:absolute;left:50%;transform:translateX(-50%);width:600px;border:16px solid ${C.ink};border-radius:76px;overflow:hidden;box-shadow:0 40px 90px rgba(5,12,30,.4);background:${C.ink}}
.ink .phone{border-color:#1E2A3C}
.phone img{display:block;width:100%}
.pill{display:inline-block;align-self:flex-start;background:${C.go};color:#fff;font-weight:700;font-size:40px;padding:26px 44px;border-radius:999px;margin-top:48px}
.list{margin-top:44px;display:grid;gap:22px}.list div{font-size:42px;font-weight:700;display:flex;gap:22px;align-items:center}
.list b{flex:none;width:60px;height:60px;border-radius:50%;background:${C.green};color:${C.ink};display:grid;place-items:center;font-size:32px;font-weight:700}
.fine{position:absolute;left:84px;right:84px;bottom:72px;font-size:24px;opacity:.65;font-weight:500}
.rings{display:flex;gap:28px;margin-top:150px}
.rcard{flex:1;background:#fff;color:${C.ink};border-radius:40px;padding:36px 20px 30px;display:flex;flex-direction:column;align-items:center;gap:18px}
.rcard svg{transform:rotate(-90deg)}
.rcard b{font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:56px;letter-spacing:-.03em;margin-top:-176px;margin-bottom:96px}
.rcard span{font-size:30px;font-weight:700;padding:8px 20px;border-radius:99px}
`;
const LOGO = s => `<svg width="${s}" height="${s}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${C.ink}" stroke="rgba(255,255,255,.22)" stroke-width=".6"/><circle cx="16" cy="16" r="9.5" fill="${C.green}"/><path d="M11.6 16.3l3 3 5.8-6.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const top = (i, n) => `<div class="top"><span class="brand">${LOGO(60)}<span class="wm">klaar</span></span><span>${n ? i + ' of ' + n : ''}</span></div>`;
const slide = (cls, inner) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="s ${cls}">${inner}</div>`;

/* A traffic light with the green lamp on, the brand's one picture. Height h px. */
const light = h => `<svg width="${h * 0.42}" height="${h}" viewBox="0 0 126 300"><defs><filter id="g" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="12"/></filter></defs>
<rect x="3" y="3" width="120" height="294" rx="40" fill="#1A2535" stroke="rgba(255,255,255,.1)" stroke-width="2"/>
<circle cx="63" cy="60" r="36" fill="${C.red}" opacity=".2"/><circle cx="63" cy="150" r="36" fill="${C.amber}" opacity=".2"/>
<circle cx="63" cy="240" r="36" fill="${C.green}" filter="url(#g)" opacity=".85"/><circle cx="63" cy="240" r="36" fill="${C.green}"/>
<path d="M11.6 16.3l3 3 5.8-6.2" transform="translate(63 240) scale(3.8) translate(-16 -16)" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* Readiness ring, as in the app: red, amber, green. */
const ring = (p, col, label, bg, fg) => `<div class="rcard"><svg width="220" height="220" viewBox="0 0 140 140"><circle cx="70" cy="70" r="58" fill="none" stroke="#EDEFEB" stroke-width="14"/><circle cx="70" cy="70" r="58" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="364.4" stroke-dashoffset="${(364.4 * (1 - p / 100)).toFixed(1)}"/></svg><b>${p}%</b><span style="background:${bg};color:${fg}">${label}</span></div>`;
const rings = () => `<div class="rings">${ring(38, C.red, 'Not yet', '#FCE3DE', '#9F2A17')}${ring(76, C.amber, 'Getting close', '#FDF0D3', '#7A4E00')}${ring(91, C.green, 'Klaar', '#DDF3E5', C.greenText)}</div>`;

function carousel(){
  const N = 6;
  return [
    slide('ink', `${top(1, N)}<h1>Pass the Dutch driving theory exam. <em>In English.</em></h1><p>Made for expats and international students. Klaar turns green when you are ready.</p>${rings()}`),
    slide('ground', `${top(2, N)}<h1>A plan that counts back from <em>your exam date.</em></h1><p>It tells you how ready you are and what to do today.</p><div class="phone" style="top:640px"><img src="${b64('1-plan')}"></div>`),
    slide('ink', `${top(3, N)}<h1>See the situation, <em>not a wall of text.</em></h1><p>Junctions, lanes and roundabouts drawn from above, with who goes where.</p><div class="phone" style="top:640px"><img src="${b64('3-question')}"></div>`),
    slide('ground', `${top(4, N)}<h1>Wrong answer? You get <em>the rule and the reason.</em></h1><p>Most answers link to the page in the government's English rulebook.</p><div class="phone" style="top:640px"><img src="${b64('4-explained')}" style="margin-top:-400px"></div>`),
    slide('ink', `${top(5, N)}<h1>Mock exams in <em>the real CBR format.</em></h1><p>50 questions, 30 minutes, 44 to pass. No feedback until you hand in.</p><div class="phone" style="top:660px"><img src="${b64('6-mock-exams')}"></div>`),
    slide('ink', `${top(6, N)}<div style="display:flex;gap:56px;align-items:center;margin-top:84px"><div style="flex:none">${light(380)}</div><h1 style="font-size:100px;margin:0">When the light is green, you are <em>klaar.</em></h1></div><div class="list" style="margin-top:72px;gap:30px"><div><b>1</b>Open the link on your phone</div><div><b>2</b>Tell it your exam date</div><div><b>3</b>Practise until your light is green</div></div><div class="pill" style="margin-top:64px">${SITE}</div><div class="fine">Free, no account, works offline. Original practice questions, not CBR exam material.</div>`)
  ];
}
const story = () => slide('ink', `${top()}<h1 style="font-size:104px;margin-top:150px">Dutch driving theory exam? Practise <em>in English.</em></h1><p style="font-size:44px">A plan that follows your exam date. Free, no account.</p><div style="position:absolute;left:0;right:0;top:900px;display:flex;justify-content:center">${light(640)}</div><div style="position:absolute;left:84px;right:84px;bottom:110px;text-align:center;font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:56px;letter-spacing:-.03em">When the light is green, you are klaar.</div>`);
const og = () => `<!doctype html><meta charset="utf-8"><style>${CSS}
.s{padding:60px 0 0 72px}.top{width:760px}.wm{font-size:46px}h1{font-size:70px;margin-top:44px;max-width:760px}p{font-size:30px;max-width:700px;margin-top:22px}
.lt{position:absolute;right:110px;top:50%;transform:translateY(-50%)}.url{position:absolute;left:72px;bottom:56px;font-size:26px;font-weight:600;opacity:.7}</style>
<div class="s ink">${top()}<h1>Green light for your <em>Dutch driving theory exam.</em></h1><p>Practise the CBR theory exam in English. A plan that follows your exam date. Free, no account.</p><div class="lt">${light(470)}</div><div class="url">${SITE}</div></div>`;

async function render(browser, html, w, h, file){
  const ctx = await browser.newContext({ viewport: {width:w, height:h}, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); await page.setContent(html);
  const ok = await page.evaluate(async () => {
    const a = await document.fonts.load('700 40px "Familjen Grotesk"'), b = await document.fonts.load('500 40px "Atkinson Hyperlegible Next"');
    await document.fonts.ready; return a.length > 0 && b.length > 0;
  });
  if (!ok) throw new Error('Brand fonts did not load for ' + file);
  await page.waitForTimeout(150);
  await page.screenshot({ path: file }); await ctx.close(); console.log('made', path.relative(ROOT, file));
}
async function webCopies(browser){
  /* small JPGs for the landing page, 2x a 300px-wide phone */
  const ctx = await browser.newContext({ viewport: {width:600, height:1298}, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const f of ['1-plan', '2-learn', '2b-lesson', '3-question', '4-explained', '5-hazard', '6-mock-exams', '7-licence-plan', '8-inburgering', '8b-stamps', '9-route']){
    await page.setContent(`<body style="margin:0"><img src="${b64(f)}" style="display:block;width:600px">`); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(DIRS.web, f + '.jpg'), type: 'jpeg', quality: 82 });
  }
  await ctx.close(); console.log('made welcome/img copies');
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  if (SHOTS){ await appShots(browser); await webCopies(browser); }
  else console.log('skipping app screenshots (--no-shots): using the ones in screenshots/');
  const slides = carousel();
  for (let i = 0; i < slides.length; i++) await render(browser, slides[i], 1080, 1350, path.join(DIRS.social, `carousel-${i + 1}.png`));
  await render(browser, story(), 1080, 1920, path.join(DIRS.social, 'story.png'));
  await render(browser, og(), 1200, 630, path.join(ROOT, 'icons', 'og.png'));
  await browser.close();
})();
