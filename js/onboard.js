/* ---- onboarding: install guide in the browser, short intro on first launch ---- */
(function(){
  var ua = navigator.userAgent;
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  var ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var inApp = /Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Snapchat|TikTok|musical_ly|BytedanceWebview|Twitter|Line\/|Pinterest/i.test(ua) || (/android/i.test(ua) && /; wv\)/.test(ua));
  var android = /android/i.test(ua);
  function guide(){
    if (ios){
      if (inApp) return "ios-inapp";
      if (/CriOS/.test(ua)) return "ios-chrome";
      if (/FxiOS/.test(ua)) return "ios-firefox";
      if (/EdgiOS/.test(ua)) return "ios-edge";
      if (/OPiOS|GSA\/|YaBrowser|DuckDuckGo/.test(ua)) return "ios-other";
      var v = /Version\/(\d+)/.exec(ua);
      return v && +v[1] < 26 ? "ios-safari-old" : "ios-safari";
    }
    if (android){
      if (inApp) return "android-inapp";
      if (/SamsungBrowser/.test(ua)) return "android-samsung";
      if (/Firefox/.test(ua)) return "android-firefox";
      if (/EdgA/.test(ua)) return "android-edge";
      if (/OPR|Opera/.test(ua)) return "android-opera";
      if (/Chrome/.test(ua)) return "android-chrome";
      return "android-other";
    }
    if (/Edg\/|Chrome\//.test(ua) && !/OPR/.test(ua)) return "desktop-chromium";
    if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Firefox/.test(ua)) return "mac-safari";
    return "desktop-other";
  }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var deferred = null, timer = null;
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferred = e; ["onb-install", "onb-or"].forEach(function(id){ var b = document.getElementById(id); if (b) b.hidden = false; }); });
  window.addEventListener("appinstalled", function(){ lsSet("klaarInstallSeen", "1"); close(); });
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  var ICON = '<img src="icon-180.png" alt="">';
  var URL_NOW = location.href.split("#")[0].split("?")[0];

  function open(html){
    close(true);
    var el = document.createElement("div"); el.className = "onb"; el.id = "onb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    el.innerHTML = '<div class="onb-in">' + html + '</div>';
    document.body.appendChild(el); document.body.style.overflow = "hidden";
    return el;
  }
  function close(now){
    clearInterval(timer); timer = null;
    var el = document.getElementById("onb"); if (!el) return;
    document.body.style.overflow = "";
    if (now || reduce){ el.remove(); return; }
    el.classList.add("out"); setTimeout(function(){ el.remove(); }, 240);
  }

  /* ---------- install guide ---------- */
  var IOS_STEPS = [
    ["Tap ••• next to the address bar", "Then tap Share. On older iPhones, tap the Share button at the bottom."],
    ["Tap Add to Home Screen", "Scroll down the list. Tap More if you don't see it."],
    ["Keep “Open as Web App” on, tap Add", "You can rename it first if you want."],
    ["Open Klaar from your home screen", "It opens full screen and works without internet."]
  ];
  var SHARE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>';
  function mockIOS(old){
    return '<div class="mock" aria-hidden="true"><div class="page"><i></i><i></i><i></i><i></i></div>' +
      '<div class="bar"><span class="url">' + location.host + '</span><span class="dots">' + (old ? SHARE : "\u2022\u2022\u2022") + '<b class="ring" id="m-ring"></b></span></div>' +
      (old ? "" : '<div class="scene pop" data-s="0"><div class="row-m">Bookmarks</div><div class="row-m hl">Share</div><div class="row-m">New Tab</div></div>') +
      '<div class="scene sheet-m" data-s="1"><div class="row-m">Copy</div><div class="row-m">Add to Reading List</div><div class="row-m hl">Add to Home Screen</div></div>' +
      '<div class="scene add-m" data-s="2"><div class="top-m"><span>Cancel</span><span class="addbtn">Add</span></div><div class="app-m">' + ICON + '<b>Klaar</b></div>' + (old ? "" : '<div class="tog"><span>Open as Web App</span><i></i></div>') + '</div>' +
      '<div class="scene home-m" data-s="3"><span></span><span></span><span></span><span></span><span></span><span></span>' + ICON + '<span></span><em>Tap Klaar to open it</em></div></div>';
  }
  function stepsHtml(list){
    return '<ol class="onb-steps">' + list.map(function(s, i){ return '<li data-i="' + i + '"><span class="n">' + (i + 1) + '</span><div><b>' + s[0] + '</b><span>' + s[1] + '</span></div></li>'; }).join("") + '</ol>';
  }
  function langRow(){
    if (!window.I18N) return "";
    return '<div class="langrow" role="group" aria-label="Language">' + Object.keys(I18N.langs).map(function(l){ return '<button data-lang="' + l + '" lang="' + l + '" translate="no" aria-pressed="' + (I18N.get() === l) + '">' + I18N.langs[l].label + '</button>'; }).join("") + '</div>';
  }
  function wireLang(el){
    var bs = Array.prototype.slice.call(el.querySelectorAll(".langrow [data-lang]"));
    bs.forEach(function(b){ b.addEventListener("click", function(){ I18N.set(b.getAttribute("data-lang")); bs.forEach(function(x){ x.setAttribute("aria-pressed", String(x.getAttribute("data-lang") === I18N.get())); }); }); });
  }
  function showInstall(){
    var head = '<div class="onb-brand">' + ICON + 'Klaar</div>' + langRow();
    var pitch = "Practise for the Dutch driving theory exam and the integration exam, one question at a time. Free, and it works offline.";
    var OPEN = ["Open Klaar from your home screen", "It opens full screen and works without internet."];
    var g = guide(), html = head;
    function linkBox(){ return '<div class="onb-url">' + URL_NOW + '</div><div class="onb-foot" style="margin-top:14px;padding-top:0"><button class="btn" id="onb-copy">Copy link</button></div>'; }
    if (g === "ios-safari" || g === "ios-safari-old"){
      var old = g === "ios-safari-old";
      html += '<h1>Put Klaar on your home screen</h1><p class="sub">' + pitch + ' Takes 20 seconds:</p>' + mockIOS(old) + stepsHtml([
        old ? ["Tap the Share button", "The square with an arrow, in the bar at the bottom."] : ["Tap ••• next to the address bar", "Then tap Share."],
        ["Tap Add to Home Screen", "Scroll down the list. Tap More if you don't see it."],
        old ? ["Tap Add", "Top right. You can rename it first."] : ["Keep “Open as Web App” on, tap Add", "You can rename it first if you want."], OPEN]);
    } else if (g === "ios-chrome"){
      html += '<h1>Put Klaar on your home screen</h1><p class="sub">' + pitch + '</p>' + stepsHtml([
        ["Tap the Share icon", "In the address bar, top right (the square with an arrow)."], ["Tap Add to Home Screen", "Scroll down if you don't see it. Tap More if it's hidden."], ["Tap Add", "Top right."], OPEN]);
    } else if (g === "ios-firefox"){
      html += '<h1>Put Klaar on your home screen</h1><p class="sub">' + pitch + '</p>' + stepsHtml([
        ["Tap the menu ☰", "Bottom right of Firefox."], ["Tap Share", "Then scroll the list."], ["Tap Add to Home Screen, then Add", "You can rename it first."], OPEN]);
    } else if (g === "ios-edge"){
      html += '<h1>Put Klaar on your home screen</h1><p class="sub">' + pitch + '</p>' + stepsHtml([
        ["Tap •••", "In the bar at the bottom of Edge."], ["Tap Share", "Then scroll the list."], ["Tap Add to Home Screen, then Add", "You can rename it first."], OPEN]);
    } else if (g === "ios-inapp" || g === "ios-other"){
      html += '<h1>Open this page in Safari</h1><p class="sub">' + (g === "ios-inapp" ? "You opened this inside another app, which can't install apps. Tap ••• or the compass icon and choose Open in Safari. Or copy the link and paste it in Safari." : "This browser can't add apps to your home screen. Copy the link and paste it in Safari.") + '</p>' + linkBox();
    } else if (g === "android-inapp"){
      html += '<h1>Open this page in your browser</h1><p class="sub">You opened this inside another app, which can\'t install apps. Tap ⋮ in the corner and choose Open in Chrome or Open in browser.</p>' + linkBox();
    } else if (g.indexOf("android") === 0 || g === "desktop-chromium"){
      var desk = g === "desktop-chromium";
      var steps = {
        "android-chrome": [["Tap ⋮", "Top right of Chrome."], ["Tap Add to Home screen", "Then Install."], OPEN],
        "android-samsung": [["Tap the menu ☰", "Bottom right of Samsung Internet."], ["Tap Add page to, then Home screen", "Then Add."], OPEN],
        "android-firefox": [["Tap ⋮", "Top right of Firefox."], ["Tap Install or Add to Home screen", "Then confirm."], OPEN],
        "android-edge": [["Tap •••", "Bottom of Edge."], ["Tap Add to phone", "Then Install."], OPEN],
        "android-opera": [["Tap ⋮", "Top right of Opera."], ["Tap Add to, then Home screen", "Then Add."], OPEN],
        "android-other": [["Open your browser's menu", "Usually ⋮ or ☰."], ["Tap Install app or Add to Home screen", "Then confirm."], OPEN],
        "desktop-chromium": [["Click the install icon in the address bar", "A small screen with an arrow, on the right. Or open the browser menu and choose Install Klaar."], ["Click Install", "Klaar opens in its own window."], ["For practice on the go, open the link on your phone too", "Your phone keeps its own progress."]]
      }[g];
      html += '<h1>Install Klaar</h1><p class="sub">' + pitch + '</p><button class="btn" id="onb-install" style="width:100%;padding:16px;font-size:16px;margin-bottom:6px"' + (deferred ? "" : " hidden") + '>Install app</button>' +
        '<p class="sub" id="onb-or" style="margin:4px 0 0"' + (deferred ? "" : " hidden") + '>Or do it by hand:</p>' + stepsHtml(steps);
    } else if (g === "mac-safari"){
      html += '<h1>Add Klaar to your Dock</h1><p class="sub">' + pitch + '</p>' + stepsHtml([["Click File in the menu bar", "Top of the screen."], ["Click Add to Dock", "Then Add."], ["For practice on the go, open the link on your phone too", "Your phone keeps its own progress."]]);
    } else {
      html += '<h1>Klaar is made for your phone</h1><p class="sub">This browser can\'t install apps. Open the link on your phone, or in Chrome or Edge on this computer.</p>' + linkBox();
    }
    html += '<div class="onb-foot"><button class="onb-link" id="onb-later">Try it in the browser first</button></div>';
    var el = open(html);
    wireLang(el);
    var copy = el.querySelector("#onb-copy");
    if (copy) copy.addEventListener("click", function(){ if (navigator.clipboard) navigator.clipboard.writeText(URL_NOW).then(function(){ copy.textContent = "Copied"; }, function(){}); });
    var inst = el.querySelector("#onb-install");
    if (inst) inst.addEventListener("click", function(){ if (!deferred) return; deferred.prompt(); deferred.userChoice.then(function(){ deferred = null; close(); }); });
    el.querySelector("#onb-later").addEventListener("click", function(){ lsSet("klaarInstallSeen", "1"); close(); setTimeout(maybeIntro, 260); });
    var lis = Array.prototype.slice.call(el.querySelectorAll(".onb-steps li")), scenes = Array.prototype.slice.call(el.querySelectorAll(".scene")), ring = el.querySelector("#m-ring");
    var cur = 0;
    function go(i){
      cur = i;
      lis.forEach(function(li, k){ li.classList.toggle("on", k === i); });
      scenes.forEach(function(s){ s.classList.toggle("on", +s.getAttribute("data-s") === i); });
      if (ring) ring.style.display = i === 0 ? "" : "none";
    }
    if (lis.length){
      go(0);
      lis.forEach(function(li){ li.addEventListener("click", function(){ clearInterval(timer); timer = null; go(+li.getAttribute("data-i")); }); });
      if (scenes.length && !reduce) timer = setInterval(function(){ go((cur + 1) % lis.length); }, 2800);
    }
  }

  /* ---------- setup: step-by-step screens in js/setup.js ---------- */
  window.KLAAR_PROFILE = function(){ if (window.KLAAR_SETUP) KLAAR_SETUP.open(true); };
  function maybeIntro(){ if (window.KLAAR_SETUP && KLAAR_SETUP.needed()) KLAAR_SETUP.open(false); }
  window.KLAAR_GUIDE = showInstall;
  if (!standalone && !lsGet("klaarInstallSeen")) showInstall();
  else maybeIntro();
})();
