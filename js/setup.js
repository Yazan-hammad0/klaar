/* Step-by-step setup: one question per screen, big buttons, a short placement check, then your plan.
   Replaces the old chat. Existing users see it once (profile v2) with their answers filled in. */
(function(){
"use strict";
function $(s, r){ return (r || document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var ICON = '<img src="icon-180.png" alt="">';
var K = null, a = {}, hist = [], el = null, existing = false;

function overlay(){
  var o = document.getElementById("setup");
  if (o) return o;
  o = document.createElement("div"); o.className = "onb setup"; o.id = "setup"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
  o.innerHTML = '<div class="onb-in"></div>'; document.body.appendChild(o); document.body.style.overflow = "hidden";
  return o;
}
function close(){ var o = document.getElementById("setup"); if (o) o.remove(); document.body.style.overflow = ""; }

/* ---- the steps, worked out from the answers so far ---- */
function steps(){
  var s = (window.I18N && Object.keys(I18N.langs).length > 1 ? ["lang"] : []).concat(["name"]);
  if (has("drive")) s.push("drive", "examDrive", "placeDrive");
  if (has("civic")) s.push("examCivic", "placeCivic");
  if (has("civic") && a.civicSkipped) s.splice(s.indexOf("placeCivic") + 1, 0, "nl");
  s.push("time", "when", "style", "plan");
  return s;
}
function has(t){ return (a.goals || []).indexOf(t) >= 0; }
function go(id, back){
  if (!back && hist[hist.length - 1] !== id) hist.push(id);
  var list = steps(), i = list.indexOf(id), pct = Math.round((i + 1) / list.length * 100);
  el = overlay();
  var head = '<div class="su-top"><button class="su-back" aria-label="Back"' + (hist.length > 1 ? "" : " hidden") + '>&larr;</button><div class="su-bar"><i style="width:' + pct + '%"></i></div><span class="su-brand">' + ICON + '</span></div>';
  var r = SCREENS[id]();
  el.querySelector(".onb-in").innerHTML = head + '<div class="su-body' + (reduce ? "" : (back ? " su-in-back" : " su-in")) + '">' + r.html + '</div>';
  $(".su-back", el).addEventListener("click", function(){ hist.pop(); go(hist[hist.length - 1], true); });
  if (r.wire) r.wire(el);
  el.scrollTop = 0;
}
function next(cur){ var list = steps(), i = list.indexOf(cur); go(list[i + 1]); }
/* a list of big options; tapping one saves it and moves on */
function choice(title, sub, opts, key, cur, multi){
  return {html:'<h1>' + title + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : "") + '<div class="su-opts">' + opts.map(function(o, i){
      var on = JSON.stringify(a[key]) === JSON.stringify(o[2]);
      return '<button class="su-opt" data-i="' + i + '" aria-pressed="' + on + '">' + '<span><b>' + o[0] + '</b>' + (o[1] ? '<small>' + o[1] + '</small>' : "") + '</span></button>'; }).join("") + '</div>',
    wire:function(el){ $$(".su-opt", el).forEach(function(b){ b.addEventListener("click", function(){
      var o = opts[+b.getAttribute("data-i")]; a[key] = o[2];
      $$(".su-opt", el).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
      setTimeout(function(){ next(cur); }, reduce ? 0 : 180);
    }); }); }};
}
var EXAM = [["Within 4 weeks", "", "4w"], ["In 1 to 3 months", "", "3m"], ["Later than that", "", "later"], ["Not booked yet", "", "none"]];
function examScreen(t, cur){
  var key = t === "drive" ? "examDrive" : "examCivic", v = a[key] || {};
  return {html:'<h1>' + (t === "drive" ? "When is your driving theory exam?" : "When is your inburgering exam?") + '</h1><p class="sub">Your plan and daily pace follow from this. A guess is fine.</p><div class="su-opts">' +
      EXAM.map(function(o, i){ return '<button class="su-opt" data-i="' + i + '" aria-pressed="' + (v.when === o[2]) + '"><span><b>' + o[0] + '</b></span></button>'; }).join("") +
      '</div><div class="su-date"><label for="su-date">I know the date</label><input type="date" class="inp" id="su-date" value="' + esc(v.date || "") + '"><button class="btn" id="su-date-ok"' + (v.date ? "" : " disabled") + '>Continue</button></div>',
    wire:function(el){
      $$(".su-opt", el).forEach(function(b){ b.addEventListener("click", function(){ a[key] = {when:EXAM[+b.getAttribute("data-i")][2]}; $$(".su-opt", el).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); setTimeout(function(){ next(cur); }, reduce ? 0 : 180); }); });
      var d = $("#su-date", el), okb = $("#su-date-ok", el);
      d.addEventListener("input", function(){ okb.disabled = !/^\d{4}-\d{2}-\d{2}$/.test(d.value); });
      okb.addEventListener("click", function(){ a[key] = {when:"date", date:d.value}; next(cur); });
    }};
}

/* ---- placement check ---- */
function placeIntro(t, cur){
  var drive = t === "drive";
  return {html:'<h1>' + (drive ? "Quick check: what do you already know?" : "Quick check: how is your Dutch?") + '</h1><p class="sub">' +
      (drive ? "Up to 8 questions, about 2 minutes. Lessons on what you already know are skipped." : "Up to 8 short questions, getting harder. It stops as soon as it knows your level.") + '</p>' +
      '<div class="su-note">' + (drive ? "Not sure? Pick your best guess. Guessing is fine here." : "Not sure? Pick your best guess. Getting it wrong just means we start lower.") + '</div>' +
      '<div class="su-foot"><button class="btn su-main" id="su-go">Start the check</button><button class="onb-link" id="su-skip">Skip</button></div>',
    wire:function(el){
      $("#su-go", el).addEventListener("click", function(){ runPlacement(t, cur); });
      $("#su-skip", el).addEventListener("click", function(){ if (!drive) a.civicSkipped = true; a["place_" + t] = null; next(cur); });
    }};
}
function runPlacement(t, cur){
  var pool = K.placementPool(t), qs = [], res = [], i = 0;
  if (t === "drive") qs = pool; else { a.rungs = pool; qs = pool.length ? pool[0].qs.slice() : []; }
  var rung = 0;
  function finish(){
    if (t === "drive"){
      var known = res.filter(function(r){ return r.ok; }).map(function(r){ return r.topic; });
      a.place_drive = {res:res, known:known, score:known.length, n:res.length};
    } else {
      var passed = -1;
      a.rungs.forEach(function(r, k){ var rr = res.filter(function(x){ return x.rung === r.rung; }); if (rr.length === r.qs.length && rr.length && rr.every(function(x){ return x.ok; }) && passed === k - 1) passed = k; });
      var lvl = ["a1", "a2", "b1", "b2"][passed] || "";
      a.nl = {"": "none", a1:"a1", a2:"a2", b1:"b1", b2:"b1"}[lvl];
      a.civicLevel = lvl === "b2" ? 3 : (lvl === "b1" ? 2 : 0);
      a.place_civic = {res:res, level:lvl};
      a.civicSkipped = false;
    }
    showResult(t, cur);
  }
  function ask(){
    if (i >= qs.length){
      if (t === "civic" && rung < a.rungs.length - 1){
        var rr = res.filter(function(x){ return x.rung === a.rungs[rung].rung; });
        if (rr.length && rr.every(function(x){ return x.ok; })){ rung++; qs = qs.concat(a.rungs[rung].qs); return ask(); }
      }
      return finish();
    }
    if (t === "drive" && res.length === 4 && res.filter(function(r){ return r.ok; }).length <= 1) return finish();   /* clearly new: stop early */
    var q = qs[i], order = q.o.map(function(_, k){ return k; }).sort(function(){ return Math.random() - .5; });
    el = overlay();
    var total = t === "drive" ? qs.length : 8;
    el.querySelector(".onb-in").innerHTML = '<div class="su-top"><span></span><div class="su-bar"><i style="width:' + Math.round(res.length / total * 100) + '%"></i></div><span class="su-count tabular">' + (res.length + 1) + '</span></div>' +
      '<div class="su-body' + (reduce ? "" : " su-in") + '"><p class="su-kicker">' + (t === "drive" ? "Quick check" : "Dutch check") + '</p>' +
      (q.sign && window.DRIVE && DRIVE.signSvg ? '<div class="visual">' + DRIVE.signSvg(q.sign) + '</div>' : "") +
      (q.p ? '<div class="passage" translate="no">' + esc(q.p) + '</div>' : "") +
      '<p class="qtext" translate="no">' + esc(q.q) + '</p><div class="opts">' + order.map(function(k, n){ return '<button class="opt" data-o="' + k + '"><span class="k">' + String.fromCharCode(65 + n) + '</span><span translate="no">' + esc(q.o[k]) + '</span></button>'; }).join("") + '</div>' +
      '<button class="onb-link su-idk" id="su-idk">I don\'t know</button></div>';
    function pick(k){
      var ok = k === q.c;
      res.push({id:q.id, ok:ok, topic:q.topic, rung:rung < (a.rungs || []).length ? a.rungs[rung].rung : null});
      $$(".opt", el).forEach(function(b){ b.disabled = true; var o = +b.getAttribute("data-o"); if (o === q.c) b.classList.add("right"); else if (o === k) b.classList.add("wrong"); });
      i++; setTimeout(ask, reduce ? 150 : 650);
    }
    $$(".opt", el).forEach(function(b){ b.addEventListener("click", function(){ pick(+b.getAttribute("data-o")); }); });
    $("#su-idk", el).addEventListener("click", function(){ pick(-1); });
  }
  ask();
}
var LEVEL_TXT = {"": "Starting from zero", a1:"Around A1: you know everyday words", a2:"Around A2: the level of the inburgering exam", b1:"Around B1: past the exam level", b2:"Around B2: you read Dutch well"};
function showResult(t, cur){
  var html;
  if (t === "drive"){
    var r = a.place_drive;
    html = '<h1>' + r.score + ' of ' + r.n + ' right</h1><p class="sub">' + (r.known.length ? "You already know these topics, so their lessons are skipped. You can still open them on Home:" : "No problem. Every topic starts with a short animated lesson, so you learn it before you're asked.") + '</p>' +
      (r.known.length ? '<div class="su-tags">' + r.known.map(function(k){ return '<span class="su-tag">' + esc(k) + '</span>'; }).join("") + '</div>' : "");
  } else {
    var lvl = a.place_civic.level;
    html = '<h1>' + esc(LEVEL_TXT[lvl]) + '</h1><p class="sub">' + (lvl === "" || lvl === "a1" ? "We start with how the Netherlands works, in English, and bring in Dutch step by step." : (lvl === "a2" ? "You're near exam level. Practice covers KNM, reading, listening and writing, like the real exam." : "You're past the exam level, so harder Dutch reading is open from the start.")) + '</p>';
  }
  el = overlay();
  el.querySelector(".onb-in").innerHTML = '<div class="su-top"><span></span><div class="su-bar"><i style="width:100%"></i></div><span class="su-brand">' + ICON + '</span></div><div class="su-body' + (reduce ? "" : " su-in") + '">' + html + '<div class="su-foot"><button class="btn su-main" id="su-next">Continue</button></div></div>';
  $("#su-next", el).addEventListener("click", function(){ next(cur); });
}

/* ---- the plan ---- */
function planLines(){
  var L = [], goal = a.goal || 30;
  ["drive", "civic"].forEach(function(t){
    if (!has(t)) return;
    var left = Math.max(0, K.poolSize(t) - K.seenCount(t)), days = Math.max(1, Math.ceil(left / goal)), ex = a[t === "drive" ? "examDrive" : "examCivic"] || {};
    var label = t === "drive" ? "Driving" : "Inburgering";
    L.push(label + ": " + days + " days to see every question, then mock exams.");
    var until = null;
    if (ex.when === "date" && ex.date){ var p = ex.date.split("-"); until = Math.ceil((new Date(+p[0], +p[1] - 1, +p[2]) - new Date()) / 86400000); L.push(label + " exam: in " + Math.max(0, until) + " days"); }
    else if (ex.when) L.push(label + " exam: " + {"4w":"within 4 weeks", "3m":"in 1 to 3 months", later:"later than that", none:"not booked yet"}[ex.when]);
    if (ex.when === "4w") until = 28;
    if (until != null && days + 7 > until) L.push(goal < 50 ? "That's tight. Going up to " + (goal === 15 ? 30 : 50) + " a day gives you a week of mock exams before the real one." : "That's tight. Do a full mock exam every day in the last week.");
  });
  L.push(a.style === "test" ? "Questions only: you learn from the explanation after each answer." : "Lessons first: each new topic starts with a short animated lesson, then questions on it. Mock exams are always the real test.");
  return L;
}

var SCREENS = {
  lang:function(){
    var ls = window.I18N ? I18N.langs : {en:{label:"English"}}, cur = window.I18N ? I18N.get() : "en";
    return {html:(existing ? '<p class="su-kicker">New setup</p>' : "") + '<h1 translate="no">Language · اللغة</h1><p class="sub" translate="no">English · العربية</p><div class="su-opts">' +
        Object.keys(ls).map(function(l){ return '<button class="su-opt" data-l="' + l + '" lang="' + l + '" translate="no" aria-pressed="' + (cur === l) + '"><span><b>' + ls[l].label + '</b></span></button>'; }).join("") + '</div>' + (existing ? '<div class="su-foot"><button class="onb-link" id="su-later">Later</button></div>' : ""),
      wire:function(el){ $$("[data-l]", el).forEach(function(b){ b.addEventListener("click", function(){ if (window.I18N) I18N.set(b.getAttribute("data-l")); setTimeout(function(){ next("lang"); }, reduce ? 0 : 180); }); });
        var lt = $("#su-later", el); if (lt) lt.addEventListener("click", function(){ try{ sessionStorage.setItem("klaarSetupLater", "1"); }catch(e){} close(); }); }};
  },
  name:function(){
    return {html:'<h1>' + (existing ? "Two minutes, and Klaar fits you better" : "Hi, I'm Klaar. What should I call you?") + '</h1>' + (existing ? '<p class="sub">Your progress stays. First, what should I call you?</p>' : '<p class="sub">Only for this app. It stays on your phone.</p>') +
        '<input class="inp su-name" id="su-name" maxlength="30" autocomplete="given-name" placeholder="Your name" aria-label="Your name" value="' + esc(a.name || "") + '">' +
        '<div class="su-foot"><button class="btn su-main" id="su-next">Continue</button><button class="onb-link" id="su-skip">Skip</button></div>',
      wire:function(el){
        var n = $("#su-name", el);
        function done(){ a.name = n.value.trim().slice(0, 30); next("name"); }
        $("#su-next", el).addEventListener("click", done);
        n.addEventListener("keydown", function(e){ if (e.key === "Enter") done(); });
        $("#su-skip", el).addEventListener("click", function(){ next("name"); });
      }};
  },
  goals:function(){ return choice((a.name ? "Nice to meet you, " + esc(a.name) + "." : "Let's set things up.") + " What are you working on first?", "One goal at a time. You can switch in your profile and your progress is kept.", [
    ["Driving licence", "The CBR theory exam, in English", ["drive"], "🚗"], ["Inburgering and Dutch", "KNM and A2, then beyond", ["civic"], "🇳🇱"]], "goals", "goals"); },
  drive:function(){ return choice("Have you driven before?", "This decides where we put the extra focus.", [
    ["Never", "Rules and signs first", "new", "🌱"], ["Yes, but not in the Netherlands", "Extra focus on what's different here", "abroad", "🌍"], ["I've had lessons here", "The full mix, like the CBR exam", "lessons", "🛞"]], "drive", "drive"); },
  examDrive:function(){ return examScreen("drive", "examDrive"); },
  placeDrive:function(){ return placeIntro("drive", "placeDrive"); },
  examCivic:function(){ return examScreen("civic", "examCivic"); },
  placeCivic:function(){ return placeIntro("civic", "placeCivic"); },
  nl:function(){ return choice("How's your Dutch right now?", "Pick what sounds most like you.", [
    ["I know almost no Dutch", "", "none"], ["I can say hello and read simple signs", "", "a1"], ["I can have a short, simple chat", "", "a2"], ["I follow most conversations", "", "b1"]], "nl", "nl"); },
  time:function(){ return choice("How much time do you have on most days?", "Small and daily beats long and rare.", [
    ["About 5 minutes", "15 questions", 15, "☕"], ["About 10 minutes", "30 questions", 30, "🚌"], ["20 minutes or more", "50 questions", 50, "🔥"]], "goal", "time"); },
  when:function(){ return choice("When do you usually have time?", "So your plan fits your day.", [
    ["Morning", "", "morning", "🌅"], ["During the day", "", "day", "☀️"], ["Evening", "", "evening", "🌙"], ["It changes", "", "varies", "🔀"]], "when", "when"); },
  style:function(){ return choice("How do you like to learn?", "", [
    ["Teach me first, then test me", "A short animated lesson, then questions", "learn", "🎬"], ["Test me straight away", "I learn from the answers", "test", "⚡"]], "style", "style"); },
  plan:function(){
    var L = planLines();
    return {html:'<h1>' + (a.name ? "Your plan, " + esc(a.name) : "Your plan") + '</h1><ul class="su-plan">' + L.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join("") + '</ul><p class="sub">You can change all of this in your profile, top right.</p>' +
        '<div class="su-foot"><button class="btn su-main pop" id="su-start">Start</button></div>',
      wire:function(el){ $("#su-start", el).addEventListener("click", finish); }};
  }
};

function finish(){
  ["drive", "civic"].forEach(function(t){ var r = a["place_" + t]; if (r && r.res && r.res.length) K.placementSave(t, r.res); });
  var old = K.profile() || {};
  K.applyProfile({v:2, name:a.name || "", goals:a.goals, drive:a.drive || old.drive, nl:a.nl || old.nl, civicLevel:a.civicLevel || 0,
    exam:{drive:a.examDrive || null, civic:a.examCivic || null}, goal:a.goal || 30, when:a.when || "", style:a.style || "learn"}, false);
  try{ sessionStorage.removeItem("klaarSetupLater"); }catch(e){}
  close();
}
function open(fromProfile){
  if (!window.KLAAR) return;
  K = window.KLAAR; hist = [];
  var old = K.profile() || {};
  existing = !fromProfile && K.hasProgress() > 0;
  a = {name:old.name || "", goals:[K.track()], drive:old.drive, nl:old.nl, goal:old.goal || K.goal() || 30, style:old.style || "learn", when:old.when,
       examDrive:(old.exam || {}).drive || null, examCivic:(old.exam || {}).civic || null};
  go(steps()[0]);
}
window.KLAAR_SETUP = {
  open:open,
  needed:function(){ if (!window.KLAAR || !KLAAR.needsSetup()) return false; try{ if (sessionStorage.getItem("klaarSetupLater")) return false; }catch(e){} return true; }
};
})();
