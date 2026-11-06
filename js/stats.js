/* Anonymous usage counts, so we can see which screens get used and which questions people get wrong.
   Sent to GoatCounter (no cookies, no IP addresses stored, nothing that identifies a person).
   Off until SITE is set, only on the live site, and each user can switch it off in their profile.
   What is counted: app opens, screens, answers (question id + right/wrong), finished lessons, mock results. */
(function(){
"use strict";
var SITE = "";  /* the GoatCounter code, e.g. "klaar" for https://klaar.goatcounter.com */
var LIVE = "yazan-hammad0.github.io";
function off(){ try{ return localStorage.getItem("klaarStats") === "off"; }catch(e){ return false; } }
function slug(s){ return String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function send(path, title){
  if (!SITE || location.hostname !== LIVE || off()) return;
  try{
    var u = "https://" + SITE + ".goatcounter.com/count?e=true&p=" + encodeURIComponent(path) + "&t=" + encodeURIComponent(title || path) +
      "&s=" + encodeURIComponent((screen.width || 0) + "," + (screen.height || 0)) + "&rnd=" + Math.random().toString(36).slice(2);
    if (!(navigator.sendBeacon && navigator.sendBeacon(u))) new Image().src = u;
  }catch(e){}
}
window.KLAAR_STATS = {
  ready: function(){ return !!SITE; },
  on: function(){ return !!SITE && !off(); },
  set: function(v){ try{ localStorage.setItem("klaarStats", v ? "on" : "off"); }catch(e){} },
  view: function(v){ send("view/" + v, "Screen: " + v); },
  answer: function(q, ok){ if (!q) return;
    send("q/" + q.track + "/" + q.id + "/" + (ok ? "right" : "wrong"), (ok ? "Right: " : "Wrong: ") + (q.topic ? q.topic + " | " : "") + String(q.q || "").slice(0, 80));
    send("topic/" + q.track + "/" + slug(q.topic) + "/" + (ok ? "right" : "wrong"), (ok ? "Right: " : "Wrong: ") + q.track + " | " + q.topic); },
  lesson: function(track, topic){ send("lesson/" + track + "/" + slug(topic), "Lesson finished: " + topic); },
  mock: function(track, id, s, n, ok){ send("mock/" + track + "/" + slug(id) + "/" + (ok ? "pass" : "fail"), "Mock " + id + ": " + (ok ? "pass" : "fail") + " (" + s + "/" + n + ")"); }
};
var lang = ""; try{ lang = localStorage.getItem("klaarLang") || "en"; }catch(e){}
var standalone = !!(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
send("open/" + (standalone ? "app" : "browser") + "/" + slug(lang || "en"), "App opened (" + (standalone ? "home-screen app" : "browser") + ", " + (lang || "en") + ")");
})();
