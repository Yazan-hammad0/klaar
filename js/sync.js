/* Optional accounts: progress follows you to another phone and survives a change of web address.
   Off (and invisible) while js/config.js is empty. Progress always lives on the phone first; the account is a copy that
   two phones merge into, never one that overwrites the other. Everything here fails quietly and tries again later. */
(function(){
"use strict";

/* ---------------- merge: pure, so both phones end up with the same result whatever order they sync in ---------------- */
function num(x){ return typeof x === "number" && isFinite(x) ? x : 0; }
function obj(x){ return x && typeof x === "object" && !Array.isArray(x) ? x : {}; }
function arr(x){ return Array.isArray(x) ? x : []; }
function maxMap(a, b){
  a = obj(a); b = obj(b); var r = {};
  Object.keys(a).concat(Object.keys(b)).forEach(function(k){
    var x = a[k], y = b[k];
    r[k] = x == null ? y : y == null ? x : (typeof x === "string" || typeof y === "string") ? (String(x) >= String(y) ? x : y) : Math.max(num(x), num(y));
  });
  return r;
}
function mergeTrack(a, b){
  a = obj(a); b = obj(b);
  /* the side that answered more owns the small running values (last 20 answers, combo, anything new) */
  var big = num(b.ans) > num(a.ans) || (num(b.ans) === num(a.ans) && JSON.stringify(b.recent || []) > JSON.stringify(a.recent || [])) ? b : a;
  var r = Object.assign({}, big === a ? b : a, big);
  ["xp", "ans", "ok", "level"].forEach(function(k){ r[k] = Math.max(num(a[k]), num(b[k])); });
  r.combo = num(big.combo);
  r.recent = arr(big.recent).slice(-20);
  r.aiOk = !!(a.aiOk || b.aiOk);
  ["seen", "primers", "days", "right", "drill"].forEach(function(k){ r[k] = maxMap(a[k], b[k]); });
  /* last answer per question: from whichever phone saw it most recently */
  var sa = obj(a.seen), sb = obj(b.seen), la = obj(a.last), lb = obj(b.last), last = {};
  Object.keys(la).concat(Object.keys(lb)).forEach(function(id){
    var inA = la[id] != null, inB = lb[id] != null;
    last[id] = !inB ? la[id] : !inA ? lb[id] : num(sa[id]) > num(sb[id]) ? la[id] : num(sb[id]) > num(sa[id]) ? lb[id] : Math.max(num(la[id]), num(lb[id]));
  });
  r.last = last;
  var ta = obj(a.topics), tb = obj(b.topics), topics = {};
  Object.keys(ta).concat(Object.keys(tb)).forEach(function(k){
    var x = obj(ta[k]), y = obj(tb[k]);
    topics[k] = num(y.a) > num(x.a) || (num(y.a) === num(x.a) && num(y.ok) > num(x.ok)) ? {a: num(y.a), ok: num(y.ok)} : {a: num(x.a), ok: num(x.ok)};
  });
  r.topics = topics;
  var ma = obj(a.mocks), mb = obj(b.mocks), mocks = {};
  Object.keys(ma).concat(Object.keys(mb)).forEach(function(id){
    var seen = {}, list = [];
    arr(ma[id]).concat(arr(mb[id])).forEach(function(x){ if (!x) return; var k = num(x.at) + ":" + num(x.s) + ":" + num(x.n); if (!seen[k]){ seen[k] = 1; list.push(x); } });
    list.sort(function(x, y){ return num(x.at) - num(y.at) || num(x.s) - num(y.s); });
    mocks[id] = list.slice(-20);
  });
  r.mocks = mocks;
  /* questions to try again: one entry per question, the earliest due wins */
  var due = {};
  arr(a.wrong).concat(arr(b.wrong)).forEach(function(w){ if (w && w.id != null && (due[w.id] == null || num(w.due) < due[w.id])) due[w.id] = num(w.due); });
  r.wrong = Object.keys(due).map(function(id){ return {id: id, due: due[id]}; }).sort(function(x, y){ return x.due - y.due || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0); }).slice(-120);
  return r;
}
/* the last time a phone answered a question or finished a mock (opening the app does not count) */
function lastActive(s){
  var m = 0, t = obj(obj(s).t);
  Object.keys(t).forEach(function(k){
    var tr = obj(t[k]), seen = obj(tr.seen), mocks = obj(tr.mocks);
    Object.keys(seen).forEach(function(id){ m = Math.max(m, num(seen[id])); });
    Object.keys(mocks).forEach(function(id){ arr(mocks[id]).forEach(function(x){ m = Math.max(m, num(x && x.at)); }); });
  });
  return m;
}
/* settings come from the phone that changed something last; progress is merged; "Start again" on one phone wins over older progress */
function merge(a, b){
  a = obj(a); b = obj(b);
  var newer = num(b.updated) > num(a.updated) ? b : a;
  /* a phone that was never set up (a new phone, a new web address) does not get to overwrite settings from one that was */
  var pa = !!(a.prof && a.prof.at), pb = !!(b.prof && b.prof.at);
  if (pa !== pb) newer = pa ? a : b;
  var older = newer === a ? b : a;
  var r = Object.assign({}, older, newer);
  r.updated = Math.max(num(a.updated), num(b.updated));
  var wa = num(a.wiped), wb = num(b.wiped);
  r.wiped = Math.max(wa, wb) || undefined;
  if (!r.wiped) delete r.wiped;
  /* "Start again" wins only over a phone that answered nothing since; otherwise both are kept */
  if (wa !== wb){
    var keep = wa > wb ? a : b, other = keep === a ? b : a;
    if (lastActive(other) <= Math.max(wa, wb)){ r.t = JSON.parse(JSON.stringify(obj(keep.t))); r.days = obj(keep.days); r.plan = obj(keep.plan); return r; }
  }
  r.days = maxMap(a.days, b.days);
  r.plan = Object.assign({}, obj(older.plan), obj(newer.plan));
  r.onboarded = !!(a.onboarded || b.onboarded) || undefined;
  if (!r.onboarded) delete r.onboarded;
  var at = obj(a.t), bt = obj(b.t);
  r.t = {};
  Object.keys(at).concat(Object.keys(bt)).forEach(function(k){ r.t[k] = mergeTrack(at[k], bt[k]); });
  return r;
}
/* the same object with keys in a fixed order, so two equal states compare equal */
function canon(x){
  if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]";
  if (x && typeof x === "object") return "{" + Object.keys(x).sort().filter(function(k){ return x[k] !== undefined; }).map(function(k){ return JSON.stringify(k) + ":" + canon(x[k]); }).join(",") + "}";
  return JSON.stringify(x === undefined ? null : x);
}
/* settings: three-way against what both phones agreed on at the last sync, so opening the app on an old phone
   does not undo a change made on another. Without that base (first sync on this phone) the account's settings win. */
