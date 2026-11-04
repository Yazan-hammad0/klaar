/* Screen-tall layout for the home-screen app, update notice, service worker. */
var KLAAR_VERSION = "fe8e7bae6d", KLAAR_NEWS = "New: animated lessons for hazards, distances, lanes, railway crossings, road markings and motorways.";
(function(){
  /* iOS home-screen apps sometimes get a layout viewport shorter than the screen, which leaves a strip under the tab bar.
     Measure it and push the bottom chrome down into that strip. */
  var probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)";
  document.body.appendChild(probe);
  var info = {}, root = document.documentElement;
  /* Home-screen app: the whole app is one block exactly as tall as the screen, with the menu bar as its last row.
     Nothing is pinned to the "viewport", which iOS sometimes reports shorter than the screen, so nothing can move. */
  function fit(){
    var st = window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
    var cs = getComputedStyle(probe), top = parseFloat(cs.paddingTop) || 0, bot = parseFloat(cs.paddingBottom) || 0;
    var portrait = !window.matchMedia || matchMedia("(orientation: portrait)").matches;
    var full = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var h = window.innerHeight, d = full - h;
    if (st && d >= 0 && d <= 140) h = full;
    root.style.setProperty("--app-h", h + "px");
    root.classList.toggle("shell", st);
    info = {st:st, full:full, inner:window.innerHeight, h:h, top:top, bot:bot};
  }
  window.KLAAR_DIAG = function(){ fit(); return "Screen " + info.full + " · view " + info.inner + " · app " + info.h + " · safe " + info.top + "/" + info.bot + (info.st ? " · home screen" : " · browser") + " · v" + KLAAR_VERSION; };
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", function(){ setTimeout(fit, 300); });
  window.addEventListener("pageshow", fit);
  /* an app, not a web page: no pinch zoom (iPhone ignores user-scalable=no; double-tap zoom is off via touch-action in app.css). The system Zoom in Accessibility still works. */
  ["gesturestart", "gesturechange"].forEach(function(n){ document.addEventListener(n, function(e){ e.preventDefault(); }, {passive:false}); });
  window.addEventListener("scroll", function(){ if (root.classList.contains("shell") && window.scrollY) window.scrollTo(0, 0); }, {passive:true});

  /* updates: check when the app comes back to the front; when a new version takes over, offer a one-tap reload */
  function updateBar(){
    if (document.getElementById("upd")) return;
    var u = document.createElement("div"); u.id = "upd"; u.className = "upd"; u.setAttribute("role", "status");
    u.innerHTML = '<span><b>New version of Klaar</b>' + KLAAR_NEWS + '</span><button class="btn pop">Update</button>';
    u.querySelector("button").addEventListener("click", function(){ location.reload(); });
    document.body.appendChild(u);
  }
  if ("serviceWorker" in navigator){
    var hadController = !!navigator.serviceWorker.controller, reg = null;
    navigator.serviceWorker.addEventListener("controllerchange", function(){ if (hadController) updateBar(); hadController = true; });
    window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js").then(function(r){ reg = r; }).catch(function(){}); });
    document.addEventListener("visibilitychange", function(){ if (!document.hidden){ setTimeout(fit, 120); if (reg) reg.update().catch(function(){}); } });
    setInterval(function(){ if (reg && !document.hidden) reg.update().catch(function(){}); }, 30 * 60 * 1000);
  }
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var dismissed = false; try{ dismissed = localStorage.getItem("klaarInstallHint") === "no"; }catch(e){}
  if (!standalone && (ios || /android/i.test(navigator.userAgent)) && !dismissed){
    var main = document.querySelector("main") || document.body;
    var d = document.createElement("div"); d.className = "install";
    d.innerHTML = '<span><b>Put Klaar on your home screen</b>It opens full screen and works without internet. <a href="#" id="inst-how">Show me how</a></span><button aria-label="Dismiss">&times;</button>';
    d.querySelector("button").addEventListener("click", function(){ d.remove(); try{ localStorage.setItem("klaarInstallHint", "no"); }catch(e){} });
    d.querySelector("#inst-how").addEventListener("click", function(e){ e.preventDefault(); if (window.KLAAR_GUIDE) window.KLAAR_GUIDE(); });
    main.insertBefore(d, main.firstChild);
  }
})();
