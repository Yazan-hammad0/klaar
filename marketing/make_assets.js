/* Makes every picture in this folder from the real app, so they never show an old design.

   Setup (once):   cd marketing && npm install playwright-core     (uses the Chrome already on this Mac)
   Run:            1. in the Klaar folder:  python3 -m http.server 8765
                   2. in another terminal:  cd marketing && node make_assets.js

   Output: screenshots/ (real app screens), social/ (carousel, story), ../welcome/img/ (small copies for the
   landing page) and ../icons/og.png (the picture WhatsApp, LinkedIn and Reddit show next to the link).
   Change SITE below when Klaar moves to its own domain, then run again. */
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');

const SITE = 'yazan-hammad0.github.io/klaar';          // shown on the pictures
const BASE = process.argv[2] || 'http://localhost:8765/';
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
  Object.keys(LESSONS.drive).forEach(function(k){ tr.primers[k] = 1; });
  var day = 86400000, now = Date.now();
  tr.mocks = {quick:[{s:15,n:20,p:false,at:now-6*day},{s:18,n:20,p:true,at:now-4*day}], full:[{s:39,n:50,p:false,at:now-3*day},{s:43,n:50,p:false,at:now-2*day},{s:45,n:50,p:true,at:now-day}]};
  localStorage.setItem("klaarStateV1", JSON.stringify(S));
  localStorage.setItem("klaarInstallSeen", "1"); localStorage.setItem("klaarInstallHint", "no"); localStorage.setItem("klaarStats", "off");
}

async function appShots(browser){
  const ctx = await browser.newContext({ viewport: {width:390, height:844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, colorScheme: 'light', serviceWorkers: 'block' });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'standalone', {get: () => true}); });
  const page = await ctx.newPage();
  await page.goto(BASE); await page.waitForTimeout(500);
  await page.evaluate(seed); await page.reload(); await page.waitForTimeout(900);
  const shot = async name => { await page.screenshot({ path: path.join(DIRS.shots, name + '.png') }); console.log('screenshot', name); };
  const scrollMain = y => page.evaluate(y => { document.querySelector('main').scrollTop = y; }, y);

  await page.click('.tab[data-view="home"]'); await page.waitForTimeout(700); await shot('1-plan');
  await scrollMain(700); await page.waitForTimeout(300); await shot('2-topics');

  /* a question with a picture: open the Priority topic from Home */
  await scrollMain(0);
  const openTopic = async name => { await page.click('.tab[data-view="home"]'); await page.waitForTimeout(400);
    await page.click('#v-home [data-topic="' + name + '"]');
    await page.waitForTimeout(1200); };
  await openTopic('Priority'); await scrollMain(0); await shot('3-question');
  const opt = await page.$('#v-feed .opt'); if (opt){ await opt.click(); await page.waitForTimeout(1100); await page.evaluate(() => { var v = document.querySelector('#v-feed .verdict'), m = document.querySelector('main'); if (v) m.scrollTop += v.getBoundingClientRect().top - 150; }); await page.waitForTimeout(400); await shot('4-explained'); }
  await openTopic('Hazard perception'); await scrollMain(0); await shot('5-hazard');

  await page.click('.tab[data-view="exams"]'); await page.waitForTimeout(700); await shot('6-mock-exams');
  await ctx.close();
}