var SETTINGS = ["prof", "goal", "arrived"];
function settle(m, local, remote, base){
  if (!remote) return m;
  SETTINGS.forEach(function(k){
    var lc = base ? canon(local[k]) !== canon(base[k]) : false, rc = base ? canon(remote[k]) !== canon(base[k]) : true;
    var v = lc && !rc ? local[k] : rc && !lc ? remote[k] : m[k];
    if (!base && (remote[k] === undefined || (k === "prof" && !(remote.prof && remote.prof.at)))) v = m[k];
    if (v === undefined) delete m[k]; else m[k] = v;
  });
  var wl = num(local.wiped), wr = num(remote.wiped), wiped = wl !== wr && lastActive(wl > wr ? remote : local) <= Math.max(wl, wr);
  if (!wiped){
    var lp = obj(local.plan), rp = obj(remote.plan), bp = obj(base && base.plan), plan = {};
    Object.keys(lp).concat(Object.keys(rp)).forEach(function(k){
      var lc = base ? lp[k] !== bp[k] : false, rc = base ? rp[k] !== bp[k] : true;
      plan[k] = lc && !rc ? lp[k] : rc && !lc ? rp[k] : obj(m.plan)[k];
      if (plan[k] === undefined) plan[k] = lp[k] !== undefined ? lp[k] : rp[k];
    });
    m.plan = plan;
  }
  return m;
}
function snapshot(s){ var b = {plan: obj(s.plan)}; SETTINGS.forEach(function(k){ if (s[k] !== undefined) b[k] = s[k]; }); return JSON.parse(JSON.stringify(b)); }
/* compare without what stays per phone */
function same(x, y){ return canon(Object.assign({}, x, {track: null, view: null})) === canon(Object.assign({}, y, {track: null, view: null})); }
if (typeof module !== "undefined" && module.exports){ module.exports = {merge: merge, mergeTrack: mergeTrack, canon: canon, settle: settle, lastActive: lastActive}; return; }

