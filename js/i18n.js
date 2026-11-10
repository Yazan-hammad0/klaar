/* Languages: English (the text in the code) and Arabic (right to left).
   Translates what is on screen as it appears, so the app code keeps plain English strings.
   Strings live in js/i18n-data.js. Questions and their explanations are not translated yet. */
(function(){
"use strict";
var LANGS = {
  en:{label:"English", dir:"ltr", loc:"en-GB"},
  ar:{label:"العربية", dir:"rtl", loc:"ar-u-nu-latn"}
};
/* Arabic is switched off for now: the app is English only. Set ARABIC to true to bring the language choice back. */
var ARABIC = false;
if (!ARABIC) delete LANGS.ar;
var KEY = "klaarLang", IDX = {ar:1};
var ATTRS = ["placeholder", "aria-label", "title", "alt"];
/* question content stays as written; labels around it are translated */
var SKIP = "script,style,textarea,input,[translate=no],.qtext,.passage,.les-q,.les-en,.les-e,.les-a b,.opt > span:last-child,.rq,.rv .mut,.fb .ex,.fb .en,.en-pre,.ai-out,.term,.sheet h2,.sheet p,.onb-url,.mock .url";
var DATA = window.I18N_DATA || {rows:[], pats:[], parts:[]};
var M = {ar:{}};
DATA.rows.forEach(function(r){ M.ar[r[0]] = r[1]; });
var PM = {ar:{}};
DATA.parts.forEach(function(r){ PM.ar[r[0]] = r[1]; });

function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
var saved = lsGet(KEY);
function detect(){
  var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
  for (var i = 0; i < list.length; i++){
    var l = String(list[i]).toLowerCase().slice(0, 2);
    if (LANGS[l]) return l;
  }
  return "en";
}
var lang = saved && LANGS[saved] ? saved : detect();

/* ---- translating one string ---- */
/* in a pattern template: $1 = the captured text, $D1 = translated if known, $T1 = a topic list like "Signs (2), Distances (1)" translated */
function expand(tpl, m, L){
  return tpl.replace(/\$([DT]?)(\d)/g, function(_, f, n){
    var g = m[+n] || "";
    if (f === "D"){ var t = tr1(g, L); return t != null ? t : g; }
    if (f === "T") return g.split(", ").map(function(x){ var mm = /^(.*?)( \(\d+\))?$/.exec(x), t = M[L][mm[1]]; return (t != null ? t : mm[1]) + (mm[2] || ""); }).join(L === "ar" ? "، " : ", ");
    return g;
  });
}
function tr1(s, L){
  var m = M[L][s]; if (m !== undefined) return m;
  var i = IDX[L], ps = DATA.pats;
  for (var k = 0; k < ps.length; k++){ var r = ps[k][0].exec(s); if (r) return expand(ps[k][i], r, L); }
  return null;
}
function sentences(s){
  var out = [], re = /([.!?])\s+/g, last = 0, m;
  while ((m = re.exec(s))){ out.push(s.slice(last, m.index + 1)); last = m.index + m[0].length; }
  out.push(s.slice(last));
  return out.filter(function(x){ return x; });
}
function bySentences(s, L){
  var ss = sentences(s), n = ss.length, out = [], i = 0;
  if (n < 2) return null;
  while (i < n){
    var hit = null, j;
    for (j = n; j > i; j--){ var t = tr1(ss.slice(i, j).join(" "), L); if (t != null){ hit = t; break; } }
    if (hit == null) return null;
    out.push(hit); i = j;
  }
  return out.join(" ");
}
function byParts(s, L, sep, table){
  var parts = s.split(sep), any = false;
  if (parts.length < 2) return null;
  var out = parts.map(function(p){ var t = tr1(p, L); if (t == null && table) t = table[L][p]; if (t != null) any = true; return t != null ? t : p; });
  return any ? out : null;
}
function trText(raw, L){
  var lead = /^\s*/.exec(raw)[0], trail = /\s*$/.exec(raw)[0], s = raw.trim();
  if (!s || !/[A-Za-z]/.test(s)) return null;
  var out = tr1(s, L);
  if (out == null) out = bySentences(s, L);
  if (out == null){ var a = byParts(s, L, " · "); if (a) out = a.join(" · "); }
  if (out == null && /\.$/.test(s) && s.indexOf(", ") > 0){
    var b = byParts(s.slice(0, -1), L, ", ", PM), ok = b && b.every(function(x, i){ return x !== s.slice(0, -1).split(", ")[i]; });
    if (ok) out = b.join(L === "ar" ? "، " : ", ") + ".";
  }
  return out == null ? null : lead + out + trail;
}

/* ---- applying it to the page ---- */
var TXT = new WeakMap(), ATT = new WeakMap();
function skipped(el){ return !!(el && el.closest && el.closest(SKIP)); }
function doText(n){
  var rec = TXT.get(n);
  if (rec && n.nodeValue !== rec.shown) rec = null;      /* the app changed it: start from its new text */
  var orig = rec ? rec.orig : n.nodeValue;
  if (lang === "en"){ if (rec){ n.nodeValue = rec.orig; TXT.delete(n); } return; }
  if (skipped(n.parentNode)){ if (rec){ n.nodeValue = rec.orig; TXT.delete(n); } return; }
  var t = trText(orig, lang);
  if (t == null){ if (rec){ n.nodeValue = orig; TXT.delete(n); } return; }
  if (n.nodeValue !== t) n.nodeValue = t;
  TXT.set(n, {orig:orig, shown:t});
}
function doAttrs(el){
  var st = ATT.get(el) || {};
  ATTRS.forEach(function(a){
    if (!el.hasAttribute(a)) { delete st[a]; return; }
    var cur = el.getAttribute(a), rec = st[a];
    if (rec && cur !== rec.shown) rec = null;
    var orig = rec ? rec.orig : cur;
    if (lang === "en" || skipped(el)){ if (rec){ el.setAttribute(a, rec.orig); delete st[a]; } return; }
    var t = trText(orig, lang);
    if (t == null){ if (rec){ el.setAttribute(a, orig); delete st[a]; } return; }
    if (cur !== t) el.setAttribute(a, t);
    st[a] = {orig:orig, shown:t};
  });
  ATT.set(el, st);
}
function walk(root){
  if (!root) return;
  if (root.nodeType === 3){ doText(root); return; }
  if (root.nodeType !== 1) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null), n = root;
  if (root.tagName === "SCRIPT" || root.tagName === "STYLE") return;
  doAttrs(root);
  while ((n = w.nextNode())){
    if (n.nodeType === 3) doText(n);
    else if (n.tagName !== "SCRIPT" && n.tagName !== "STYLE") doAttrs(n);
  }
}
var obs = null;
function observe(on){
  if (!obs && on && window.MutationObserver){
    obs = new MutationObserver(function(recs){
      recs.forEach(function(r){
        if (r.type === "childList") Array.prototype.forEach.call(r.addedNodes, walk);
        else if (r.type === "characterData") doText(r.target);
        else if (r.type === "attributes") doAttrs(r.target);
      });
      obs.takeRecords();   /* drop the changes we just made ourselves */
    });
  }
  if (!obs) return;
  obs.disconnect();
  if (on) obs.observe(document.documentElement, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS});
}
function applyDoc(){
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGS[lang].dir;
  if (obs) obs.disconnect();
  walk(document.body);
  observe(lang !== "en");
}
function set(l){
  if (!LANGS[l]) return;
  lang = l; lsSet(KEY, l);
  applyDoc();
  try{ window.dispatchEvent(new Event("klaar-lang")); }catch(e){}
}
window.I18N = {
  get: function(){ return lang; },
  set: set,
  chosen: function(){ return !!lsGet(KEY); },
  langs: LANGS,
  rtl: function(){ return LANGS[lang].dir === "rtl"; },
  loc: function(){ return LANGS[lang].loc; },
  apply: function(el){ walk(el); }
};
document.documentElement.lang = lang;
document.documentElement.dir = LANGS[lang].dir;
if (lang !== "en"){ applyDoc(); } else { observe(false); }
})();
