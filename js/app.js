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
var SUBS = {drive: "Driving licence", civic: "Inburgering"};
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
/* multi: several answers are right (cs). spot: tap the right place in the picture (map.spots, c). order: see orderItems. */
function driveKind(q){ return q.kind === "order" || q.kind === "multi" || q.kind === "spot" ? q.kind : (q.hz ? "hazard" : (q.num ? "num" : "mc")); }
var STATIC = {drive: [], civic: []};
DRIVE.QUESTIONS.forEach(function(q, i){
  STATIC.drive.push({id:"d" + i, track:"drive", topic:q.t, kind:driveKind(q), q:q.q, o:q.o, c:q.c, cs:q.cs, a:q.a, ans:q.ans, e:q.e, sign:q.sign, view:q.view, map:q.map, src:q.source, lvl:1});
});
CIVIC.QUESTIONS.forEach(function(q, i){
  STATIC.civic.push({id:"c" + i, track:"civic", topic:q.t, kind:"mc", q:q.q, o:q.o, c:q.c, e:q.e, icon:q.icon, sec:"basics", lvl:1});
});
CIVIC.STAGES.forEach(function(s){
  s.qs.forEach(function(q, i){
    STATIC.civic.push({id:"s-" + s.id + "-" + i, track:"civic", topic:q.t || s.title, kind:q.type === "type" ? "type" : "mc", q:q.q, o:q.o, c:q.c, a:q.a, e:q.e, en:q.en, p:q.p, audio:q.audio, sec:s.id, lvl:SEC_LVL[s.id] || 1});
  });
});
var XB = (typeof EXTRA !== "undefined" && EXTRA) ? EXTRA : {drive: [], civic: []};
/* ids come from the question text. Two questions can share a text and differ only in the picture: the first keeps
   its id (so progress is kept), a later one gets an id that also takes its picture into account. */
