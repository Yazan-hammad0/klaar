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
  function showInstall(){
    var head = '<div class="onb-brand">' + ICON + 'Klaar</div>';
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

  /* ---------- first-run intro ---------- */
  var choice = {track: null, goal: 30};
  var CAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(45 12 12)"/><rect x="9" y="9" width="6" height="6" transform="rotate(45 12 12)" fill="currentColor"/></svg>';
  var PASS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="10" r="3.2"/><path d="M8.5 16.5h7"/></svg>';
  var CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>';
  var BARS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
  var SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>';
  function dots(i){ return '<div class="dots-nav" aria-hidden="true">' + [0, 1, 2].map(function(k){ return '<i class="' + (k === i ? "on" : "") + '"></i>'; }).join("") + '</div>'; }
  var lastSlide = -1;
  function slide(i, back){
    var body, foot, anim = i !== lastSlide; lastSlide = i;
    if (i === 0){
      body = '<h1>Learn the way you scroll</h1><p class="sub">Tap an answer and see why it\'s right or wrong. Then swipe up for the next question. Questions you miss come back until you know them.</p>' +
        '<div class="intro-vis" aria-hidden="true"><div class="mini"><i class="q"></i><i style="width:60%"></i><i class="o"></i><i class="o ok"></i><i class="o"></i></div><span class="finger"></span></div>';
      foot = '<button class="btn" data-go="1">Next</button>';
    } else if (i === 1){
      body = '<h1>What are you working towards?</h1><p class="sub">You can switch any time with the toggle at the top.</p><div class="choice">' +
        '<button data-t="drive" aria-pressed="' + (choice.track === "drive") + '"><span class="ic" style="background:#1C4FA0">' + CAR + '</span><span><b>Driving licence</b><span>CBR theory exam, practised in English</span></span></button>' +
        '<button data-t="civic" aria-pressed="' + (choice.track === "civic") + '"><span class="ic" style="background:#7A2233">' + PASS + '</span><span><b>Integration exam</b><span>KNM and Dutch at A2, then beyond</span></span></button></div>';
      foot = '<button class="btn" data-go="2"' + (choice.track ? "" : " disabled") + '>Next</button><button class="onb-link" data-go="0">Back</button>';
    } else {
      body = '<h1>Pick a daily goal</h1><p class="sub">A small number every day beats a big session once a week.</p><div class="goals">' +
        [[15, "about 5 min"], [30, "about 10 min"], [50, "about 15 min"]].map(function(g){ return '<button data-g="' + g[0] + '" aria-pressed="' + (choice.goal === g[0]) + '">' + g[0] + '<small>' + g[1] + '</small></button>'; }).join("") + '</div>' +
        '<div class="tips"><div>' + CLOCK + '<span><b>Exams</b> are timed mock tests, scored like the real one.</span></div><div>' + BARS + '<span><b>Progress</b> shows your weak topics and your checklist.</span></div><div>' + SWAP + '<span>Your progress stays on this phone. Nothing is uploaded.</span></div></div>';
      foot = '<button class="btn" id="onb-start">Start practising</button><button class="onb-link" data-go="1">Back</button>';
    }
    var el = document.getElementById("onb") || open("");
    el.querySelector(".onb-in").innerHTML = '<div class="' + (anim ? "slide" + (back ? " back" : "") : "") + '" style="display:flex;flex-direction:column;flex:1"><div class="onb-brand">' + ICON + 'Klaar</div>' + body + '<div class="onb-foot">' + dots(i) + foot + '</div></div>';
    Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function(b){ b.addEventListener("click", function(){ var n = +b.getAttribute("data-go"); slide(n, n < i); }); });
    Array.prototype.forEach.call(el.querySelectorAll("[data-t]"), function(b){ b.addEventListener("click", function(){ choice.track = b.getAttribute("data-t"); slide(1); }); });
    Array.prototype.forEach.call(el.querySelectorAll("[data-g]"), function(b){ b.addEventListener("click", function(){ choice.goal = +b.getAttribute("data-g"); slide(2); }); });
    var st = el.querySelector("#onb-start");
    if (st) st.addEventListener("click", function(){ if (window.KLAAR) window.KLAAR.finish(choice.track, choice.goal); close(); });
    el.scrollTop = 0;
  }
  function maybeIntro(){
    if (!window.KLAAR || window.KLAAR.isOnboarded()) return;
    choice.track = null; choice.goal = window.KLAAR.goal() || 30; lastSlide = -1;
    open(""); slide(0);
  }
  window.KLAAR_GUIDE = showInstall;
  if (!standalone && !lsGet("klaarInstallSeen")) showInstall();
  else maybeIntro();
})();