const b64 = f => 'data:image/png;base64,' + fs.readFileSync(path.join(DIRS.shots, f + '.png')).toString('base64');
const CSS = `
*{box-sizing:border-box;margin:0}
body{font-family:system-ui,-apple-system,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased}
.s{position:relative;overflow:hidden;width:100vw;height:100vh;padding:84px 84px 0;display:flex;flex-direction:column}
.blue{background:#1C4FA0;color:#fff}.light{background:#EDF1F7;color:#0F1A2E}.navy{background:#0A101C;color:#E8EEF8}
.s::before{content:"";position:absolute;left:0;right:0;top:0;height:14px;background:#F2B705}
.top{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:26px;letter-spacing:.08em;text-transform:uppercase;opacity:.9}
.wm{font-style:italic;font-weight:900;font-size:54px;letter-spacing:-.03em;text-transform:none;opacity:1}
h1{font-weight:900;font-size:92px;line-height:1.02;letter-spacing:-.035em;margin-top:56px;max-width:900px}
h1 em{font-style:normal;color:#F2B705}.light h1 em{color:#1C4FA0}
p{font-size:38px;line-height:1.3;font-weight:500;margin-top:28px;max-width:860px;opacity:.88}
.phone{position:absolute;left:50%;transform:translateX(-50%);width:600px;border:16px solid #0F1A2E;border-radius:76px;overflow:hidden;box-shadow:0 40px 90px rgba(5,12,30,.45);background:#0F1A2E}
.navy .phone,.blue .phone{border-color:#0A101C}
.phone img{display:block;width:100%}
.pill{display:inline-block;align-self:flex-start;background:#F2B705;color:#0F1A2E;font-weight:800;font-size:40px;padding:26px 44px;border-radius:999px;margin-top:48px}
.list{margin-top:44px;display:grid;gap:22px}.list div{font-size:42px;font-weight:700;display:flex;gap:22px;align-items:center}
.list b{flex:none;width:58px;height:58px;border-radius:50%;background:#F2B705;color:#0F1A2E;display:grid;place-items:center;font-size:34px}
.url{position:absolute;left:84px;bottom:72px;font-size:34px;font-weight:700;opacity:.9}
.fine{position:absolute;left:84px;right:84px;bottom:72px;font-size:24px;opacity:.7;font-weight:500}
`;
const top = (i, n) => `<div class="top"><span class="wm">Klaar</span><span>${n ? i + ' / ' + n : ''}</span></div>`;
const slide = (cls, inner) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="s ${cls}">${inner}</div>`;

function carousel(){
  const N = 6;
  return [
    slide('blue', `${top(1, N)}<h1>Pass the Dutch driving theory exam. <em>In English.</em></h1><p>Made for expats and international students.</p><div class="phone" style="top:700px"><img src="${b64('1-plan')}"></div>`),
    slide('light', `${top(2, N)}<h1>A plan that counts back from <em>your exam date.</em></h1><p>It tells you how ready you are and what to do today.</p><div class="phone" style="top:640px"><img src="${b64('1-plan')}"></div>`),
    slide('blue', `${top(3, N)}<h1>See the situation, <em>not a wall of text.</em></h1><p>Junctions, lanes and roundabouts drawn from above, with who goes where.</p><div class="phone" style="top:640px"><img src="${b64('3-question')}"></div>`),
    slide('light', `${top(4, N)}<h1>Wrong answer? You get <em>the rule and the reason.</em></h1><p>Most answers link to the page of the official rulebook.</p><div class="phone" style="top:640px"><img src="${b64('4-explained')}" style="margin-top:-540px"></div>`),
    slide('blue', `${top(5, N)}<h1>Mock exams with <em>the real CBR rules.</em></h1><p>50 questions, 30 minutes, 44 to pass. No feedback until you hand in.</p><div class="phone" style="top:660px"><img src="${b64('6-mock-exams')}"></div>`),
    slide('navy', `${top(6, N)}<h1 style="font-size:132px;margin-top:110px">Start today.<br><em>Free.</em></h1><div class="list" style="margin-top:70px;gap:34px"><div><b>1</b>Open the link on your phone</div><div><b>2</b>Tell it your exam date</div><div><b>3</b>Do today's questions</div></div><div class="pill" style="margin-top:84px">${SITE}</div><div class="fine">No account. Works offline. Original practice questions, not official CBR material.</div>`)
  ];
}
const story = () => slide('blue', `${top()}<h1 style="font-size:104px;margin-top:150px">Dutch driving theory exam? Practise <em>in English.</em></h1><p style="font-size:44px">A plan that follows your exam date. Free, no account.</p><div class="phone" style="top:860px;width:680px"><img src="${b64('1-plan')}"></div>`);
const og = () => `<!doctype html><meta charset="utf-8"><style>${CSS}
.s{padding:64px 0 0 72px}h1{font-size:68px;margin-top:40px;max-width:640px}p{font-size:30px;max-width:600px;margin-top:22px}.phone{left:auto;right:70px;transform:none;top:70px;width:340px;border-width:10px;border-radius:46px}.url{left:72px;bottom:54px;font-size:28px}</style>
<div class="s blue">${top()}<h1>Pass the Dutch driving theory exam. <em>In English.</em></h1><p>A plan that follows your exam date. Free, works offline.</p><div class="phone"><img src="${b64('1-plan')}"></div><div class="url">${SITE}</div></div>`;

async function render(browser, html, w, h, file){
  const ctx = await browser.newContext({ viewport: {width:w, height:h}, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); await page.setContent(html); await page.waitForTimeout(250);
  await page.screenshot({ path: file }); await ctx.close(); console.log('made', path.relative(ROOT, file));
}
async function webCopies(browser){
  /* small JPGs for the landing page, 2x a 300px-wide phone */
  const ctx = await browser.newContext({ viewport: {width:600, height:1298}, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const f of ['1-plan', '2-topics', '3-question', '4-explained', '6-mock-exams']){
    await page.setContent(`<body style="margin:0"><img src="${b64(f)}" style="display:block;width:600px">`); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(DIRS.web, f + '.jpg'), type: 'jpeg', quality: 82 });
  }
  await ctx.close(); console.log('made welcome/img copies');
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  await appShots(browser);
  const slides = carousel();
  for (let i = 0; i < slides.length; i++) await render(browser, slides[i], 1080, 1350, path.join(DIRS.social, `carousel-${i + 1}.png`));
  await render(browser, story(), 1080, 1920, path.join(DIRS.social, 'story.png'));
  await render(browser, og(), 1200, 630, path.join(ROOT, 'icons', 'og.png'));
  await webCopies(browser);
  await browser.close();
})();