/* ---------------- account and sync ---------------- */
var K = window.KLAAR, on = !!(window.Backend && Backend.on && K && K.state);
var AUTH = "klaarAuthV1", META = "klaarSyncV1", NUDGE = "klaarNudgeV1";
function get(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }
function put(k, v){ try{ if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
var sess = on ? get(AUTH) : null, meta = get(META) || {};
if (sess && !(sess.refresh && sess.uid)) sess = null;
var timer = null, busy = null, again = false, fails = 0;

function setSess(s){ sess = s; put(AUTH, s); }
function online(){ return navigator.onLine !== false; }
function later(ms){ clearTimeout(timer); timer = setTimeout(function(){ sync(); }, ms); }

/* read the account copy, merge it with this phone, write both back. One at a time. */
function sync(){
  if (!on || !sess) return Promise.resolve(false);
  if (busy){ again = true; return busy; }
  clearTimeout(timer);
  if (!online()){ later(60000); return Promise.resolve(false); }
  var auth = function(force){ if (force) sess.exp = 0; return Backend.fresh(sess, setSess).catch(function(e){ if (e) e.auth = true; throw e; }); };
  var round = function(sn){
    return Backend.loadProgress(sn).then(function(remote){
      var local = JSON.parse(JSON.stringify(K.state()));
      var m = remote ? settle(merge(local, remote), local, remote, meta.base) : local;
      m.track = local.track; m.view = local.view;
      if (!same(m, local)) K.adopt(m);
      meta.next = snapshot(m);
      if (!remote || !same(m, remote)) return Backend.saveProgress(sn, m);
    });
  };
  busy = auth(false).then(function(sn){
    /* an access token the server no longer accepts: get a new one once and try again */
    return round(sn).catch(function(e){ if (e && e.status === 401 && !e.auth) return auth(true).then(round); throw e; });
  }).then(function(){
    fails = 0; meta.at = Date.now(); meta.err = 0; meta.base = meta.next; delete meta.next; put(META, meta); return true;
  }, function(e){
    /* the sign-in itself ran out or was removed: sign out on this phone, keep the progress */
    if (e && e.auth && (e.status === 400 || e.status === 401 || e.status === 403)){ setSess(null); meta = {}; put(META, null); refresh(); return false; }
    fails++; meta.err = Date.now(); put(META, meta);
    later(Math.min(600000, 30000 * Math.pow(2, Math.min(fails, 5))));
    return false;
  }).then(function(ok){
    busy = null; refresh();
    if (again){ again = false; later(3000); }
    return ok;
  });
  return busy;
}
/* app.js calls this after every save: sync once things go quiet */
function dirty(){ if (on && sess && !busy) later(20000); else if (busy) again = true; }

/* ---------------- screens ---------------- */
function nice(e){
  var c = String((e && (e.code || e.message)) || "");
  if (e instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(c)) return "No connection. Try again when you are online.";
  if (/user_already_exists|already registered/i.test(c)) return "That email already has an account. Sign in instead.";
  if (/invalid_credentials|invalid login/i.test(c)) return "Wrong email or password.";
  if (/weak_password|at least/i.test(c)) return "Use a password of at least 8 characters.";
  if (/email_address_invalid|validation_failed|invalid.*email/i.test(c)) return "Check the email address.";
  if (/rate_limit|429/i.test(c)) return "Too many tries. Wait a minute and try again.";
  if (/no_session|email_not_confirmed|signup_disabled|provider_disabled/i.test(c)) return "Accounts are not open yet. Your progress is safe on this phone.";
  return "Something went wrong. Try again in a moment.";
}
var afterSheet = null;
function openForm(mode, done){
  afterSheet = done || null;
  var signup = mode !== "in";
  K.sheet('<div class="acct">' +
    '<h2>' + (signup ? "Save your progress" : "Sign in") + '</h2>' +
    '<p>' + (signup ? "A free account keeps your progress safe and brings it to any phone you sign in on. You can keep using Klaar without one." : "Sign in to bring back the progress saved to your account. It joins what is on this phone, nothing is lost.") + '</p>' +
    '<form class="acct-form" novalidate>' +
      '<label class="acct-l" for="acct-email">Email</label><input class="inp" id="acct-email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" required>' +
      '<label class="acct-l" for="acct-pw">Password</label><input class="inp" id="acct-pw" type="password" autocomplete="' + (signup ? "new-password" : "current-password") + '" minlength="8" required>' +
      (signup ? '<p class="acct-hint">At least 8 characters. There is no password reset yet, so pick one you will remember.</p>' : "") +
      '<p class="acct-err" id="acct-err" role="alert"></p>' +
      '<button class="btn pop" type="submit" id="acct-go">' + (signup ? "Create account" : "Sign in") + '</button>' +
    '</form>' +
    '<button class="link acct-swap" data-act="acct-swap">' + (signup ? "I already have an account" : "New here? Create an account") + '</button>' +
    (signup ? '<p class="acct-small">By creating an account you agree to the <a href="terms/" target="_blank" rel="noopener">terms</a>. See what is stored on the <a href="privacy/" target="_blank" rel="noopener">privacy page</a>.</p>' : "") +
    '<button class="link acct-later" data-act="acct-later">Not now</button>' +
  '</div>', true);
  var root = document.getElementById("overlay-root"), f = root.querySelector(".acct-form"), err = root.querySelector("#acct-err"), go = root.querySelector("#acct-go");
  var cancel = function(){ var d = afterSheet; afterSheet = null; if (d) setTimeout(function(){ d(false); }, 260); };
  root.querySelector("#ov").addEventListener("click", function(e){ if (e.target.id === "ov") cancel(); });
  var esc1 = function(e){ if (e.key === "Escape"){ document.removeEventListener("keydown", esc1); cancel(); } };
  document.addEventListener("keydown", esc1);
  root.querySelector('[data-act="acct-swap"]').addEventListener("click", function(){ openForm(signup ? "in" : "up", afterSheet); });
  root.querySelector('[data-act="acct-later"]').addEventListener("click", function(){ var d = afterSheet; afterSheet = null; K.closeSheet(); if (d) d(false); });
  f.addEventListener("submit", function(e){
    e.preventDefault();
    var email = root.querySelector("#acct-email").value.trim(), pw = root.querySelector("#acct-pw").value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent = "Check the email address."; return; }
    if (pw.length < 8){ err.textContent = "Use a password of at least 8 characters."; return; }
    err.textContent = ""; go.disabled = true; go.textContent = signup ? "Creating your account" : "Signing in";
    var p = signup ? Backend.signUp(email, pw).catch(function(e){ if (/user_already_exists/i.test(String(e && e.code))) return Backend.signIn(email, pw); throw e; }) : Backend.signIn(email, pw);
    p.then(function(s){
      setSess(s);
      meta = {}; put(META, null);
      var st = K.state(); if (st.wiped){ delete st.wiped; try{ localStorage.setItem("klaarStateV1", JSON.stringify(st)); }catch(e){} }
      return sync();
    }).then(function(ok){
      var d = afterSheet; afterSheet = null;
      K.closeSheet();
      K.toast(ok ? (signup ? "Account made. Your progress is saved." : "Signed in. Your progress is back.") : "Signed in. Your progress will be saved when you are online.");
      refresh();
      if (d) d(true);
    }).catch(function(e){
      err.textContent = nice(e); go.disabled = false; go.textContent = signup ? "Create account" : "Sign in";
      if (signup && /user_already_exists|invalid_credentials/i.test(String(e && e.code))) err.textContent = "That email already has an account with another password. Sign in instead.";
    });
  });
}
function when(t){
  if (!t) return "";
  var m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : new Date(t).toLocaleDateString("en-GB", {day: "numeric", month: "short"});
}
/* the "Your account" part of the profile */
function profileHtml(){ return on ? '<div id="acct-wrap">' + accountInner() + '</div>' : ""; }
function accountInner(){
  if (!sess) return '<div class="label">Your account</div><div class="ai-box" id="acct-box"><p>Your progress is saved on this phone only. Make a free account to keep it safe and to use it on another phone.</p><button class="btn ghost" data-act="acct-open" style="width:100%">Save your progress</button><button class="link acct-swap" data-act="acct-in">I already have an account</button></div>';
  var st = meta.err && meta.err > (meta.at || 0) ? "Not saved yet. Klaar tries again when you are online." : meta.at ? "Last saved " + when(meta.at) + "." : "Saving soon.";
  return '<div class="label">Your account</div><div class="ai-box" id="acct-box"><p>Signed in as <b>' + esc(sess.email || "your account") + '</b>. Your progress is saved to your account and joins up on every phone you sign in on.</p><p class="note acct-st" id="acct-st">' + esc(st) + '</p>' +
    '<div class="pair"><button class="btn ghost" data-act="acct-out">Sign out</button><button class="btn ghost danger" data-act="acct-del">Delete account</button></div></div>';
}
function wire(v){
  if (!on || !v) return;
  var b = v.querySelector('[data-act="acct-open"]'); if (b) b.addEventListener("click", function(){ openForm("up"); });
  var i = v.querySelector('[data-act="acct-in"]'); if (i) i.addEventListener("click", function(){ openForm("in"); });
  var o = v.querySelector('[data-act="acct-out"]'); if (o) o.addEventListener("click", function(){
    o.disabled = true;
    var s = sess;
    (online() ? sync() : Promise.resolve()).then(function(){ if (s) Backend.signOut(s); setSess(null); meta = {}; put(META, null); K.toast("Signed out. Your progress stays on this phone."); refresh(); });
  });
  var d = v.querySelector('[data-act="acct-del"]'); if (d) d.addEventListener("click", function(){
    if (!d.getAttribute("data-sure")){ d.setAttribute("data-sure", "1"); d.textContent = "Tap again to delete"; return; }
    d.disabled = true; d.textContent = "Deleting";
    Backend.fresh(sess, setSess).then(function(sn){ return Backend.deleteMe(sn); }).then(function(){
      setSess(null); meta = {}; put(META, null); K.toast("Account deleted. Your progress stays on this phone."); refresh();
    }, function(e){ d.disabled = false; d.removeAttribute("data-sure"); d.textContent = "Delete account"; K.toast(nice(e)); });
  });
}
function refresh(){
  var w = document.getElementById("acct-wrap");
  if (!w) return;
  w.innerHTML = accountInner(); wire(w);
}
/* one gentle nudge, once, after real progress */
function nudgeHtml(){
  if (!on || sess || get(NUDGE) || !K.hasProgress || K.hasProgress() < 30) return "";
  put(NUDGE, Date.now());
  return '<button class="link acct-nudge" data-act="acct-nudge">Save your progress to a free account, so a new phone does not start from zero</button>';
}
function wireNudge(v){ var n = v && v.querySelector('[data-act="acct-nudge"]'); if (n) n.addEventListener("click", function(){ openForm("up"); }); }

/* setup's "I already have an account": sign in first, then skip setup if the account already has it */
function signInFirst(done){ openForm("in", done); }

window.KLAAR_SYNC = {on: function(){ return on; }, signedIn: function(){ return !!sess; }, dirty: dirty, sync: sync, profileHtml: profileHtml, wire: wire, nudgeHtml: nudgeHtml, wireNudge: wireNudge, signInFirst: signInFirst, open: openForm};
if (!on) return;

window.addEventListener("online", function(){ if (sess) later(2000); });
document.addEventListener("visibilitychange", function(){
  if (!sess) return;
  if (document.hidden){ if (timer) sync(); }   /* best effort; opening the app again always syncs */
  else if (!meta.at || Date.now() - meta.at > 120000) later(1500);
});
if (sess) later(1500);
})();
