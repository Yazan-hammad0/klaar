/* Klaar app: feed, exams, progress, home. Plain JS, no build step. */
(function(){
"use strict";

/* ---------------- helpers ---------------- */
function $(s, r){ return (r || document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pad(n){ return (n < 10 ? "0" : "") + n; }
function dayKey(d){ d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function normNum(s){ return String(s || "").replace(/[^0-9.,]/g, "").replace(",", "."); }
function normTxt(s){ return String(s || "").toLowerCase().trim().replace(/[.!?,]+$/, ""); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

var LIBS = {drive: DRIVE, civic: CIVIC};
var NAMES = {drive: "Rijbewijs", civic: "Inburgering"};
var SUBS = {drive: "Rijbewijs B", civic: "KNM + Dutch"};
var MAXLV = {drive: 5, civic: 4};
var CIVIC_LV = {1: "KNM + A2", 2: "B1", 3: "B2", 4: "C1"};
var SEC_LVL = {"basics":1,"knm":1,"a2-lezen":1,"a2-luisteren":1,"a2-schrijven":1,"b1":2,"b2":3,"c1":4};
var SEC_NAME = {"basics":"Basics","knm":"KNM","a2-lezen":"A2 Lezen","a2-luisteren":"A2 Luisteren","a2-schrijven":"A2 Schrijven","b1":"B1 Lezen","b2":"B2 Lezen","c1":"C1 Lezen"};
function citizenDates(){
  if (!S.arrived || !/^\d{4}-\d{2}-\d{2}$/.test(S.arrived)) return null;
  var p = S.arrived.split("-"), f = new Date(+p[0], +p[1] - 1, +p[2]), at = new Date(+p[0] + 5, +p[1] - 1, +p[2]);
  return {from:f, at:at};
}
function loc(){ return window.I18N ? I18N.loc() : "en-GB"; }
function fmtDate(d){ return d.toLocaleDateString(loc(), {day:"numeric", month:"short", year:"numeric"}); }
function hashId(s){ var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

/* ---------------- question bank ---------------- */
var STATIC = {drive: [], civic: []};
DRIVE.QUESTIONS.forEach(function(q, i){
  STATIC.drive.push({id:"d" + i, track:"drive", topic:q.t, kind:q.hz ? "hazard" : (q.num ? "num" : "mc"), q:q.q, o:q.o, c:q.c, a:q.a, e:q.e, sign:q.sign, src:q.source, lvl:1});
});
CIVIC.QUESTIONS.forEach(function(q, i){
  STATIC.civic.push({id:"c" + i, track:"civic", topic:q.t, kind:"mc", q:q.q, o:q.o, c:q.c, e:q.e, icon:q.icon, sec:"basics", lvl:1});
});
CIVIC.STAGES.forEach(function(s){
  s.qs.forEach(function(q, i){
    STATIC.civic.push({id:"s-" + s.id + "-" + i, track:"civic", topic:s.title, kind:q.type === "type" ? "type" : "mc", q:q.q, o:q.o, c:q.c, a:q.a, e:q.e, en:q.en, p:q.p, audio:q.audio, sec:s.id, lvl:SEC_LVL[s.id] || 1});
  });
});
var XB = (typeof EXTRA !== "undefined" && EXTRA) ? EXTRA : {drive: [], civic: []};
(XB.drive || []).forEach(function(q){
  STATIC.drive.push({id:"x-d-" + hashId(q.q), track:"drive", topic:q.t, kind:q.hz ? "hazard" : (q.num ? "num" : "mc"), q:q.q, o:q.o, c:q.c, a:q.a, e:q.e, sign:q.sign, src:q.source, lvl:1});
});
(XB.civic || []).forEach(function(q){
  var sec = SEC_LVL[q.sec] ? q.sec : "knm";
  STATIC.civic.push({id:"x-c-" + hashId(q.q), track:"civic", topic:q.t || SEC_NAME[sec], kind:q.type === "type" ? "type" : "mc", q:q.q, o:q.o, c:q.c, a:q.a, e:q.e, en:q.en, p:q.p, audio:q.audio, src:q.source, sec:sec, lvl:SEC_LVL[sec] || 1});
});
var GEN = {drive: [], civic: []};
var INDEX = {};
function reindex(){
  INDEX = {};
  ["drive", "civic"].forEach(function(t){ STATIC[t].concat(GEN[t]).forEach(function(q){ INDEX[q.id] = q; }); });
}
function pool(t){ return STATIC[t].concat(GEN[t]); }

/* ---------------- state ---------------- */
function freshTrack(){ return {xp:0, ans:0, ok:0, level:1, recent:[], topics:{}, seen:{}, primers:{}, wrong:[], mocks:{}, combo:0, aiOk:false}; }
function freshState(){ return {v:1, updated:0, track:"drive", view:"feed", t:{drive:freshTrack(), civic:freshTrack()}, days:{}, goal:30, plan:{}}; }
function mergeState(raw){
  var s = freshState();
  if (!raw || typeof raw !== "object") return s;
  ["updated", "track", "view", "goal", "arrived", "onboarded", "prof"].forEach(function(k){ if (raw[k] != null) s[k] = raw[k]; });
  if (raw.days) s.days = raw.days;
  if (raw.plan) s.plan = raw.plan;
  ["drive", "civic"].forEach(function(t){ if (raw.t && raw.t[t]) s.t[t] = Object.assign(freshTrack(), raw.t[t]); });
  if (s.track !== "civic") s.track = "drive";
  if (["home", "feed", "exams"].indexOf(s.view) < 0) s.view = "home";
  return s;
}
var LS = "klaarStateV1", LSG = "klaarGenV1";
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
var S = mergeState(lsGet(LS));
(function(){ var g = lsGet(LSG); if (g){ GEN.drive = Array.isArray(g.drive) ? g.drive : []; GEN.civic = Array.isArray(g.civic) ? g.civic : []; } reindex(); })();
function T(){ return S.t[S.track]; }

/* ---------------- cloud sync (db) ---------------- */
var DB = null, UID = null, dbTimer = null, dbBusy = false, dbDirty = false, cloud = "device";
function statePath(){ return "data/users/" + UID + "/state"; }
function genPath(t){ return "data/users/" + UID + "/gen-" + t; }
function renderSync(){
  var el = $("#sync");
  if (el) el.textContent = cloud === "cloud" ? "Synced to your account" : (cloud === "connecting" ? "Connecting…" : "Saved on this device");
}
function save(){
  S.updated = Date.now();
  lsSet(LS, S);
  if (DB){ dbDirty = true; clearTimeout(dbTimer); dbTimer = setTimeout(flush, 2500); }
}
function flush(){
  if (!DB || dbBusy || !dbDirty) return;
  dbBusy = true; dbDirty = false;
  DB.doc(statePath()).set(clone(S)).then(function(){}, function(e){
    if (e && (e.code === "invalid_argument" || e.code === "revoked" || e.code === "not_granted")){ DB = null; cloud = "device"; renderSync(); }
  }).then(function(){ dbBusy = false; if (dbDirty && DB){ clearTimeout(dbTimer); dbTimer = setTimeout(flush, 1500); } });
}
var genSaving = {drive: Promise.resolve(), civic: Promise.resolve()};
function saveGen(t){
  lsSet(LSG, GEN);
  if (!DB) return;
  var items = clone(GEN[t]);
  genSaving[t] = genSaving[t].then(function(){ return DB ? DB.doc(genPath(t)).set({items: items, updated: Date.now()}) : null; }).catch(function(){});
}
function initCloud(){
  if (!window.claude || !window.claude.use) return;
  cloud = "connecting"; renderSync();
  Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function(r){
    var db = r[0], user = r[1];
    if (!db || !user){ cloud = "device"; renderSync(); return; }
    return user.id().then(function(id){
      if (!id){ cloud = "device"; renderSync(); return; }
      DB = db; UID = id;
      return DB.doc(statePath()).get().then(function(snap){
        var remote = snap.exists ? snap.data() : null;
        if (remote && (remote.updated || 0) > (S.updated || 0)){ S = mergeState(remote); lsSet(LS, S); applyTrack(); renderAll(); }
        else if (!remote || (S.updated || 0) > (remote.updated || 0)){ dbDirty = true; flush(); }
        return Promise.all(["drive", "civic"].map(function(t){
          return DB.doc(genPath(t)).get().then(function(gs){
            var remoteItems = gs.exists && Array.isArray(gs.data().items) ? gs.data().items : [];
            var have = {}; GEN[t].forEach(function(q){ have[q.id] = true; });
            var added = remoteItems.filter(function(q){ return q && q.id && !have[q.id]; });
            if (added.length){ GEN[t] = GEN[t].concat(added).slice(-250); }
            if (GEN[t].length > remoteItems.length) saveGen(t); else lsSet(LSG, GEN);
          });
        }));
      }).then(function(){ reindex(); cloud = "cloud"; renderSync(); if (view === "home") renderHome(); });
    });
  }).catch(function(){ DB = null; cloud = "device"; renderSync(); });
}

/* ---------------- Claude (sample) ---------------- */
var SAMPLE = null, aiOff = false;
var ai = {drive: "idle", civic: "idle"};
function initSample(){
  if (!window.claude || !window.claude.use) return;
  window.claude.use("sample").then(function(s){ SAMPLE = s || null; if (!SAMPLE) aiOff = true; refreshAiBits(); }, function(){ aiOff = true; });
}
function aiAvailable(){ return !!SAMPLE && !aiOff; }

function weakTopics(t, n){
  var tp = S.t[t].topics;
  return Object.keys(tp).filter(function(k){ return tp[k].a >= 3; })
    .sort(function(a, b){ return tp[a].ok / tp[a].a - tp[b].ok / tp[b].a; })
    .slice(0, n || 3);
}
function stems(t){
  return pool(t).slice(-70).map(function(q){ return "- " + String(q.q).slice(0, 90).replace(/\s+/g, " "); }).join("\n");
}
var DRIVE_TOPICS = ["Priority","Hazard perception","Speed limits","Distances","Signs","Road markings","Stopping & parking","Lane use","Motorway","Lights & visibility","Railway crossings","Mobile phones","Alcohol limit","Vehicle condition","Safety","Seatbelts"];
function promptFor(t, n){
  var lv = S.t[t].level, weak = weakTopics(t);
  if (t === "drive"){
    return [
      "You write practice questions for the Dutch CBR car theory exam (category B, the single 50-question format used since April 2025). The learner takes the exam in English and may have learned to drive abroad, so Dutch-specific rules are the hard part.",
      "Write " + n + " NEW questions at difficulty level " + lv + " of 5 (1 = basic rules, 3 = typical real exam, 5 = the trickiest real-exam situations: combined priority cases, exceptions, exact numbers, trams, cyclists, special manoeuvres).",
      weak.length ? "Put extra focus on the learner's weakest topics: " + weak.join(", ") + "." : "Spread across topics.",
      "Allowed topic names: " + DRIVE_TOPICS.join(", ") + ".",
      "Rules:",
      "- Dutch traffic law as it is now (RVV 1990, BABW signs, CBR exam since April 2025). Only questions with one clearly correct answer. If you are not certain of a fact, do not use it.",
      "- Use the CBR English-exam terms; add the Dutch term in brackets where useful, e.g. built-up area (bebouwde kom).",
      "- Multiple choice: 3 or 4 options of similar length and style. The correct option must not be the longest. Distractors must be plausible, especially rules that are true in other countries.",
      "- About 2 of the " + n + " are hazard situations: kind \"hazard\", a concrete scene with your speed and the distance, options exactly [\"Brake\",\"Release the accelerator\",\"Do nothing\"].",
      "- About 1 is kind \"num\": the answer is a number the learner types; give accepted answers as strings in \"a\".",
      "- \"e\": 1-2 sentences in English: why the answer is right and what the trap was.",
      "- Do not repeat or rephrase these existing questions:",
      stems(t),
      "Reply with only a JSON array like:",
      '[{"topic":"Priority","kind":"mc","q":"...","o":["...","...","...","..."],"c":2,"e":"..."},{"topic":"Hazard perception","kind":"hazard","q":"You drive 50 km/h ...","o":["Brake","Release the accelerator","Do nothing"],"c":1,"e":"..."},{"topic":"Distances","kind":"num","q":"... (type a number)","a":["25"],"e":"..."}]'
    ].join("\n");
  }
  var secs = lv <= 1 ? "knm, a2-lezen, a2-luisteren, a2-schrijven" : (lv === 2 ? "knm, a2-lezen, a2-luisteren, a2-schrijven, b1" : (lv === 3 ? "knm, b1, b2" : "knm, b2, c1"));
  return [
    "You write practice questions for the Dutch civic integration exam (inburgeringsexamen, A2) and Dutch reading above it. The learner is an adult expat in the Netherlands, preparing to naturalise. Explanations are in English; exam content is in Dutch.",
    "Write " + n + " NEW questions. The learner's current level is " + CIVIC_LV[lv] + ". Use these sections, mixed: " + secs + ".",
    weak.length ? "Extra focus on the learner's weakest topics: " + weak.join(", ") + "." : "",
    "Section formats:",
    "- knm: a practical daily-life situation in simple Dutch (A2) about Dutch society, rules, healthcare, work, housing, government, history or norms, like the real KNM exam. Fields: q, o, c, en (English translation of the question), e.",
    "- a2-lezen: \"p\" is a short realistic Dutch text (letter, notice, message, sign, 30-80 words); q is a Dutch question about it; fields en, e.",
    "- a2-luisteren: \"audio\" is a short spoken Dutch message (1-3 sentences, with traps like 'half tien', 'veertien' vs 'veertig'); q in Dutch; fields en, e.",
    "- a2-schrijven: kind \"type\": a fill-in grammar item such as 'Vul in: Gisteren ___ ik naar de dokter. (gaan)', accepted answers in \"a\"; or a multiple-choice sentence-order or formal-letter item.",
    "- b1 / b2 / c1: \"p\" is a Dutch text at that level (news, official letters, workplace, opinion; c1 can be business or HR language), q asks about meaning, a word, or the writer's intent.",
    "Rules:",
    "- Facts about the Netherlands must be correct as of now. Only one clearly correct answer. If unsure of a fact, skip it.",
    "- Multiple choice: 3 or 4 options of similar length; the correct option must not be the longest; distractors plausible.",
    "- \"topic\" is a short English topic name (e.g. Healthcare, Work life, Government, Housing, Grammar, Reading).",
    "- \"e\": 1-2 sentences in English explaining the answer and the trap.",
    "- Do not repeat or rephrase these existing questions:",
    stems(t),
    "Reply with only a JSON array like:",
    '[{"sec":"knm","topic":"Healthcare","kind":"mc","q":"...","o":["...","...","..."],"c":1,"en":"...","e":"..."},{"sec":"a2-lezen","topic":"Reading","kind":"mc","p":"...","q":"...","o":["...","...","...","..."],"c":0,"en":"...","e":"..."},{"sec":"a2-schrijven","topic":"Grammar","kind":"type","q":"Vul in: ...","a":["..."],"en":"...","e":"..."}]'
  ].join("\n");
}
function validate(t, raw){
  if (!Array.isArray(raw)) return [];
  var out = [], stamp = Date.now(), lv = S.t[t].level;
  raw.forEach(function(r, i){
    if (!r || typeof r !== "object" || typeof r.q !== "string" || r.q.length < 8) return;
    var kind = r.kind === "hazard" || r.kind === "num" || r.kind === "type" ? r.kind : "mc";
    var q = {id:"g" + stamp + "-" + i, track:t, gen:true, topic:String(r.topic || "Mixed").slice(0, 40), kind:kind, q:r.q.slice(0, 700), e:String(r.e || "").slice(0, 600)};
    if (kind === "num" || kind === "type"){
      if (!Array.isArray(r.a) || !r.a.length) return;
      q.a = r.a.map(String).slice(0, 5);
    } else {
      if (kind === "hazard") r.o = ["Brake", "Release the accelerator", "Do nothing"];
      if (!Array.isArray(r.o) || r.o.length < 2 || r.o.length > 5) return;
      var c = Number(r.c);
      if (!(c >= 0 && c < r.o.length) || Math.floor(c) !== c) return;
      q.o = r.o.map(function(x){ return String(x).slice(0, 220); }); q.c = c;
    }
    if (t === "civic"){
      q.sec = SEC_LVL[r.sec] ? r.sec : "knm";
      q.lvl = SEC_LVL[q.sec];
      if (r.p) q.p = String(r.p).slice(0, 1600);
      if (r.audio) q.audio = String(r.audio).slice(0, 500);
      if (r.en) q.en = String(r.en).slice(0, 400);
      if (q.sec === "knm" || q.sec.indexOf("a2") === 0) q.topic = q.topic;
    } else {
      q.lvl = lv;
      if (DRIVE_TOPICS.indexOf(q.topic) < 0) q.topic = kind === "hazard" ? "Hazard perception" : q.topic;
    }
    out.push(q);
  });
  return out;
}
function generate(t, n){
  if (!aiAvailable() || ai[t] === "busy") return Promise.resolve(0);
  ai[t] = "busy"; refreshAiBits();
  return SAMPLE.json(promptFor(t, n || 8), {cache: false}).then(function(raw){
    var items = validate(t, raw);
    if (items.length){
      GEN[t] = GEN[t].concat(items).slice(-250); reindex(); saveGen(t);
      S.t[t].aiOk = true; save();
      toast(items.length + " fresh " + (t === "drive" ? "driving" : "integration") + " questions added");
    } else toast("That batch didn't come back usable. Try again.");
    ai[t] = items.length ? "idle" : "error";
    return items.length;
  }, function(e){
    var code = e && e.code;
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].indexOf(code) >= 0){ aiOff = true; ai[t] = "off"; }
    else if (code === "rate_limited"){ ai[t] = "limited"; toast("Claude needs a break. Try again in a while."); }
    else if (code === "cancelled"){ ai[t] = "idle"; }
    else { ai[t] = "error"; toast("Couldn't reach Claude. Try again."); }
    return 0;
  }).then(function(n){ refreshAiBits(); if (view === "feed" && waitingForQuestions) nextQuestion(); return n; });
}
function maybeAutoGen(t){
  if (aiAvailable() && S.t[t].aiOk && ai[t] === "idle") generate(t, 8);
}
function refreshAiBits(){
  if (view === "home") renderHome();
  if (view === "feed" && waitingForQuestions) renderFeed();
}

/* ---------------- stats ---------------- */
function topicAcc(tr, topic){ var x = tr.topics[topic]; return x && x.a ? x.ok / x.a : 0.6; }
function record(q, ok, fromExam){
  var tr = S.t[q.track];
  tr.ans++; if (ok) tr.ok++;
  var tp = tr.topics[q.topic] || (tr.topics[q.topic] = {a:0, ok:0});
  tp.a++; if (ok) tp.ok++;
  tr.seen[q.id] = Date.now();
  var dk = dayKey(); S.days[dk] = (S.days[dk] || 0) + 1;
  var leveled = false;
  if (!fromExam){
    tr.combo = ok ? tr.combo + 1 : 0;
    tr.xp += ok ? 10 + Math.min(tr.combo, 10) : 2;
    /* The civic level is your Dutch level, so only the language parts count, not KNM facts. */
    if (!(q.track === "civic" && (q.sec === "basics" || q.sec === "knm"))){ tr.recent.push(ok ? 1 : 0); if (tr.recent.length > 20) tr.recent = tr.recent.slice(-20); }
    if (!ok) tr.wrong.push({id:q.id, due:tr.ans + 5});
    if (tr.recent.length >= 20 && tr.recent.reduce(function(a, b){ return a + b; }, 0) >= 17 && tr.level < MAXLV[q.track]){
      tr.level++; tr.recent = []; leveled = true;
    }
  } else if (!ok){ tr.wrong.push({id:q.id, due:tr.ans + 3}); }
  if (tr.wrong.length > 120) tr.wrong = tr.wrong.slice(-120);
  save();
  return leveled;
}
function streak(){
  var n = 0, d = new Date();
  if (!S.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (S.days[dayKey(d)]){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function levelName(t){ return t === "drive" ? "Level " + S.t.drive.level : CIVIC_LV[S.t.civic.level]; }

/* ---------------- glossary sheet ---------------- */
function mark(t, s){ return LIBS[t].markGlossary(s); }
function openSheet(html){
  var root = $("#overlay-root");
  root.innerHTML = '<div class="overlay" id="ov" role="dialog" aria-modal="true"><div class="sheet">' + html + '<button class="btn" id="sheet-close">Got it</button></div></div>';
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#ov").addEventListener("click", function(e){ if (e.target.id === "ov") closeSheet(); });
}
function closeSheet(){
  var ov = $("#ov"); if (!ov || ov.classList.contains("out")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches){ $("#overlay-root").innerHTML = ""; return; }
  ov.classList.add("out"); setTimeout(function(){ if (ov.parentNode) ov.parentNode.innerHTML = ""; }, 240);
}
document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeSheet(); });
document.addEventListener("click", function(e){
  var t = e.target.closest && e.target.closest(".term");
  if (!t) return;
  e.stopPropagation(); e.preventDefault();
  var g = LIBS[S.track].GLOSSARY[t.getAttribute("data-term")];
  if (!g) return;
  openSheet('<div class="sheet-head">' + (g.icon || "") + '<h2>' + esc(g.label) + '</h2></div><p>' + esc(g.def) + '</p>');
}, true);

/* ---------------- toast ---------------- */
var toastTimer = null;
function toast(msg){
  var old = $(".toast"); if (old) old.remove();
  var el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ el.remove(); }, 2600);
}

/* ---------------- speech ---------------- */
/* Listening: recorded Dutch audio (audio/<hash>.mp3, natural voices made with audio/make_audio.py).
   Text without a recording falls back to the phone's best Dutch voice. */
var CLIP = null;
function stopSound(){ try{ if (CLIP){ CLIP.pause(); CLIP = null; } if ("speechSynthesis" in window) speechSynthesis.cancel(); }catch(e){} }
function speak(text){
  var h = hashId(text);
  stopSound();
  if (window.KLAAR_AUDIO && KLAAR_AUDIO.indexOf(h) >= 0){
    try{ CLIP = new Audio("audio/" + h + ".mp3"); var pr = CLIP.play(); if (pr && pr.catch) pr.catch(function(){ ttsSpeak(text); }); return true; }catch(e){}
  }
  return ttsSpeak(text);
}
function ttsSpeak(text){
  if (!("speechSynthesis" in window)) return false;
  try{
    var u = new SpeechSynthesisUtterance(text); u.lang = "nl-NL"; u.rate = 0.88;
    var vs = speechSynthesis.getVoices().filter(function(x){ return /^nl/i.test(x.lang); });
    var score = function(x){ return (/premium|enhanced|natural|neural|siri|google/i.test(x.name) ? 4 : 0) + (/nl[-_]NL/i.test(x.lang) ? 2 : 0) + (x.localService ? 0 : 1); };
    vs.sort(function(a, b){ return score(b) - score(a); });
    if (vs[0]) u.voice = vs[0];
    speechSynthesis.speak(u); return true;
  }catch(e){ return false; }
}
var PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5 L13 8 L4 13.5 Z" fill="currentColor"/></svg>';

/* ---------------- shared question renderer ---------------- */
function visualFor(q){
  if (q.sign && DRIVE.signSvg) return '<div class="visual">' + DRIVE.signSvg(q.sign) + '</div>';
  if (q.icon && CIVIC.topicIcon) return '<div class="visual">' + CIVIC.topicIcon(q.icon) + '</div>';
  return "";
}
function bodyHtml(q){
  var h = visualFor(q);
  if (q.p) h += '<div class="passage">' + esc(q.p) + '</div>';
  if (q.audio) h += '<div class="audio"><button class="btn" data-act="play">' + PLAY + 'Luister</button><button class="small" data-act="showtx">Can\'t play? Show text</button></div><div class="passage" data-tx hidden>' + esc(q.audio) + '</div>';
  if (q.kind === "hazard") h += '<div class="passage scenario">' + mark(q.track, q.q) + '</div><p class="qtext">What do you do?</p>';
  else h += '<p class="qtext">' + mark(q.track, q.q) + '</p>';
  if (!run && helpEN(q) && q.kind !== "hazard") h += '<p class="en-pre">' + esc(q.en) + '</p>';
  return h;
}
function correctText(q){ return q.o ? q.o[q.c] : q.a[0]; }
function isRight(q, a){
  if (q.kind === "num") return q.a.some(function(x){ return normNum(x) === normNum(a) && normNum(a) !== ""; });
  if (q.kind === "type") return q.a.some(function(x){ return normTxt(x) === normTxt(a); });
  return a === q.c;
}
function wireAudio(root, q){
  var p = $('[data-act="play"]', root), s = $('[data-act="showtx"]', root), tx = $("[data-tx]", root);
  if (p) p.addEventListener("click", function(){ if (!speak(q.audio) && tx) tx.hidden = false; });
  if (s) s.addEventListener("click", function(){ if (tx) tx.hidden = false; });
}

/* ---------------- FEED ---------------- */
var cur = null, waitingForQuestions = false, lastId = null;
/* ---------------- personal profile (set in the level chat) ---------------- */
function prof(){ return S.prof || {}; }
function goals(){ var g = prof().goals; return g && g.length ? g : ["drive", "civic"]; }
function helpEN(q){ var nl = prof().nl; return q.track === "civic" && !!q.en && (nl === "none" || nl === "a1"); }
var DUTCH_SPECIFIC = {"Priority":1, "Signs":1, "Road markings":1, "Lane use":1, "Railway crossings":1};
function fitsProfile(q){
  var pr = prof();
  if (q.track === "civic"){
    var a = S.t.civic.ans;
    if (pr.nl === "none" && a < 30) return q.sec === "basics";
    if ((pr.nl === "none" || pr.nl === "a1") && a < 60) return q.sec === "basics" || q.sec === "knm" || q.sec === "a2-schrijven";
  }
  if (q.track === "drive" && pr.drive === "new" && S.t.drive.ans < 30) return q.kind !== "hazard";
  return true;
}
function profileBoost(q){ return q.track === "drive" && prof().drive === "abroad" && DUTCH_SPECIFIC[q.topic] ? 2 : 0; }
function levelCap(t){ return t === "drive" ? 99 : S.t.civic.level; }
/* Lessons first: before the first question on a topic, its lesson plays once (js/lessons.js).
   Topics without a lesson go straight to questions. "test" turns lessons off. */
function teachFirst(){ return prof().style !== "test"; }
function topicLesson(t, topic){ return window.LESSONS && LESSONS[t] && LESSONS[t][topic]; }
function needsLesson(q){ var tr = S.t[q.track]; return teachFirst() && !!topicLesson(q.track, q.topic) && !(tr.primers || {})[q.topic]; }
var lesson = null, focus = null, UNIT_MAX = 10;
/* a unit = a topic's lesson, then its questions, then a short "topic done" card */
function nextLessonTopic(t, p){
  var order = (window.LESSON_ORDER && LESSON_ORDER[t]) || [], tr = S.t[t], done = tr.primers || {};
  for (var i = 0; i < order.length; i++){
    var k = order[i];
    if (done[k] || !topicLesson(t, k)) continue;
    if (p.some(function(x){ return x.topic === k && !tr.seen[x.id]; })) return k;
  }
  return null;
}
function startLesson(first){
  var t = S.track;
  lesson = {track:t, topic:first.topic, primer:{steps:topicLesson(t, first.topic), i:0}};
  cur = null; waitingForQuestions = false;
  renderFeed(true);
  scrollTop0();
}
function pickNext(t){
  var tr = S.t[t];
  var inUnit = focus && focus.track === t && focus.asked < focus.n;
  for (var i = 0; i < tr.wrong.length; i++){
    if (tr.wrong[i].due <= tr.ans && !(inUnit && INDEX[tr.wrong[i].id] && INDEX[tr.wrong[i].id].topic !== focus.topic)){   /* other topics' retries wait until the unit is done */
      var w = tr.wrong.splice(i, 1)[0];
      if (INDEX[w.id] && w.id !== lastId) return INDEX[w.id];
      i--;
    }
  }
  var cap = levelCap(t);
  var p = pool(t).filter(function(q){ return (q.lvl || 1) <= cap; });
  var fit = p.filter(fitsProfile); if (fit.length >= 12) p = fit;
  if (focus && focus.track === t && focus.asked < focus.n){
    var fq = p.filter(function(x){ return x.topic === focus.topic && !tr.seen[x.id] && x.id !== lastId; });
    if (fq.length) return fq[Math.floor(Math.random() * fq.length)];
    focus.n = focus.asked;
  }
  if (teachFirst() && !focus){
    var nt = nextLessonTopic(t, p);
    if (nt){ var lq = p.filter(function(x){ return x.topic === nt && !tr.seen[x.id]; }); return lq[Math.floor(Math.random() * lq.length)]; }
  }
  var unseen = p.filter(function(q){ return !tr.seen[q.id] && q.id !== lastId; });
  if (unseen.length <= 8) maybeAutoGen(t);
  var cand = unseen;
  if (!cand.length){
    if (!tr.aiOk && aiAvailable()) return null;
    cand = p.filter(function(q){ return q.id !== lastId; }).sort(function(a, b){ return (tr.seen[a.id] || 0) - (tr.seen[b.id] || 0); }).slice(0, Math.max(6, Math.floor(p.length / 3)));
  }
  var weights = cand.map(function(q){
    return 1 + profileBoost(q) + 3 * (1 - topicAcc(tr, q.topic)) + ((q.lvl || 1) === cap && t === "civic" ? 1.5 : 0) + (q.gen ? 0.5 : 0);
  });
  var sum = weights.reduce(function(a, b){ return a + b; }, 0), r = Math.random() * sum;
  for (var k = 0; k < cand.length; k++){ r -= weights[k]; if (r <= 0) return cand[k]; }
  return cand[cand.length - 1];
}
function nextQuestion(){
  if (milestoneDue){ milestoneDue = false; renderMilestone(); return; }
  if (lesson && lesson.track === S.track){ renderFeed(); return; }
  if (focus && focus.track === S.track && focus.asked >= focus.n){ renderUnitDone(); return; }
  var q = pickNext(S.track);
  if (!q){ cur = null; waitingForQuestions = true; renderFeed(); return; }
  if (needsLesson(q)){ startLesson(q); return; }
  waitingForQuestions = false;
  lastId = q.id;
  cur = {q:q, done:false, sel:null, order:q.kind === "mc" ? shuffle(q.o.map(function(_, i){ return i; })) : (q.o ? q.o.map(function(_, i){ return i; }) : null), input:""};
  renderFeed(true);
  scrollTop0();
}
function renderUnitDone(){
  var F = focus, t = F.track, tr = S.t[t], p = pool(t).filter(function(q){ return (q.lvl || 1) <= levelCap(t); }), nt = null;
  focus = null; nt = teachFirst() ? nextLessonTopic(t, p) : null; focus = F;
  var v = $("#v-feed");
  v.innerHTML = feedHead() + '<article class="qcard enter milestone unit-done"><div class="eyebrow"><span>' + esc(F.topic) + '</span></div><div class="m-big tabular">' + F.ok + '<small>/' + F.n + '</small></div><div class="m-cap">Topic done</div>' +
    '<p class="m-cheer">' + (F.ok >= F.n * 0.8 ? "Strong. You know this topic." : "Mistakes come back later, so you get another go.") + '</p>' +
    (nt ? '<p class="unit-next">Next lesson: <b>' + esc(nt) + '</b></p>' : "") +
    '<div class="fb-actions"><button class="btn pop" data-act="u-next">' + (nt ? "Start the next lesson" : "Keep going") + '</button></div></article>';
  $('[data-act="u-next"]', v).addEventListener("click", function(){ focus = null; nextQuestion(); });
  scrollTop0();
}
function ringSvg(done, goal){
  var r = 24, C = 2 * Math.PI * r, f = Math.min(1, done / goal);
  return '<svg viewBox="0 0 58 58" aria-hidden="true"><circle cx="29" cy="29" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="6"/>' +
    '<circle cx="29" cy="29" r="' + r + '" fill="none" stroke="' + (f >= 1 ? "var(--ok)" : "var(--accent)") + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg>';
}
var FLAME = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7z" fill="currentColor"/></svg>';
function feedHead(){
  var tr = T(), today = S.days[dayKey()] || 0, st = streak();
  var lvlPct = Math.round(Math.min(1, (tr.recent.reduce(function(a, b){ return a + b; }, 0)) / 17) * 100);
  return '<div class="feed-head"><div class="ring">' + ringSvg(today, S.goal) + '<b class="tabular">' + today + '<small>/' + S.goal + '</small></b></div>' +
    '<div class="chips"><span class="chip' + (st >= 3 ? " hot" : "") + '">' + FLAME + st + '-day streak</span>' +
    '<span class="chip">' + esc(levelName(S.track)) + '</span>' +
    (tr.combo >= 3 ? '<span class="chip hot">Combo x' + tr.combo + '</span>' : '<span class="chip tabular">' + tr.xp + ' XP</span>') +
    '</div></div>' +
    '<div class="xpbar" title="Progress to next level"><i style="width:' + (tr.level >= MAXLV[S.track] ? 100 : lvlPct) + '%"></i></div>';
}
/* the topic lesson: a few steps with an animated scene, shown once before the first questions on a topic */
function renderPrimer(v, entering){
  var L = lesson, P = L.primer, st = P.steps[P.i], last = P.i === P.steps.length - 1;
  var h = feedHead() + '<article class="qcard lesson primer' + (entering ? " enter" : "") + '" id="qcard"><div class="eyebrow"><span>' + esc(L.topic) + '</span><span class="tag">Lesson</span><span class="pr-count tabular">' + (P.i + 1) + ' / ' + P.steps.length + '</span></div>' +
    (st.scene && window.LESSON_SCENE ? '<div class="lscene">' + LESSON_SCENE(st.scene) + '</div>' : (st.icon && LIBS[L.track].GLOSSARY[st.icon] ? '<div class="visual">' + LIBS[L.track].GLOSSARY[st.icon].icon + '</div>' : "")) +
    '<h3 class="les-h">' + esc(st.h) + '</h3><p class="pr-t">' + (window.I18N && I18N.get() !== "en" ? esc(st.t) : mark(L.track, st.t)) + '</p>' +
    '<p class="pr-why"><b>Why</b><span>' + esc(st.why) + '</span></p>' + (st.src ? '<p class="src">Source: ' + esc(srcName(st.src)) + '</p>' : "") +
    '<p class="pr-swipe">Swipe for the next step</p><div class="pr-dots" aria-hidden="true">' + P.steps.map(function(_, k){ return '<i class="' + (k === P.i ? "on" : (k < P.i ? "done" : "")) + '"></i>'; }).join("") + '</div>' +
    '<div class="fb-actions">' + (P.i > 0 ? '<button class="btn ghost" data-act="pr-back">Back</button>' : "") + '<button class="btn' + (last ? " pop" : "") + '" data-act="pr-next">' + (last ? "Now practise" : "Next") + '</button></div></article>';
  v.innerHTML = h;
  var b = $('[data-act="pr-back"]', v); if (b) b.addEventListener("click", function(){ P.i--; renderFeed(); scrollTop0(); });
  var card = $("#qcard", v), sx = null, sy = 0, rtl = window.I18N && I18N.rtl();
  card.addEventListener("touchstart", function(e){ if (e.touches.length === 1){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, {passive:true});
  card.addEventListener("touchend", function(e){
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var fwd = rtl ? dx > 0 : dx < 0;
    if (fwd) $('[data-act="pr-next"]', v).click(); else if (P.i > 0){ P.i--; renderFeed(); scrollTop0(); }
  }, {passive:true});
  $('[data-act="pr-next"]', v).addEventListener("click", function(){
    if (!last){ P.i++; renderFeed(); scrollTop0(); return; }
    var tr = S.t[L.track]; tr.primers = tr.primers || {}; tr.primers[L.topic] = Date.now();
    var unseen = pool(L.track).filter(function(x){ return x.topic === L.topic && !tr.seen[x.id] && (x.lvl || 1) <= levelCap(L.track); }).length;
    focus = unseen ? {track:L.track, topic:L.topic, n:Math.min(UNIT_MAX, unseen), asked:0, ok:0} : null; lesson = null; save(); nextQuestion();
  });
}
function renderLesson(v, entering){ renderPrimer(v, entering); }
function renderFeed(entering){
  var v = $("#v-feed");
  if (lesson){ renderLesson(v, entering); return; }
  if (!cur){
    var t = S.track, busy = ai[t] === "busy";
    var html = feedHead() + '<article class="qcard"><div class="empty">';
    if (busy) html += '<div class="spinner"></div><h3>Writing fresh questions</h3><p>Claude is making a new batch aimed at your weak spots. This can take up to a minute.</p>';
    else if (aiAvailable()) html += '<h3>You\'ve seen every question</h3><p>Let Claude write new ones, tuned to your level and the topics you miss most. After this, new batches arrive automatically while you scroll.</p><button class="btn pop" data-act="gen">Generate fresh questions</button><p class="note" style="margin-top:12px">Uses your own Claude usage. Claude asks once before the first batch.</p>';
    else html += '<h3>You\'ve seen every question</h3><p>Repeats start now, weakest topics first.</p><button class="btn" data-act="repeat">Keep going</button>';
    html += '</div></article>';
    v.innerHTML = html;
    var g = $('[data-act="gen"]', v); if (g) g.addEventListener("click", function(){ generate(t, 8); renderFeed(); });
    var rp = $('[data-act="repeat"]', v); if (rp) rp.addEventListener("click", function(){ S.t[t].aiOk = true; nextQuestion(); });
    return;
  }
  var q = cur.q, html2 = feedHead();
  html2 += '<article class="qcard' + (entering ? " enter" : "") + (q.kind === "hazard" ? " hz" : "") + '" id="qcard">';
  var inUnit = focus && focus.track === q.track && q.topic === focus.topic;
  html2 += '<div class="eyebrow"><span>' + esc(q.topic) + '</span>' + (inUnit ? '<span class="pr-count tabular">' + Math.min(focus.n, focus.asked + (cur.done ? 0 : 1)) + ' / ' + focus.n + '</span>' : "") + (q.sec && q.sec !== "basics" && SEC_NAME[q.sec] !== q.topic ? '<span class="tag">' + esc(SEC_NAME[q.sec] || q.sec) + '</span>' : "") + (q.gen ? '<span class="tag ai">New</span>' : "") + '</div>';
  html2 += bodyHtml(q);
  if (q.kind === "num" || q.kind === "type"){
    html2 += '<div class="inrow"><input class="inp" id="feed-inp" ' + (q.kind === "num" ? 'inputmode="decimal" placeholder="Type a number"' : 'autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Type je antwoord"') + ' aria-label="Your answer" value="' + esc(cur.input) + '"' + (cur.done ? " disabled" : "") + '>' +
      (cur.done ? "" : '<button class="btn" data-act="check">Check</button>') + '</div>';
  } else {
    html2 += '<div class="opts">';
    cur.order.forEach(function(orig, k){
      var cls = "opt";
      if (cur.done){ if (orig === q.c) cls += " right"; else if (orig === cur.sel) cls += " wrong"; }
      html2 += '<button class="' + cls + '" data-o="' + orig + '"' + (cur.done ? " disabled" : "") + '><span class="k">' + String.fromCharCode(65 + k) + '</span><span>' + mark(q.track, q.o[orig]) + '</span></button>';
    });
    html2 += '</div>';
  }
  if (cur.done){
    var ok = cur.ok;
    html2 += '<div class="fb"><p class="verdict ' + (ok ? "ok" : "no") + '">' + (ok ? "Correct" : "Not quite") + '</p>';
    if (!ok) html2 += '<p><b>Answer: ' + esc(correctText(q)) + '</b></p>';
    if (q.en) html2 += '<p class="en">' + esc(q.en) + '</p>';
    if (q.audio) html2 += '<p class="en">Audio: ' + esc(q.audio) + '</p>';
    html2 += '<p class="ex">' + mark(q.track, q.e) + '</p>';
    if (q.src) html2 += '<p class="src">Source: ' + esc(srcName(q.src)) + '</p>';
    if (cur.explain) html2 += '<div class="ai-out" id="ai-out">' + esc(cur.explain) + '</div>';
    html2 += '<div class="fb-actions">' + (aiAvailable() && !cur.explaining && !cur.explain ? '<button class="btn ghost" data-act="explain">Explain it simpler</button>' : "") + '<button class="btn" data-act="next">Next</button></div></div>';
    html2 += '<p class="hint">Swipe up for the next question</p>';
  }
  html2 += '</article>';
  v.innerHTML = html2;
  wireFeed(v);
}
function burst(btn){
  if (!btn || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var card = $("#qcard"); if (!card) return;
  var cr = card.getBoundingClientRect(), br = btn.getBoundingClientRect();
  for (var i = 0; i < 14; i++){
    var s = document.createElement("i"); s.className = "burst";
    s.style.setProperty("--x", (br.left - cr.left + br.width * 0.15) + "px");
    s.style.setProperty("--y", (br.top - cr.top + br.height / 2) + "px");
    s.style.setProperty("--dx", (Math.random() * 180 - 40) + "px");
    s.style.setProperty("--dy", (Math.random() * -120 - 10) + "px");
    card.appendChild(s);
  }
}
function answer(a, btnRect){
  if (cur.done) return;
  var q = cur.q, ok = isRight(q, a);
  cur.done = true; cur.sel = a; cur.ok = ok;
  var leveled = record(q, ok, false);
  if (focus && focus.track === q.track && q.topic === focus.topic){ focus.asked++; if (ok) focus.ok++; }
  renderFeed();
  var card = $("#qcard");
  if (card){ card.classList.add(ok ? "hit" : "miss"); }
  if (ok) burst($(".opt.right") || $(".inp"));
  var fbx = $("#v-feed .fb");
  if (fbx){ var r = fbx.getBoundingClientRect(), tbh = ($(".tabbar") || {offsetHeight:0}).offsetHeight, want = r.top + 150 - ($(".tabbar") ? $(".tabbar").getBoundingClientRect().top : window.innerHeight - tbh);
    if (want > 0) scroller().scrollBy({top: want, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); }
  var dn = S.days[dayKey()] || 0; if (dn > 0 && dn % 10 === 0) milestoneDue = true;
  if (leveled) toast("Level up: " + levelName(q.track) + ". Questions get harder now.");
  else if (ok && T().combo > 0 && T().combo % 10 === 0) toast(T().combo + " in a row");
  if ((S.days[dayKey()] || 0) === S.goal) toast("Daily goal done. Anything now is bonus.");
}
function wireFeed(v){
  $$(".opt", v).forEach(function(b){ b.addEventListener("click", function(){ answer(+b.getAttribute("data-o")); }); });
  var inp = $("#feed-inp", v);
  if (inp){
    inp.addEventListener("input", function(){ cur.input = inp.value; });
    inp.addEventListener("keydown", function(e){ if (e.key === "Enter"){ if (!cur.done && inp.value.trim()) answer(inp.value); else if (cur.done) nextQuestion(); } });
  }
  var chk = $('[data-act="check"]', v); if (chk) chk.addEventListener("click", function(){ if (inp && inp.value.trim()) answer(inp.value); });
  var nx = $('[data-act="next"]', v); if (nx) nx.addEventListener("click", nextQuestion);
  var ex = $('[data-act="explain"]', v); if (ex) ex.addEventListener("click", explain);
  if (cur) wireAudio(v, cur.q);
  var card = $("#qcard", v);
  if (card) wireSwipe(card);
  sizeCard();
}
function atEnd(){ var se = scroller(); return se.scrollTop + se.clientHeight >= se.scrollHeight - 4; }
function rubber(x, dim){ var c = 0.55; return (x * dim * c) / (dim + c * Math.abs(x)); }
function wireSwipe(card){
  var y0 = null, x0 = 0, live = false, end = false, hist = [];
  card.addEventListener("touchstart", function(e){
    if (!cur || !cur.done || e.touches.length > 1 || e.target.closest("input,textarea")) { y0 = null; return; }
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; live = false; end = atEnd(); hist = [{y:y0, t:performance.now()}];
    card.style.transition = "none";
  }, {passive:true});
  card.addEventListener("touchmove", function(e){
    if (y0 === null) return;
    var y = e.touches[0].clientY, dy = y - y0, dx = e.touches[0].clientX - x0;
    if (!live){
      if (Math.abs(dy) < 10 && Math.abs(dx) < 10) return;
      if (!end || dy > 0 || Math.abs(dx) > Math.abs(dy)){ y0 = null; return; }
      live = true;
    }
    e.preventDefault();
    hist.push({y:y, t:performance.now()}); if (hist.length > 5) hist.shift();
    var off = dy < 0 ? dy : rubber(dy, 300);
    card.style.transform = "translateY(" + off + "px)";
    card.style.opacity = String(Math.max(0.35, 1 + off / 700));
  }, {passive:false});
  function release(){
    if (y0 === null) return;
    var was = live; y0 = null; live = false;
    if (!was) return;
    var a = hist[0], b = hist[hist.length - 1], v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) * 1000 : 0;
    var m = /translateY\((-?[\d.]+)px\)/.exec(card.style.transform), now = m ? +m[1] : 0;
    var projected = now + (v / 1000) * 0.998 / (1 - 0.998) * 0.25;
    if (projected < -120 || now < -160){
      var ms = Math.max(140, Math.min(260, 260 - Math.abs(v) / 12));
      card.style.transition = "transform " + ms + "ms cubic-bezier(.3,.7,.4,1), opacity " + ms + "ms";
      card.style.transform = "translateY(-" + (window.innerHeight * 0.9) + "px)"; card.style.opacity = "0";
      setTimeout(nextQuestion, ms - 20);
    } else {
      card.style.transition = "transform .42s cubic-bezier(.2,.9,.25,1), opacity .3s";
      card.style.transform = ""; card.style.opacity = "";
    }
  }
  card.addEventListener("touchend", release, {passive:true});
  card.addEventListener("touchcancel", release, {passive:true});
}
function sizeCard(){
  var c = $("#v-feed #qcard"), tb = $(".tabbar");
  if (!c || !tb || view !== "feed") return;
  c.style.minHeight = "";
  if (scroller().scrollTop > 2) return;

}
window.addEventListener("resize", function(){ sizeCard(); });
function explain(){
  if (!aiAvailable() || !cur || cur.explaining) return;
  var q = cur.q, mine = q.o ? (cur.sel != null ? q.o[cur.sel] : "") : cur.sel;
  cur.explaining = true; cur.explain = "Thinking…"; renderFeed();
  var prompt = [
    "A learner is practising for the " + (q.track === "drive" ? "Dutch CBR car theory exam" : "Dutch civic integration exam (A2) and Dutch language") + ".",
    "Explain this question simply in plain English, in at most 110 words. Define any Dutch or technical term. If they got it wrong, say exactly why their choice is wrong. End with one memory trick.",
    q.p ? "Text: " + q.p : "", q.audio ? "Audio: " + q.audio : "",
    "Question: " + q.q,
    q.o ? "Options: " + q.o.join(" | ") : "",
    "Correct answer: " + correctText(q),
    "Learner answered: " + mine + (cur.ok ? " (correct)" : " (wrong)"),
    "Reference explanation: " + q.e,
    "Reply with plain text only, no markdown."
  ].filter(Boolean).join("\n");
  var forQ = q.id;
  SAMPLE(prompt, {onText:function(u){ if (cur && cur.q.id === forQ){ cur.explain = u.text; var el = $("#ai-out"); if (el) el.textContent = u.text; } }}).then(function(r){
    if (cur && cur.q.id === forQ){ cur.explain = r.text; cur.explaining = false; renderFeed(); }
  }, function(e){
    if (e && ["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].indexOf(e.code) >= 0) aiOff = true;
    if (cur && cur.q.id === forQ){ cur.explain = e && e.text ? e.text : null; cur.explaining = false; renderFeed(); if (!e || e.code !== "cancelled") toast("Couldn't get an explanation right now."); }
  });
}

/* ---------------- EXAMS ---------------- */
var DRIVE_MODES = [
  {id:"full", badge:"50", title:"Full mock exam", sub:"50 questions · 30 min · pass with 44 (max 6 wrong)", n:50, mins:30, pass:44},
  {id:"quick", badge:"20", title:"Quick mock", sub:"20 questions · 12 min · pass with 18", n:20, mins:12, pass:18},
  {id:"hazard", badge:"!", title:"Hazard drill", sub:"Brake, release or nothing · 6 min", n:20, mins:6, filter:function(q){ return q.kind === "hazard"; }}
];
var CIVIC_MODES = [
  {id:"knm", badge:"KNM", title:"KNM", sub:"Kennis van de Nederlandse Maatschappij · real exam part", sec:"knm", n:25, mins:0, exam:true},
  {id:"a2-lezen", badge:"A2", title:"A2 Lezen", sub:"Reading · real exam part", sec:"a2-lezen", n:15, exam:true},
  {id:"a2-luisteren", badge:"A2", title:"A2 Luisteren", sub:"Listening · real exam part", sec:"a2-luisteren", n:12, exam:true},
  {id:"a2-schrijven", badge:"A2", title:"A2 Schrijven", sub:"Writing & grammar · real exam part", sec:"a2-schrijven", n:15, exam:true},
  {id:"b1", badge:"B1", title:"B1 Lezen", sub:"News, letters, work", sec:"b1", n:12},
  {id:"b2", badge:"B2", title:"B2 Lezen", sub:"Opinions, arguments, nuance", sec:"b2", n:10},
  {id:"c1", badge:"C1", title:"C1 Lezen", sub:"Working proficiency: reports, HR, formal writing", sec:"c1", n:10}
];
function modes(t){ return t === "drive" ? DRIVE_MODES : CIVIC_MODES; }
function passMark(m, n){ return m.pass && n === m.n ? m.pass : Math.ceil(n * (S.track === "drive" ? 0.88 : 0.75)); }
function mockPassed(t, id){ return (S.t[t].mocks[id] || []).some(function(x){ return x.p; }); }
function civicUnlocked(i){
  var m = CIVIC_MODES[i]; if (m.exam) return true;
  for (var j = 0; j < i; j++) if (!mockPassed("civic", CIVIC_MODES[j].id)) return false;
  return true;
}
var run = null, tick = null;
function stopTimer(){ if (tick){ clearInterval(tick); tick = null; } }
function renderExams(){
  stopTimer(); run = null;
  var t = S.track, v = $("#v-exams"), html;
  if (t === "drive"){
    html = '<h2 class="h2">CBR mock exams</h2><p class="lead">Same rules as the real theory exam since April 2025: one mixed test, timed, no feedback until you hand in. You need <b>44 of 50</b>. Only about 4 in 10 people pass first time.</p>';
  } else {
    html = '<h2 class="h2">Integration exams</h2><p class="lead">In Dutch, scored at the end like the real exam. 85%+ on an exam part = ready to book it. B1 to C1 unlock once all four exam parts are passed.</p>';
  }
  html += '<div class="label">' + (t === "drive" ? "Choose a test" : "Step 1 · Your exam (A2 + KNM)") + '</div>';
  modes(t).forEach(function(m, i){
    if (t === "civic" && i === 4) html += '<p class="note">Spreken (speaking) can\'t be graded here. Practise it out loud with your teacher.</p><div class="label">Step 2 · Beyond the exam</div>';
    var h = S.t[t].mocks[m.id] || [];
    var open = t === "drive" || civicUnlocked(i);
    var best = h.length ? Math.max.apply(null, h.map(function(x){ return x.s / x.n; })) : null;
    var avail = examPool(t, m).length;
    var sub = open ? m.sub : "Locked · pass all four exam parts first";
    html += '<button class="row' + (mockPassed(t, m.id) ? " done" : "") + '" data-m="' + m.id + '"' + (open && avail ? "" : " disabled") + '><span class="badge">' + esc(m.badge) + '</span><span class="row-main"><span class="row-title">' + esc(m.title) + '</span><span class="row-sub">' + esc(sub) + ' · ' + avail + ' in bank</span>' +
      (h.length ? '<span class="hist">' + h.slice(-6).map(function(x){ return '<span class="' + (x.p ? "ok" : "") + '">' + x.s + '/' + x.n + '</span>'; }).join("") + '</span>' : "") +
      '</span><span class="row-score">' + (best != null ? Math.round(best * 100) + "%" : "") + '</span></button>';
  });
  html += '<p class="note">' + (t === "drive" ? "Book the real exam when you pass the full mock 3 times in a row. The real exam shows short animations for hazards; here they're written scenes." : "Original questions in the style of the real exam, not official DUO material. Also do the free practice exams on inburgeren.nl.") + ' New questions arrive with app updates.</p>';
  v.innerHTML = html;
  $$(".row", v).forEach(function(b){ b.addEventListener("click", function(){ startExam(b.getAttribute("data-m")); }); });
}
function examPool(t, m){
  return pool(t).filter(function(q){ return m.filter ? m.filter(q) : (m.sec ? q.sec === m.sec : true); });
}
function startExam(id){
  var t = S.track, m = modes(t).filter(function(x){ return x.id === id; })[0];
  var qs = shuffle(examPool(t, m)).slice(0, m.n);
  if (m.sec && m.sec !== "knm") qs.sort(function(a, b){ return (a.p || a.audio || "").localeCompare(b.p || b.audio || ""); });
  run = {t:t, m:m, qs:qs, i:0, ans:qs.map(function(){ return null; }),
    order:qs.map(function(q){ return q.kind === "mc" ? shuffle(q.o.map(function(_, k){ return k; })) : (q.o ? q.o.map(function(_, k){ return k; }) : null); }),
    end:m.mins ? Date.now() + m.mins * 60000 : 0};
  stopTimer();
  if (run.end) tick = setInterval(updTimer, 1000);
  renderRun();
}
function fmt(ms){ var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ":" + pad(s % 60); }
function updTimer(){
  if (!run || !run.end) return stopTimer();
  var left = run.end - Date.now(), el = $("#x-timer");
  if (el){ el.textContent = fmt(left); el.classList.toggle("low", left < 60000); }
  if (left <= 0) finishExam(true);
}
function answered(k){ var a = run.ans[k]; return a !== null && a !== ""; }
function renderRun(){
  var q = run.qs[run.i], n = run.qs.length, last = run.i === n - 1, v = $("#v-exams");
  var html = '<div class="run-top"><button class="link" data-act="quit">&larr; Stop</button>' + (run.end ? '<span class="timer" id="x-timer">' + fmt(run.end - Date.now()) + '</span>' : '<b>' + esc(run.m.title) + '</b>') + '<span class="count">' + (run.i + 1) + ' / ' + n + '</span></div>';
  html += '<div class="prog"><i style="width:' + Math.round((run.i + 1) / n * 100) + '%"></i></div>';
  html += '<article class="qcard' + (q.kind === "hazard" ? " hz" : "") + '">' + bodyHtml(q);
  if (q.kind === "num" || q.kind === "type"){
    html += '<input class="inp" id="x-inp" style="width:100%" ' + (q.kind === "num" ? 'inputmode="decimal" placeholder="Type a number"' : 'autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Type je antwoord"') + ' aria-label="Your answer" value="' + esc(run.ans[run.i] || "") + '">';
  } else {
    html += '<div class="opts">';
    run.order[run.i].forEach(function(orig, k){
      html += '<button class="opt' + (run.ans[run.i] === orig ? " sel" : "") + '" data-o="' + orig + '"><span class="k">' + String.fromCharCode(65 + k) + '</span><span>' + mark(q.track, q.o[orig]) + '</span></button>';
    });
    html += '</div>';
  }
  html += '<div class="nav"><button class="btn ghost" data-act="prev"' + (run.i === 0 ? " disabled" : "") + '>Back</button><button class="btn" data-act="fwd">' + (last ? "Hand in" : "Next") + '</button></div>';
  if (last){ var open = run.ans.filter(function(_, k){ return !answered(k); }).length; if (open) html += '<p class="hint">' + open + ' unanswered. They count as wrong.</p>'; }
  html += '</article>';
  v.innerHTML = html;
  $('[data-act="quit"]', v).addEventListener("click", renderExams);
  $('[data-act="prev"]', v).addEventListener("click", function(){ if (run.i > 0){ run.i--; renderRun(); } });
  $('[data-act="fwd"]', v).addEventListener("click", function(){ if (run.i < n - 1){ run.i++; renderRun(); scrollTop0(); } else finishExam(false); });
  $$(".opt", v).forEach(function(b){ b.addEventListener("click", function(){ run.ans[run.i] = +b.getAttribute("data-o"); renderRun(); }); });
  var inp = $("#x-inp", v);
  if (inp){ inp.addEventListener("input", function(){ run.ans[run.i] = inp.value; }); inp.addEventListener("keydown", function(e){ if (e.key === "Enter") $('[data-act="fwd"]', v).click(); }); }
  wireAudio(v, q);
}
function finishExam(timedOut){
  stopTimer();
  var r = run, t = r.t, n = r.qs.length, s = 0, wrongBy = {};
  r.qs.forEach(function(q, k){ var ok = isRight(q, r.ans[k]); if (ok) s++; else wrongBy[q.topic] = (wrongBy[q.topic] || 0) + 1; record(q, ok, true); });
  var need = passMark(r.m, n), ok = s >= need;
  var list = S.t[t].mocks[r.m.id] || (S.t[t].mocks[r.m.id] = []);
  list.push({s:s, n:n, p:ok, at:Date.now()}); if (list.length > 20) S.t[t].mocks[r.m.id] = list.slice(-20);
  if (t === "drive" && r.m.id === "full"){ var l3 = S.t.drive.mocks.full.slice(-3); if (l3.length === 3 && l3.every(function(x){ return x.p; })) S.plan["d-mock3"] = true; }
  if (t === "civic" && ok && ["knm", "a2-lezen", "a2-luisteren", "a2-schrijven"].indexOf(r.m.id) >= 0 && s / n >= 0.85 && S.t.civic.level < 2 &&
      ["knm", "a2-lezen", "a2-luisteren", "a2-schrijven"].every(function(id){ return mockPassed("civic", id); })) { S.t.civic.level = 2; toast("All four exam parts cleared. B1 questions now join your feed."); }
  save();
  var verdict;
  if (t === "drive") verdict = (timedOut ? "Time's up. " : "") + (ok ? "Passed. Keep going until you pass the full mock 3 times in a row." : "On the real exam this is a fail: " + (n - s) + " wrong, max " + (n - need) + ".");
  else if (r.m.exam) verdict = s / n >= 0.85 ? "Ready. You can book this part of the real exam." : (ok ? "Passed, but close. Do it once more before booking." : "Not yet. Review below, drill in the feed, try again.");
  else verdict = ok ? "Passed. Next level unlocked." : "Not yet. Review below and try again.";
  var topics = Object.keys(wrongBy).sort(function(a, b){ return wrongBy[b] - wrongBy[a]; });
  var v = $("#v-exams");
  var html = '<div class="run-top"><button class="link" data-act="back">&larr; All tests</button><b>' + esc(r.m.title) + '</b><span></span></div>';
  html += '<article class="qcard"><div class="score"><b class="' + (ok ? "ok" : "no") + '">' + s + '/' + n + '</b><span>pass mark ' + need + '/' + n + '</span></div>' +
    '<p style="font-weight:700;text-align:center;margin:14px 0 6px">' + esc(verdict) + '</p>' +
    (topics.length ? '<p class="note" style="text-align:center">Weakest: ' + topics.slice(0, 3).map(function(x){ return esc(x) + " (" + wrongBy[x] + ")"; }).join(", ") + '. These now show up more in your feed.</p>' : "") +
    '<div class="nav"><button class="btn ghost" data-act="again">New attempt</button><button class="btn" data-act="back2">All tests</button></div></article>';
  html += '<div class="label">Mistakes first</div>';
  r.qs.map(function(q, k){ return k; }).sort(function(a, b){ return (isRight(r.qs[a], r.ans[a]) ? 1 : 0) - (isRight(r.qs[b], r.ans[b]) ? 1 : 0); }).forEach(function(k){
    var q = r.qs[k], a = r.ans[k], good = isRight(q, a);
    var yours = q.o ? (a === null ? "(no answer)" : q.o[a]) : (a ? a : "(empty)");
    html += '<div class="rv' + (good ? "" : " bad") + '"><div class="rq">' + esc(q.q) + '</div>' + (q.en ? '<div class="mut">' + esc(q.en) + '</div>' : "") +
      '<div>' + (good ? '<b>&#10003; ' + esc(yours) + '</b>' : 'Yours: ' + esc(yours) + '<br><b>Correct: ' + esc(correctText(q)) + '</b>') + '</div><div class="mut">' + esc(q.e) + '</div></div>';
  });
  v.innerHTML = html;
  var id = r.m.id; run = null;
  $('[data-act="back"]', v).addEventListener("click", renderExams);
  $('[data-act="back2"]', v).addEventListener("click", renderExams);
  $('[data-act="again"]', v).addEventListener("click", function(){ startExam(id); });
  scrollTop0();
}

/* ---------------- PROGRESS ---------------- */
var PLAN = {
  drive: [["d-mock3", "Pass the full mock 3 times in a row"], ["d-course", "Do an English CBR theory course"], ["d-book", "Book the CBR theory exam (in English)"], ["d-theory", "Pass the theory exam"], ["d-lessons", "Start driving lessons"], ["d-practical", "Pass the practical exam"]],
  civic: [["c-oefen", "Do the free practice exams on inburgeren.nl"], ["c-tma", "Ask your employer or gemeente about Dutch classes"], ["c-knm", "Pass KNM"], ["c-lezen", "Pass A2 Lezen"], ["c-luisteren", "Pass A2 Luisteren"], ["c-schrijven", "Pass A2 Schrijven"], ["c-spreken", "Pass A2 Spreken"], ["c-jordan", "Ask your embassy how giving up your nationality works"], ["c-docs", "Get your birth certificate legalised or apostilled"], ["c-apply", "Apply for citizenship at your gemeente"]]
};
function renderProgress(pre){
  var t = S.track, tr = S.t[t], v = $("#v-home"), html = "";
  if (t === "civic"){
    var cd = citizenDates();
    if (cd){
      var now = new Date(), days = Math.max(0, Math.ceil((cd.at - now) / 86400000));
      var pct = Math.min(100, Math.max(0, (now - cd.from) / (cd.at - cd.from) * 100));
      html += '<div class="hero"><div class="cap">' + (days ? "Days until you can apply for citizenship" : "You can apply for citizenship") + '</div><div class="big tabular">' + days + '</div><div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div><div class="meta"><span>' + fmtDate(cd.from) + '</span><span>' + Math.round(pct) + '% of 5 years</span><span>' + fmtDate(cd.at) + '</span></div><button class="link hero-edit" data-act="arr-edit">Change date</button></div>';
    } else {
      html += '<div class="hero"><div class="cap">Citizenship countdown</div><p class="hero-q">When did you start living in the Netherlands legally?</p><div class="hero-row"><input type="date" class="inp" id="arr-in" aria-label="Date you started living in the Netherlands"><button class="btn pop" data-act="arr-set">Start</button></div><p class="hero-note">Most people can apply after 5 years of legal residence. Some can apply sooner. Check ind.nl for your situation.</p></div>';
    }
  } else {
    var full = tr.mocks.full || [], last3 = full.slice(-3), inRow = 0;
    for (var i = full.length - 1; i >= 0 && full[i].p; i--) inRow++;
    html += '<div class="hero"><div class="cap">Full mocks passed in a row</div><div class="big tabular">' + Math.min(inRow, 3) + '<span style="font-size:24px;opacity:.7">/3</span></div><div class="bar"><i style="width:' + (Math.min(inRow, 3) / 3 * 100) + '%"></i></div><div class="meta"><span>' + full.length + ' full mocks taken</span><span>' + (inRow >= 3 ? "Ready to book" : "3 in a row = book it") + '</span></div></div>';
  }
  var ex = ((prof().exam || {})[t]) || null;
  if (ex && ex.date){ var dp = ex.date.split("-"), dl = Math.ceil((new Date(+dp[0], +dp[1] - 1, +dp[2]) - new Date()) / 86400000); if (dl >= 0) html += '<p class="exam-date">' + (dl === 0 ? "Your exam is today. Good luck!" : "Your exam: in " + dl + " days") + '</p>'; }
  var acc = tr.ans ? Math.round(tr.ok / tr.ans * 100) + "%" : "–";
  html = (pre || "") + html;
  html += '<div class="stats"><div class="stat"><b class="tabular">' + tr.ans + '</b><span>Answered</span></div><div class="stat"><b class="tabular">' + acc + '</b><span>Accuracy</span></div><div class="stat"><b class="tabular">' + streak() + '</b><span>Day streak</span></div></div>';

  var tp = tr.topics, keys = Object.keys(tp).filter(function(k){ return tp[k].a >= 2; }).sort(function(a, b){ return tp[a].ok / tp[a].a - tp[b].ok / tp[b].a; }).slice(0, 5);
  html += '<div class="label">Weakest topics</div>';
  if (keys.length){
    html += '<div class="weak">' + keys.map(function(k){ var p = Math.round(tp[k].ok / tp[k].a * 100); return '<div><span style="width:140px;flex:none">' + esc(k) + '</span><span class="meter"><i style="width:' + (100 - p) + '%"></i></span><span class="pct">' + p + '%</span></div>'; }).join("") + '</div><p class="note">Bar = how often you miss it. These topics come up more in your feed and in new questions.</p>';
  } else html += '<p class="note">Answer a few more questions and your weak spots show up here.</p>';

  if (!aiOff && SAMPLE){
    html += '<div class="label">Fresh questions</div><div class="ai-box">';
    html += '<p>' + GEN[t].length + ' questions written for you so far. When you run low, new batches arrive automatically while you scroll, tuned to your level and weak topics.</p>';
    html += '<button class="btn pop" data-act="gen"' + (ai[t] === "busy" ? " disabled" : "") + '>' + (ai[t] === "busy" ? "Writing questions…" : "Write 8 new questions now") + '</button></div>';
  }

  html += '<div class="label">Your ' + (t === "drive" ? "licence" : "citizenship") + ' checklist</div>';
  PLAN[t].forEach(function(p){
    var done = !!S.plan[p[0]];
    html += '<label class="check' + (done ? " done" : "") + '"><input type="checkbox" id="pl-' + p[0] + '" data-plan="' + p[0] + '"' + (done ? " checked" : "") + '><span>' + esc(p[1]) + '</span></label>';
  });
  v.innerHTML = html;
  var g = $('[data-act="gen"]', v); if (g) g.addEventListener("click", function(){ generate(t, 8); renderHome(); });
  var as = $('[data-act="arr-set"]', v); if (as) as.addEventListener("click", function(){ var val = $("#arr-in", v).value; if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return toast("Pick a date first."); S.arrived = val; save(); renderHome(); });
  var ae = $('[data-act="arr-edit"]', v); if (ae) ae.addEventListener("click", function(){ S.arrived = null; save(); renderHome(); });
  var jg = $('[data-act="j-go"]', v); if (jg) jg.addEventListener("click", function(){ setView("exams"); });
  $$("[data-plan]", v).forEach(function(c){ c.addEventListener("change", function(){ S.plan[c.getAttribute("data-plan")] = c.checked; save(); renderHome(); }); });
}

/* ---------------- PROFILE: your details and every setting in one place ---------------- */
var PERSON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function initials(){ var n = String(prof().name || "").trim(); if (!n) return ""; var w = n.split(/\s+/); return ((w[0][0] || "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
function avatarInner(){ var i = initials(); return i ? '<b translate="no">' + esc(i) + '</b>' : PERSON; }
function renderAvatar(){ var b = $("#prof-btn"); if (b) b.innerHTML = avatarInner(); }
var backTo = "home";
function renderProfile(){
  var v = $("#v-profile"), html = '';
  html += '<div class="run-top"><button class="link" data-act="prof-back">&larr; Back</button><b>Profile</b><span></span></div>';
  html += '<div class="prof-card"><span class="avatar big" aria-hidden="true">' + avatarInner() + '</span>' +
    '<div class="prof-id"><input class="inp" id="prof-name" maxlength="30" autocomplete="given-name" placeholder="Your name" aria-label="Your name" value="' + esc(prof().name || "") + '"><span class="prof-line">' + esc(profileLine()) + '</span></div></div>';
  if (window.I18N){
    html += '<div class="label">Language</div><div class="stats" role="group" aria-label="Language">' + Object.keys(I18N.langs).map(function(l){ return '<button class="btn ' + (I18N.get() === l ? "" : "ghost") + '" data-lang="' + l + '" lang="' + l + '" translate="no">' + I18N.langs[l].label + '</button>'; }).join("") + '</div>' +
      '<p class="note">Menus and instructions are in your language. Questions are still in English and Dutch.</p>';
  }
  html += '<div class="label">Daily goal</div><div class="stats" role="group" aria-label="Daily goal">' + [15, 30, 50].map(function(g){ return '<button class="btn ' + (S.goal === g ? "" : "ghost") + '" data-goal="' + g + '">' + g + ' a day</button>'; }).join("") + '</div>';

  html += '<div class="label">How you learn</div><div class="pair" role="group" aria-label="How you learn">' + [["learn", "Lessons first"], ["test", "Questions only"]].map(function(s){ return '<button class="btn ' + ((teachFirst() ? "learn" : "test") === s[0] ? "" : "ghost") + '" data-style="' + s[0] + '">' + s[1] + '</button>'; }).join("") + '</div>' +
    '<p class="note">' + (teachFirst() ? "Each new topic starts with a short animated lesson, then questions on it. Mock exams are always the real test." : "You get questions straight away and learn from the answers.") + '</p>';


  html += '<div class="label">Your level and goals</div><div class="ai-box"><p>' + esc(profileLine()) + '</p><button class="btn ghost" data-act="redo-prof" style="width:100%">Change my level and goals</button></div>';
  html += '<div class="label">Share Klaar</div><div class="ai-box"><p>Know someone preparing for these exams? Send them the link. It shows them how to install it.</p><button class="btn ghost" data-act="share-app" style="width:100%">Share the link</button></div>';
  html += '<div class="label">Show Claude your progress</div><div class="ai-box"><p>The app is offline, so nobody can see your progress, including Claude. Tap below, then paste the text into your chat with Claude. Nothing else is sent anywhere.</p><button class="btn" data-act="share-prog" style="width:100%">Copy my progress</button></div>';
  html += '<div class="label">Start again</div><div class="ai-box"><p>Clears your answers, mocks and streak on this phone. Your name, language and goals stay.</p><button class="btn ghost danger" data-act="reset" style="width:100%">Start from scratch</button></div>';
  html += '<div class="label">Backup</div><div class="ai-box"><p>Progress lives on this phone only. Save a backup file now and then, so a new phone or a cleared browser doesn\'t wipe it.</p><div class="pair"><button class="btn ghost" data-act="bk-save">Save backup</button><label class="btn ghost" for="bk-file">Restore<input type="file" id="bk-file" accept="application/json,.json" hidden></label></div></div>';
  html += '<p class="note">Works offline. Practice questions are original and in the style of the real exams, not official CBR or DUO material.</p><p class="note diag" id="diag"></p>';
  v.innerHTML = html;
  $('[data-act="prof-back"]', v).addEventListener("click", function(){ setView(backTo); });
  var nm = $("#prof-name", v), nt = null;
  nm.addEventListener("input", function(){ clearTimeout(nt); nt = setTimeout(function(){ S.prof = S.prof || {}; S.prof.name = nm.value.trim().slice(0, 30); save(); renderAvatar(); var a = $(".prof-card .avatar", v); if (a) a.innerHTML = avatarInner(); }, 300); });
  var rp = $('[data-act="redo-prof"]', v); if (rp) rp.addEventListener("click", function(){ if (window.KLAAR_PROFILE) window.KLAAR_PROFILE(); });
  var sa = $('[data-act="share-app"]', v); if (sa) sa.addEventListener("click", shareApp);
  var sp = $('[data-act="share-prog"]', v); if (sp) sp.addEventListener("click", shareProgress);
  var dg = $("#diag", v); if (dg && window.KLAAR_DIAG) dg.textContent = window.KLAAR_DIAG();
  var bx = $('[data-act="bk-save"]', v); if (bx) bx.addEventListener("click", backupSave);
  var rs = $('[data-act="reset"]', v); if (rs) rs.addEventListener("click", function(){ if (rs.getAttribute("data-sure")){ resetProgress(); toast("Fresh start. Your progress is back to zero."); return; } rs.setAttribute("data-sure", "1"); rs.textContent = "Tap again to clear everything"; });
  var bi = $("#bk-file", v); if (bi) bi.addEventListener("change", function(){ if (bi.files && bi.files[0]) backupLoad(bi.files[0]); });
  $$("[data-goal]", v).forEach(function(b){ b.addEventListener("click", function(){ S.goal = +b.getAttribute("data-goal"); save(); renderProfile(); }); });
  $$("[data-lang]", v).forEach(function(b){ b.addEventListener("click", function(){ I18N.set(b.getAttribute("data-lang")); }); });
  $$("[data-style]", v).forEach(function(b){ b.addEventListener("click", function(){ S.prof = S.prof || {}; S.prof.style = b.getAttribute("data-style"); lesson = null; save(); renderProfile(); }); });
}

function progressSummary(){
  var L = ["Klaar progress, " + dayKey()];
  ["drive", "civic"].forEach(function(t){
    var tr = S.t[t], acc = tr.ans ? Math.round(tr.ok / tr.ans * 100) + "%" : "n/a";
    L.push(""); L.push(NAMES[t] + ": " + tr.ans + " answered, " + acc + " right, " + levelName(t) + ", " + tr.xp + " XP");
    var tp = tr.topics, ks = Object.keys(tp).filter(function(k){ return tp[k].a >= 3; }).sort(function(x, y){ return tp[x].ok / tp[x].a - tp[y].ok / tp[y].a; }).slice(0, 4);
    if (ks.length) L.push("Weakest: " + ks.map(function(k){ return k + " " + Math.round(tp[k].ok / tp[k].a * 100) + "% (" + tp[k].a + ")"; }).join(", "));
    var ms = [];
    Object.keys(tr.mocks).forEach(function(id){
      var h = tr.mocks[id]; if (!h || !h.length) return;
      var m = modes(t).filter(function(x){ return x.id === id; })[0], last = h[h.length - 1];
      ms.push((m ? m.title : id) + ": last " + last.s + "/" + last.n + (last.p ? " pass" : " fail") + ", " + h.filter(function(x){ return x.p; }).length + "/" + h.length + " passed");
    });
    L.push(ms.length ? "Mock exams: " + ms.join("; ") : "Mock exams: none yet");
    var done = PLAN[t].filter(function(p){ return S.plan[p[0]]; }).map(function(p){ return p[1]; });
    if (done.length) L.push("Checklist done: " + done.join("; "));
  });
  L.push(""); L.push("Streak " + streak() + " days. Goal " + S.goal + "/day. Days practised: " + Object.keys(S.days).length + (S.arrived ? ". Arrived " + S.arrived : "") + ".");
  return L.join("\n");
}
function shareProgress(){
  var text = progressSummary();
  function copied(){ toast("Copied. Paste it in your chat with Claude."); }
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(copied, function(){ if (navigator.share) navigator.share({text:text}).catch(function(){}); });
  } else if (navigator.share){ navigator.share({text:text}).catch(function(){}); }
  else { openSheet('<h2>Your progress</h2><p style="white-space:pre-wrap;user-select:all">' + esc(text) + '</p>'); }
}
function srcName(u){ var m = /^https?:\/\/(?:www\.)?([^\/]+)/.exec(String(u)); return m ? m[1] : String(u); }
function backupSave(){
  var data = JSON.stringify({app:"klaar", v:1, at:Date.now(), state:S}, null, 0);
  var name = "klaar-backup-" + dayKey() + ".json";
  try{
    var file = new File([data], name, {type:"application/json"});
    if (navigator.canShare && navigator.canShare({files:[file]})){ navigator.share({files:[file], title:"Klaar backup"}).catch(function(){}); return; }
  }catch(e){}
  var url = URL.createObjectURL(new Blob([data], {type:"application/json"}));
  var link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click();
  setTimeout(function(){ URL.revokeObjectURL(url); link.remove(); }, 1500);
}
function backupLoad(f){
  var r = new FileReader();
  r.onload = function(){
    try{
      var d = JSON.parse(r.result);
      if (!d || d.app !== "klaar" || !d.state) throw 0;
      S = mergeState(d.state); S.updated = Date.now(); lsSet(LS, S); applyTrack(); renderAll(); toast("Backup restored.");
    }catch(e){ toast("That file isn't a Klaar backup."); }
  };
  r.readAsText(f);
}

/* ---------------- where you are (journey), milestone cards, share ---------------- */
function journey(t){
  var tr = S.t[t], rec = tr.recent || [], recAcc = rec.length ? rec.reduce(function(a, b){ return a + b; }, 0) / rec.length : 0;
  var full = tr.mocks.full || [], inRow = 0; for (var i = full.length - 1; i >= 0 && full[i].p; i--) inRow++;
  var steps;
  if (t === "drive") steps = [
    {name:"Learn the rules", done:tr.ans >= 100, p:Math.min(1, tr.ans / 100), msg:tr.ans + " of 100 questions answered. " + Math.max(0, 100 - tr.ans) + " more and you know the basics."},
    {name:"Score 85% in practice", done:tr.level >= 2 || (rec.length >= 20 && recAcc >= 0.85), p:Math.min(1, recAcc / 0.85), msg:rec.length < 10 ? "Answer " + (10 - rec.length) + " more to see your score." : "Your last " + rec.length + " answers: " + Math.round(recAcc * 100) + "% right. Aim for 85%."},
    {name:"Pass the quick mock", done:mockPassed(t, "quick"), p:0, msg:"20 questions in 12 minutes. You need 18 right.", go:true},
    {name:"Pass the full mock 3 in a row", done:inRow >= 3 || !!S.plan["d-mock3"], p:inRow / 3, msg:"Full mocks passed in a row: " + Math.min(inRow, 3) + " of 3. Three in a row means you're ready.", go:true},
    {name:"Book the real exam", done:!!S.plan["d-book"], p:0, msg:"You're ready. Book the CBR theory exam in English, then tick it off in your checklist below."}
  ];
  else steps = [
    {name:"Learn the basics", done:tr.ans >= 60, p:Math.min(1, tr.ans / 60), msg:tr.ans + " of 60 questions answered. " + Math.max(0, 60 - tr.ans) + " more and you know the basics."},
    {name:"Pass the KNM mock", done:mockPassed(t, "knm"), p:0, msg:"Dutch society, scored like the real KNM exam.", go:true},
    {name:"Pass the reading mock", done:mockPassed(t, "a2-lezen"), p:0, msg:"Short Dutch texts at A2, like the real reading exam.", go:true},
    {name:"Pass listening and writing", done:mockPassed(t, "a2-luisteren") && mockPassed(t, "a2-schrijven"), p:(mockPassed(t, "a2-luisteren") ? 0.5 : 0) + (mockPassed(t, "a2-schrijven") ? 0.5 : 0), msg:"Two more practice exams and the A2 part is covered.", go:true},
    {name:"Book your real exams", done:!!S.plan["c-knm"], p:0, msg:"You're ready. Book KNM and A2 in Mijn Inburgering, then tick them off below."}
  ];
  var at = 0; while (at < steps.length && steps[at].done) at++;
  return {steps:steps, at:at};
}
var CHEERS = ["Nice work.", "Keep it up.", "That's real progress.", "You're getting there.", "Solid session."];
function journeyHtml(t, compact){
  var j = journey(t), n = j.steps.length, all = j.at >= n, cur = all ? null : j.steps[j.at];
  var html = '<div class="journey' + (compact ? " compact" : "") + '"><div class="j-cap">Where you are</div><div class="j-track" aria-hidden="true">';
  j.steps.forEach(function(s, i){
    html += '<span class="j-dot' + (s.done ? " done" : (i === j.at ? " now" : "")) + '">' + (s.done ? "✓" : (i + 1)) + '</span>' + (i < n - 1 ? '<span class="j-line' + (s.done ? " done" : "") + '"></span>' : "");
  });
  html += '</div>';
  if (all) html += '<div class="j-now">All ' + n + ' steps done</div><p class="j-msg">You did the work. Keep a short streak going until exam day.</p>';
  else {
    html += '<div class="j-step">Step ' + (j.at + 1) + ' of ' + n + '</div><div class="j-now">' + esc(cur.name) + '</div>';
    if (cur.p > 0) html += '<div class="j-bar"><i style="width:' + Math.round(cur.p * 100) + '%"></i></div>';
    html += '<p class="j-msg">' + esc(cur.msg) + '</p>';
  }
  return html + '</div>';
}
var milestoneDue = false;
function renderMilestone(){
  var t = S.track, today = S.days[dayKey()] || 0, j = journey(t), cur = j.steps[j.at];
  var v = $("#v-feed");
  var html = feedHead() + '<article class="qcard enter milestone"><div class="m-big tabular">' + today + '</div><div class="m-cap">questions today</div><p class="m-cheer">' +
    esc(CHEERS[Math.floor(today / 10) % CHEERS.length]) + (today >= S.goal ? " Daily goal done." : " " + (S.goal - today) + " to go for your daily goal.") + '</p>' + journeyHtml(t, true) +
    '<div class="fb-actions">' + (cur && cur.go ? '<button class="btn ghost" data-act="m-exam">Try the mock</button>' : "") + '<button class="btn" data-act="m-next">Keep going</button></div></article>';
  v.innerHTML = html;
  $('[data-act="m-next"]', v).addEventListener("click", nextQuestion);
  var me = $('[data-act="m-exam"]', v); if (me) me.addEventListener("click", function(){ setView("exams"); });
  scrollTop0();
}
function shareApp(){
  var url = location.origin + location.pathname.replace(/index\.html$/, "");
  var text = "Klaar: free practice for the Dutch driving theory exam and the inburgering exam. Works offline.";
  if (navigator.share) navigator.share({title:"Klaar", text:text, url:url}).catch(function(){});
  else if (navigator.clipboard) navigator.clipboard.writeText(text + " " + url).then(function(){ toast("Link copied."); });
}

function scroller(){ return document.documentElement.classList.contains("shell") ? document.getElementById("main") : (document.scrollingElement || document.documentElement); }
function scrollTop0(){ scroller().scrollTop = 0; }
/* ---------------- HOME: both tracks at a glance ---------------- */
var TRACK_ICON = {
  drive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(45 12 12)"/><rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" fill="currentColor"/></svg>',
  civic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="10" r="3.2"/><path d="M8.5 16.5h7"/></svg>'
};
var HOME_SUB = {drive: "Driving theory (CBR)", civic: "KNM and Dutch A2"};
function trackFrac(t){ var j = journey(t), n = j.steps.length; if (j.at >= n) return 1; return (j.at + (j.steps[j.at].p || 0)) / n; }
function renderHome(){
  var v = $("#v-home"), today = S.days[dayKey()] || 0, st = streak(), hr = new Date().getHours();
  var hi = hr < 12 ? "Good morning" : (hr < 18 ? "Good afternoon" : "Good evening");
  var line = today === 0 ? "Nothing yet today. Five minutes keeps your streak alive." : (today < S.goal ? today + " done today, " + (S.goal - today) + " to go." : "Daily goal done. Anything now is bonus.");
  var html = '<div class="home-hi"><h2 class="h2">' + hi + '</h2><p class="lead">' + esc(line) + '</p></div>';

  /* today: ring + streak + last 7 days */
  var week = "", d = new Date(), names = [0, 1, 2, 3, 4, 5, 6].map(function(i){ return new Date(2023, 0, 1 + i).toLocaleDateString(loc(), {weekday:"narrow"}); });
  for (var i = 6; i >= 0; i--){
    var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i), n = S.days[dayKey(day)] || 0;
    week += '<span class="wk' + (n ? " on" : "") + (i === 0 ? " now" : "") + '"><i style="height:' + Math.max(4, Math.min(100, n / S.goal * 100)) + '%"></i><b>' + names[day.getDay()] + '</b></span>';
  }
  html += '<div class="today"><div class="ring big">' + ringSvg(today, S.goal) + '<b class="tabular">' + today + '<small>/' + S.goal + '</small></b></div>' +
    '<div class="today-mid"><div class="today-streak">' + FLAME + ' ' + st + '-day streak</div><div class="week" aria-label="Last 7 days">' + week + '</div></div></div>';

  /* where you are on this goal, with one button to the next thing to do */
  var t = S.track, jy = journey(t), nx = jy.steps[jy.at];
  html += journeyHtml(t, false);
  if (nx) html += '<button class="btn pop home-go" data-go-t="' + t + '" data-go-v="' + (nx.go ? "exams" : "feed") + '">' + (nx.go ? "Go to exams" : (t === "drive" ? "Practise driving" : "Practise inburgering")) + '</button>';

  /* lessons and words for this goal */
  var L = window.LESSONS && LESSONS[t], ks = L ? Object.keys(L) : [], done = S.t[t].primers || {};
  if (ks.length) html += '<div class="label">Lessons</div><div class="les-list">' + ks.map(function(k){ return '<button class="les-chip' + (done[k] > 0 ? " done" : "") + '" data-les-t="' + t + '" data-les="' + esc(k) + '">' + (done[k] > 0 ? '<i aria-hidden="true">&#10003;</i>' : '<i aria-hidden="true">&#9654;</i>') + '<span>' + esc(k) + '</span></button>'; }).join("") + '</div>';
  if (window.KLAAR_GLOSSARY) html += '<button class="row gl-open" data-act="glossary"><span class="badge">Aa</span><span class="row-main"><span class="row-title">Words to know</span><span class="row-sub">' + KLAAR_GLOSSARY.count(t) + ' terms, with the logic behind them</span></span><span class="nu-go">›</span></button>';
  html += '<div class="label">Your progress</div>';
  renderProgress(html);
  var gl = $('[data-act="glossary"]', v); if (gl) gl.addEventListener("click", function(){ setView("glossary"); });
  $$("[data-les]", v).forEach(function(b){ b.addEventListener("click", function(){ var t = b.getAttribute("data-les-t"), k = b.getAttribute("data-les"); if (t !== S.track) setTrack(t); lesson = {track:t, topic:k, primer:{steps:LESSONS[t][k], i:0}}; cur = null; setView("feed"); }); });
  $$("[data-go-t]", v).forEach(function(b){ b.addEventListener("click", function(){ var t = b.getAttribute("data-go-t"), to = b.getAttribute("data-go-v"); if (t !== S.track) setTrack(t); setView(to); }); });
}

/* ---------------- shell ---------------- */
var view = S.view = "home";
function applyTrack(){
  document.body.setAttribute("data-track", S.track);
  $("#brand-sub").textContent = SUBS[S.track];
  $$(".switch button").forEach(function(b){ b.setAttribute("aria-selected", String(b.getAttribute("data-track") === S.track)); });
  $(".switch").hidden = goals().length < 2;
  renderAvatar();
}
function setTrack(t){
  if (t === S.track) return;
  if (run && !confirmLeave()) return;
  stopSound();
  S.track = t; save(); applyTrack(); cur = null; lesson = null; focus = null; lastId = null; stopTimer(); run = null;
  renderAll(true);
}
function confirmLeave(){ return true; }
function setView(v){
  if (v === "progress") v = "home";
  var ORDER = ["home", "feed", "exams"], changed = v !== view, dir = ORDER.indexOf(v) >= ORDER.indexOf(view) ? 1 : -1;
  if ((v === "profile" || v === "glossary") && view !== v) backTo = view === "profile" || view === "glossary" ? "home" : view;
  view = v; S.view = v; save();
  document.body.setAttribute("data-view", v);
  $("#v-home").hidden = v !== "home"; $("#v-feed").hidden = v !== "feed"; $("#v-exams").hidden = v !== "exams"; $("#v-glossary").hidden = v !== "glossary"; $("#v-profile").hidden = v !== "profile";
  $$(".tab").forEach(function(b){ b.setAttribute("aria-selected", String(b.getAttribute("data-view") === v)); });
  var flip = window.I18N && I18N.rtl() ? -1 : 1, ind = $(".tab-ind"); if (ind){ ind.style.transform = "translateX(" + (flip * Math.max(0, ORDER.indexOf(v)) * 100) + "%)"; ind.style.opacity = ORDER.indexOf(v) < 0 ? "0" : ""; }
  var pb = $("#prof-btn"); if (pb) pb.setAttribute("aria-pressed", String(v === "profile"));
  if (changed){ var sec = $("#v-" + v); sec.style.setProperty("--dir", dir * flip); sec.classList.remove("v-in"); void sec.offsetWidth; sec.classList.add("v-in"); }
  if (v === "feed"){ if (!cur || cur.q.track !== S.track) nextQuestion(); else renderFeed(); }
  if (v === "exams" && !run) renderExams();
  if (v === "glossary" && window.KLAAR_GLOSSARY) KLAAR_GLOSSARY.render($("#v-glossary"), S.track, function(){ setView(backTo); });
  if (v === "home") renderHome();
  if (v === "profile") renderProfile();
  scrollTop0();
}
function renderAll(){
  if (view === "feed"){ if (!cur || cur.q.track !== S.track) nextQuestion(); else renderFeed(); }
  else setView(view);
}
$$(".switch button").forEach(function(b){ b.addEventListener("click", function(){ setTrack(b.getAttribute("data-track")); }); });
$("#prof-btn").addEventListener("click", function(){ setView(view === "profile" ? backTo : "profile"); });
$$(".tab").forEach(function(b){ b.addEventListener("click", function(){ if (b.getAttribute("data-view") === "exams" && view === "exams" && run) return; setView(b.getAttribute("data-view")); }); });

function profileLine(){
  var pr = prof(); if (!pr.at) return "Not set yet.";
  var NL = {none:"Dutch: starting from zero", a1:"Dutch: the basics", a2:"Dutch: simple conversations", b1:"Dutch: past A2"};
  var DR = {"new":"driving: never driven", abroad:"driving: licensed abroad", lessons:"driving: lessons here"};
  var bits = [];
  if (goals().indexOf("civic") >= 0 && pr.nl) bits.push(NL[pr.nl]);
  if (goals().indexOf("drive") >= 0 && pr.drive) bits.push(DR[pr.drive]);
  bits.push(teachFirst() ? "lessons first" : "questions only");
  bits.push(S.goal + " questions a day");
  var s = bits.join(", "); return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
function applyProfile(p, fresh){
  if (fresh){ var keep = {arrived:S.arrived, goal:S.goal, view:"home"}; S = freshState(); S.arrived = keep.arrived; S.view = "home"; cur = null; lastId = null; }
  S.prof = p; S.prof.at = Date.now(); S.onboarded = true; lesson = null;
  if (p.goal) S.goal = p.goal;
  if (p.civicLevel && S.t.civic.level < p.civicLevel) S.t.civic.level = p.civicLevel;
  else if (p.nl === "b1" && S.t.civic.level < 2) S.t.civic.level = 2;
  var g = goals(); if (g.indexOf(S.track) < 0) S.track = g[0]; applyTrack();
  cur = null; save(); view = "home"; renderAll(); setView("home");
}
/* placement: a few questions per goal; drive = one per key topic, civic = a ladder of Dutch levels */
var PLACE_DRIVE = ["Priority", "Signs", "Speed limits", "Distances", "Hazard perception", "Road markings", "Stopping & parking", "Motorway"];
function slim(q){ return {id:q.id, q:q.q, o:q.o, c:q.c, p:q.p, kind:q.kind, topic:q.topic, sign:q.sign, sec:q.sec}; }
function placementPool(t){
  var tr = S.t[t], mc = function(q){ return q.o && (q.kind === "mc" || q.kind === "hazard") && !tr.seen[q.id]; };
  if (t === "drive") return PLACE_DRIVE.map(function(topic){ var c = shuffle(STATIC.drive.filter(function(q){ return q.topic === topic && mc(q); })); return c[0] ? slim(c[0]) : null; }).filter(Boolean);
  var rungs = [["a1", function(q){ return q.sec === "basics" && q.topic === "Vocabulary"; }], ["a2", function(q){ return q.sec === "a2-lezen"; }], ["b1", function(q){ return q.sec === "b1"; }], ["b2", function(q){ return q.sec === "b2"; }]];
  return rungs.map(function(r){ return {rung:r[0], qs:shuffle(STATIC.civic.filter(function(q){ return r[1](q) && mc(q); })).slice(0, 2).map(slim)}; });
}
function placementSave(t, results){
  results.forEach(function(r){ var q = INDEX[r.id]; if (q) record(q, r.ok, true); });
  if (t === "drive"){
    var tr = S.t.drive; tr.primers = tr.primers || {};
    results.forEach(function(r){ var q = INDEX[r.id]; if (q && r.ok) tr.primers[q.topic] = tr.primers[q.topic] || -1; });  /* known: skip that lesson, still on Home */
  }
  save();
}
function resetProgress(){ var keep = {arrived:S.arrived, prof:S.prof, goal:S.goal}; S = freshState(); S.arrived = keep.arrived; S.prof = keep.prof; S.goal = keep.goal; S.onboarded = true; cur = null; lesson = null; focus = null; lastId = null; save(); applyTrack(); setView("home"); }
window.KLAAR = {needsSetup:function(){ return !(S.prof && S.prof.v >= 2); }, placementPool:placementPool, placementSave:placementSave, poolSize:function(t){ return pool(t).length; }, seenCount:function(t){ return Object.keys(S.t[t].seen).length; },
  isProfiled:function(){ return !!(S.prof && S.prof.at); }, hasProgress:function(){ return S.t.drive.ans + S.t.civic.ans; }, profile:function(){ return S.prof || null; }, applyProfile:applyProfile, isOnboarded:function(){ return !!S.onboarded; }, goal:function(){ return S.goal; }, finish:function(t, g){ if (t === 'drive' || t === 'civic') setTrack(t); if (g) S.goal = g; S.onboarded = true; save(); renderAll(); }};
applyTrack();
renderSync();
setView(view);
window.addEventListener("klaar-lang", function(){ renderSync(); renderAll(); });
initSample();
initCloud();
try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
})();