var xSeen = {};
(XB.drive || []).forEach(function(q){
  var xid = "x-d-" + hashId(q.q);
  if (xSeen[xid]) xid = "x-d-" + hashId(q.q + "|" + (q.sign || JSON.stringify(q.map || q.view || "")));
  xSeen[xid] = 1;
  STATIC.drive.push({id:xid, track:"drive", topic:q.t, kind:driveKind(q), q:q.q, o:q.o, c:q.c, cs:q.cs, a:q.a, ans:q.ans, e:q.e, sign:q.sign, view:q.view, map:q.map, src:q.source, lvl:1});
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
/* practice only asks what a lesson taught: questions in js/untaught.js wait until their lesson covers them. Mock exams use every question. */
function held(q){ var u = window.UNTAUGHT && UNTAUGHT[q.track]; return !!(u && u[q.id]); }
function allPool(t){ return STATIC[t].concat(GEN[t]); }
function pool(t){ return allPool(t).filter(function(q){ return !held(q); }); }

/* ---------------- state ---------------- */
function freshTrack(){ return {xp:0, ans:0, ok:0, level:1, recent:[], topics:{}, seen:{}, primers:{}, wrong:[], mocks:{}, combo:0, aiOk:false, days:{}, right:{}, last:{}, drill:{}}; }
function freshState(){ return {v:1, updated:0, track:"drive", view:"feed", t:{drive:freshTrack(), civic:freshTrack()}, days:{}, goal:30, plan:{}}; }
function mergeState(raw){
  var s = freshState();
  if (!raw || typeof raw !== "object") return s;
  ["updated", "track", "view", "goal", "arrived", "onboarded", "prof", "split", "wiped"].forEach(function(k){ if (raw[k] != null) s[k] = raw[k]; });
  if (raw.days) s.days = raw.days;
  if (raw.plan) s.plan = raw.plan;
  ["drive", "civic"].forEach(function(t){ if (raw.t && raw.t[t]) s.t[t] = Object.assign(freshTrack(), raw.t[t]); });
  /* each goal now keeps its own days; days from before that split count for both, so streaks survive */
  if (!s.split){ s.split = dayKey(); ["drive", "civic"].forEach(function(t){ Object.keys(s.days).forEach(function(d){ if (d !== s.split && !s.t[t].days[d]) s.t[t].days[d] = s.days[d]; }); }); }
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
  if (window.KLAAR_SYNC) KLAAR_SYNC.dirty();
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
  tr.last = tr.last || {}; tr.last[q.id] = ok ? 1 : 0;
  var dk = dayKey(); S.days[dk] = (S.days[dk] || 0) + 1;
  tr.days[dk] = (tr.days[dk] || 0) + 1; if (ok) tr.right[dk] = (tr.right[dk] || 0) + 1;
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
/* per goal: days you practised it, and right answers today (only right answers count toward the daily goal) */
function streak(t){
  var days = S.t[t || S.track].days, n = 0, d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]){ n++; d.setDate(d.getDate() - 1); }
  return n;
}
function rightOn(t, day){ var tr = S.t[t]; return tr.right[day] || (S.split && day < S.split ? tr.days[day] || 0 : 0); }
function rightToday(t){ return S.t[t || S.track].right[dayKey()] || 0; }
function levelName(t){ return t === "drive" ? "Level " + S.t.drive.level : CIVIC_LV[S.t.civic.level]; }

/* ---------------- glossary sheet ---------------- */
function mark(t, s){ return LIBS[t].markGlossary(s); }
function openSheet(html, noClose){
  var root = $("#overlay-root");
  root.innerHTML = '<div class="overlay" id="ov" role="dialog" aria-modal="true"><div class="sheet">' + html + (noClose ? "" : '<button class="btn" id="sheet-close">Got it</button>') + '</div></div>';
  if (!noClose) $("#sheet-close").addEventListener("click", closeSheet);
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
var SPEAKER = '<svg class="say-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
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
  if (q.map && window.KLAAR_MAP) return '<div class="visual mpv">' + KLAAR_MAP(q.map) + '</div>';
  if (q.view && window.KLAAR_VIEW) return '<div class="visual dv">' + KLAAR_VIEW(q.view) + '</div>';
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
function correctText(q){ return q.kind === "order" ? orderText(q, q.ans) : (q.kind === "multi" ? multiText(q, q.cs) : (q.kind === "spot" ? spotName(q, q.c) : (q.o ? q.o[q.c] : q.a[0]))); }
/* multi questions (the CBR multiple-response question): tick every right answer, then check */
function multiText(q, a){ return (a || []).slice().sort(function(x, y){ return x - y; }).map(function(i){ return q.o[i]; }).join("; "); }
function multiHtml(q, order, picked, done){
  var h = (done ? "" : '<p class="ord-help">More than one answer can be right. Tick every right answer.</p>') + '<div class="opts">';
  order.forEach(function(orig){
    var on = picked.indexOf(orig) >= 0, good = q.cs.indexOf(orig) >= 0, cls = "opt multi" + (done ? (good ? " right" : (on ? " wrong" : "")) : (on ? " sel" : ""));
    h += '<button class="' + cls + '" data-m="' + orig + '" role="checkbox" aria-checked="' + on + '"' + (done ? " disabled" : "") + '><span class="k">' + (on ? (done && !good ? "&#10005;" : "&#10003;") : "") + '</span><span>' + mark(q.track, q.o[orig]) + (done && good && !on ? ' <i class="missed">You missed this one</i>' : "") + '</span></button>';
  });
  return h + '</div>';
}
function wireMulti(root, pick, onChange){
  $$("[data-m]", root).forEach(function(b){
    b.addEventListener("click", function(){
      var i = +b.getAttribute("data-m"), at = pick.indexOf(i);
      if (at >= 0) pick.splice(at, 1); else pick.push(i);
      b.classList.toggle("sel", at < 0); b.setAttribute("aria-checked", String(at < 0)); b.querySelector(".k").innerHTML = at < 0 ? "&#10003;" : "";
      onChange();
    });
  });
}
/* spot questions (the CBR single-drag question): tap the right place, on the picture or on the letters under it */
function spots(q){ return (q.map && q.map.spots) || []; }
function spotName(q, i){ var s = spots(q)[i]; return String.fromCharCode(65 + i) + (s && s[2] ? ", " + s[2] : ""); }
function spotHtml(q, done){
  return (done ? "" : '<p class="ord-help">Tap the right place: in the picture, or a letter below.</p>') +
    '<div class="spot-row">' + spots(q).map(function(_, i){ return '<button class="spot-b" data-spot="' + i + '" aria-label="Place ' + String.fromCharCode(65 + i) + '"' + (done ? " disabled" : "") + '>' + String.fromCharCode(65 + i) + '</button>'; }).join("") + '</div>';
}
function paintSpot(root, q, sel, done){
  $$("[data-spot]", root).forEach(function(el){
    var i = +el.getAttribute("data-spot");
    el.classList.remove("set", "right", "wrong");
    if (done){ if (i === q.c) el.classList.add("right"); else if (i === sel) el.classList.add("wrong"); }
    else if (i === sel) el.classList.add("set");
  });
}
function wireSpot(root, onPick){
  $$("[data-spot]", root).forEach(function(el){ el.addEventListener("click", function(){ onPick(+el.getAttribute("data-spot")); }); });
}
/* order questions (the CBR drag question): put 1, 2, 3 on the road users in the order they may go */
function orderItems(q){ return ((q.map && q.map.items) || []).filter(function(it){ return it.id; }); }
function orderName(q, id){ var it = orderItems(q).filter(function(x){ return x.id === id; })[0]; return it ? it.name : id; }
function orderText(q, ids){ return (ids || []).map(function(id, i){ return (i + 1) + " " + orderName(q, id); }).join(", "); }
function orderHtml(q, done){
  return (done ? "" : '<p class="ord-help">Tap them in the order they may go: first, then second, then third. Tap again to undo.</p>') +
    '<div class="ord-row">' + orderItems(q).map(function(it){ return '<button class="ord-b" data-id="' + esc(it.id) + '"' + (done ? " disabled" : "") + '><span class="ord-n" aria-hidden="true"></span><span>' + esc(it.name) + '</span></button>'; }).join("") + '</div>';
}
/* numbers on the buttons and on the picture, updated in place so nothing is redrawn */
function paintOrder(root, q, pick, done){
  $$("[data-id]", root).forEach(function(el){
    var id = el.getAttribute("data-id"), i = pick.indexOf(id), want = q.ans.indexOf(id);
    var num = done ? want + 1 : (i >= 0 ? i + 1 : 0), cls = done ? (i === want ? "right" : "wrong") : (i >= 0 ? "set" : "");
    el.classList.remove("set", "right", "wrong"); if (cls) el.classList.add(cls);
    var t = el.querySelector("text") || el.querySelector(".ord-n"); if (t) t.textContent = num ? String(num) : "";
    if (el.tagName === "BUTTON") el.setAttribute("aria-label", orderName(q, id) + (num ? ", number " + num : ", no number yet"));
  });
}
function wireOrder(root, q, pick, onChange, locked){
  $$("[data-id]", root).forEach(function(el){
    el.addEventListener("click", function(){
      if (locked && locked()) return;
      var id = el.getAttribute("data-id"), i = pick.indexOf(id);
      if (i >= 0) pick.splice(i, 1); else pick.push(id);
      paintOrder(root, q, pick, false); onChange();
    });
  });
}
function isRight(q, a){
  if (q.kind === "order") return Array.isArray(a) && a.length === q.ans.length && a.every(function(x, i){ return x === q.ans[i]; });
  if (q.kind === "multi") return Array.isArray(a) && a.length === q.cs.length && q.cs.every(function(x){ return a.indexOf(x) >= 0; });
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
/* one goal at a time: the app only talks about the goal you are on. You switch in your profile; progress on the other one is kept. */
function goals(){ return [S.track]; }
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
/* a question's lesson: some topics share one lesson (A2 Luisteren and Listening, for example) */
function lessonKey(t, topic){ var a = window.LESSON_ALIAS && LESSON_ALIAS[t]; return (a && a[topic]) || topic; }
function topicLesson(t, topic){ return window.LESSONS && LESSONS[t] && LESSONS[t][lessonKey(t, topic)]; }
function needsLesson(q){ var tr = S.t[q.track]; return teachFirst() && !!topicLesson(q.track, q.topic) && !(tr.primers || {})[lessonKey(q.track, q.topic)]; }
var lesson = null, focus = null, practiceMode = null, UNIT_MAX = 10, MISTAKES = "Your mistakes";
function inFocus(q){ return focus.set ? !!focus.set[q.id] : (focus.part ? q.track === "civic" && partOf(q) === focus.part : lessonKey(q.track, q.topic) === focus.topic); }
/* inburgering exam parts: practise just one of them today. Every civic question belongs to one part, by its exam section,
   and for the basics (and AI questions) by its topic. */
var PARTS = [["read", "Reading", "Signs, letters and short texts"], ["listen", "Listening", "Short spoken Dutch"], ["write", "Writing and grammar", "Words and sentences"], ["knm", "Dutch society", "KNM: work, health, rules, history"]];
var SEC_PART = {"a2-lezen":"read", "b1":"read", "b2":"read", "c1":"read", "a2-luisteren":"listen", "a2-schrijven":"write", "knm":"knm"};
var TOPIC_PART = {"Reading":"read", "Listening":"listen", "Words you hear":"listen", "Grammar":"write", "Writing":"write", "Vocabulary":"write", "B1 Lezen":"read", "B2 Lezen":"read", "C1 Lezen":"read"};
function partOf(q){ return (q.sec && SEC_PART[q.sec]) || TOPIC_PART[lessonKey("civic", q.topic)] || "knm"; }
function partName(k){ for (var i = 0; i < PARTS.length; i++) if (PARTS[i][0] === k) return PARTS[i][1]; return k; }
/* a unit = a topic's lesson, then its questions, then a short "topic done" card */
function nextLessonTopic(t, p){
  var order = (window.LESSON_ORDER && LESSON_ORDER[t]) || [], tr = S.t[t], done = tr.primers || {};
  for (var i = 0; i < order.length; i++){
    var k = order[i];
    if (done[k] || !topicLesson(t, k)) continue;
    if (p.some(function(x){ return lessonKey(t, x.topic) === k && !tr.seen[x.id]; })) return k;
  }
  return null;
}
function startLesson(first){
  var t = S.track;
  lesson = {track:t, topic:lessonKey(t, first.topic), primer:{steps:topicLesson(t, first.topic), i:0}, keep:focus && focus.part && focus.track === t ? focus : null};
  cur = null; waitingForQuestions = false;
  renderFeed(true);
  scrollTop0();
}
function pickNext(t){
  var tr = S.t[t];
  var inUnit = focus && focus.track === t && focus.asked < focus.n;
  for (var i = 0; i < tr.wrong.length; i++){
    if (tr.wrong[i].due <= tr.ans && !(inUnit && INDEX[tr.wrong[i].id] && !inFocus(INDEX[tr.wrong[i].id]))){   /* other topics' retries wait until the unit is done */
      var w = tr.wrong.splice(i, 1)[0];
      if (INDEX[w.id] && w.id !== lastId && !held(INDEX[w.id])){ if (inUnit && focus.ids) focus.ids[w.id] = 1; return INDEX[w.id]; }
      i--;
    }
  }
  var cap = levelCap(t);
  var p = pool(t).filter(function(q){ return (q.lvl || 1) <= cap; }), all = p;
  var fit = p.filter(fitsProfile); if (fit.length >= 12) p = fit;
  if (focus && focus.track === t && focus.asked < focus.n){
    var inT = all.filter(function(x){ return inFocus(x) && x.id !== lastId; });   /* you picked this topic, so the profile filter does not hide its questions */
    var fq = inT.filter(function(x){ return !tr.seen[x.id]; });
    if (focus.drill){   /* a drill: questions you missed and new ones first, then the ones you saw longest ago */
      var missed = {}; tr.wrong.forEach(function(w){ missed[w.id] = 1; });
      var rest = inT.filter(function(x){ return !focus.ids[x.id]; });
      fq = rest.filter(function(x){ return missed[x.id] || !tr.seen[x.id]; });
      if (!fq.length) fq = rest.sort(function(a, b){ return (tr.seen[a.id] || 0) - (tr.seen[b.id] || 0); }).slice(0, 4);
    }
    if (fq.length){ var pk = fq[Math.floor(Math.random() * fq.length)]; if (focus.ids) focus.ids[pk.id] = 1; return pk; }
    focus.n = focus.asked;
    return null;   /* the unit ran out: end it with the "topic done" card, never an off-topic question */
  }
  if (practiceMode === "mix" && teachFirst() && !focus){   /* a mix only asks about lessons you have done; with none done yet, it starts the next lesson */
    var dn = tr.primers || {}, lp = p.filter(function(q){ return !topicLesson(t, q.topic) || dn[lessonKey(t, q.topic)]; });
    if (lp.length) p = lp;
  }
  if (teachFirst() && !focus){
    var nt = nextLessonTopic(t, p);
    if (nt){ var lq = p.filter(function(x){ return lessonKey(t, x.topic) === nt && !tr.seen[x.id]; }); return lq[Math.floor(Math.random() * lq.length)]; }
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
  if (!q && focus && focus.track === S.track && focus.asked >= focus.n){ renderUnitDone(); return; }
  if (!q){ cur = null; waitingForQuestions = true; renderFeed(); return; }
  if (needsLesson(q)){ startLesson(q); return; }
  waitingForQuestions = false;
  lastId = q.id;
  cur = {q:q, done:false, sel:null, order:q.kind === "mc" || q.kind === "multi" ? shuffle(q.o.map(function(_, i){ return i; })) : (q.o ? q.o.map(function(_, i){ return i; }) : null), input:"", pick:[]};
  renderFeed(true);
  scrollTop0();
}
function renderUnitDone(){
  var F = focus, t = F.track, tr = S.t[t];
  if (!F.n){ focus = null; nextQuestion(); return; }
  tr.drill = tr.drill || {}; tr.drill[F.topic] = dayKey(); save();   /* done for today: the plan moves on and comes back to it tomorrow if it is still weak */
  var P = plan(t), pct = F.ok / F.n * 100, miss = F.n - F.ok, pass = PASS_PCT[t], today = rightToday(t);
  var cheer = pct >= pass ? (t === "drive" ? "Above the CBR pass mark of 88%. You know this topic." : "Strong. You know this topic.") :
    (pct >= 70 ? "Close. " + (t === "drive" ? "The CBR pass mark is 88%. " : "") + "The " + miss + " you missed come back soon." : (F.set ? "The " + miss + " you missed again stay on your list." : "This topic needs more work. The " + miss + " you missed come back soon, and it stays on your plan."));
  var pace = P.exam ? "Exam in " + P.exam.n + (P.exam.n === 1 ? " day. " : " days. ") : "";
  pace += today >= S.goal ? "Daily goal done." : (S.goal - today) + " more right answers finish today's goal.";
  var v = $("#v-feed");
  v.innerHTML = feedHead() + '<article class="qcard enter milestone unit-done"><div class="eyebrow"><span>' + esc(F.topic) + '</span></div><div class="m-big tabular">' + F.ok + '<small>/' + F.n + '</small></div><div class="m-cap">' + (F.set ? "Mistakes done" : (F.drill ? "Drill done" : "Topic done")) + '</div>' +
    '<p class="m-cheer">' + esc(cheer) + '</p><p class="unit-next">' + esc(pace) + '</p>' +
    '<div class="unit-plan"><b>Next: ' + esc(P.next.title) + '</b><span>' + esc(P.next.why) + '</span></div>' +
    '<div class="fb-actions"><button class="btn ghost" data-act="u-pick">Choose something else</button><button class="btn pop" data-act="u-next">' + (P.next.kind === "mock" ? "Go to exams" : "Start") + '</button></div></article>';
  $('[data-act="u-next"]', v).addEventListener("click", function(){ focus = null; startNext(t, P.next); });
  $('[data-act="u-pick"]', v).addEventListener("click", function(){ focus = null; cur = null; practiceMode = null; showPractice(); scrollTop0(); });
  scrollTop0();
}
function ringSvg(done, goal){
  var r = 24, C = 2 * Math.PI * r, f = Math.min(1, done / goal);
  return '<svg viewBox="0 0 58 58" aria-hidden="true"><circle cx="29" cy="29" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="6"/>' +
    '<circle cx="29" cy="29" r="' + r + '" fill="none" stroke="' + (f >= 1 ? "var(--ok)" : "var(--accent)") + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + (C * f).toFixed(1) + ' ' + C.toFixed(1) + '"/></svg>';
}
var FLAME = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7z" fill="currentColor"/></svg>';
function feedHead(){
  var tr = T(), today = rightToday(), st = streak();
  var lvlPct = Math.round(Math.min(1, (tr.recent.reduce(function(a, b){ return a + b; }, 0)) / 17) * 100);
  return '<div class="feed-head"><div class="ring">' + ringSvg(today, S.goal) + '<b class="tabular">' + today + '<small>/' + S.goal + '</small></b></div>' +
    '<div class="chips"><span class="chip' + (st >= 3 ? " hot" : "") + '">' + FLAME + st + '-day streak</span>' +
    (examDays(S.track) ? '<span class="chip tabular">Exam in ' + examDays(S.track).n + ' d</span>' : '<span class="chip">' + esc(levelName(S.track)) + '</span>') +
    (tr.combo >= 3 ? '<span class="chip hot">' + tr.combo + ' in a row</span>' : "") +
    '</div></div>' +
    '<div class="xpbar" title="Progress to next level"><i style="width:' + (tr.level >= MAXLV[S.track] ? 100 : lvlPct) + '%"></i></div>';
}
/* the topic lesson: a few steps with an animated scene, shown once before the first questions on a topic */
function renderPrimer(v, entering){
  var L = lesson, P = L.primer, st = P.steps[P.i], last = P.i === P.steps.length - 1;
  var h = feedHead() + '<article class="qcard lesson primer' + (entering ? " enter" : "") + '" id="qcard"><div class="eyebrow"><span>' + esc(L.topic) + '</span><span class="tag">Lesson</span><span class="pr-count tabular">' + (P.i + 1) + ' / ' + P.steps.length + '</span></div>' +
    (st.scene && window.LESSON_SCENE ? '<div class="lscene">' + LESSON_SCENE(st.scene) + '</div>' : (st.icon && LIBS[L.track].GLOSSARY[st.icon] ? '<div class="visual">' + LIBS[L.track].GLOSSARY[st.icon].icon + '</div>' : "")) +
    '<h3 class="les-h">' + esc(st.h) + '</h3><p class="pr-t">' + (window.I18N && I18N.get() !== "en" ? esc(st.t) : mark(L.track, st.t)) + '</p>' +
    (st.say ? '<div class="say" aria-label="Tap to hear">' + st.say.map(function(x){ return '<button class="say-b" data-say="' + esc(x[0]) + '">' + SPEAKER + '<span class="say-nl" lang="nl" translate="no">' + esc(x[0]) + '</span><span class="say-en">' + esc(x[1]) + '</span></button>'; }).join("") + '</div>' : "") +
    '<p class="pr-why"><b>Why</b><span>' + esc(st.why) + '</span></p>' + (st.src ? srcLink(st.src) : "") +
    '<p class="pr-swipe">Swipe for the next step</p><div class="pr-dots" aria-hidden="true">' + P.steps.map(function(_, k){ return '<i class="' + (k === P.i ? "on" : (k < P.i ? "done" : "")) + '"></i>'; }).join("") + '</div>' +
    '<div class="fb-actions">' + (P.i > 0 ? '<button class="btn ghost" data-act="pr-back">Back</button>' : "") + '<button class="btn' + (last ? " pop" : "") + '" data-act="pr-next">' + (last ? "Now practise" : "Next") + '</button></div></article>';
  v.innerHTML = h;
  var b = $('[data-act="pr-back"]', v); if (b) b.addEventListener("click", function(){ P.i--; renderFeed(); scrollTop0(); });
  $$("[data-say]", v).forEach(function(x){ x.addEventListener("click", function(){ $$(".say-b.on", v).forEach(function(o){ o.classList.remove("on"); }); x.classList.add("on"); speak(x.getAttribute("data-say")); setTimeout(function(){ x.classList.remove("on"); }, 1600); }); });
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
    if (window.KLAAR_STATS) KLAAR_STATS.lesson(L.track, L.topic);
    var unseen = pool(L.track).filter(function(x){ return lessonKey(L.track, x.topic) === L.topic && !tr.seen[x.id] && (x.lvl || 1) <= levelCap(L.track); }).length;
    focus = L.keep ? L.keep : (unseen ? {track:L.track, topic:L.topic, n:Math.min(UNIT_MAX, unseen), asked:0, ok:0} : null); lesson = null; save(); nextQuestion();   /* a part run carries on after its lesson */
  });
}
function renderLesson(v, entering){ renderPrimer(v, entering); }
/* after a wrong answer: the whole lesson in a sheet, so you can reread the rule and come back to the same card */
function reviewLesson(t, topic){
  var steps = topicLesson(t, topic); if (!steps) return;
  openSheet('<div class="rvw"><h2>' + esc(lessonKey(t, topic)) + '</h2>' + steps.map(function(st){
    return '<section class="rvw-step">' + (st.scene && window.LESSON_SCENE ? '<div class="lscene">' + LESSON_SCENE(st.scene) + '</div>' : "") +
      '<h3 class="les-h">' + esc(st.h) + '</h3><p class="pr-t">' + esc(st.t) + '</p><p class="pr-why"><b>Why</b><span>' + esc(st.why) + '</span></p>' + (st.src ? srcLink(st.src) : "") + '</section>';
  }).join("") + '</div>');
}
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
  html2 += '<article class="qcard' + (entering ? " enter" : "") + (q.kind === "hazard" ? " hz" : "") + '" id="qcard" data-qid="' + esc(String(q.id)) + '">';
  var inUnit = focus && focus.track === q.track && inFocus(q);
  html2 += '<div class="eyebrow"><span>' + esc(q.topic) + '</span>' + (inUnit && focus.set ? '<span class="tag">Mistakes</span>' : "") + (inUnit ? '<span class="pr-count tabular">' + Math.min(focus.n, focus.asked + (cur.done ? 0 : 1)) + ' / ' + focus.n + '</span>' : "") + (q.sec && q.sec !== "basics" && SEC_NAME[q.sec] !== q.topic ? '<span class="tag">' + esc(SEC_NAME[q.sec] || q.sec) + '</span>' : "") + (q.gen ? '<span class="tag ai">New</span>' : "") + '</div>';
  html2 += bodyHtml(q);
  if (q.kind === "order"){
    html2 += orderHtml(q, cur.done);
    if (!cur.done) html2 += '<div class="ord-act"><button class="btn ghost" data-act="ord-clear">Clear</button><button class="btn" data-act="ord-check" disabled>Check</button></div>';
  } else if (q.kind === "multi"){
    html2 += multiHtml(q, cur.order, cur.done ? cur.sel : cur.pick, cur.done);
    if (!cur.done) html2 += '<div class="ord-act"><button class="btn" data-act="multi-check" disabled>Check</button></div>';
  } else if (q.kind === "spot"){
    html2 += spotHtml(q, cur.done);
  } else if (q.kind === "num" || q.kind === "type"){
    html2 += '<div class="inrow"><input class="inp" id="feed-inp" ' + (q.kind === "num" ? 'inputmode="decimal" placeholder="Type a number"' : 'autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Type je antwoord"') + ' aria-label="Your answer" value="' + esc(cur.input) + '"' + (cur.done ? " disabled" : "") + '>' +
      (cur.done ? "" : '<button class="btn" data-act="check">Check</button>') + '</div>';
  } else {
    html2 += '<div class="opts">';
    cur.order.forEach(function(orig, k){
      var cls = "opt";
      if (cur.done){ if (orig === q.c) cls += " right" + (cur.fresh ? " in" : ""); else if (orig === cur.sel) cls += " wrong" + (cur.fresh ? " in" : ""); }
      html2 += '<button class="' + cls + '" data-o="' + orig + '"' + (cur.done ? " disabled" : "") + '><span class="k">' + String.fromCharCode(65 + k) + '</span><span>' + mark(q.track, q.o[orig]) + '</span></button>';
    });
    html2 += '</div>';
  }
  if (cur.done){
    var ok = cur.ok;
    html2 += '<div class="fb' + (cur.fresh ? " in" : "") + '"><p class="verdict ' + (ok ? "ok" : "no") + '">' + (ok ? "Correct" : "Not quite") + '</p>' + (ok && cur.cheer ? '<p class="cheer-l">' + esc(cur.cheer) + '</p>' : "");
    if (!ok && q.kind === "order") html2 += '<p>Yours: ' + esc(orderText(q, cur.sel)) + '</p>';
    if (!ok && q.kind === "spot") html2 += '<p>Yours: ' + esc(spotName(q, cur.sel)) + '</p>';
    if (!ok) html2 += '<p><b>Answer: ' + esc(correctText(q)) + '</b></p>';
    if (q.en) html2 += '<p class="en">' + esc(q.en) + '</p>';
    if (q.audio) html2 += '<p class="en">Audio: ' + esc(q.audio) + '</p>';
    html2 += '<p class="ex">' + mark(q.track, q.e) + '</p>';
    if (q.src) html2 += srcLink(q.src);
    html2 += '<div class="rep" id="rep">' + (cur.reported ? '<span class="note">Reported. Thank you.</span>' : '<button class="link" data-act="report">Report a problem with this question</button>') + '</div>';
    if (cur.explain) html2 += '<div class="ai-out" id="ai-out">' + esc(cur.explain) + '</div>';
    html2 += '<div class="fb-actions">' + (!ok && topicLesson(q.track, q.topic) ? '<button class="btn ghost" data-act="review">Review the lesson</button>' : "") + (aiAvailable() && !cur.explaining && !cur.explain ? '<button class="btn ghost" data-act="explain">Explain it simpler</button>' : "") + '<button class="btn" data-act="next">Next</button></div></div>';
    html2 += '<p class="hint">Swipe up for the next question</p>';
  }
  html2 += '</article>';
  /* re-rendering the same question (after answering) keeps its picture, so it doesn't flash or restart */
  var old = entering ? null : $("#qcard", v), keep = old && old.getAttribute("data-qid") === String(q.id) ? $(".visual", old) : null;
  if (keep && keep.querySelector("button,audio,input")) keep = null;
  v.innerHTML = html2;
  if (keep){ var nv = $("#qcard .visual", v); if (nv) nv.parentNode.replaceChild(keep, nv); }
  wireFeed(v);
}
/* a short word of encouragement after a right answer: what you just did, never the same line twice in a row */
var RIGHT_LINES = ["Nice one.", "You knew that.", "Spot on.", "That's how it's done.", "Good thinking.", "Exactly right.", "You've got this.", "Clear thinking.", "Sharp."];
var lastCheer = -1;
function cheerLine(q){
  var tr = S.t[q.track], c = tr.combo || 0;
  if (c >= 3 && c % 5 === 0) return c + " in a row. You're on a roll.";
  if (c === 3) return "Three in a row. Keep going.";
  if ((tr.right || {})[dayKey()] === 1) return "First one today. Good start.";
  var i; do { i = Math.floor(Math.random() * RIGHT_LINES.length); } while (i === lastCheer && RIGHT_LINES.length > 1);
  lastCheer = i; return RIGHT_LINES[i];
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
  cur.done = true; cur.sel = a; cur.ok = ok; cur.fresh = true;
  if (window.KLAAR_STATS) KLAAR_STATS.answer(q, ok);
  var leveled = record(q, ok, false);
  if (focus && focus.track === q.track && inFocus(q)){ focus.asked++; if (ok) focus.ok++; }
  if (ok) cur.cheer = cheerLine(q);
  renderFeed(); cur.fresh = false;
  var card = $("#qcard");
  if (card){ card.classList.add(ok ? "hit" : "miss"); }
  if (ok) burst($(".opt.right") || $(".spot-b.right") || $(".inp"));
  var fbx = $("#v-feed .fb");
  if (fbx){ var r = fbx.getBoundingClientRect(), tbh = ($(".tabbar") || {offsetHeight:0}).offsetHeight, want = r.top + 150 - ($(".tabbar") ? $(".tabbar").getBoundingClientRect().top : window.innerHeight - tbh);
    if (want > 0) scroller().scrollBy({top: want, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); }
  var dn = T().days[dayKey()] || 0; if (dn > 0 && dn % 10 === 0) milestoneDue = true;
  if (leveled) toast("Level up: " + levelName(q.track) + ". Questions get harder now.");
  else if (ok && T().combo > 0 && T().combo % 10 === 0) toast(T().combo + " in a row");
  if (ok && rightToday() === S.goal) toast("Daily goal done. Anything now is bonus.");
}
function wireFeed(v){
  if (cur && cur.q.kind === "order"){
    var oq = cur.q, oc = $("#qcard", v);
    paintOrder(oc, oq, cur.done ? cur.sel : cur.pick, cur.done);
    if (!cur.done){
      var ck = $('[data-act="ord-check"]', v), full = function(){ return cur.pick.length === orderItems(oq).length; }, upd = function(){ ck.disabled = !full(); };
      wireOrder(oc, oq, cur.pick, upd, function(){ return cur.done; }); upd();
      ck.addEventListener("click", function(){ if (full()) answer(cur.pick.slice()); });
      $('[data-act="ord-clear"]', v).addEventListener("click", function(){ cur.pick.length = 0; paintOrder(oc, oq, cur.pick, false); upd(); });
    }
  }
  if (cur && cur.q.kind === "multi" && !cur.done){
    var mk = $('[data-act="multi-check"]', v), mupd = function(){ mk.disabled = !cur.pick.length; };
    wireMulti(v, cur.pick, mupd); mupd();
    mk.addEventListener("click", function(){ if (cur.pick.length) answer(cur.pick.slice()); });
  }
  if (cur && cur.q.kind === "spot"){
    var sc = $("#qcard", v), sq = cur.q;
    paintSpot(sc, sq, cur.sel, cur.done);
    if (!cur.done) wireSpot(sc, function(i){ if (cur && cur.q === sq && !cur.done) answer(i); });
  }
  $$(".opt[data-o]", v).forEach(function(b){ b.addEventListener("click", function(){ answer(+b.getAttribute("data-o")); }); });
  var inp = $("#feed-inp", v);
  if (inp){
    inp.addEventListener("input", function(){ cur.input = inp.value; });
    inp.addEventListener("keydown", function(e){ if (e.key === "Enter"){ if (!cur.done && inp.value.trim()) answer(inp.value); else if (cur.done) leaveThenNext(); } });
  }
  var chk = $('[data-act="check"]', v); if (chk) chk.addEventListener("click", function(){ if (inp && inp.value.trim()) answer(inp.value); });
  var nx = $('[data-act="next"]', v); if (nx) nx.addEventListener("click", leaveThenNext);
  /* report a question: sends the question id and the reason, nothing about the person */
  var rp = $('[data-act="report"]', v);
  if (rp) rp.addEventListener("click", function(){
    var box = $("#rep", v), rq = cur.q, why = [["answer", "The answer is wrong"], ["unclear", "The question is unclear"]];
    if (rq.map || rq.view || rq.sign) why.push(["picture", "The picture is wrong"]);
    box.innerHTML = '<p class="note">What is wrong? This sends the question number and your reason. Nothing about you.</p><div class="rep-row">' +
      why.map(function(r){ return '<button class="chip" data-rep="' + r[0] + '">' + r[1] + '</button>'; }).join("") + '</div>';
    $$("[data-rep]", box).forEach(function(b){ b.addEventListener("click", function(){
      if (window.KLAAR_STATS && KLAAR_STATS.report) KLAAR_STATS.report(rq, b.getAttribute("data-rep"));
      if (cur && cur.q === rq) cur.reported = true;
      box.innerHTML = '<span class="note">Reported. Thank you.</span>';
    }); });
  });
  var ex = $('[data-act="explain"]', v); if (ex) ex.addEventListener("click", explain);
  var rv = $('[data-act="review"]', v); if (rv) rv.addEventListener("click", function(){ reviewLesson(cur.q.track, cur.q.topic); });
  if (cur) wireAudio(v, cur.q);
  var card = $("#qcard", v);
  if (card) wireSwipe(card);
  sizeCard();
}
/* The answered card glides up and out, then the next one rises in (the same motion as the swipe). */
function leaveThenNext(){
  var c = $("#v-feed #qcard");
  if (c && c.classList.contains("leave")) return;
  if (!c || reduced()){ nextQuestion(); return; }
  c.classList.add("leave"); setTimeout(nextQuestion, 170);
}
function atEnd(){ var se = scroller(); return se.scrollTop + se.clientHeight >= se.scrollHeight - 4; }
function rubber(x, dim){ var c = 0.55; return (x * dim * c) / (dim + c * Math.abs(x)); }
/* Swipe up past the end for the next question. The touchmove listener has to be able to stop scrolling, and such a
   listener makes the phone wait for JavaScript on every frame, so it is only attached for a touch that can become a swipe
   (answered and already at the bottom). Every other touch scrolls natively. */
function wireSwipe(card){
  var y0 = null, x0 = 0, live = false, end = false, hist = [], on = false;
  function detach(){ if (on){ card.removeEventListener("touchmove", move, {passive:false}); on = false; } }
  card.addEventListener("touchstart", function(e){
    detach();
    if (!cur || !cur.done || e.touches.length > 1 || e.target.closest("input,textarea") || !atEnd()) { y0 = null; return; }
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; live = false; end = true; hist = [{y:y0, t:performance.now()}];
    card.style.transition = "none";
    card.addEventListener("touchmove", move, {passive:false}); on = true;
  }, {passive:true});
  function move(e){
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
  }
  function release(){
    detach();
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
  var q = cur.q, mine = q.kind === "order" ? orderText(q, cur.sel) : (q.o ? (cur.sel != null ? q.o[cur.sel] : "") : cur.sel);
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
  {id:"full", badge:"50", title:"Full mock exam", sub:"50 questions, 30 minutes. Pass with 44.", n:50, mins:30, pass:44},
  {id:"quick", badge:"20", title:"Quick mock", sub:"20 questions, 12 minutes. Pass with 18.", n:20, mins:12, pass:18},
  {id:"hazard", badge:"!", title:"Hazard drill", sub:"Brake, release or nothing. 6 minutes.", n:20, mins:6, filter:function(q){ return q.kind === "hazard"; }}
];
var CIVIC_MODES = [
  /* times are the real DUO exam times (inburgeren.nl, checked 17 Nov 2026); question counts are ours */
  {id:"knm", badge:"KNM", title:"KNM", sub:"30 questions grouped by theme, 45 minutes like the real exam", sec:"knm", n:30, mins:45, exam:true},
  {id:"a2-lezen", badge:"A2", title:"A2 Lezen", sub:"15 reading questions, 65 minutes like the real exam", sec:"a2-lezen", n:15, mins:65, exam:true},
  {id:"a2-luisteren", badge:"A2", title:"A2 Luisteren", sub:"12 listening questions, 45 minutes like the real exam", sec:"a2-luisteren", n:12, mins:45, exam:true},
  {id:"a2-schrijven", badge:"A2", title:"A2 Schrijven", sub:"15 grammar and writing questions, 40 minutes. The real exam is 4 written tasks on paper", sec:"a2-schrijven", n:15, mins:40, exam:true},
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
    html = '<h2 class="h2">Integration exams</h2><p class="lead">In Dutch, timed like the real exam and scored at the end. You pass a mock with 75%. Score 85% or more and you are ready to book that part. B1 to C1 unlock once all four exam parts are passed.</p>';
  }
  html += '<div class="label">' + (t === "drive" ? "Choose a test" : "Step 1: your exam (A2 + KNM)") + '</div>';
  modes(t).forEach(function(m, i){
    if (t === "civic" && i === 4) html += '<p class="note">Spreken (speaking) can\'t be graded here. Practise it out loud with your teacher.</p><div class="label">Step 2: beyond the exam</div>';
    var h = S.t[t].mocks[m.id] || [];
    var open = t === "drive" || civicUnlocked(i);
    var best = h.length ? Math.max.apply(null, h.map(function(x){ return x.s / x.n; })) : null;
    var avail = examPool(t, m).length;
    var sub = open ? m.sub : "Locked. Pass all four exam parts first.";
    html += '<button class="row' + (mockPassed(t, m.id) ? " done" : "") + '" data-m="' + m.id + '"' + (open && avail ? "" : " disabled") + '><span class="badge">' + esc(m.badge) + '</span><span class="row-main"><span class="row-title">' + esc(m.title) + '</span><span class="row-sub">' + esc(sub) + '</span>' +
      (h.length ? '<span class="hist">' + h.slice(-6).map(function(x){ return '<span class="' + (x.p ? "ok" : "") + '">' + x.s + '/' + x.n + '</span>'; }).join("") + '</span>' : "") +
      '</span><span class="row-score">' + (best != null ? Math.round(best * 100) + "%" : "") + '</span></button>';
  });
  html += '<p class="note">' + (t === "drive" ? "Book the real exam when you pass the full mock 3 times in a row. The real exam shows short animations for hazards; here they're written scenes." : "Original questions in the style of the real exam, not official DUO material. Also do the free practice exams on inburgeren.nl.") + ' New questions arrive with app updates.</p>';
  v.innerHTML = html;
  $$(".row", v).forEach(function(b){ b.addEventListener("click", function(){ startExam(b.getAttribute("data-m")); }); });
}
function examPool(t, m){
  return allPool(t).filter(function(q){ return m.filter ? m.filter(q) : (m.sec ? q.sec === m.sec : true); });
}
function startExam(id){
  var t = S.track, m = modes(t).filter(function(x){ return x.id === id; })[0];
  var qs = shuffle(examPool(t, m)).slice(0, m.n);
  if (m.sec && m.sec !== "knm") qs.sort(function(a, b){ return (a.p || a.audio || "").localeCompare(b.p || b.audio || ""); });
  /* the real KNM exam asks its questions theme by theme, like wonen or werk en inkomen */
  if (m.sec === "knm") qs.sort(function(a, b){ return String(a.topic).localeCompare(String(b.topic)); });
  run = {t:t, m:m, qs:qs, i:0, ans:qs.map(function(){ return null; }),
    order:qs.map(function(q){ return q.kind === "mc" || q.kind === "multi" ? shuffle(q.o.map(function(_, k){ return k; })) : (q.o ? q.o.map(function(_, k){ return k; }) : null); }),
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
function answered(k){ var a = run.ans[k]; if (Array.isArray(a)) return run.qs[k].kind === "multi" ? a.length > 0 : a.length === orderItems(run.qs[k]).length; return a !== null && a !== ""; }
function renderRun(){
  var q = run.qs[run.i], n = run.qs.length, last = run.i === n - 1, v = $("#v-exams");
  var html = '<div class="run-top"><button class="link" data-act="quit">&larr; Stop</button>' + (run.end ? '<span class="timer" id="x-timer">' + fmt(run.end - Date.now()) + '</span>' : '<b>' + esc(run.m.title) + '</b>') + '<span class="count">' + (run.i + 1) + ' / ' + n + '</span></div>';
  html += '<div class="prog"><i style="width:' + Math.round((run.i + 1) / n * 100) + '%"></i></div>';
  html += '<article class="qcard' + (q.kind === "hazard" ? " hz" : "") + '">' + bodyHtml(q);
  if (q.kind === "order"){
    html += orderHtml(q, false) + '<div class="ord-act"><button class="btn ghost" data-act="ord-clear">Clear</button></div>';
  } else if (q.kind === "multi"){
    html += multiHtml(q, run.order[run.i], Array.isArray(run.ans[run.i]) ? run.ans[run.i] : (run.ans[run.i] = []), false);
  } else if (q.kind === "spot"){
    html += spotHtml(q, false);
  } else if (q.kind === "num" || q.kind === "type"){
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
  $$(".opt[data-o]", v).forEach(function(b){ b.addEventListener("click", function(){ run.ans[run.i] = +b.getAttribute("data-o"); renderRun(); }); });
  if (q.kind === "multi") wireMulti(v, run.ans[run.i], function(){});
  if (q.kind === "spot"){
    var xc = $(".qcard", v), xi = run.i;
    paintSpot(xc, q, run.ans[xi], false);
    wireSpot(xc, function(i){ run.ans[xi] = run.ans[xi] === i ? null : i; paintSpot(xc, q, run.ans[xi], false); });
  }
  var inp = $("#x-inp", v);
  if (inp){ inp.addEventListener("input", function(){ run.ans[run.i] = inp.value; }); inp.addEventListener("keydown", function(e){ if (e.key === "Enter") $('[data-act="fwd"]', v).click(); }); }
  if (q.kind === "order"){
    var pk = Array.isArray(run.ans[run.i]) ? run.ans[run.i] : (run.ans[run.i] = []), oc = $(".qcard", v);
    paintOrder(oc, q, pk, false); wireOrder(oc, q, pk, function(){});
    $('[data-act="ord-clear"]', v).addEventListener("click", function(){ pk.length = 0; paintOrder(oc, q, pk, false); });
  }
  wireAudio(v, q);
}
function finishExam(timedOut){
  stopTimer();
  var r = run, t = r.t, n = r.qs.length, s = 0, wrongBy = {};
  r.qs.forEach(function(q, k){ var ok = isRight(q, r.ans[k]); if (ok) s++; else wrongBy[q.topic] = (wrongBy[q.topic] || 0) + 1; record(q, ok, true); });
  var need = passMark(r.m, n), ok = s >= need;
  if (window.KLAAR_STATS) KLAAR_STATS.mock(t, r.m.id, s, n, ok);
  var list = S.t[t].mocks[r.m.id] || (S.t[t].mocks[r.m.id] = []);
  list.push({s:s, n:n, p:ok, at:Date.now()}); if (list.length > 20) S.t[t].mocks[r.m.id] = list.slice(-20);
  if (t === "drive" && r.m.id === "full"){ var l3 = S.t.drive.mocks.full.slice(-3); if (l3.length === 3 && l3.every(function(x){ return x.p; })) S.plan["d-mock3"] = true; }
  if (t === "civic" && ok && ["knm", "a2-lezen", "a2-luisteren", "a2-schrijven"].indexOf(r.m.id) >= 0 && s / n >= 0.85 && S.t.civic.level < 2 &&
      ["knm", "a2-lezen", "a2-luisteren", "a2-schrijven"].every(function(id){ return mockPassed("civic", id); })) { S.t.civic.level = 2; toast("All four exam parts cleared. B1 questions now join your practice."); }
  save();
  var verdict;
  if (t === "drive") verdict = (timedOut ? "Time's up. " : "") + (ok ? "Passed. Keep going until you pass the full mock 3 times in a row." : "On the real exam this is a fail: " + (n - s) + " wrong, max " + (n - need) + ".");
  else if (r.m.exam) verdict = s / n >= 0.85 ? "Ready. You can book this part of the real exam." : (ok ? "Passed, but close. Do it once more before booking." : "Not yet. Review below, practise the weak topics, try again.");
  else verdict = ok ? "Passed. Next level unlocked." : "Not yet. Review below and try again.";
  var topics = Object.keys(wrongBy).sort(function(a, b){ return wrongBy[b] - wrongBy[a]; });
  var v = $("#v-exams");
  var html = '<div class="run-top"><button class="link" data-act="back">&larr; All tests</button><b>' + esc(r.m.title) + '</b><span></span></div>';
  html += '<article class="qcard"><div class="score"><b class="' + (ok ? "ok" : "no") + '">' + s + '/' + n + '</b><span>pass mark ' + need + '/' + n + '</span></div>' +
    '<p style="font-weight:700;text-align:center;margin:14px 0 6px">' + esc(verdict) + '</p>' +
    (topics.length ? '<p class="note" style="text-align:center">Weakest: ' + topics.slice(0, 3).map(function(x){ return esc(x) + " (" + wrongBy[x] + ")"; }).join(", ") + '. These now come up more often in practice.</p>' : "") +
    '<div class="nav"><button class="btn ghost" data-act="again">New attempt</button><button class="btn" data-act="back2">All tests</button></div></article>';
  html += '<div class="label">Mistakes first</div>';
  r.qs.map(function(q, k){ return k; }).sort(function(a, b){ return (isRight(r.qs[a], r.ans[a]) ? 1 : 0) - (isRight(r.qs[b], r.ans[b]) ? 1 : 0); }).forEach(function(k){
    var q = r.qs[k], a = r.ans[k], good = isRight(q, a);
    var yours = q.kind === "order" ? (Array.isArray(a) && a.length ? orderText(q, a) : "(no answer)") : q.kind === "multi" ? (Array.isArray(a) && a.length ? multiText(q, a) : "(no answer)") : q.kind === "spot" ? (a === null ? "(no answer)" : spotName(q, a)) : (q.o ? (a === null ? "(no answer)" : q.o[a]) : (a ? a : "(empty)"));
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
/* inburgering's own: how long until you can apply for citizenship */
function civicHero(){
  var html = "";
  var cd = citizenDates();
    if (cd){
      var now = new Date(), days = Math.max(0, Math.ceil((cd.at - now) / 86400000));
      var pct = Math.min(100, Math.max(0, (now - cd.from) / (cd.at - cd.from) * 100));
      html += '<div class="hero"><div class="cap">' + (days ? "Days until you can apply for citizenship" : "You can apply for citizenship") + '</div><div class="big tabular">' + days + '</div><div class="bar"><i style="width:' + pct.toFixed(1) + '%"></i></div><div class="meta"><span>' + fmtDate(cd.from) + '</span><span>' + Math.round(pct) + '% of 5 years</span><span>' + fmtDate(cd.at) + '</span></div><button class="link hero-edit" data-act="arr-edit">Change date</button></div>';
    } else {
      html += '<div class="hero"><div class="cap">Citizenship countdown</div><p class="hero-q">When did you start living in the Netherlands legally?</p><div class="hero-row"><input type="date" class="inp" id="arr-in" aria-label="Date you started living in the Netherlands"><button class="btn" data-act="arr-set">Save</button></div><p class="hero-note">Most people can apply after 5 years of legal residence. Some can apply sooner. Check ind.nl for your situation.</p></div>';
    }
  return html;
}
function renderProgress(pre){
  var t = S.track, tr = S.t[t], v = $("#v-home"), html = "";
  html = (pre || "") + html;

  if (!aiOff && SAMPLE){
    html += '<div class="label">Fresh questions</div><div class="ai-box">';
    html += '<p>' + GEN[t].length + ' questions written for you so far. When you run low, new batches arrive automatically while you scroll, tuned to your level and weak topics.</p>';
    html += '<button class="btn pop" data-act="gen"' + (ai[t] === "busy" ? " disabled" : "") + '>' + (ai[t] === "busy" ? "Writing questions…" : "Write 8 new questions now") + '</button></div>';
  }

  if (false) html += t === "drive" ?
    '<div class="also"><h3>Staying in the Netherlands?</h3><p>Klaar also prepares you for the inburgering exam: Dutch society (KNM) and Dutch at A2, with listening you can play back. Your driving progress is kept.</p><button class="btn ghost" data-act="other-goal">Try inburgering practice</button></div>' :
    '<div class="also"><h3>Need a Dutch driving licence too?</h3><p>Klaar has a full plan for the CBR theory exam, in English. Your inburgering progress is kept.</p><button class="btn ghost" data-act="other-goal">Go to driving theory</button></div>';
  v.innerHTML = html;
  var g = $('[data-act="gen"]', v); if (g) g.addEventListener("click", function(){ generate(t, 8); renderHome(); });
  var jg = $('[data-act="j-go"]', v); if (jg) jg.addEventListener("click", function(){ setView("exams"); });
  $$("[data-plan]", v).forEach(function(c){ c.addEventListener("click", function(){ var k = c.getAttribute("data-plan"); S.plan[k] = !S.plan[k]; save(); renderHome(); }); });
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
  if (window.I18N && Object.keys(I18N.langs).length > 1){
    html += '<div class="label">Language</div><div class="stats" role="group" aria-label="Language">' + Object.keys(I18N.langs).map(function(l){ return '<button class="btn ' + (I18N.get() === l ? "" : "ghost") + '" data-lang="' + l + '" lang="' + l + '" translate="no">' + I18N.langs[l].label + '</button>'; }).join("") + '</div>' +
      '<p class="note">Menus and instructions are in your language. Questions are still in English and Dutch.</p>';
  }
  html += '<div class="label">Your goal</div><div class="pair" role="group" aria-label="Your goal">' + [["drive", "Driving theory"], ["civic", "Inburgering"]].map(function(g){ return '<button class="btn ' + (S.track === g[0] ? "" : "ghost") + '" data-goal-t="' + g[0] + '">' + g[1] + '</button>'; }).join("") + '</div><p class="note">Klaar shows one goal at a time. Your progress on the other one is kept.</p>';
  html += '<div class="label">Daily goal</div><div class="stats" role="group" aria-label="Daily goal">' + [15, 30, 50].map(function(g){ return '<button class="btn ' + (S.goal === g ? "" : "ghost") + '" data-goal="' + g + '">' + g + ' a day</button>'; }).join("") + '</div><p class="note">Counts right answers for the goal you are on. A wrong answer comes back later and counts when you get it right.</p>';

  html += '<div class="label">How you learn</div><div class="pair" role="group" aria-label="How you learn">' + [["learn", "Lessons first"], ["test", "Questions only"]].map(function(s){ return '<button class="btn ' + ((teachFirst() ? "learn" : "test") === s[0] ? "" : "ghost") + '" data-style="' + s[0] + '">' + s[1] + '</button>'; }).join("") + '</div>' +
    '<p class="note">' + (teachFirst() ? "Each new topic starts with a short animated lesson, then questions on it. Mock exams are always the real test." : "You get questions straight away and learn from the answers.") + '</p>';


  if (window.KLAAR_SYNC) html += KLAAR_SYNC.profileHtml();
  html += '<div class="label">Your level and goals</div><div class="ai-box"><p>' + esc(profileLine()) + '</p><button class="btn ghost" data-act="redo-prof" style="width:100%">Change my level and goals</button></div>';
  html += '<div class="label">Share Klaar</div><div class="ai-box"><p>Know someone preparing for these exams? Send them the link. It shows them how to install it.</p><button class="btn ghost" data-act="share-app" style="width:100%">Share the link</button></div>';
  html += '<div class="label">Start again</div><div class="ai-box"><p>Clears your answers, mocks and streak on this phone. Your name, language and goals stay.</p><button class="btn ghost danger" data-act="reset" style="width:100%">Start from scratch</button></div>';
  html += '<div class="label">Backup</div><div class="ai-box"><p>' + (window.KLAAR_SYNC && KLAAR_SYNC.signedIn() ? "Your progress is saved to your account. A backup file is an extra copy you keep yourself." : "Progress lives on this phone. Save a backup file now and then, so a new phone or a cleared browser doesn\'t wipe it.") + '</p><div class="pair"><button class="btn ghost" data-act="bk-save">Save backup</button><label class="btn ghost" for="bk-file">Restore<input type="file" id="bk-file" accept="application/json,.json" hidden></label></div></div>';
  if (window.KLAAR_STATS && KLAAR_STATS.ready()) html += '<div class="label">Anonymous stats</div><div class="ai-box"><p>Klaar counts which screens are used and which questions people get wrong, so the hard parts can be fixed. If you report a question, the question number and your reason are sent, also when stats are off. No name, no email, no cookies. Your progress is never part of these counts. <a href="privacy/" target="_blank" rel="noopener">Read the privacy page</a></p><button class="btn ghost" data-act="stats" style="width:100%">' + (KLAAR_STATS.on() ? "Turn off anonymous stats" : "Turn on anonymous stats") + '</button></div>';
  html += '<p class="note">Works offline. Practice questions are original and in the style of the real exams, not official CBR or DUO material.</p><p class="note prof-links"><a href="terms/" target="_blank" rel="noopener">Terms</a> <a href="privacy/" target="_blank" rel="noopener">Privacy</a></p><p class="note diag" id="diag"></p>';
  v.innerHTML = html;
  $('[data-act="prof-back"]', v).addEventListener("click", function(){ setView(backTo); });
  if (window.KLAAR_SYNC) KLAAR_SYNC.wire(v);
  var stb = $('[data-act="stats"]', v); if (stb) stb.addEventListener("click", function(){ KLAAR_STATS.set(!KLAAR_STATS.on()); stb.textContent = KLAAR_STATS.on() ? "Turn off anonymous stats" : "Turn on anonymous stats"; });
  var nm = $("#prof-name", v), nt = null;
  nm.addEventListener("input", function(){ clearTimeout(nt); nt = setTimeout(function(){ S.prof = S.prof || {}; S.prof.name = nm.value.trim().slice(0, 30); save(); renderAvatar(); var a = $(".prof-card .avatar", v); if (a) a.innerHTML = avatarInner(); }, 300); });
  var rp = $('[data-act="redo-prof"]', v); if (rp) rp.addEventListener("click", function(){ if (window.KLAAR_PROFILE) window.KLAAR_PROFILE(); });
  var sa = $('[data-act="share-app"]', v); if (sa) sa.addEventListener("click", shareApp);
  var dg = $("#diag", v); if (dg && window.KLAAR_DIAG){ dg.textContent = "Version " + KLAAR_VERSION; dg.addEventListener("click", function(){ dg.textContent = window.KLAAR_DIAG(); }); }
  var bx = $('[data-act="bk-save"]', v); if (bx) bx.addEventListener("click", backupSave);
  var rs = $('[data-act="reset"]', v); if (rs) rs.addEventListener("click", function(){ if (rs.getAttribute("data-sure")){ resetProgress(); toast("Fresh start. Your progress is back to zero."); return; } rs.setAttribute("data-sure", "1"); rs.textContent = "Tap again to clear everything"; });
  var bi = $("#bk-file", v); if (bi) bi.addEventListener("change", function(){ if (bi.files && bi.files[0]) backupLoad(bi.files[0]); });
  $$("[data-goal-t]", v).forEach(function(b){ b.addEventListener("click", function(){ var t = b.getAttribute("data-goal-t"); if (t === S.track) return; S.prof = S.prof || {}; S.prof.goals = [t]; setTrack(t); toast(t === "drive" ? "Now on driving theory." : "Now on inburgering."); }); });
  $$("[data-goal]", v).forEach(function(b){ b.addEventListener("click", function(){ S.goal = +b.getAttribute("data-goal"); save(); renderProfile(); }); });
  $$("[data-lang]", v).forEach(function(b){ b.addEventListener("click", function(){ I18N.set(b.getAttribute("data-lang")); }); });
  $$("[data-style]", v).forEach(function(b){ b.addEventListener("click", function(){ S.prof = S.prof || {}; S.prof.style = b.getAttribute("data-style"); lesson = null; save(); renderProfile(); }); });
}

function srcName(u){ var m = /^https?:\/\/(?:www\.)?([^\/]+)/.exec(String(u)), p = /#page=(\d+)$/.exec(String(u)); return (m ? m[1] : String(u)) + (p ? ", page " + p[1] : ""); }
/* a source line that opens the page the fact comes from */
function srcLink(u){ return /^https:\/\//.test(String(u)) ? '<p class="src"><a href="' + esc(u) + '" target="_blank" rel="noopener">Source: ' + esc(srcName(u)) + '</a></p>' : '<p class="src">Source: ' + esc(srcName(u)) + '</p>'; }
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

/* ---------------- your plan: exam date, readiness, pace, and what to do next ---------------- */
var PASS_PCT = {drive: 88, civic: 75};
/* days until the exam: exact when you gave a date, a rough count when you picked "within 4 weeks" or "1 to 3 months" */
function examDays(t){
  var ex = (prof().exam || {})[t]; if (!ex) return null;
  if (ex.date){ var p = ex.date.split("-"), d = Math.ceil((new Date(+p[0], +p[1] - 1, +p[2]) - new Date()) / 86400000); return d >= 0 ? {n:d, exact:true} : null; }
  var span = {"4w":28, "3m":60}[ex.when]; if (!span) return null;
  var left = span - Math.floor((Date.now() - (prof().at || Date.now())) / 86400000);
  return left > 0 ? {n:left, exact:false} : null;
}
/* per topic: how much of it you have seen and how often you get it right */
function topicStats(t){
  var tr = S.t[t], by = {}, order = [], cap = levelCap(t), last = tr.last || {};
  pool(t).forEach(function(q){
    if ((q.lvl || 1) > cap) return;
    var x = by[q.topic]; if (!x){ x = by[q.topic] = {name:q.topic, total:0, seen:0, right:0, old:0}; order.push(q.topic); }
    x.total++; if (tr.seen[q.id]){ x.seen++; if (last[q.id] === 1) x.right++; else if (last[q.id] == null) x.old++; }
  });
  return order.map(function(k){
    var x = by[k], a = tr.topics[k] || {a:0, ok:0};
    x.a = a.a; x.acc = a.a ? a.ok / a.a : null;
    x.state = !x.seen ? "new" : (a.a >= 3 && x.acc < 0.7 ? "weak" : (x.seen >= x.total && x.acc >= PASS_PCT[t] / 100 ? "strong" : "going"));
    x.score = (x.right + x.old * (x.acc == null ? 0 : x.acc)) / x.total;   /* answers from before results were kept per question count at the topic's average */
    return x;
  });
}
function mistakes(t){ var tr = S.t[t], last = tr.last || {}, cap = levelCap(t); return pool(t).filter(function(q){ return last[q.id] === 0 && (q.lvl || 1) <= cap; }); }
function plan(t){
  var tr = S.t[t], ts = topicStats(t), total = 0, seen = 0, score = 0;
  ts.forEach(function(x){ total += x.total; seen += x.seen; score += x.score * x.total; });
  var left = total - seen, ex = examDays(t), mockDays = ex ? (ex.n > 14 ? 5 : (ex.n > 5 ? 2 : 0)) : 0;
  var pace = ex && left ? Math.ceil(left / Math.max(1, ex.n - mockDays)) : 0;
  var today = dayKey(), drilled = tr.drill || {};
  var weak = ts.filter(function(x){ return x.state === "weak" && drilled[lessonKey(t, x.name)] !== today; }).sort(function(a, b){ return a.acc - b.acc; });
  var p = pool(t).filter(function(q){ return (q.lvl || 1) <= levelCap(t); });
  var nl = teachFirst() ? nextLessonTopic(t, p) : null, next;
  function fix(x){ return {kind:"drill", topic:x.name, title:"Fix " + x.name, why:"You get " + Math.round(x.acc * 100) + "% right here. " + (t === "drive" ? "The CBR pass mark is 88%." : "Aim for 75% or more.")}; }
  var miss = drilled[MISTAKES] === today ? 0 : mistakes(t).length;
  var redo = {kind:"mistakes", title:"Fix your " + miss + (miss === 1 ? " mistake" : " mistakes"), why:"Questions you got wrong the last time. Get them right and your readiness goes up."};
  if (weak[0] && weak[0].acc < 0.6) next = fix(weak[0]);
  else if (miss >= 6) next = redo;
  else if (nl) next = {kind:"lesson", topic:nl, title:"Learn " + nl, why:"A new topic: a short lesson, then questions on it."};
  else if (weak[0]) next = fix(weak[0]);
  else if (miss) next = redo;
  else if (left) next = {kind:"mix", title:"Practise new questions", why:left + " questions you have not seen yet."};
  else next = {kind:"mock", title:"Take a mock exam", why:"You have seen every question. A mock exam shows if you are ready."};
  var status, raise = 0;
  if (!left) status = ex ? "Every question seen. Use the days left for mock exams and your weak topics." : "Every question seen. Mock exams are the real check now.";
  else if (!ex) status = "At " + S.goal + " a day you see every question in " + (Math.ceil(left / S.goal) === 1 ? "1 day" : Math.ceil(left / S.goal) + " days") + ". Add your exam date and the plan works back from it.";
  else if (pace <= S.goal) status = "On pace. " + pace + " new questions a day covers everything" + (mockDays ? " and leaves " + mockDays + " days for mock exams." : " before the exam.");
  else { raise = Math.min(80, Math.ceil(pace / 5) * 5); status = "Behind. You need about " + pace + " questions a day to see everything before the exam. Your daily goal is " + S.goal + "."; }
  return {topics:ts, total:total, seen:seen, left:left, ready:total ? Math.round(score / total * 100) : 0, exam:ex, pace:pace, status:status, raise:raise > S.goal ? raise : 0, next:next};
}
/* practise one topic: its lesson first if you have not had it, else a drill of up to 10 (missed and new ones first) */
function practiseTopic(t, topic, lessonOnly){
  var key = lessonKey(t, topic), tr = S.t[t], steps = topicLesson(t, topic);
  cur = null; lastId = null; lesson = null; focus = null;
  if (steps && (lessonOnly || (teachFirst() && !(tr.primers || {})[key]))) lesson = {track:t, topic:key, primer:{steps:steps, i:0}};
  else {
    var n = pool(t).filter(function(q){ return lessonKey(t, q.topic) === key && (q.lvl || 1) <= levelCap(t); }).length;
    if (!n){ toast("No questions on this topic yet."); return; }
    focus = {track:t, topic:key, n:Math.min(UNIT_MAX, n), asked:0, ok:0, drill:true, ids:{}};
  }
  setView("feed");
}
/* practise one inburgering exam part: its first lesson you have not had, then a drill of up to 10 from that part only */
function practisePart(k){
  var t = "civic", tr = S.t[t], cap = levelCap(t);
  var qs = pool(t).filter(function(q){ return partOf(q) === k && (q.lvl || 1) <= cap; });
  if (!qs.length){ toast("No questions in this part yet."); return; }
  cur = null; lastId = null; lesson = null;
  focus = {track:t, topic:partName(k), part:k, n:Math.min(UNIT_MAX, qs.length), asked:0, ok:0, drill:true, ids:{}};
  var order = (window.LESSON_ORDER && LESSON_ORDER[t]) || [], done = tr.primers || {};
  if (teachFirst()) for (var i = 0; i < order.length; i++){
    var key = order[i];
    if (done[key] || !topicLesson(t, key) || !qs.some(function(q){ return lessonKey(t, q.topic) === key; })) continue;
    lesson = {track:t, topic:key, primer:{steps:topicLesson(t, key), i:0}, keep:focus};
    break;
  }
  setView("feed");
}
function practiseMistakes(t){
  var ms = mistakes(t); if (!ms.length){ toast("No mistakes to fix right now."); return; }
  var set = {}; ms.forEach(function(q){ set[q.id] = 1; });
  cur = null; lastId = null; lesson = null;
  focus = {track:t, topic:MISTAKES, n:Math.min(UNIT_MAX, ms.length), asked:0, ok:0, drill:true, ids:{}, set:set};
  setView("feed");
}
function startNext(t, n){
  if (n.kind === "mock"){ setView("exams"); return; }
  if (n.kind === "mistakes"){ practiseMistakes(t); return; }
  if (n.kind === "drill" || n.kind === "lesson"){ practiseTopic(t, n.topic); return; }
  cur = null; focus = null; practiceMode = "mix"; setView("feed");
}
function mockLine(t){
  var m = (S.t[t].mocks || {})[t === "drive" ? "full" : "knm"] || [], l = m[m.length - 1];
  return l ? '<p class="plan-mock">Last ' + (t === "drive" ? "full" : "KNM") + ' mock: <b class="tabular">' + l.s + ' of ' + l.n + '</b>, ' + (l.p ? "passed" : "not passed yet") + '.</p>' : "";
}
function planHtml(t, todayLine){
  var P = plan(t), ex = P.exam, exRaw = ((prof().exam || {})[t]) || {}, exact = ex && ex.exact;
  var html = '<div class="plan"><div class="sign"><div class="plan-figs">' +
    '<div class="plan-fig"><b class="tabular">' + (ex ? ex.n : "&ndash;") + '</b><span>' + (ex ? (ex.n === 1 ? "day" : "days") + " to your exam" + (ex.exact ? "" : ", roughly") : "No exam date yet") + '</span></div>' +
    '<div class="plan-fig"><b class="tabular">' + P.ready + '<small>%</small></b><span>ready</span></div></div>' +
    '<div class="plan-bar" role="img" aria-label="' + P.ready + '% ready, pass mark ' + PASS_PCT[t] + '%"><i style="width:' + P.ready + '%"></i><u style="inset-inline-start:' + PASS_PCT[t] + '%"><span>Pass ' + PASS_PCT[t] + '%</span></u></div>' +
    '<p class="plan-status">' + esc(P.status) + '</p>' + mockLine(t) +
    (todayLine ? '<p class="plan-today">' + esc(todayLine) + '</p>' : "") +
    '<button class="link plan-edit" data-act="plan-date-edit">' + (exact ? "Change exam date" : "Add your exam date") + '</button></div>' +
    (P.raise ? '<button class="btn ghost plan-raise" data-act="plan-raise" data-n="' + P.raise + '">Make my goal ' + P.raise + ' a day</button>' : "") +
    '<div class="plan-next"><h3 class="plan-title">Next: ' + esc(P.next.title) + '</h3><p>' + esc(P.next.why) + '</p>' +
    '<button class="btn pop" data-act="plan-go">' + (P.next.kind === "mock" ? "Go to exams" : "Start") + '</button></div>' +
    '<div class="plan-date" hidden id="plan-date"><label for="plan-date-in">Exam date</label><div class="hero-row"><input type="date" class="inp" id="plan-date-in" value="' + esc(exRaw.date || "") + '"><button class="btn" data-act="plan-date-ok">Save</button></div></div>' +
    '</div>';
  return html;
}
function wirePlan(v, t){
  var go = $('[data-act="plan-go"]', v); if (go) go.addEventListener("click", function(){ startNext(t, plan(t).next); });
  var rs = $('[data-act="plan-raise"]', v); if (rs) rs.addEventListener("click", function(){ S.goal = +rs.getAttribute("data-n"); save(); renderHome(); toast("Daily goal: " + S.goal + " a day."); });
  var ed = $('[data-act="plan-date-edit"]', v); if (ed) ed.addEventListener("click", function(){ var d = $("#plan-date", v); d.hidden = false; ed.hidden = true; var inp = $("#plan-date-in", d); if (inp) inp.focus(); });
  var ok = $('[data-act="plan-date-ok"]', v); if (ok) ok.addEventListener("click", function(){
    var val = $("#plan-date-in", v).value; if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return toast("Pick a date first.");
    S.prof = S.prof || {}; S.prof.exam = S.prof.exam || {}; S.prof.exam[t] = {when:"date", date:val}; save(); renderHome();
  });
}
var homeOpen = {};
var STATE_NAME = {weak:"Weak", going:"Going", "new":"New", strong:"Strong"};
function topicsHtml(t){
  var rank = {weak:0, going:1, "new":2, strong:3};
  var ts = topicStats(t).map(function(x, i){ x.i = i; return x; }).sort(function(a, b){ return rank[a.state] - rank[b.state] || (a.state === "new" ? a.i - b.i : (a.acc || 0) - (b.acc || 0)); });
  var ms = mistakes(t).length, SHOW = 3, rest = ts.slice(SHOW);
  function row(x){
    var sub = x.state === "new" ? "Not started, " + x.total + " questions" : Math.round((x.acc || 0) * 100) + "% right, " + x.seen + " of " + x.total + " seen";
    return '<div class="tp tp-' + x.state + '"><button class="tp-main" data-topic="' + esc(x.name) + '"><span class="tp-name">' + esc(x.name) + '</span><span class="tp-sub">' + sub + '</span>' +
      '<span class="tp-bar"><i style="width:' + Math.round(x.seen / x.total * 100) + '%"></i></span></button>' +
      '<span class="tp-state">' + STATE_NAME[x.state] + '</span>' +
      (topicLesson(t, x.name) ? '<button class="tp-les" data-topic-les="' + esc(x.name) + '" aria-label="Lesson: ' + esc(x.name) + '">Lesson</button>' : "") + '</div>';
  }
  return '<div class="label">' + (ts.some(function(x){ return x.state !== "new"; }) ? "Work on these" : "Start with these") + '</div><div class="topics">' +
    (ms ? '<div class="tp tp-weak"><button class="tp-main" data-act="mistakes"><span class="tp-name">Your mistakes</span><span class="tp-sub">' + ms + (ms === 1 ? " question" : " questions") + ' you got wrong the last time</span></button><span class="tp-state">Fix</span></div>' : "") +
    ts.slice(0, SHOW).map(row).join("") + '</div>' +
    (rest.length ? '<details class="tp-more"' + (homeOpen.topics ? " open" : "") + ' data-fold="topics"><summary>All ' + ts.length + ' topics</summary><div class="topics">' + rest.map(row).join("") + '</div></details>' : "");
}

/* ---------------- driving Home: a readiness ring, the route to a licence, one next step, topics as colour tiles ---------------- */
var SHORT = {"Hazard perception":"Hazards", "Lights & visibility":"Lights", "Railway crossings":"Railway", "Vehicle condition":"Vehicle", "Road markings":"Markings",
  "Alcohol limit":"Alcohol", "Stopping & parking":"Parking", "Mobile phones":"Phones", "Speed limits":"Speed", "Lane use":"Lanes"};
var TILE_WORD = {weak:"Fix", going:"Going", strong:"Solid", "new":"New"};
var ringShown = {};
function readyState(t, p){ return p === 0 ? "new" : (p < 50 ? "weak" : (p < PASS_PCT[t] ? "going" : "strong")); }
var READY_WORD = {"new":"Let's start", weak:"Not yet", going:"Getting close", strong:"Klaar"};
function addDays(d, n){ var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function monthName(d, yr){ return d.toLocaleDateString(loc(), yr ? {month:"long", year:"numeric"} : {month:"long"}); }
function dayMonth(d){ return d.toLocaleDateString(loc(), {day:"numeric", month:"short"}); }
/* the road from theory to licence. Lessons: most people need about 40 hours, so about 4 months at 2 or 3 a week.
   After the practical exam you apply at your town hall, and the licence is ready about 5 working days later. */
function licenceRoute(t, P){
  var pl = S.plan || {}, ex = P.exam, now = new Date(), D = licDates();
  var theory = ex ? addDays(now, ex.n) : (D ? D.theory : null);
  var practical = D ? D.practical : (theory ? addDays(theory, 120) : null), licence = D ? D.licence : (practical ? addDays(practical, 14) : null);
  var at = pl["d-practical"] ? 3 : (pl["d-lessons"] ? 2 : (pl["d-theory"] ? 1 : 0));
  var done = at === 0 ? P.ready / 100 * 0.22 : at * 0.25 + 0.05;
  var stops = [
    {name:"Theory", when:pl["d-theory"] ? "Passed" : (theory ? dayMonth(theory) : "Add a date")},
    {name:"Lessons", when:pl["d-lessons"] ? "Done" : (D ? "Until " + monthName(D.practical) : (theory ? "4 months" : "After theory"))},
    {name:"Practical", when:pl["d-practical"] ? "Passed" : (practical ? monthName(practical) : "After lessons")},
    {name:"Licence", when:licence ? monthName(licence) : "A week later"}
  ];
  return {stops:stops, at:at, done:Math.min(1, done), licence:licence, by:!!D};
}
function driveHomeHtml(t, P){
  var st = readyState(t, P.ready), ex = P.exam, today = rightToday(), sk = streak();
  var R = licenceRoute(t, P), r = 58, C = 364.4;
  var html = '<section class="rc" aria-label="Your readiness"><div class="rc-top">' +
    '<div class="rc-ring rs-' + st + '" data-ready="' + P.ready + '"><i class="rc-glow"></i><svg viewBox="0 0 140 140" role="img" aria-label="' + P.ready + '% ready, pass mark ' + PASS_PCT[t] + '%"><circle class="rc-track" cx="70" cy="70" r="' + r + '"/><circle class="rc-arc" cx="70" cy="70" r="' + r + '" style="stroke-dasharray:' + C + ';stroke-dashoffset:' + (C * (1 - P.ready / 100)).toFixed(1) + '"/></svg>' +
    '<div class="rc-num"><b class="tabular"><span class="rc-n">' + P.ready + '</span><small>%</small></b><span>ready</span></div></div>' +
    '<div class="rc-side"><span class="rc-pill rs-' + st + '">' + READY_WORD[st] + '</span>' +
    (ex ? '<div><b class="rc-days tabular">' + ex.n + '</b><span class="rc-cap">' + (ex.n === 1 ? "day" : "days") + ' to your theory exam' + (ex.exact ? "" : ", roughly") + '</span></div>' :
      '<div><span class="rc-cap">No theory exam date yet</span></div>') +
    '<span class="rc-today">' + today + ' of ' + S.goal + ' today' + (sk > 1 ? ", " + sk + "-day streak" : "") + '</span>' +
    '<button class="link rc-date" data-act="plan-date-edit">' + (ex && ex.exact ? "Change date" : "Add exam date") + '</button></div></div>' +
    '<div class="plan-date" hidden id="plan-date"><label for="plan-date-in">Theory exam date</label><div class="hero-row"><input type="date" class="inp" id="plan-date-in" value="' + esc((((prof().exam || {})[t]) || {}).date || "") + '"><button class="btn" data-act="plan-date-ok">Save</button></div></div>' +
    (P.raise ? '<button class="rc-raise" data-act="plan-raise" data-n="' + P.raise + '">You need about ' + P.pace + ' a day to be ready. <b>Make my goal ' + P.raise + '</b></button>' : "") +
    '<div class="rc-route"><div class="rc-route-h"><span>' + (lic().from === "eu" ? "You can usually swap your licence" : (R.licence ? (R.by ? "Licence by " : "Licence around ") + monthName(R.licence, true) : "Your route to a licence")) + '</span><button class="link" data-act="your-plan">Your plan ›</button></div>' +
    '<div class="rc-road"><i style="width:' + Math.round(R.done * 100) + '%"></i></div><ol class="rc-stops">' +
    R.stops.map(function(s, i){ return '<li class="' + (i < R.at ? "done" : (i === R.at ? "now" : "")) + '"><b>' + s.name + '</b><span>' + esc(s.when) + '</span></li>'; }).join("") + '</ol></div></section>';
  return nextHtml(P) + html;
}
function tilesHtml(t, ts){
  var rank = {weak:0, going:1, "new":2, strong:3};
  ts = ts.map(function(x, i){ x.i = i; return x; }).sort(function(a, b){ return rank[a.state] - rank[b.state] || (a.state === "new" ? a.i - b.i : (a.acc || 0) - (b.acc || 0)); });
  var fix = ts.filter(function(x){ return x.state === "weak"; }).length, fresh = ts.filter(function(x){ return x.state === "new"; }).length, ms = mistakes(t).length;
  var html = '<section class="tl" aria-label="Your topics"><div class="tl-h"><h2>Your topics</h2><span>' + (fix ? fix + " to fix" : (fresh === ts.length ? ts.length + " to start" : "Nothing to fix")) + '</span></div><div class="tl-grid">';
  ts.forEach(function(x, j){
    html += '<button class="tile ts-' + x.state + '" data-tile="' + esc(x.name) + '" style="animation-delay:' + (300 + j * 30) + 'ms" aria-label="' + esc(x.name) + ', ' + TILE_WORD[x.state] + '"><i></i><span>' + esc(SHORT[x.name] || x.name) + '</span></button>';
  });
  html += '</div><div class="tl-key"><span class="ts-weak"><i></i>Fix</span><span class="ts-going"><i></i>Going</span><span class="ts-strong"><i></i>Solid</span><span class="ts-new"><i></i>New</span></div>' +
    (ms ? '<button class="link tl-miss" data-act="mistakes">Fix your ' + ms + (ms === 1 ? " mistake" : " mistakes") + ' ›</button>' : "") + '</section>';
  return html;
}
function topicSheet(t, name){
  var x = topicStats(t).filter(function(y){ return y.name === name; })[0]; if (!x) return;
  var les = topicLesson(t, name), seenLes = ((S.t[t].primers || {})[lessonKey(t, name)]);
  var stat = x.state === "new" ? "Not started. " + x.total + " questions." : Math.round((x.acc || 0) * 100) + "% right. " + x.seen + " of " + x.total + " questions seen.";
  openSheet('<div class="tsh ts-' + x.state + '"><div class="tsh-h"><i></i><h2>' + esc(name) + '</h2></div><p>' + esc(stat) + '</p>' +
    '<div class="tsh-bar"><i style="width:' + Math.round(x.seen / x.total * 100) + '%"></i></div>' +
    '<button class="btn pop" data-act="tsh-go">' + (les && !seenLes ? "Start with the lesson" : "Practise " + Math.min(UNIT_MAX, x.total) + " questions") + '</button>' +
    (les && seenLes ? '<button class="btn ghost" data-act="tsh-les">Read the lesson again</button>' : "") + '</div>', true);
  var go = $('[data-act="tsh-go"]'); if (go) go.addEventListener("click", function(){ closeSheet(); practiseTopic(t, name); });
  var le = $('[data-act="tsh-les"]'); if (le) le.addEventListener("click", function(){ closeSheet(); practiseTopic(t, name, true); });
}
/* the ring fills and the number counts up, only when the number changed since you last saw it */
function animateRing(v, t){
  var el = $(".rc-ring", v); if (!el) return;
  var to = +el.getAttribute("data-ready"), from = ringShown[t] == null ? 0 : ringShown[t]; ringShown[t] = to;
  if (from === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var arc = $(".rc-arc", el), num = $(".rc-n", el), C = 364.4, t0 = null, dur = 1300;
  function paint(p){ arc.style.strokeDashoffset = (C * (1 - p / 100)).toFixed(1); num.textContent = Math.round(p); el.className = "rc-ring rs-" + readyState(t, Math.round(p)); }
  paint(from);
  function tick(ts){ if (t0 == null) t0 = ts; var k = Math.min(1, (ts - t0 - 200) / dur), e = k < 0 ? 0 : 1 - Math.pow(1 - k, 3); paint(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
}

/* ---------------- your licence plan: is your date realistic, what it takes, and where to go (the official sites) ---------------- */
var homeSub = null;
var LIC_PLANS = {
  3: {theory:3, practical:11, licence:12, word:"Very tight", cls:"weak", say:"Possible, but only with an intensive course and an early practical exam date. Waiting times for the practical exam can be several weeks, so ask your driving school to book it as soon as you start."},
  6: {theory:5, practical:22, licence:24, word:"Realistic", cls:"going", say:"Pass the theory exam in about 5 weeks, then take 2 or 3 lessons a week. Your driving school books the practical exam when you are nearly ready."},
  12: {theory:8, practical:44, licence:46, word:"Comfortable", cls:"strong", say:"Plenty of time. Take the theory exam first, then spread your lessons and book the practical exam when your instructor says you are ready."}
};
function lic(){ return prof().lic || {}; }
function licDates(){
  var L = lic(), pl = LIC_PLANS[L.by]; if (!pl || !L.at) return null;
  var a = new Date(L.at);
  return {theory:addDays(a, pl.theory * 7), practical:addDays(a, pl.practical * 7), licence:addDays(a, pl.licence * 7), plan:pl};
}
var OFFICIAL = [
  ["Book your theory exam", "mijn.cbr.nl, log in with DigiD", "https://mijn.cbr.nl"],
  ["The CBR in English", "Exams, prices and waiting times", "https://www.cbr.nl/en"],
  ["Driving licence rules", "government.nl", "https://www.government.nl/topics/driving-licence"],
  ["Swap a foreign licence", "rdw.nl", "https://www.rdw.nl/en"]
];
function renderLicencePlan(){
  var v = $("#v-home"), t = "drive", L = lic(), D = licDates(), P = plan(t), ex = P.exam;
  function opt(key, val, label){ var on = String(L[key]) === String(val); return '<button class="lp-opt' + (on ? " on" : "") + '" data-lic="' + key + '" data-val="' + val + '" aria-pressed="' + on + '">' + label + '</button>'; }
  var html = '<div class="run-top"><button class="link" data-act="lp-back">&larr; Home</button><b>Your licence plan</b><span></span></div>';
  html += '<section class="lp-card"><h3>Do you have a driving licence from another country?</h3><div class="lp-opts">' +
    opt("from", "none", "No") + opt("from", "eu", "Yes, from the EU, EEA or Switzerland") + opt("from", "other", "Yes, from another country") + '</div>';
  if (L.from === "eu") html += '<p class="lp-say ts-strong">You can usually swap it for a Dutch licence at your town hall. No exams. Check the rules for your licence first.</p><a class="lp-link" href="https://www.rdw.nl/en" target="_blank" rel="noopener">Swapping a licence on rdw.nl ›</a>';
  if (L.from === "other") html += '<p class="lp-say ts-going">You can drive on it for up to 185 days after you register here. Some licences can be swapped for a Dutch one, depending on the country and your situation. If yours cannot, you take the theory and practical exams.</p><a class="lp-link" href="https://www.rdw.nl/en" target="_blank" rel="noopener">Check on rdw.nl ›</a>';
  html += '</section>';
  if (L.from && L.from !== "eu"){
    html += '<section class="lp-card"><h3>When do you want your licence?</h3><div class="lp-opts row3">' + opt("by", 3, "Within 3 months") + opt("by", 6, "Within 6 months") + opt("by", 12, "Within a year") + '</div>';
    if (D){
      html += '<p class="lp-say ts-' + D.plan.cls + '"><b>' + D.plan.word + '.</b> ' + esc(D.plan.say) + '</p>';
      var left = P.left, needDays = Math.ceil(left / Math.max(1, S.goal)), theoryIn = Math.ceil((D.theory - new Date()) / 86400000);
      if (ex && ex.exact && ex.n > theoryIn + 3) html += '<p class="lp-note">Your theory exam is in ' + ex.n + ' days. This plan needs it within about ' + Math.max(1, theoryIn) + ' days.</p>';
      else if (left && needDays > theoryIn) html += '<p class="lp-note">At ' + S.goal + ' a day you need ' + needDays + ' days to see every question. Raise your daily goal in your profile to be ready in time.</p>';
      var pl = S.plan || {};
      function step(key, name, when, txt){ var on = !!pl[key]; return '<li class="' + (on ? "done" : "") + '"><b>' + name + '</b><span>' + when + '</span><p>' + txt + '</p>' +
        (key ? '<button class="rd-btn' + (on ? " on" : "") + '" data-plan="' + key + '" aria-pressed="' + on + '">' + (on ? "Done ✓" : "Done") + '</button>' : "") + '</li>'; }
      html += '<ol class="lp-route">' +
        step("d-theory", "Theory exam", pl["d-theory"] ? "Passed" : "By " + fmtDate(ex && ex.exact ? addDays(new Date(), ex.n) : D.theory), "Book it on mijn.cbr.nl with your DigiD. Klaar gets you ready for it.") +
        step("d-lessons", "Driving lessons", pl["d-lessons"] ? "Done" : "Until " + monthName(D.practical, true), "Most people need about 40 hours. Many driving schools teach in English.") +
        step("d-practical", "Practical exam", pl["d-practical"] ? "Passed" : "Around " + fmtDate(D.practical), "Your driving school books it with the CBR. Pass it within 1.5 years of your theory exam.") +
        step("", "Your licence", "By " + fmtDate(D.licence), "Apply at your town hall after you pass. It is usually ready about 5 working days later.") + '</ol>';
    }
    html += '</section>';
    html += '<section class="lp-card"><h3>What it takes</h3><ul class="lp-list">' +
      '<li>You must be 18 to drive on your own.</li>' +
      '<li>A DigiD to book your theory exam.</li>' +
      '<li>A driving school. Ask if they teach in English.</li>' +
      '<li>Your theory pass is valid for 1.5 years.</li></ul></section>';
  }
  html += '<section class="lp-card"><h3>The official places</h3><div class="lp-links">' + OFFICIAL.map(function(o){ return '<a class="lp-off" href="' + o[2] + '" target="_blank" rel="noopener"><b>' + o[0] + '</b><span>' + o[1] + '</span><i aria-hidden="true">›</i></a>'; }).join("") + '</div></section>';
  html += '<p class="lp-disc">Klaar is an independent practice app. It is not the CBR, the RDW or your town hall. Book exams and apply only on their official sites. Rules and waiting times change, so check there first.</p>';
  v.innerHTML = html;
  $('[data-act="lp-back"]', v).addEventListener("click", function(){ homeSub = null; renderHome(); scrollTop0(); });
  $$("[data-lic]", v).forEach(function(b){ b.addEventListener("click", function(){
    var k = b.getAttribute("data-lic"), val = b.getAttribute("data-val");
    S.prof = S.prof || {}; S.prof.lic = Object.assign({}, S.prof.lic || {});
    S.prof.lic[k] = k === "by" ? +val : val; if (k === "by") S.prof.lic.at = Date.now();
    save(); renderLicencePlan();
  }); });
  $$("[data-plan]", v).forEach(function(c){ c.addEventListener("click", function(){ var k = c.getAttribute("data-plan"); S.plan[k] = !S.plan[k]; save(); renderLicencePlan(); }); });
}

/* ---------------- inburgering Home: your situation, a 5-year countdown, exam stamps, a checklist that fits why you came ---------------- */
var civEdit = false;
function civ(){ return prof().civ || {}; }
function setCiv(k, val){ S.prof = S.prof || {}; S.prof.civ = Object.assign({}, S.prof.civ || {}); S.prof.civ[k] = val; save(); }
var CIV_WHY = [["study", "To study"], ["work", "To work"], ["family", "To live with my partner or family"], ["other", "Something else"]];
var CIV_GOAL = [["citizen", "Become Dutch"], ["permanent", "Stay for good"], ["integrate", "Just integrate"]];
var GOAL_CAP = {citizen:"to become Dutch", permanent:"for permanent residence"};
function dayDiff(a, b){ return Math.round((a - b) / 86400000); }
function civicSetupHtml(){
  var C = civ(), step = civEdit ? (civEdit === true ? 1 : civEdit) : (!C.why ? 1 : (!C.goal ? 2 : 3));
  function opts(key, list){ return '<div class="cv-opts">' + list.map(function(o){ return '<button class="cv-opt' + (C[key] === o[0] ? " on" : "") + '" data-civ="' + key + '" data-val="' + o[0] + '">' + o[1] + '</button>'; }).join("") + '</div>'; }
  var html = '<section class="cv-hero cv-setup"><span class="cv-step">Your plan, step ' + step + ' of 3</span>';
  if (step === 1) html += '<h3>Why are you in the Netherlands?</h3>' + opts("why", CIV_WHY);
  else if (step === 2) html += '<h3>What do you want?</h3>' + opts("goal", CIV_GOAL) + '<p class="cv-small">You can change this later.</p>';
  else html += '<h3>When did you move here?</h3><p class="cv-small">Not moved yet? Pick the day you will move. Klaar counts down to it.</p>' +
    '<div class="hero-row"><input type="date" class="inp" id="arr-in" aria-label="The day you moved, or will move, to the Netherlands" value="' + esc(S.arrived || "") + '"><button class="btn cv-save" data-act="arr-set">Save</button></div>';
  return html + '</section>';
}
function civicCountdownHtml(){
  var C = civ(), cd = citizenDates(), now = new Date(), html;
  if (!C.why || !C.goal || !cd || civEdit) return civicSetupHtml();
  var future = cd.from > now, big, cap, bars = "";
  if (future){ big = dayDiff(cd.from, now) + 1; cap = big === 1 ? "day until you move" : "days until you move"; }
  else if (C.goal === "integrate"){ big = dayDiff(now, cd.from) + 1; cap = "days in the Netherlands"; }
  else {
    big = Math.max(0, Math.ceil((cd.at - now) / 86400000));
    cap = big ? (big === 1 ? "day" : "days") + " until you can apply " + GOAL_CAP[C.goal] : "You can apply " + GOAL_CAP[C.goal] + " now";
  }
  if (!future && C.goal !== "integrate"){
    bars = '<div class="cv-years" role="img" aria-label="' + Math.min(100, Math.round((now - cd.from) / (cd.at - cd.from) * 100)) + '% of 5 years">';
    for (var y = 0; y < 5; y++){ var ys = new Date(cd.from), ye; ys.setFullYear(ys.getFullYear() + y); ye = new Date(ys); ye.setFullYear(ye.getFullYear() + 1);
      bars += '<i><b style="width:' + Math.max(0, Math.min(100, (now - ys) / (ye - ys) * 100)).toFixed(1) + '%"></b></i>'; }
    bars += '</div><div class="cv-meta"><span>' + fmtDate(cd.from) + '</span><span>' + fmtDate(cd.at) + '</span></div>';
  }
  var sub = future ? "Your 5 years start when you move. Sort out the checklist below first." :
    (C.goal === "integrate" ? "No deadline here. If DUO sent you a letter, you have 3 years from the date in it." :
      (C.why === "study" ? "A study permit is temporary. To apply, you need a permit for a non-temporary purpose, such as work. Check ind.nl." : "Most people can apply after 5 years living here legally."));
  html = '<section class="cv-hero"><div class="cv-top"><span class="cv-cap">' + (future ? "Before you move" : (C.goal === "integrate" ? "Your time here" : "Your 5 years")) + '</span><button class="link cv-edit" data-act="civ-edit">Change</button></div>' +
    (big ? '<b class="cv-big tabular">' + big.toLocaleString(loc()) + '</b>' : "") + '<span class="cv-what">' + cap + '</span>' + bars +
    '<p class="cv-sub">' + sub + '</p>' +
    (C.goal !== "integrate" || !future ? '<button class="cv-route" data-act="civic-route">How to apply, step by step<span aria-hidden="true">›</span></button>' : "") + '</section>';
  return html;
}
/* each exam is a stamp: it lands when you pass its practice exam, and gets a check when you pass the real one */
var STAMPS = [
  {id:"knm", name:"KNM", key:"c-knm", topic:"KNM"},
  {id:"a2-lezen", name:"Reading", key:"c-lezen", topic:"A2 Lezen"},
  {id:"a2-luisteren", name:"Listening", key:"c-luisteren", topic:"A2 Luisteren"},
  {id:"a2-schrijven", name:"Writing", key:"c-schrijven", topic:"A2 Schrijven"},
  {id:null, name:"Speaking", key:"c-spreken", topic:null}
];
function stampState(s){
  var tr = S.t.civic, real = !!(S.plan || {})[s.key];
  if (real) return {k:"passed", label:"Passed"};
  var ms = s.id ? (tr.mocks[s.id] || []) : [], best = 0;
  ms.forEach(function(m){ best = Math.max(best, m.n ? m.s / m.n : 0); });
  if (best >= 0.85) return {k:"ready", label:"Ready"};
  /* practice accuracy over every topic of this exam part (questions are tagged by theme, not by exam part) */
  var a = 0, ok = 0, part = s.id && SEC_PART[s.id];
  if (part) Object.keys(tr.topics).forEach(function(k){ if ((TOPIC_PART[lessonKey("civic", k)] || "knm") === part){ a += tr.topics[k].a || 0; ok += tr.topics[k].ok || 0; } });
  var acc = a ? ok / a : 0, p = Math.round(Math.max(best, acc) * 100);
  return p ? {k:"going", label:p + "%"} : {k:"new", label:"Not yet"};
}
function stampsHtml(){
  var html = '<section class="cv-card" aria-label="Your exams"><div class="tl-h"><h2>Your exams</h2><span>' + STAMPS.filter(function(s){ return (S.plan || {})[s.key]; }).length + ' of 5 passed</span></div><div class="stamps">';
  STAMPS.forEach(function(s, i){
    var st = stampState(s);
    html += '<button class="stamp st-' + st.k + '" data-stamp="' + i + '" style="animation-delay:' + (250 + i * 90) + 'ms" aria-label="' + s.name + ', ' + st.label + '"><span class="stamp-c">' +
      (st.k === "passed" || st.k === "ready" ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>' : (st.k === "going" ? st.label : "")) + '</span><b>' + s.name + '</b><small>' + (st.k === "going" ? "Practising" : st.label) + '</small></button>';
  });
  return html + '</div></section>';
}
function stampSheet(i){
  var s = STAMPS[i], st = stampState(s), real = !!(S.plan || {})[s.key];
  var line = s.id ? (st.k === "new" ? "Not practised yet." : (st.k === "going" ? "You get about " + st.label + " right in practice." : "You passed the practice exam.")) :
    "Klaar has no speaking practice yet. The official practice exams on inburgeren.nl include speaking.";
  openSheet('<div class="tsh"><div class="tsh-h"><h2>' + s.name + '</h2></div><p>' + line + '</p>' +
    (s.topic ? '<button class="btn pop" data-act="st-prac">Practise ' + s.name + '</button><button class="btn ghost" data-act="st-exam">Take the practice exam</button>' :
      '<a class="btn pop" href="https://www.inburgeren.nl/en/taking-the-integration-exam/practicing.jsp" target="_blank" rel="noopener">Official practice exams</a>') +
    '<button class="btn ghost' + (real ? " on" : "") + '" data-act="st-real">' + (real ? "Passed the real exam ✓" : "I passed the real exam") + '</button></div>', true);
  var p = $('[data-act="st-prac"]'); if (p) p.addEventListener("click", function(){ closeSheet(); practiseTopic("civic", s.topic); });
  var e = $('[data-act="st-exam"]'); if (e) e.addEventListener("click", function(){ closeSheet(); setView("exams"); startExam(s.id); });
  $('[data-act="st-real"]').addEventListener("click", function(){ S.plan[s.key] = !S.plan[s.key]; save(); closeSheet(); renderHome(); });
}
/* what to sort out, by why you came and what you want. Lines with a link were checked on that page; the permit lines are general advice. */
function civicChecklist(){
  var C = civ(), L = [];
  if (C.why === "study") L.push(["cl-permit", "If you need a residence permit, your university usually applies for it. Send them what they ask for.", ""]);
  if (C.why === "work") L.push(["cl-permit", "If you need a residence permit, your employer usually applies for it. Send them what they ask for.", ""]);
  if (C.why === "family") L.push(["cl-abroad", "Check if you must pass the civic integration exam abroad before you come.", "https://ind.nl/en/civic-integration-exam-abroad"]);
  L.push(["cl-bsn", "Register at your town hall. You get your BSN there.", ""]);
  L.push(["cl-digid", "Apply for your DigiD. You need it for Mijn Inburgering.", "https://www.digid.nl/en"]);
  if (C.why === "family") L.push(["cl-duo", "Wait for the letter from DUO. It can take 8 weeks after you register. Then you have 3 years to integrate.", "https://www.inburgeren.nl/en/integration-in-the-netherlands/index.jsp"]);
  else L.push(["cl-mijn", "Log in to Mijn Inburgering to see if you must integrate. If you must, DUO also sends you a letter.", "https://www.inburgeren.nl/en/log-in-to-mijn-inburgering/"]);
  if (C.goal === "citizen") L.push(["cl-exam", "Pass the inburgering exams at A2, or the Nt2 state exam at B1 or B2.", "https://www.inburgeren.nl/en/integration-in-the-netherlands/naturalisation.jsp"]);
  if (C.goal === "permanent") L.push(["cl-exam", "Get your civic integration diploma. The IND asks for it.", "https://ind.nl/en/living-in-the-netherlands-with-a-residence-permit/civic-integration-for-more-secure-residence-permit"]);
  if (C.goal === "integrate") L.push(["cl-exam", "Book your exams in Mijn Inburgering when you are ready.", "https://www.inburgeren.nl/en/taking-the-integration-exam/registering.jsp"]);
  return L;
}
function checklistHtml(){
  var L = civicChecklist(), pl = S.plan || {}, todo = L.filter(function(x){ return !pl[x[0]]; }), done = L.length - todo.length;
  var html = '<section class="cv-card" aria-label="Your checklist"><div class="tl-h"><h2>Your checklist</h2><span>' + done + ' of ' + L.length + ' done</span></div><ul class="ck">';
  L.forEach(function(x){
    var on = !!pl[x[0]];
    html += '<li class="' + (on ? "on" : "") + '"><button class="ck-b" data-plan="' + x[0] + '" aria-pressed="' + on + '" aria-label="' + (on ? "Mark as not done" : "Mark as done") + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg></button><span>' + esc(x[1]) +
      (x[2] ? ' <a href="' + x[2] + '" target="_blank" rel="noopener">' + x[2].replace(/^https:\/\/(www\.)?/, "").split("/")[0] + ' ›</a>' : "") + '</span></li>';
  });
  return html + '</ul></section>';
}
function civicHomeHtml(t, P){
  var C = civ();
  if (!(C.why && C.goal && citizenDates() && !civEdit)) return civicCountdownHtml();
  return nextHtml(P) + civicCountdownHtml() + stampsHtml() + checklistHtml();
}
/* Today's one main action */
function nextHtml(P){
  var n = P.next, cap = n.kind === "drill" || n.kind === "mistakes" ? "Fix this first" : (P.seen ? "Next up" : "Start here");
  return '<section class="nx" aria-label="Next up"><span class="nx-cap">' + cap + '</span><h3 class="nx-t">' + esc(n.kind === "drill" ? n.topic : n.title) + '</h3><p class="nx-s">' + esc(n.why) + '</p>' +
    '<button class="btn pop" data-act="plan-go">' + (n.kind === "mock" ? "Go to exams" : "Start") + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button></section>';
}
function wireCivic(v){
  $$("[data-civ]", v).forEach(function(b){ b.addEventListener("click", function(){
    var k = b.getAttribute("data-civ"); setCiv(k, b.getAttribute("data-val"));
    if (civEdit) civEdit = k === "why" ? 2 : 3;
    renderHome();
  }); });
  var as = $('[data-act="arr-set"]', v); if (as) as.addEventListener("click", function(){ var val = $("#arr-in", v).value; if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return toast("Pick a date first."); S.arrived = val; civEdit = false; save(); renderHome(); });
  var ed = $('[data-act="civ-edit"]', v); if (ed) ed.addEventListener("click", function(){ civEdit = true; renderHome(); });
  $$("[data-part]", v).forEach(function(b){ b.addEventListener("click", function(){ practisePart(b.getAttribute("data-part")); }); });
  $$("[data-stamp]", v).forEach(function(b){ b.addEventListener("click", function(){ stampSheet(+b.getAttribute("data-stamp")); }); });
  var rt = $('[data-act="civic-route"]', v); if (rt) rt.addEventListener("click", function(){ homeSub = "route"; renderCivicRoute(); scrollTop0(); });
}

/* ---------------- the official route for inburgering: book and pass your exams, then become Dutch or stay for good ---------------- */
var routeTab = "a";
var EXAM_STEPS = [
  ["See which exams you need", "Log in to Mijn Inburgering with your DigiD. It shows which exams to take and at which level.", "Mijn Inburgering", "https://www.inburgeren.nl/en/log-in-to-mijn-inburgering/"],
  ["Book early", "Register for KNM and the A2 exams in Mijn Inburgering. It can take more than 6 weeks to get a date. You can change the date up to 1 week before.", "Registering for an exam", "https://www.inburgeren.nl/en/taking-the-integration-exam/registering.jsp"],
  ["B1 or B2 instead?", "At B1 or B2 the language exams are the state exam Dutch as a second language (Nt2). It is booked another way.", "Read how on inburgeren.nl", "https://www.inburgeren.nl/en/taking-the-integration-exam/registering.jsp"],
  ["Pass, then keep your diploma", "DUO runs the exams. You get a digital diploma in Mijn Inburgering. The town hall or the IND asks for it later.", "Your diploma", "https://www.inburgeren.nl/en/taking-the-integration-exam/diploma.jsp"]
];
var NAT_REQ = [
  "I am 18 or older.",
  "I have lived here for 5 years in a row with a valid residence permit, and always extended it on time.",
  "I passed the inburgering exam at A2 or higher, or I am exempt.",
  "I am willing to give up my current nationality, unless an exception applies to me.",
  "I am willing to make the declaration of solidarity at the ceremony."
];
var NAT_STEPS = [
  ["Apply at your town hall", "Make an appointment where you live. You fill in the form together and pay the fee there."],
  ["The IND decides", "Your town hall sends it to the IND. They have 12 months to decide."],
  ["Go to the ceremony", "After a yes, go to the naturalisation ceremony within 1 year. That is when you become Dutch."],
  ["Get your Dutch passport", "Apply for it at your town hall."]
];
var PERM_STEPS = [
  ["Get your civic integration diploma", "The IND usually asks for it. Some people are exempt."],
  ["Apply to the IND", "Online or by post, while your current permit is still valid. After 5 years with a residence permit you can choose when to apply."],
  ["Pay the fee", "The IND page shows the current amount."]
];
function renderCivicRoute(){
  var v = $("#v-home"), C = civ(), goal = C.goal || "citizen", pl = S.plan || {};
  var second = goal === "permanent" ? "2. Staying for good" : "2. Becoming Dutch";
  var html = '<div class="run-top"><button class="link" data-act="rt-back">&larr; Home</button><b>The official route</b><span></span></div>';
  if (goal !== "integrate") html += '<div class="rt-tabs" role="tablist"><button role="tab" data-tab="a" aria-selected="' + (routeTab === "a") + '">1. Your exams</button><button role="tab" data-tab="b" aria-selected="' + (routeTab === "b") + '">' + second + '</button></div>';
  if (routeTab === "a" || goal === "integrate"){
    html += '<h2 class="rt-h">Book and pass your inburgering exams</h2><ol class="rt-steps">' + EXAM_STEPS.map(function(s){
      return '<li><b>' + s[0] + '</b><p>' + s[1] + '</p><a href="' + s[3] + '" target="_blank" rel="noopener">' + s[2] + ' ›</a></li>'; }).join("") + '</ol>';
  } else if (goal === "permanent"){
    html += '<h2 class="rt-h">Apply for permanent residence</h2><ol class="rt-steps">' + PERM_STEPS.map(function(s){ return '<li><b>' + s[0] + '</b><p>' + s[1] + '</p></li>'; }).join("") + '</ol>' +
      '<a class="btn pop rt-off" href="https://ind.nl/en/replace-extend-renew-and-change/permanent-residency/permanent-residence-permit" target="_blank" rel="noopener">Read the full rules on ind.nl</a>';
  } else {
    var cd = citizenDates();
    if (cd) html += '<section class="cv-hero rt-when"><span class="cv-cap">Based on the date you moved here</span><b>' + (cd.at > new Date() ? "You can apply from " + fmtDate(cd.at) : "You can apply now") + '</b></section>';
    var left = NAT_REQ.filter(function(x, i){ return !pl["nat-" + i]; }).length;
    html += '<section class="cv-card"><h3 class="rt-sub">Tick what is true for you</h3><ul class="ck">' + NAT_REQ.map(function(x, i){ var on = !!pl["nat-" + i];
      return '<li class="' + (on ? "on" : "") + '"><button class="ck-b" data-plan="nat-' + i + '" aria-pressed="' + on + '" aria-label="' + (on ? "Untick" : "Tick") + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg></button><span>' + x + '</span></li>'; }).join("") + '</ul>' +
      '<p class="lp-say ' + (left ? "ts-going" : "ts-strong") + '">' + (left ? left + (left === 1 ? " condition" : " conditions") + " still open. Klaar helps with the exam. The IND page explains the rest." : "You meet the main conditions. Make an appointment at your town hall.") + '</p></section>';
    html += '<h2 class="rt-h">Then, step by step</h2><ol class="rt-steps">' + NAT_STEPS.map(function(s){ return '<li><b>' + s[0] + '</b><p>' + s[1] + '</p></li>'; }).join("") + '</ol>' +
      '<a class="btn pop rt-off" href="https://ind.nl/en/dutch-citizenship/becoming-a-dutch-national-through-naturalisation" target="_blank" rel="noopener">Read the full rules on ind.nl</a>';
  }
  html += '<p class="lp-disc">Klaar is an independent practice app. It is not DUO, the IND or your town hall. Book exams and apply only on their official sites. Rules can change, so always check there first.</p>';
  v.innerHTML = html;
  $('[data-act="rt-back"]', v).addEventListener("click", function(){ homeSub = null; renderHome(); scrollTop0(); });
  $$("[data-tab]", v).forEach(function(b){ b.addEventListener("click", function(){ routeTab = b.getAttribute("data-tab"); renderCivicRoute(); }); });
  $$("[data-plan]", v).forEach(function(c){ c.addEventListener("click", function(){ var k = c.getAttribute("data-plan"); S.plan[k] = !S.plan[k]; save(); renderCivicRoute(); }); });
}

/* ---------------- news: news.json is fetched whenever the phone is online, so news and rule changes reach people without an app update.
   Practice never needs the internet. One unread item shows on Home until you close it. ---------------- */
var NEWS_KEY = "klaarNews", NEWS_SEEN = "klaarNewsSeen";
function isoToday(){ var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function newsItems(){
  var n = lsGet(NEWS_KEY) || [], seen = lsGet(NEWS_SEEN) || [], today = isoToday();
  return n.filter(function(x){ return x && x.id && x.title && seen.indexOf(x.id) < 0 && (!x.track || x.track === "all" || x.track === S.track) && (!x.from || x.from <= today) && (!x.until || x.until >= today); });
}
function newsHtml(){
  var x = newsItems()[0]; if (!x) return "";
  var url = /^https:\/\//.test(x.url || "") ? x.url : "";
  return '<section class="news" aria-label="News"><div class="news-h"><span>News</span><button class="news-x" data-news-x="' + esc(x.id) + '" aria-label="Close">&times;</button></div><b>' + esc(x.title) + '</b>' +
    (x.body ? '<p>' + esc(x.body) + '</p>' : "") + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(x.link || "Read more") + ' ›</a>' : "") + '</section>';
}
function wireNews(v){
  $$("[data-news-x]", v).forEach(function(b){ b.addEventListener("click", function(){
    var seen = lsGet(NEWS_SEEN) || []; seen.push(b.getAttribute("data-news-x")); lsSet(NEWS_SEEN, seen.slice(-100));
    var card = b.closest(".news"); if (card) card.remove();
  }); });
}
function fetchNews(){
  if (navigator.onLine === false || !window.fetch) return;
  fetch("news.json", {cache:"no-store"}).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){
    if (!j || !Array.isArray(j.items)) return;
    var items = j.items.slice(0, 20), had = JSON.stringify(lsGet(NEWS_KEY) || []);
    if (had === JSON.stringify(items)) return;
    lsSet(NEWS_KEY, items);
    if (view === "home" && !homeSub) renderHome();
  }).catch(function(){});
}
document.addEventListener("visibilitychange", function(){ if (!document.hidden) fetchNews(); });
window.addEventListener("online", fetchNews);
setTimeout(fetchNews, 1500);

/* ---------------- where you are (journey), milestone cards, share ---------------- */
function journey(t){
  var tr = S.t[t], rec = tr.recent || [], recAcc = rec.length ? rec.reduce(function(a, b){ return a + b; }, 0) / rec.length : 0;
  var full = tr.mocks.full || [], inRow = 0; for (var i = full.length - 1; i >= 0 && full[i].p; i--) inRow++;
  var steps, P = S.plan;
  function real(key, name, msg){ return {name:name, key:key, done:!!P[key], p:0, msg:msg}; }
  if (t === "drive") steps = [
    {name:"Learn the rules", done:tr.ok >= 100, p:Math.min(1, tr.ok / 100), msg:tr.ok + " of 100 questions answered right. " + Math.max(0, 100 - tr.ok) + " more and you know the basics."},
    {name:"Score 85% in practice", done:tr.level >= 2 || (rec.length >= 20 && recAcc >= 0.85), p:Math.min(1, recAcc / 0.85), msg:rec.length < 10 ? "Answer " + (10 - rec.length) + " more to see your score." : "Your last " + rec.length + " answers: " + Math.round(recAcc * 100) + "% right. Aim for 85%."},
    {name:"Pass the quick mock", done:mockPassed(t, "quick"), p:0, msg:"20 questions in 12 minutes. You need 18 right.", go:true},
    {name:"Pass the full mock 3 in a row", done:inRow >= 3 || !!P["d-mock3"], p:inRow / 3, msg:"Full mocks passed in a row: " + Math.min(inRow, 3) + " of 3. Three in a row means you're ready.", go:true},
    real("d-book", "Book the CBR theory exam", "You're ready. Book the theory exam on cbr.nl with your DigiD, then tap Done."),
    real("d-theory", "Pass the theory exam", "Good luck. Tap Done when you have passed."),
    real("d-lessons", "Take driving lessons", "Find a driving school near you. Tap Done when your instructor says you're ready for the exam."),
    real("d-practical", "Pass the practical exam", "The last step. Tap Done when you pass.")
  ];
  else {
    var a2 = [["c-lezen", "Lezen"], ["c-luisteren", "Luisteren"], ["c-schrijven", "Schrijven"], ["c-spreken", "Spreken"]], a2n = a2.filter(function(x){ return P[x[0]]; }).length;
    steps = [
      {name:"Learn the basics", done:tr.ok >= 60, p:Math.min(1, tr.ok / 60), msg:tr.ok + " of 60 questions answered right. " + Math.max(0, 60 - tr.ok) + " more and you know the basics."},
      {name:"Pass the KNM mock", done:mockPassed(t, "knm"), p:0, msg:"Dutch society, scored like the real KNM exam.", go:true},
      {name:"Pass the reading mock", done:mockPassed(t, "a2-lezen"), p:0, msg:"Short Dutch texts at A2, like the real reading exam.", go:true},
      {name:"Pass listening and writing", done:mockPassed(t, "a2-luisteren") && mockPassed(t, "a2-schrijven"), p:(mockPassed(t, "a2-luisteren") ? 0.5 : 0) + (mockPassed(t, "a2-schrijven") ? 0.5 : 0), msg:"Two more practice exams and the A2 part is covered.", go:true},
      real("c-oefen", "Try the official practice exams", "inburgeren.nl has free practice exams that look like the real ones. Try them, then tap Done."),
      real("c-book", "Book your exams", "Book KNM and the A2 exams in Mijn Inburgering, then tap Done."),
      real("c-knm", "Pass KNM", "Tap Done when you have passed."),
      {name:"Pass the A2 exams", parts:a2, done:a2n === 4, p:a2n / 4, msg:a2n + " of 4 passed. Tap each one when you pass it."},
      real("c-docs", "Get your documents ready", "For citizenship you usually need a legalised or apostilled birth certificate. Ask your gemeente what they need from you."),
      real("c-apply", "Apply for citizenship", "Usually after 5 years of legal residence. You apply at your gemeente.")
    ];
  }
  var at = 0; while (at < steps.length && steps[at].done) at++;
  return {steps:steps, at:at};
}
/* the whole road for this goal: steps the app measures tick themselves, real-world steps get a Done button */
function roadmapHtml(t){
  var j = journey(t), html = '<div class="label">Your road to ' + (t === "drive" ? "a licence" : "inburgering and citizenship") + '</div><ol class="road">';
  j.steps.forEach(function(st, i){
    var cls = st.done ? "done" : (i === j.at ? "now" : "next");
    html += '<li class="rd ' + cls + '"><span class="rd-dot" aria-hidden="true">' + (st.done ? "✓" : (i + 1)) + '</span><div class="rd-main"><b>' + esc(st.name) + '</b>';
    if (i === j.at) html += '<p>' + esc(st.msg) + '</p>';
    if (st.parts) html += '<div class="rd-parts">' + st.parts.map(function(x){ var on = !!S.plan[x[0]]; return '<button class="rd-part' + (on ? " on" : "") + '" data-plan="' + x[0] + '" aria-pressed="' + on + '" translate="no">' + (on ? "✓ " : "") + esc(x[1]) + '</button>'; }).join("") + '</div>';
    else if (st.key) html += '<button class="rd-btn' + (st.done ? " on" : "") + '" data-plan="' + st.key + '" aria-pressed="' + st.done + '">' + (st.done ? "Done ✓" : "Done") + '</button>';
    else if (!st.done) html += '<span class="rd-auto">Ticks itself</span>';
    html += '</div></li>';
  });
  return html + '</ol>';
}
var CHEERS = ["Nice work.", "Keep it up.", "That's real progress.", "You're getting there.", "Solid session."];
function journeyHtml(t, compact){
  var j = journey(t), n = j.steps.length, all = j.at >= n, cur = all ? null : j.steps[j.at];
  var html = '<div class="journey' + (compact ? " compact" : "") + (n > 7 ? " many" : "") + '"><div class="j-cap">Where you are</div><div class="j-track" aria-hidden="true">';
  j.steps.forEach(function(s, i){
    html += '<span class="j-dot' + (s.done ? " done" : (i === j.at ? " now" : "")) + '">' + (s.done ? "✓" : (i + 1)) + '</span>' + (i < n - 1 ? '<span class="j-line' + (s.done ? " done" : "") + '"></span>' : "");
  });
  html += '</div>';
  if (all) html += '<div class="j-now">You are klaar</div><p class="j-msg">Every step done. Well done.</p>';
  else {
    html += '<div class="j-step">Step ' + (j.at + 1) + ' of ' + n + '</div><div class="j-now">' + esc(cur.name) + '</div>';
    if (cur.p > 0) html += '<div class="j-bar"><i style="width:' + Math.round(cur.p * 100) + '%"></i></div>';
    html += '<p class="j-msg">' + esc(cur.msg) + '</p>';
  }
  return html + '</div>';
}
var milestoneDue = false;
function renderMilestone(){
  var t = S.track, today = rightToday(), j = journey(t), cur = j.steps[j.at];
  var v = $("#v-feed");
  var html = feedHead() + '<article class="qcard enter milestone"><div class="m-big tabular">' + today + '</div><div class="m-cap">right today</div><p class="m-cheer">' +
    esc(CHEERS[Math.floor(today / 10) % CHEERS.length]) + (today >= S.goal ? " Daily goal done." : " " + (S.goal - today) + " to go for your daily goal.") + '</p>' + journeyHtml(t, true) +
    '<div class="fb-actions">' + (cur && cur.go ? '<button class="btn ghost" data-act="m-exam">Try the mock</button>' : "") + '<button class="btn" data-act="m-next">Keep going</button></div>' + (window.KLAAR_SYNC ? KLAAR_SYNC.nudgeHtml() : "") + '</article>';
  v.innerHTML = html;
  $('[data-act="m-next"]', v).addEventListener("click", nextQuestion);
  var me = $('[data-act="m-exam"]', v); if (me) me.addEventListener("click", function(){ setView("exams"); });
  if (window.KLAAR_SYNC) KLAAR_SYNC.wireNudge(v);
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
  if (homeSub === "plan" && S.track === "drive") return renderLicencePlan();
  if (homeSub === "route" && S.track === "civic") return renderCivicRoute();
  var v = $("#v-home"), today = rightToday(), st = streak(), hr = new Date().getHours();
  var hi = hr < 12 ? "Good morning" : (hr < 18 ? "Good afternoon" : "Good evening");
  var nm = String(prof().name || "").trim();
  var line = today === 0 ? "Nothing yet today. Your goal is " + S.goal + " right answers." : (today < S.goal ? today + " of " + S.goal + " right today." : "Daily goal done. Anything now is bonus.");
  if (st > 1) line += " " + st + "-day streak.";
  var t = S.track, html = '<h1 class="td-h">' + hi + (nm ? ", " + esc(nm.split(/\s+/)[0]) : "") + '</h1>';
  if (t === "drive") html += driveHomeHtml(t, plan(t));
  else html += civicHomeHtml(t, plan(t));
  html += newsHtml();
  renderProgress(html);
  wirePlan(v, t);
  var mk = $('[data-act="mistakes"]', v); if (mk) mk.addEventListener("click", function(){ practiseMistakes(t); });
  var og = $('[data-act="other-goal"]', v); if (og) og.addEventListener("click", function(){ var o = t === "drive" ? "civic" : "drive"; S.prof = S.prof || {}; S.prof.goals = [o]; setTrack(o); setView("home"); toast(o === "drive" ? "Now on driving theory." : "Now on inburgering. Switch back in your profile."); });
  $$("[data-topic]", v).forEach(function(b){ b.addEventListener("click", function(){ practiseTopic(t, b.getAttribute("data-topic")); }); });
  $$("[data-topic-les]", v).forEach(function(b){ b.addEventListener("click", function(){ practiseTopic(t, b.getAttribute("data-topic-les"), true); }); });
  var gl = $('[data-act="glossary"]', v); if (gl) gl.addEventListener("click", function(){ setView("glossary"); });
  $$("details[data-fold]", v).forEach(function(d){ d.addEventListener("toggle", function(){ homeOpen[d.getAttribute("data-fold")] = d.open; }); });
  $$("[data-tile]", v).forEach(function(b){ b.addEventListener("click", function(){ topicSheet(t, b.getAttribute("data-tile")); }); });
  var yp = $('[data-act="your-plan"]', v); if (yp) yp.addEventListener("click", function(){ homeSub = "plan"; renderLicencePlan(); scrollTop0(); });
  animateRing(v, t);
  if (t === "civic") wireCivic(v);
  wireNews(v);
}


/* ---------------- Practice: choose what to practise, then questions ---------------- */
function showPractice(){
  if (lesson && lesson.track === S.track){ renderFeed(); return; }
  if (focus && focus.track === S.track){ if (cur && cur.q.track === S.track) renderFeed(); else nextQuestion(); return; }
  if (practiceMode === "mix"){ if (!cur || cur.q.track !== S.track) nextQuestion(); else renderFeed(); return; }
  renderPicker();
}
function lessonQs(t, k){ return pool(t).filter(function(q){ return lessonKey(t, q.topic) === k && (q.lvl || 1) <= levelCap(t); }).length; }
function renderPicker(){
  var t = S.track, tr = S.t[t], done = tr.primers || {}, ms = mistakes(t).length, v = $("#v-feed");
  var order = ((window.LESSON_ORDER && LESSON_ORDER[t]) || []).filter(function(k){ return topicLesson(t, k) && lessonQs(t, k); });
  var html = '<div class="pk"><h1 class="td-h">Practice</h1><p class="pk-sub">Pick what you want today. Questions only come from lessons you have done.</p>';
  if (ms) html += '<button class="pk-row pk-main" data-pk="mistakes"><span><b>Fix your mistakes</b><small>' + ms + (ms === 1 ? " question" : " questions") + ' you got wrong</small></span><i aria-hidden="true">›</i></button>';
  html += '<button class="pk-row' + (ms ? "" : " pk-main") + '" data-pk="mix"><span><b>A mix of what you have learned</b><small>' + UNIT_MAX + ' questions, weakest topics first</small></span><i aria-hidden="true">›</i></button>';
  if (t === "civic"){
    html += '<h2 class="pk-h">One exam part</h2>' + PARTS.map(function(x){
      return '<button class="pk-row" data-part="' + x[0] + '"><span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span><i aria-hidden="true">›</i></button>'; }).join("");
  } else {
    html += '<h2 class="pk-h">One topic</h2>' + order.map(function(k){
      var n = lessonQs(t, k);
      return '<button class="pk-row" data-pk-topic="' + esc(k) + '"><span><b>' + esc(k) + '</b><small>' + (done[k] ? Math.min(UNIT_MAX, n) + " questions" : "Starts with the lesson") + '</small></span><i aria-hidden="true">›</i></button>'; }).join("");
  }
  v.innerHTML = feedHead() + html + '</div>';
  $$("[data-pk]", v).forEach(function(b){ b.addEventListener("click", function(){
    var k = b.getAttribute("data-pk");
    if (k === "mistakes"){ practiseMistakes(t); return; }
    practiceMode = "mix"; cur = null; focus = null; lastId = null; nextQuestion();
  }); });
  $$("[data-pk-topic]", v).forEach(function(b){ b.addEventListener("click", function(){ practiseTopic(t, b.getAttribute("data-pk-topic")); }); });
  $$("[data-part]", v).forEach(function(b){ b.addEventListener("click", function(){ practisePart(b.getAttribute("data-part")); }); });
}

/* ---------------- Learn: the lessons in order, each followed by questions on only what it taught ---------------- */
function renderLearn(){
  var t = S.track, tr = S.t[t], done = tr.primers || {}, v = $("#v-learn");
  var order = ((window.LESSON_ORDER && LESSON_ORDER[t]) || []).filter(function(k){ return topicLesson(t, k); });
  var nextK = null; order.some(function(k){ if (!done[k]){ nextK = k; return true; } return false; });
  function row(k, i){
    var st = done[k] ? "done" : (k === nextK ? "now" : ""), n = lessonQs(t, k), steps = topicLesson(t, k).length;
    return '<li><button class="ln ' + st + '" data-ln="' + esc(k) + '"><span class="ln-dot">' + (done[k] ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-6.5"/></svg>' : (i + 1)) + '</span>' +
      '<span class="ln-main"><b>' + esc(k) + '</b><small>' + steps + (steps === 1 ? " step" : " steps") + (n ? ", " + n + (n === 1 ? " question" : " questions") : "") + '</small></span>' +
      '<span class="ln-st">' + (done[k] ? "Done" : (st === "now" ? "Next" : "")) + '</span></button></li>';
  }
  var html = '<h1 class="td-h">Learn</h1><p class="pk-sub">The lessons in order. Each one ends with questions on only what it taught.</p>';
  if (t === "civic"){
    var i = 0;
    PARTS.forEach(function(x){
      var ks = order.filter(function(k){ return (TOPIC_PART[k] || "knm") === x[0]; });
      if (!ks.length) return;
      html += '<h2 class="pk-h">' + esc(x[1]) + '</h2><ol class="ln-path">' + ks.map(function(k){ return row(k, i++); }).join("") + '</ol>';
    });
  } else html += '<ol class="ln-path">' + order.map(row).join("") + '</ol>';
  if (window.KLAAR_GLOSSARY) html += '<button class="row gl-open" data-act="glossary"><span class="badge">Aa</span><span class="row-main"><span class="row-title">Words to know</span><span class="row-sub">' + KLAAR_GLOSSARY.count(t) + ' terms, with the logic behind them</span></span><span class="nu-go">›</span></button>';
  v.innerHTML = html;
  $$("[data-ln]", v).forEach(function(b){ b.addEventListener("click", function(){
    var k = b.getAttribute("data-ln");
    if (!done[k]){ practiseTopic(t, k); return; }
    var n = lessonQs(t, k);
    openSheet('<div class="tsh"><h2>' + esc(k) + '</h2><p>You have done this lesson.' + (n ? " Practise its questions, or read it again." : "") + '</p>' +
      (n ? '<button class="btn pop" data-act="ln-go">Practise ' + Math.min(UNIT_MAX, n) + ' questions</button>' : "") +
      '<button class="btn ghost" data-act="ln-read">Read the lesson again</button></div>', true);
    var g = $('[data-act="ln-go"]'); if (g) g.addEventListener("click", function(){ closeSheet(); practiseTopic(t, k); });
    $('[data-act="ln-read"]').addEventListener("click", function(){ closeSheet(); practiseTopic(t, k, true); });
  }); });
  var gl = $('[data-act="glossary"]', v); if (gl) gl.addEventListener("click", function(){ setView("glossary"); });
}

/* ---------------- the mode switch: hold to see your mode, double-tap to switch ---------------- */
(function(){
  var b = $("#mode-sw"); if (!b) return;
  var holdT = null, held = false, lastUp = 0, single = null, tipT = null;
  function other(){ return S.track === "drive" ? "civic" : "drive"; }
  function tip(ms){
    var on = S.track === "drive" ? "Driving licence" : "Inburgering", to = other() === "drive" ? "driving licence" : "inburgering";
    $("#ms-tip-a").textContent = "You're on " + on; $("#ms-tip-b").textContent = "Double-tap to switch to " + to;
    var el = $("#ms-tip"); el.classList.add("on"); clearTimeout(tipT); if (ms) tipT = setTimeout(function(){ el.classList.remove("on"); }, ms);
  }
  function hide(){ clearTimeout(tipT); $("#ms-tip").classList.remove("on"); }
  function go(){
    hide();
    var o = other(), w = $("#ms-wipe");
    function flip(){ S.prof = S.prof || {}; S.prof.goals = [o]; setTrack(o); setView("home"); }
    if (reduced()){ flip(); setTimeout(function(){ tip(1600); }, 50); return; }
    w.className = "ms-wipe to-" + o; void w.offsetWidth; w.classList.add("go");
    setTimeout(flip, 340);
    setTimeout(function(){ w.className = "ms-wipe"; tip(1600); }, 760);
  }
  b.addEventListener("pointerdown", function(){ held = false; clearTimeout(holdT); holdT = setTimeout(function(){ held = true; clearTimeout(single); tip(0); }, 420); });
  ["pointerleave", "pointercancel"].forEach(function(ev){ b.addEventListener(ev, function(){ clearTimeout(holdT); if (held) setTimeout(hide, 900); }); });
  b.addEventListener("pointerup", function(){
    clearTimeout(holdT);
    if (held){ setTimeout(hide, 900); return; }
    var now = Date.now();
    if (now - lastUp < 330){ lastUp = 0; clearTimeout(single); go(); return; }
    lastUp = now; clearTimeout(single); single = setTimeout(function(){ tip(1800); }, 340);
  });
  b.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } });
  b.addEventListener("contextmenu", function(e){ e.preventDefault(); });
})();
/* ---------------- shell ---------------- */
var view = S.view = "home";
function applyTrack(){
  document.body.setAttribute("data-track", S.track);
  $("#brand-sub").textContent = SUBS[S.track];
  var mn = $("#ms-name"); if (mn) mn.textContent = S.track === "drive" ? "Driving" : "Inburgering";
  var ms = $("#mode-sw"); if (ms) ms.setAttribute("aria-label", "Mode: " + (S.track === "drive" ? "driving licence" : "inburgering") + ". Double-tap to switch to " + (S.track === "drive" ? "inburgering" : "driving licence") + ".");
  renderAvatar();
}
function setTrack(t){
  if (t === S.track) return;
  if (run && !confirmLeave()) return;
  stopSound();
  smooth(function(){
    S.track = t; save(); applyTrack(); cur = null; lesson = null; focus = null; lastId = null; practiceMode = null; stopTimer(); run = null;
    renderAll(true);
  });
}
function reduced(){ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
/* Cross-fade the whole screen for a big change (switching goal). Browsers without View Transitions get the slide-in. */
function smooth(fn){
  var done = false;
  function run(){ if (done) return; done = true; fn(); }
  if (document.startViewTransition && !reduced() && !document.hidden){
    try {
      var vt = document.startViewTransition(run);
      ["ready", "finished", "updateCallbackDone"].forEach(function(k){ if (vt[k] && vt[k].catch) vt[k].catch(function(){}); });   /* a skipped transition is fine, not an error */
      /* safety net: if the browser never gets to the transition, switch at once anyway */
      setTimeout(function(){ if (!done){ try { vt.skipTransition(); } catch (e) {} run(); } }, 400);
      return;
    } catch (e) {}
  }
  run();
  var sec = $("#v-" + view); if (sec && !reduced()){ sec.classList.remove("v-in"); void sec.offsetWidth; sec.classList.add("v-in"); }
}
function confirmLeave(){ return true; }
function setView(v){
  if (v === "progress") v = "home";
  var ORDER = ["home", "learn", "feed", "exams"], changed = v !== view, dir = ORDER.indexOf(v) >= ORDER.indexOf(view) ? 1 : -1;
  if ((v === "profile" || v === "glossary") && view !== v) backTo = view === "profile" || view === "glossary" ? "home" : view;
  if (changed && window.KLAAR_STATS) KLAAR_STATS.view(v);
  view = v; S.view = v; save();
  document.body.setAttribute("data-view", v);
  $("#v-home").hidden = v !== "home"; $("#v-learn").hidden = v !== "learn"; $("#v-feed").hidden = v !== "feed"; $("#v-exams").hidden = v !== "exams"; $("#v-glossary").hidden = v !== "glossary"; $("#v-profile").hidden = v !== "profile";
  $$(".tab").forEach(function(b){ b.setAttribute("aria-selected", String(b.getAttribute("data-view") === v)); });
  var flip = window.I18N && I18N.rtl() ? -1 : 1, ind = $(".tab-ind"); if (ind){ ind.style.transform = "translateX(" + (flip * Math.max(0, ORDER.indexOf(v)) * 100) + "%)"; ind.style.opacity = ORDER.indexOf(v) < 0 ? "0" : ""; }
  var pb = $("#prof-btn"); if (pb) pb.setAttribute("aria-pressed", String(v === "profile"));
  if (changed){ var sec = $("#v-" + v); sec.style.setProperty("--dir", dir * flip); sec.classList.remove("v-in"); void sec.offsetWidth; sec.classList.add("v-in"); }
  if (v === "feed") showPractice();
  if (v === "learn") renderLearn();
  if (v === "exams" && !run) renderExams();
  if (v === "glossary" && window.KLAAR_GLOSSARY) KLAAR_GLOSSARY.render($("#v-glossary"), S.track, function(){ setView(backTo); });
  if (v === "home"){ homeSub = null; renderHome(); }
  if (v === "profile") renderProfile();
  scrollTop0();
}
function renderAll(){
  if (view === "feed") showPractice();
  else setView(view);
}
$("#prof-btn").addEventListener("click", function(){ setView(view === "profile" ? backTo : "profile"); });
$$(".tab").forEach(function(b){ b.addEventListener("click", function(){
  var to = b.getAttribute("data-view");
  if (to === "exams" && view === "exams" && run) return;
  if (to === "feed" && view === "feed" && !lesson){ cur = null; focus = null; practiceMode = null; }   /* tapping Practice again goes back to the choices */
  setView(to);
}); });

function profileLine(){
  var pr = prof(); if (!pr.at) return "Not set yet.";
  var NL = {none:"Dutch: starting from zero", a1:"Dutch: the basics", a2:"Dutch: simple conversations", b1:"Dutch: past A2"};
  var DR = {"new":"driving: never driven", abroad:"driving: licensed abroad", lessons:"driving: lessons here"};
  var bits = [];
  if (goals().indexOf("civic") >= 0 && pr.nl) bits.push(NL[pr.nl]);
  if (goals().indexOf("drive") >= 0 && pr.drive) bits.push(DR[pr.drive]);
  bits.push(teachFirst() ? "lessons first" : "questions only");
  bits.push(S.goal + " right answers a day");
  var s = bits.join(", "); return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}
function applyProfile(p, fresh){
  if (fresh){ var keep = {arrived:S.arrived, goal:S.goal, view:"home"}; S = freshState(); S.arrived = keep.arrived; S.view = "home"; if (window.KLAAR_SYNC && KLAAR_SYNC.signedIn()) S.wiped = Date.now(); cur = null; lastId = null; }
  S.prof = p; S.prof.at = Date.now(); S.onboarded = true; lesson = null;
  if (p.goal) S.goal = p.goal;
  if (p.civicLevel && S.t.civic.level < p.civicLevel) S.t.civic.level = p.civicLevel;
  else if (p.nl === "b1" && S.t.civic.level < 2) S.t.civic.level = 2;
  if (p.goals && p.goals.length && p.goals.indexOf(S.track) < 0) S.track = p.goals[0];
  applyTrack();
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
function resetProgress(){ var keep = {arrived:S.arrived, prof:S.prof, goal:S.goal}; S = freshState(); S.arrived = keep.arrived; S.prof = keep.prof; S.goal = keep.goal; S.onboarded = true; if (window.KLAAR_SYNC && KLAAR_SYNC.signedIn()) S.wiped = Date.now(); cur = null; lesson = null; focus = null; lastId = null; save(); applyTrack(); setView("home"); }
/* accounts (js/sync.js): take a merged state into the one already on screen. Fields are copied into the existing objects,
   so a question or mock that is open keeps writing to the right place. Mode and screen stay as they are on this phone. */
function adoptState(m){
  m = mergeState(m);
  ["updated", "goal", "arrived", "onboarded", "prof", "split", "wiped", "days", "plan"].forEach(function(k){ if (m[k] === undefined) delete S[k]; else S[k] = m[k]; });
  ["drive", "civic"].forEach(function(t){ var tr = S.t[t]; Object.keys(tr).forEach(function(k){ delete tr[k]; }); Object.assign(tr, m.t[t]); });
  lsSet(LS, S);
  renderAvatar();
  if (document.getElementById("setup")) return;
  if (view === "home" && !homeSub) renderHome();
  else if (view === "learn") renderLearn();
}
window.KLAAR = {track:function(){ return S.track; }, state:function(){ return S; }, adopt:adoptState, sheet:openSheet, closeSheet:closeSheet, toast:toast, needsSetup:function(){ return !(S.prof && S.prof.v >= 2); }, placementPool:placementPool, placementSave:placementSave, poolSize:function(t){ return pool(t).length; }, seenCount:function(t){ return Object.keys(S.t[t].seen).length; },
  isProfiled:function(){ return !!(S.prof && S.prof.at); }, hasProgress:function(){ return S.t.drive.ans + S.t.civic.ans; }, profile:function(){ return S.prof || null; }, applyProfile:applyProfile, isOnboarded:function(){ return !!S.onboarded; }, goal:function(){ return S.goal; }, finish:function(t, g){ if (t === 'drive' || t === 'civic') setTrack(t); if (g) S.goal = g; S.onboarded = true; save(); renderAll(); }};
applyTrack();
renderSync();
setView(view);
window.addEventListener("klaar-lang", function(){ renderSync(); renderAll(); });
initSample();
initCloud();
try{ if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
})();

