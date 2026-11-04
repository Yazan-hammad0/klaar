/* Topic lessons: short steps with an animated scene, the rule, and why it works that way.
   Shown once, before the first questions on that topic. Scenes are drawn in SVG and animated with CSS,
   so they work offline and weigh almost nothing. Traffic drives on the right. */
(function(){
"use strict";
var SRC = {
  anwbPriority: "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/voorrang",
  /* the English booklet of the Dutch traffic rules (RVV 1990), linked per page */
  gov: function(page){ return "https://www.government.nl/site/binaries/site-content/collections/documents/2024/02/09/road-traffic-signs-and-regulations-in-the-netherlands/Road+Traffic+Signs+and+Regulations+in+the+Netherlands.pdf#page=" + page; },
  anwbSigns: "https://www.anwb.nl/verkeer/nederland/verkeersinformatie/verkeersborden-nederland",
  anwbLights: "https://www.anwb.nl/auto/onderhoud-en-reparatie/verlichting/soorten-autoverlichting",
  rvv34: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=34",
  /* civic (KNM): official pages, each checked on 4 Nov 2026 */
  insurance: "https://www.rijksoverheid.nl/onderwerpen/immigratie-naar-nederland/vraag-en-antwoord/moet-ik-een-zorgverzekering-afsluiten-als-ik-in-nederland-ga-werken",
  referral: "https://www.rijksoverheid.nl/onderwerpen/eerstelijnszorg/vraag-en-antwoord/wanneer-heb-ik-een-verwijsbrief-van-mijn-huisarts-nodig-en-wanneer-mag-hij-deze-weigeren",
  eigenRisico: "https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/zorgverzekering/eigen-risico-zorgverzekering",
  call112: "https://www.rijksoverheid.nl/vraag-en-antwoord/alarmnummer-112/wanneer-112-bellen",
  probation: "https://www.rijksoverheid.nl/onderwerpen/arbeidsovereenkomst-en-cao/vraag-en-antwoord/hoelang-duurt-een-proeftijd",
  holidayPay: "https://www.rijksoverheid.nl/onderwerpen/vakantiedagen-en-vakantiegeld/vraag-en-antwoord/hoe-hoog-is-mijn-vakantiegeld",
  sickPay: "https://www.rijksoverheid.nl/vraag-en-antwoord/ziekteverzuim-van-het-werk/hoeveel-loon-krijg-ik-doorbetaald-als-ik-ziek-ben",
  ww: "https://www.uwv.nl/nl/ww/ww-aanvragen",
  bsn: "https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/privacy-en-persoonsgegevens/hoe-kom-ik-aan-een-burgerservicenummer-bsn",
  birth: "https://www.rijksoverheid.nl/onderwerpen/aangifte-geboorte-en-naamskeuze-kind/vraag-en-antwoord/aangifte-geboorte",
  toeslagChange: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/toeslagen/wijzigingen_doorgeven/wijzigingen_doorgeven",
  digid: "https://www.digid.nl/en/security/tips-secure-login",
  cbr: "https://www.cbr.nl/nl/rijbewijs-halen/auto/theorie-examen-auto/onderwerpen-in-het-theorie-examen.htm",
  anwbDistance: "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/afstand-houden",
  anwbSpeed: "https://www.anwb.nl/verzekeringen/autoverzekering/veilig-rijden/rijtips-snelheid",
  rvv23: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=23",
  rvv54: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=54",
  rvv20: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=20",
  rvv21: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=21",
  rvv45: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=45",
  speedRules: "https://www.rijksoverheid.nl/vraag-en-antwoord/verkeersveiligheid/wat-is-de-maximumsnelheid-voor-auto-s-op-de-snelweg"
};

/* ---- ground ---- */
function crossroads(){
  return '<rect class="sc-road" x="70" y="0" width="60" height="200"/><rect class="sc-road" x="0" y="70" width="200" height="60"/>' +
    '<path class="sc-dash" d="M100 0V68M100 132V200M0 100H68M132 100H200"/>';
}
function drivewayRoad(){
  return '<rect class="sc-road" x="0" y="60" width="200" height="60"/><path class="sc-dash" d="M0 90H200"/>' +
    '<rect class="sc-drive" x="30" y="120" width="30" height="80"/><path class="sc-kerb" d="M30 121H60"/>';
}
/* a straight road going up: lanes centred on x=80 (left) and x=120 (right) */
function road(centre){
  var c = centre === "half" ? '<path class="sc-solid" d="M100 0V100"/><path class="sc-dash" d="M100 100V200"/>' :
    centre === "none" ? "" : '<path class="sc-dash" d="M100 0V200"/>';
  return '<rect class="sc-road" x="60" y="0" width="80" height="200"/>' + c;
}
function zipRoad(){
  return '<rect class="sc-road" x="100" y="0" width="40" height="200"/><path class="sc-road" d="M60 200V95L100 55V200Z"/>' +
    '<path class="sc-dash" d="M100 98V200"/>';
}
function motorway(){
  return '<rect class="sc-road" x="70" y="0" width="80" height="200"/><path class="sc-road" d="M150 200V75L150 35L178 75V200Z"/>' +
    '<path class="sc-dash" d="M110 0V200M150 80V200"/><path class="sc-solid" d="M70 0V200"/>';
}
function tracks(){
  var s = ""; for (var x = 4; x < 200; x += 12) s += '<rect class="sc-sleeper" x="' + x + '" y="72" width="5" height="16"/>';
  return s + '<path class="sc-rail" d="M0 75H200M0 85H200"/>';
}
function tree(x, y){ return '<path class="sc-post" d="M' + x + ' ' + (y + 6) + 'V' + (y + 16) + '"/><circle class="sc-tree" cx="' + x + '" cy="' + y + '" r="9"/>'; }
function parked(x, y){ return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-8" y="-14" width="16" height="28" rx="4" class="sc-car c-parked"/></g>'; }

/* ---- moving things ---- */
var SHAPES = {
  car: function(c){ return '<rect x="-8" y="-14" width="16" height="28" rx="4" class="sc-car ' + c + '"/><rect x="-6" y="-9" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  truck: function(c){ return '<rect x="-9" y="-22" width="18" height="44" rx="3" class="sc-car ' + (c || "c-truck") + '"/><rect x="-7" y="-19" width="14" height="7" rx="1.5" class="sc-glass"/>'; },
  bike: function(){ return '<rect x="-1.5" y="-10" width="3" height="20" rx="1.5" class="sc-bike"/><circle cx="0" cy="1" r="4.5" class="sc-rider"/>'; },
  tram: function(){ return '<rect x="-8" y="-30" width="16" height="60" rx="5" class="sc-car c-tram"/><rect x="-6" y="-25" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  train: function(){ return '<rect x="-9" y="-60" width="18" height="120" rx="5" class="sc-car c-train"/><path class="sc-glass" d="M-6 -50H6M-6 -20H6M-6 10H6M-6 40H6" stroke-width="3"/>'; },
  ball: function(){ return '<circle r="5" class="sc-ball"/>'; },
  person: function(){ return '<circle r="5" class="sc-kid"/>'; },
  /* cars at night: beam in front (dipped or high), rear lights, rear fog light */
  lit: function(c){ return '<path class="sc-beam" d="M-6 -14L6 -14L18 -62L-18 -62Z"/>' + SHAPES.car(c) + TAIL; },
  high: function(c){ return '<path class="sc-beam" d="M-6 -14L6 -14L26 -130L-26 -130Z"/>' + SHAPES.car(c) + TAIL; },
  fogcar: function(c){ return SHAPES.car(c) + TAIL + '<circle class="sc-foglight" cx="-4" cy="15" r="3.2"/>'; },
  flash: function(c){ return '<path class="sc-ray" d="M-5 -18L-12 -34M0 -19V-37M5 -18L12 -34"/>' + SHAPES.car(c); },
  badge: function(c, t){ return '<circle class="sc-badge" r="9"/><text class="sc-num" x="0" y="3.5">' + t + '</text>'; }
};
var TAIL = '<rect class="sc-tail" x="-7" y="11.5" width="4" height="2.5"/><rect class="sc-tail" x="3" y="11.5" width="4" height="2.5"/>';
/* a sign from the question bank, placed at x,y with size s */
function roadSign(kind, x, y, s){ return window.DRIVE && DRIVE.signSvg ? DRIVE.signSvg(kind).replace('<svg ', '<svg x="' + (x - s / 2) + '" y="' + (y - s / 2) + '" width="' + s + '" height="' + s + '" ') : ""; }
function label(x, y, t){ return '<text class="sc-mark" x="' + x + '" y="' + y + '">' + t + '</text>'; }
/* civic drawings: flat, static pictures on a light card */
function civ(id, inner){ return '<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><rect class="cv-bg" width="200" height="200"/>' + inner + '</svg>'; }
function ctext(x, y, t, cls){ return '<text class="' + (cls || "cv-t") + '" x="' + x + '" y="' + y + '">' + t + '</text>'; }
function calendar(x, y, big, small){ return '<rect class="cv-card" x="' + (x - 34) + '" y="' + (y - 30) + '" width="68" height="66" rx="8"/><rect class="cv-red" x="' + (x - 34) + '" y="' + (y - 30) + '" width="68" height="16" rx="8"/><rect class="cv-red" x="' + (x - 34) + '" y="' + (y - 22) + '" width="68" height="8"/>' + ctext(x, y + 18, big, "cv-big") + ctext(x, y + 32, small, "cv-s"); }
var NIGHT = '<rect class="sc-night" width="200" height="200"/>';
/* an actor: shape, badge, label, and keyframes [percent, x, y, rotation, opacity] */
function actors(id, list){
  var css = "", g = "";
  list.forEach(function(a, k){
    var name = "sc-" + id + "-" + k, still = a.still || a.path[0], fade = a.path.some(function(p){ return p[4] != null; });
    function frame(p, rot){ return p[0] + "%{transform:translate(" + p[1] + "px," + p[2] + "px)" + (rot ? " rotate(" + (p[3] || 0) + "deg)" : "") + (fade ? ";opacity:" + (p[4] == null ? 1 : p[4]) : "") + "}"; }
    css += "@keyframes " + name + "{" + a.path.map(function(p){ return frame(p, true); }).join("") + "}";
    css += "@keyframes " + name + "b{" + a.path.map(function(p){ return frame(p, false); }).join("") + "}";
    var timing = a.steady ? ";animation-timing-function:linear" : "", op = still[4] != null ? ' opacity="' + still[4] + '"' : "";
    g += '<g class="sc-a" style="animation-name:' + name + timing + '"' + op + ' transform="translate(' + still[1] + ' ' + still[2] + ') rotate(' + (still[3] || 0) + ')">' + SHAPES[a.shape](a.color || "", a.text) + '</g>';
    if (a.badge || a.label){
      var up = a.shape === "tram" ? -40 : (a.shape === "truck" ? -32 : -25);
      g += '<g class="sc-a" style="animation-name:' + name + 'b' + timing + '"' + op + ' transform="translate(' + still[1] + ' ' + still[2] + ')">' +
        (a.badge ? '<circle class="sc-badge" cx="0" cy="' + up + '" r="' + (a.badge.length > 2 ? 12 : 9) + '"/><text class="sc-num" x="0" y="' + (up + 3.5) + '"' + (a.badge.length > 2 ? ' style="font-size:9px"' : "") + '>' + a.badge + '</text>' : "") +
        (a.label ? '<text class="sc-label" x="0" y="30">' + a.label + '</text>' : "") + '</g>';
    }
  });
  return '<style>' + css + '</style>' + g;
}
function svg(id, ground, extra, list){
  return '<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><rect class="sc-bg" width="200" height="200"/>' + ground + (extra || "") + actors(id, list) + '</svg>';
}
var YOU = {shape:"car", color:"c-you", label:"You"};
function you(path, more){ var a = {shape:"car", color:"c-you", label:"You", path:path}; for (var k in more) a[k] = more[k]; return a; }

var SCENES = {
  /* priority */
  rightFirst: function(){ return svg("rf", crossroads(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 215, 85, -90], [40, -25, 85, -90], [100, -25, 85, -90]], still:[0, 112, 85, -90]},
    you([[0, 115, 205], [18, 115, 150], [45, 115, 150], [75, 115, -25], [100, 115, -25]], {badge:"2", still:[0, 115, 152]})
  ]); },
  bikeFirst: function(){ return svg("bf", crossroads(), "", [
    {shape:"bike", badge:"1", path:[[0, 212, 85, -90], [50, -15, 85, -90], [100, -15, 85, -90]], still:[0, 112, 85, -90]},
    you([[0, 115, 205], [18, 115, 150], [52, 115, 150], [80, 115, -25], [100, 115, -25]], {badge:"2", still:[0, 115, 152]})
  ]); },
  tramFirst: function(){ return svg("tf", crossroads(), '<path class="sc-rail" d="M0 111H200M0 119H200"/>', [
    {shape:"tram", badge:"1", path:[[0, -45, 115, 90], [50, 250, 115, 90], [100, 250, 115, 90]], still:[0, 80, 115, 90]},
    you([[0, 115, 205], [18, 115, 152], [55, 115, 152], [82, 115, -25], [100, 115, -25]], {badge:"2", still:[0, 115, 154]})
  ]); },
  signsWin: function(){
    var teeth = ""; for (var y = 71; y < 99; y += 7) teeth += '<path class="sc-teeth" d="M134 ' + y + 'L142 ' + (y + 3) + 'L134 ' + (y + 6) + 'Z"/>';
    var sign = '<path class="sc-post" d="M158 160V176"/><rect class="sc-diamond" x="151" y="146" width="14" height="14" transform="rotate(45 158 153)"/>';
    return svg("sw", crossroads(), teeth + sign, [
      {shape:"car", color:"c-red", badge:"2", path:[[0, 215, 85, -90], [18, 152, 85, -90], [60, 152, 85, -90], [92, -25, 85, -90], [100, -25, 85, -90]], still:[0, 152, 85, -90]},
      you([[0, 115, 205], [50, 115, -25], [100, 115, -25]], {badge:"1", still:[0, 115, 112]})
    ]);
  },
  driveway: function(){ return svg("dw", drivewayRoad(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, -25, 105, 90], [48, 225, 105, 90], [100, 225, 105, 90]], still:[0, 100, 105, 90]},
    you([[0, 45, 205], [15, 45, 145], [52, 45, 145], [62, 45, 120], [72, 70, 105, 90], [100, 230, 105, 90]], {badge:"2", still:[0, 45, 145]})
  ]); },

  /* hazard perception */
  hzBrake: function(){ return svg("hb", road(), '<rect class="sc-drive" x="140" y="0" width="22" height="200"/>' + parked(151, 40) + parked(151, 122) + parked(151, 158), [
    {shape:"ball", path:[[0, 151, 84, 0, 0], [20, 151, 84, 0, 1], [55, 72, 84, 0, 1], [70, 72, 84, 0, 0], [100, 72, 84, 0, 0]], still:[0, 110, 84, 0, 1]},
    you([[0, 120, 215], [25, 120, 160], [38, 120, 138], [46, 120, 128], [100, 120, 128]], {steady:true, still:[0, 120, 128]})
  ]); },
  hzRelease: function(){ return svg("hr", road(), '<circle class="sc-kid" cx="166" cy="58" r="5"/><circle class="sc-kid" cx="176" cy="70" r="5"/><circle class="sc-ball" cx="170" cy="84" r="4"/>', [
    you([[0, 120, 215], [30, 120, 140], [100, 120, 70]], {steady:true, still:[0, 120, 130]})
  ]); },
  hzNothing: function(){ return svg("hn", road(), tree(170, 60) + tree(30, 140), [
    you([[0, 120, 215], [100, 120, -25]], {steady:true, still:[0, 120, 120]})
  ]); },

  /* distances */
  twoSec: function(){ return svg("ts", road(), tree(162, 100), [
    {shape:"car", color:"c-red", steady:true, path:[[0, 120, 150], [100, 120, -60]], still:[0, 120, 95]},
    you([[0, 120, 210], [100, 120, 0]], {steady:true, still:[0, 120, 155]}),
    {shape:"badge", text:"1", steady:true, path:[[0, 182, 88, 0, 0], [23, 182, 88, 0, 0], [24, 182, 88, 0, 1], [60, 182, 88, 0, 1], [62, 182, 88, 0, 0], [100, 182, 88, 0, 0]], still:[0, 182, 88, 0, 1]},
    {shape:"badge", text:"2", steady:true, path:[[0, 182, 112, 0, 0], [37, 182, 112, 0, 0], [38, 182, 112, 0, 1], [60, 182, 112, 0, 1], [62, 182, 112, 0, 0], [100, 182, 112, 0, 0]], still:[0, 182, 112, 0, 1]}
  ]); },
  brake4x: function(){ return svg("b4", road(), '<path class="sc-brakeline" d="M60 170H140"/>', [
    {shape:"car", color:"c-red", badge:"50", path:[[0, 80, 215], [15, 80, 170], [35, 80, 150], [100, 80, 150]], still:[0, 80, 150]},
    {shape:"car", color:"c-you", badge:"100", path:[[0, 120, 215], [8, 120, 170], [55, 120, 90], [100, 120, 90]], still:[0, 120, 90]}
  ]); },

  /* lanes */
  keepRight: function(){ return svg("kr", road(), "", [
    {shape:"truck", steady:true, path:[[0, 120, 135], [100, 120, 60]], still:[0, 120, 110]},
    you([[0, 120, 215], [25, 120, 182], [38, 92, 152, -18], [48, 80, 122, 0], [62, 80, 62, 0], [72, 100, 36, 18], [82, 120, 12, 0], [100, 120, -40, 0]], {still:[0, 80, 105]})
  ]); },
  zip: function(){ return svg("zp", zipRoad(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 120, 150], [30, 120, 40], [60, 120, -40], [100, 120, -40]], still:[0, 120, 45]},
    you([[0, 80, 180], [30, 80, 108], [42, 96, 80, 25], [52, 120, 60, 0], [85, 120, -40, 0], [100, 120, -40, 0]], {badge:"2", still:[0, 98, 82, 25]}),
    {shape:"car", color:"c-red", badge:"3", path:[[0, 120, 215], [30, 120, 150], [52, 120, 122], [90, 120, 12], [100, 120, 12]], still:[0, 120, 135]}
  ]); },

  /* railway crossing */
  railStop: function(){ return svg("rs", road(), tracks() + '<rect class="sc-barrier" x="100" y="99" width="40" height="5" rx="2"/><path class="sc-post" d="M152 104V120"/><circle class="sc-light sc-blink" cx="147" cy="102" r="4"/><circle class="sc-light sc-blink2" cx="157" cy="102" r="4"/>', [
    {shape:"train", path:[[0, 300, 80, 90], [55, -110, 80, 90], [100, -110, 80, 90]], still:[0, 60, 80, 90]},
    you([[0, 120, 215], [25, 120, 128], [100, 120, 128]], {still:[0, 120, 128]})
  ]); },
  railRoom: function(){ return svg("rr", road(), tracks() + parked(120, 22) + parked(120, 52), [
    you([[0, 120, 215], [30, 120, 118], [100, 120, 118]], {still:[0, 120, 118]})
  ]); },

  /* road markings */
  overtake: function(){ return svg("ov", road("half"), "", [
    {shape:"truck", color:"c-tractor", steady:true, path:[[0, 120, 178], [100, 120, 140]], still:[0, 120, 160]},
    you([[0, 120, 232], [8, 120, 215], [16, 96, 195, -20], [24, 80, 170, 0], [34, 80, 140, 0], [42, 98, 118, 22], [50, 120, 102, 0], [100, 120, -40, 0]], {still:[0, 80, 150]})
  ]); },

  /* seconds and metres */
  secondsAway: function(){
    var m = ""; [["3 s", 170], ["2 s", 125], ["1 s", 80]].forEach(function(x){ m += '<path class="sc-tick" d="M60 ' + x[1] + 'H140"/><text class="sc-mark" x="32" y="' + (x[1] + 4) + '">' + x[0] + '</text>'; });
    return svg("sa", road(), m + '<circle class="sc-kid" cx="146" cy="44" r="5"/><circle class="sc-ball" cx="134" cy="52" r="4"/>', [
      you([[0, 120, 215], [70, 120, 92], [80, 120, 88], [100, 120, 88]], {steady:true, still:[0, 120, 125]})
    ]);
  },
  mps: function(){
    var m = ""; [["0 m", 180], ["25 m", 135], ["50 m", 90], ["75 m", 45]].forEach(function(x){ m += '<path class="sc-tick" d="M60 ' + x[1] + 'H140"/><text class="sc-mark" x="30" y="' + (x[1] + 4) + '">' + x[0] + '</text>'; });
    return svg("mp", road("none"), m, [
      you([[0, 120, 205], [100, 120, -30]], {steady:true, badge:"90", still:[0, 120, 135]})
    ]);
  },
  fog: function(){ return svg("fg", road(), parked(120, 45) + '<defs><linearGradient id="fgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sc-fog1"/><stop offset="1" class="sc-fog2"/></linearGradient></defs>', [
    you([[0, 120, 215], [45, 120, 130], [60, 120, 112], [100, 120, 112]], {still:[0, 120, 112]})
  ]).replace('</svg>', '<rect x="0" y="0" width="200" height="98" fill="url(#fgG)"/></svg>'); },
  blueZone: function(){
    var bays = '<rect class="sc-drive" x="140" y="0" width="30" height="200"/><path class="sc-blue" d="M140 0V200"/><path class="sc-tick" d="M140 50H170M140 100H170M140 150H170"/>' + parked(155, 75) + parked(155, 175);
    var disc = '<g transform="translate(32 100)"><rect class="sc-disc" x="-20" y="-26" width="40" height="52" rx="6"/><circle class="sc-clock" cx="0" cy="-4" r="13"/><path class="sc-hand" d="M0 -4V-13M0 -4L6 0"/></g>';
    return svg("bz", road(), bays + disc, [ you([[0, 120, 215], [40, 120, 125], [60, 155, 125, 0], [100, 155, 125, 0]], {still:[0, 155, 125]}) ]);
  },
  missedExit: function(){
    var exitLane = '<path class="sc-road" d="M150 120L190 40V0H170V30L150 70Z"/>';
    return svg("me", motorway(), exitLane, [
      you([[0, 130, 215], [100, 130, -30]], {steady:true, still:[0, 130, 100]})
    ]);
  },
  speedSigns: function(){
    function sign(x, n){ return '<circle class="sc-sign" cx="' + x + '" cy="80" r="34"/><text class="sc-signnum" x="' + x + '" y="92">' + n + '</text>'; }
    return svg("ss", "", sign(58, "100") + sign(142, "130") + '<rect class="sc-plate" x="22" y="126" width="72" height="24" rx="4"/><text class="sc-platet" x="58" y="143">06–19 h</text><rect class="sc-matrix" x="104" y="126" width="76" height="40" rx="4"/><text class="sc-matrixt" x="142" y="153">80</text>', []);
  },

  /* speed limits */
  townSign: function(){
    var sign = '<path class="sc-post" d="M38 122V150"/><rect class="sc-town" x="8" y="96" width="60" height="28" rx="3"/><text class="sc-townt" x="38" y="115">Dorp</text>';
    return svg("tn", road(), sign + '<path class="sc-tick" d="M60 110H140"/>' + tree(170, 40) + tree(170, 170), [
      you([[0, 120, 215], [30, 120, 150], [55, 120, 112], [100, 120, -30]], {badge:"50", still:[0, 120, 80]})
    ]);
  },
  roadTypes: function(){
    function sign(x, n, l){ return '<circle class="sc-sign" cx="' + x + '" cy="80" r="27" style="stroke-width:7"/><text class="sc-signnum" x="' + x + '" y="87" style="font-size:19px">' + n + '</text><text class="sc-mark" x="' + x + '" y="132">' + l + '</text>'; }
    return svg("rt", "", sign(36, "80", "Road") + sign(100, "100", "Autoweg") + sign(164, "130", "Motorway"), []);
  },
  erf: function(){
    var sides = '<rect class="sc-drive" x="20" y="0" width="40" height="200"/><rect class="sc-drive" x="140" y="0" width="40" height="200"/>';
    return svg("ef", road("none"), sides + '<circle class="sc-kid" cx="88" cy="58" r="5"/><circle class="sc-ball" cx="76" cy="66" r="4"/><circle class="sc-kid" cx="158" cy="120" r="5"/>' + parked(40, 150), [
      you([[0, 120, 215], [100, 120, 90]], {steady:true, badge:"15", still:[0, 120, 150]})
    ]);
  },

  /* stopping and parking */
  dropOff: function(){ return svg("do", road(), '<rect class="sc-drive" x="140" y="0" width="30" height="200"/>' + tree(184, 40), [
    you([[0, 120, 215], [30, 120, 110], [72, 120, 110], [100, 120, -30]], {still:[0, 120, 110]}),
    {shape:"person", path:[[0, 128, 110, 0, 0], [33, 128, 110, 0, 0], [36, 128, 110, 0, 1], [56, 156, 104, 0, 1], [100, 156, 104, 0, 1]], still:[0, 156, 104, 0, 1]}
  ]); },
  noStop: function(){
    var z = ""; for (var x = 62; x < 138; x += 13) z += '<rect class="sc-zebra" x="' + x + '" y="62" width="8" height="22"/>';
    var zone = '<rect class="sc-nozone" x="60" y="84" width="80" height="22"/><rect class="sc-nozone" x="60" y="40" width="80" height="22"/>';
    return svg("ns", road(), '<rect class="sc-cyclelane" x="128" y="0" width="12" height="200"/>' + zone + z + label(32, 99, "5 m") + label(32, 55, "5 m"), [
      you([[0, 114, 215], [100, 114, -30]], {steady:true, still:[0, 114, 150]})
    ]);
  },
  junction5m: function(){ return svg("j5", crossroads(), '<rect class="sc-nozone" x="100" y="132" width="30" height="26"/><rect class="sc-nozone" x="70" y="42" width="30" height="26"/>' + label(158, 149, "5 m") + label(42, 59, "5 m"), [
    you([[0, 115, 225], [45, 115, 176], [100, 115, 176]], {still:[0, 115, 176]})
  ]); },

  /* lights */
  dipped: function(){ return svg("dp", road(), NIGHT, [
    {shape:"lit", color:"c-red", steady:true, path:[[0, 80, -40, 180], [100, 80, 240, 180]], still:[0, 80, 50, 180]},
    you([[0, 120, 230], [100, 120, -40]], {shape:"lit", steady:true, still:[0, 120, 150]})
  ]); },
  highBeam: function(){ return svg("hb2", road(), NIGHT, [
    {shape:"lit", color:"c-red", path:[[0, 80, -40, 180], [38, 80, -40, 180], [100, 80, 120, 180]], still:[0, 80, 40, 180]},
    you([[0, 120, 165, 0, 1], [40, 120, 165, 0, 1], [42, 120, 165, 0, 0], [100, 120, 165, 0, 0]], {shape:"high", still:[0, 120, 165, 0, 0]}),
    you([[0, 120, 165, 0, 0], [40, 120, 165, 0, 0], [42, 120, 165, 0, 1], [100, 120, 165, 0, 1]], {shape:"lit", still:[0, 120, 165, 0, 1]})
  ]); },
  rearFog: function(){ return svg("rf2", road(), '<path class="sc-tick" d="M60 150H140M60 96H140"/>' + label(30, 127, "50 m") + '<defs><linearGradient id="rfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sc-fog1"/><stop offset="1" class="sc-fog2"/></linearGradient></defs>', [
    {shape:"fogcar", color:"c-red", steady:true, path:[[0, 120, 125], [100, 120, 30]], still:[0, 120, 110]},
    you([[0, 120, 178], [100, 120, 178]], {shape:"lit", still:[0, 120, 178]})
  ]).replace('</svg>', '<rect x="0" y="0" width="200" height="90" fill="url(#rfG)"/></svg>'); },
  tunnelLights: function(){ return svg("tl", road(), '<rect class="sc-tunnel" x="40" y="0" width="120" height="104"/><path class="sc-mouth" d="M40 104H160"/>', [
    you([[0, 120, 230], [100, 120, -40]], {shape:"lit", steady:true, still:[0, 120, 80]})
  ]); },
  flashWarn: function(){ return svg("fw", road(), '<rect class="sc-drive" x="140" y="0" width="30" height="200"/>' + parked(155, 92), [
    {shape:"person", path:[[0, 160, 60], [45, 160, 60], [80, 138, 64], [100, 138, 64]], still:[0, 152, 62]},
    you([[0, 120, 230], [50, 120, 160], [100, 120, 140]], {shape:"flash", still:[0, 120, 150]})
  ]); },

  /* signs */
  signShapes: function(){
    return svg("sh", "", roadSign("warning", 55, 52, 58) + roadSign("no-entry", 145, 52, 58) + roadSign("mandatory-up", 55, 132, 58) + roadSign("parking", 145, 132, 58) +
      label(55, 94, "Warning") + label(145, 94, "Ban") + label(55, 174, "Must do") + label(145, 174, "Info"), []);
  },
  stopSign: function(){ return svg("st", crossroads(), '<path class="sc-solid" d="M100 133H130" style="stroke-width:3"/>' + roadSign("stop", 152, 152, 26), [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 215, 85, -90], [30, 215, 85, -90], [58, -25, 85, -90], [100, -25, 85, -90]], still:[0, 150, 85, -90]},
    you([[0, 115, 215], [22, 115, 148], [62, 115, 148], [86, 115, -25], [100, 115, -25]], {badge:"2", still:[0, 115, 148]})
  ]); },
  parkStop: function(){
    return svg("ps", "", roadSign("no-parking", 55, 72, 70) + roadSign("no-stopping", 145, 72, 70) +
      label(55, 128, "No parking") + label(145, 128, "No stopping") + label(55, 146, "Drop-off OK") + label(145, 146, "Not even briefly"), []);
  },
  advisory: function(){
    return svg("ad", "", '<circle class="sc-sign" cx="58" cy="80" r="34"/><text class="sc-signnum" x="58" y="89">70</text>' +
      '<rect class="sc-adv" x="110" y="46" width="68" height="68" rx="5"/><text class="sc-advt" x="144" y="89">70</text>' + label(58, 140, "Limit") + label(144, 140, "Advice"), []);
  },

  /* civic: healthcare */
  insCard: function(){ return civ("ic", '<rect class="cv-card" x="18" y="44" width="104" height="68" rx="9"/><rect class="cv-blue" x="18" y="44" width="104" height="20" rx="9"/><rect class="cv-blue" x="18" y="56" width="104" height="8"/>' +
    ctext(70, 58, "Zorgverzekering", "cv-w") + '<path class="cv-plus" d="M44 82V100M35 91H53"/><path class="cv-line" d="M64 84H110M64 96H98"/>' + calendar(150, 120, "4", "months") + ctext(100, 178, "Within 4 months", "cv-t")); },
  referralPath: function(){ return civ("rp", '<rect class="cv-card" x="10" y="70" width="48" height="48" rx="6"/><path class="cv-plus" d="M34 82V106M22 94H46"/>' +
    '<path class="cv-arrow" d="M62 94H76M71 89L77 94L71 99"/><rect class="cv-card" x="80" y="78" width="40" height="30" rx="3"/><path class="cv-line" d="M80 79L100 95L120 79"/>' +
    '<path class="cv-arrow" d="M124 94H138M133 89L139 94L133 99"/><rect class="cv-blue" x="142" y="58" width="50" height="60" rx="4"/>' + ctext(167, 98, "H", "cv-hbig") +
    ctext(34, 136, "Huisarts", "cv-s") + ctext(100, 136, "Verwijsbrief", "cv-s") + ctext(167, 136, "Hospital", "cv-s")); },
  eigenRisico: function(){ return civ("er", '<rect class="cv-card" x="16" y="74" width="168" height="32" rx="8"/><rect class="cv-warm" x="16" y="74" width="64" height="32" rx="8"/><rect class="cv-warm" x="60" y="74" width="20" height="32"/>' +
    ctext(48, 95, "€385", "cv-w") + ctext(132, 95, "Insurer pays", "cv-t") + ctext(48, 128, "You pay", "cv-s") + ctext(100, 160, "Huisarts: €0", "cv-t") + ctext(100, 178, "Under 18: €0", "cv-t")); },
  phone112: function(){ return civ("p1", '<rect class="cv-dark" x="62" y="22" width="76" height="140" rx="14"/><rect class="cv-card" x="68" y="36" width="64" height="108" rx="6"/>' +
    ctext(100, 98, "112", "cv-num") + ctext(100, 180, "Not urgent: 0900-8844", "cv-s")); },

  /* civic: work */
  probationBars: function(){
    function bar(y, w, a, b){ return '<rect class="cv-card" x="20" y="' + y + '" width="160" height="26" rx="6"/><rect class="cv-blue" x="20" y="' + y + '" width="' + w + '" height="26" rx="6"/>' + ctext(100, y - 6, a, "cv-s") + ctext(100, y + 18, b, "cv-tb"); }
    return civ("pb", bar(40, 30, "6 months or less", "No proeftijd") + bar(98, 80, "6 months to 2 years", "1 month at most") + bar(156, 160, "2 years or permanent", "2 months at most"));
  },
  holidayPay: function(){ return civ("hp", '<circle class="cv-warm" cx="100" cy="86" r="52"/>' + ctext(100, 102, "8%", "cv-hbig") + ctext(100, 166, "At least, once a year", "cv-t") + ctext(100, 184, "Often in May or June", "cv-s")); },
  sickPay: function(){ return civ("sp", '<rect class="cv-card" x="16" y="74" width="168" height="40" rx="8"/><rect class="cv-blue" x="16" y="74" width="84" height="40" rx="8"/><rect class="cv-blue" x="80" y="74" width="20" height="40"/><rect class="cv-blue2" x="100" y="74" width="84" height="40" rx="8"/><rect class="cv-blue2" x="100" y="74" width="20" height="40"/>' +
    ctext(58, 99, "70%", "cv-w") + ctext(142, 99, "70%", "cv-w") + ctext(58, 136, "Year 1", "cv-s") + ctext(142, 136, "Year 2", "cv-s") + ctext(58, 152, "min. wage", "cv-s")); },
  wwWeek: function(){
    var d = ""; for (var i = 0; i < 7; i++) d += '<rect class="' + (i === 0 ? "cv-warm" : "cv-card") + '" x="' + (16 + i * 25) + '" y="78" width="20" height="28" rx="4"/>';
    return civ("ww", d + ctext(26, 70, "Day 1", "cv-s") + '<path class="cv-arrow" d="M18 120H182M176 114L183 120L176 126"/>' + ctext(100, 146, "Apply within 1 week", "cv-t") + ctext(100, 166, "UWV", "cv-s"));
  },

  /* civic: administration */
  bsnCard: function(){ return civ("bc", '<rect class="cv-card" x="24" y="52" width="152" height="92" rx="10"/><circle class="cv-blue2" cx="62" cy="92" r="20"/><rect class="cv-blue2" x="44" y="114" width="36" height="16" rx="8"/>' +
    ctext(132, 84, "BSN", "cv-t") + '<path class="cv-line" d="M98 100H166M98 114H150"/>' + ctext(100, 172, "Gemeente → BRP → BSN", "cv-s")); },
  birthDays: function(){ return civ("bd", calendar(100, 82, "3", "days") + ctext(100, 160, "Report the birth", "cv-t") + ctext(100, 178, "at the gemeente", "cv-s")); },
  toeslagWeeks: function(){ return civ("tw", calendar(100, 82, "4", "weeks") + ctext(100, 160, "New job, income or address?", "cv-t") + ctext(100, 178, "Tell the Belastingdienst", "cv-s")); },
  digidLock: function(){ return civ("dl", '<path class="cv-dark2" d="M74 86V68a26 26 0 0 1 52 0V86" fill="none"/><rect class="cv-blue" x="60" y="84" width="80" height="62" rx="10"/>' + ctext(100, 121, "DigiD", "cv-w") +
    ctext(100, 172, "Never share it", "cv-t") + ctext(100, 188, "Use DigiD Machtigen", "cv-s")); },

  /* motorway */
  mwJoin: function(){ return svg("mj", motorway(), "", [
    {shape:"car", color:"c-red", badge:"1", steady:true, path:[[0, 130, 240], [55, 130, -40], [100, 130, -40]], still:[0, 130, 60]},
    you([[0, 164, 215], [40, 164, 140], [58, 164, 110], [68, 150, 88, -20], [76, 130, 70, 0], [100, 130, -25, 0]], {badge:"2", still:[0, 164, 120]})
  ]); }
};

/* the motorway day limit (100 km/h, 06:00 to 19:00) is policy and can change: recheck yearly */
window.LESSONS = {
  drive: {
    "Priority": [
      {scene:"rightFirst", h:"Equal junction: traffic from the right goes first",
       t:"No signs, no lines, no lights? Then whoever comes from your right goes first. This is called an equal junction (gelijkwaardige kruising).",
       why:"With no signs, everyone needs one simple rule that works the same at every junction.", src:SRC.anwbPriority},
      {scene:"bikeFirst", h:"Cyclists and mopeds count too",
       t:"The rule is for every driver, including a cyclist or moped rider coming from your right. A bus gets no exception.",
       why:"On a bike you are a driver (bestuurder) under Dutch traffic law, so the same rule applies.", src:SRC.anwbPriority},
      {scene:"tramFirst", h:"Trams go first, even from the left",
       t:"At an equal junction a tram has priority over all other traffic, from any side. Trams must still obey signs and lights.",
       why:"A tram runs on rails, can't steer around you and needs a long distance to stop.", src:SRC.gov(25)},
      {scene:"signsWin", h:"Signs and markings beat the rule",
       t:"A yellow diamond means you are on a priority road. Shark teeth (haaientanden) or a give-way sign mean you give way, even to traffic from your left. Traffic lights and police beat signs.",
       why:"Signs are put where the simple rule isn't safe enough, so they always win.", src:SRC.gov(43)},
      {scene:"driveway", h:"Special manoeuvres: you give way to everyone",
       t:"Coming out of a driveway or parking place, reversing, a U-turn or changing lanes is a special manoeuvre (bijzondere manoeuvre). You let all other traffic go first, from every direction.",
       why:"You are joining or crossing traffic that is already moving, so it goes first.", src:SRC.anwbPriority}
    ],
    "Hazard perception": [
      {scene:"hzBrake", h:"Brake: the danger is close",
       t:"Someone is on your path, or about to be, and close by. A ball rolling out between parked cars means a child may follow. Only braking gives you enough room.",
       why:"Releasing the accelerator slows you too little when the danger is a few seconds away.", src:SRC.cbr},
      {scene:"hzRelease", h:"Release the accelerator: something might happen",
       t:"Nothing is in your way yet, but it could be soon: children playing beside the road, a car that might pull out, brake lights far ahead. Take your foot off the accelerator and get ready to brake.",
       why:"Losing a little speed early gives you time and room if it turns into real danger.", src:SRC.cbr},
      {scene:"hzNothing", h:"Do nothing: the road stays clear",
       t:"Your speed fits the situation and nobody is heading into your path. Keep going as you are.",
       why:"Braking without a reason surprises the driver behind you.", src:SRC.cbr},
      {scene:"secondsAway", h:"Distance and speed decide",
       t:"The same situation can need a different answer. Close or fast: brake. Far away or slow: release. Ask yourself how many seconds it takes to get there.",
       why:"At 50 km/h you cover about 14 m every second (50 ÷ 3.6).", src:SRC.cbr}
    ],
    "Distances": [
      {scene:"twoSec", h:"Stay at least 2 seconds behind",
       t:"When the car ahead passes a tree or post, count: one thousand and one, one thousand and two. If you reach it before you finish, you are too close.",
       why:"You need about a second to react, and after that you still need room to brake.", src:SRC.anwbDistance},
      {scene:"mps", h:"Speed in metres per second: divide by 3.6",
       t:"90 km/h is 25 m per second, so 2 seconds is 50 m. 120 km/h is about 33 m per second.",
       why:"The exam asks for distances in metres, and this one sum gets you there.", src:SRC.anwbDistance},
      {scene:"brake4x", h:"Twice as fast, four times the braking distance",
       t:"Braking distance grows with the square of your speed. From 50 to 100 km/h it becomes 4 times as long. Your reaction distance only doubles.",
       why:"At double the speed the brakes have to remove four times as much energy.", src:SRC.anwbSpeed},
      {scene:"fog", h:"Always stop within what you can see",
       t:"In fog, heavy rain or a bend, your speed must let you stop within the clear road you can see. The speed sign is only a maximum.",
       why:"Something just out of sight still needs you to be able to stop for it.", src:SRC.gov(26)}
    ],
    "Lane use": [
      {scene:"keepRight", h:"Keep right, overtake on the left",
       t:"Drive in the right-hand lane when it is free. Overtake on the left, then move back to the right.",
       why:"The left lane stays free for overtaking, so nobody needs to pass on the wrong side.", src:SRC.gov(24)},
      {scene:"zip", h:"Lane ends? Zip merge (ritsen)",
       t:"Use both lanes up to the point where one ends, then take turns, one by one. This is the advised way, not a legal duty: the driver who changes lanes must give way.",
       why:"Using both lanes to the end keeps the queue shorter and moving.", src:SRC.rvv54}
    ],
    "Railway crossings": [
      {scene:"railStop", h:"Flashing red lights: stop, even if you see no train",
       t:"Stop before the crossing as soon as the red lights flash or the bell rings, even before the barriers come down. Wait until the lights are off.",
       why:"A train can't stop or steer, and it can come faster than you expect.", src:SRC.gov(45)},
      {scene:"railRoom", h:"Never stop on the tracks",
       t:"Only drive onto the crossing when there is room to get off it completely on the other side. If traffic is queuing, wait before the crossing.",
       why:"If the barriers close while you are stuck on the tracks, you can't get out of the way.", src:SRC.rvv23}
    ],
    "Road markings": [
      {scene:"overtake", h:"Solid line: don't cross it. Broken line: you may, when safe",
       t:"A solid line in the middle of the road may not be crossed, so finish overtaking before it starts. Where the line is broken you may cross it if it is safe.",
       why:"Solid lines are painted where you can't see far enough ahead to overtake safely.", src:SRC.gov(46)},
      {scene:"blueZone", h:"Blue line: park with a parking disc",
       t:"In a disc zone (blauwe zone) you may park only in spaces with a blue line or marked bays, with a parking disc showing your arrival time. You may round the time up to the next half hour.",
       why:"It gives everyone free short-term parking without a meter.", src:SRC.gov(30)}
    ],
    /* the 100 km/h motorway day limit named here is policy and can change: recheck yearly */
    "Speed limits": [
      {scene:"townSign", h:"Built-up area: 50 km/h",
       t:"From the blue place-name sign you are in a built-up area (bebouwde kom). The limit is 50 km/h unless a sign says otherwise. Many town streets are signed 30.",
       why:"In town people walk, cycle and cross everywhere, so you must be able to stop quickly.", src:SRC.rvv20},
      {scene:"roadTypes", h:"Outside town: 80, autoweg 100, motorway 130",
       t:"With no speed sign, the limit is 80 km/h on a normal road, 100 km/h on an autoweg (expressway) and 130 km/h on a motorway (autosnelweg). Signs often set less, like 60 on country roads or 100 on the motorway by day.",
       why:"The better a road keeps traffic apart, the faster you can safely drive on it.", src:SRC.rvv21},
      {scene:"erf", h:"Woonerf (erf): 15 km/h",
       t:"In a woonerf, shown by a blue sign with a house and children playing, you drive at most 15 km/h. People on foot may use the whole width of the street. Older books say walking pace (stapvoets), but the law has said 15 km/h since 2012.",
       why:"The street is shared with people on foot, so you must be able to stop at once.", src:SRC.rvv45}
    ],
    "Stopping & parking": [
      {scene:"dropOff", h:"Stopping or parking? It depends on why you stand still",
       t:"Standing still just to let someone in or out, or to load or unload, is stopping (stilstaan). Leaving your car for anything else is parking, even for two minutes to buy a coffee.",
       why:"Many places ban parking but still allow a quick drop-off, so you need to know which one you are doing.", src:SRC.gov(18)},
      {scene:"noStop", h:"Places where you may not even stop",
       t:"Never stop on a junction or level crossing, on a cycle track or cycle lane, on a zebra crossing or within 5 m of it, in a tunnel, in a bus lane or along a solid yellow line. At a bus stop you may stop only to let passengers in or out.",
       why:"A car standing there blocks people who have no other way to go, or hides someone about to cross.", src:SRC.gov(29)},
      {scene:"junction5m", h:"No parking within 5 m of a junction",
       t:"You may not park within 5 m of a junction, in front of a driveway, or on the carriageway of a priority road outside a built-up area. Double parking is never allowed.",
       why:"A car right at the corner hides people crossing and leaves no room to turn.", src:SRC.gov(29)}
    ],
    "Lights & visibility": [
      {scene:"dipped", h:"Dipped headlights at night and when you can't see well",
       t:"Switch on dipped headlights (dimlicht) at night, and in the daytime when visibility is seriously reduced, for example in heavy rain or fog.",
       why:"Others must see you in time, not only you them.", src:SRC.gov(31)},
      {scene:"highBeam", h:"High beam only when nobody is close ahead",
       t:"At night you may use high beam (grootlicht). Switch back to dipped headlights when someone comes towards you or when you drive close behind another vehicle. High beam is never allowed in the daytime.",
       why:"High beam dazzles other drivers, so for a moment they can't see the road.", src:SRC.gov(32)},
      {scene:"rearFog", h:"Rear fog light: only below 50 m",
       t:"Use the rear fog light only when fog or snow cuts your view to less than 50 m. Not in rain, and switch it off when the fog clears.",
       why:"It is very bright, so in better weather it dazzles the driver behind you and makes your brake lights hard to see.", src:SRC.rvv34},
      {scene:"tunnelLights", h:"In a tunnel, switch on dipped headlights",
       t:"Daytime running lights often light only the front of your car. When you enter a tunnel or the weather turns bad, switch on dipped headlights yourself so your rear lights come on too.",
       why:"Without rear lights, the driver behind sees your car too late in the dark.", src:SRC.anwbLights},
      {scene:"flashWarn", h:"Horn and headlight flash: only to warn of danger",
       t:"Use the horn or flash your headlights only to warn someone of danger. Flashing to say 'you go first' is common, but that is not what the signal is for.",
       why:"A signal that means only one thing is understood at once.", src:SRC.gov(30)}
    ],
    "Signs": [
      {scene:"signShapes", h:"The shape tells you what kind of sign it is",
       t:"A red triangle warns you. A red circle bans something. A blue circle tells you what you must do. A blue square or rectangle gives information or advice.",
       why:"Once you know the shape, you know the kind of message before you can read it.", src:SRC.anwbSigns},
      {scene:"stopSign", h:"STOP means a full stop, even when the road is clear",
       t:"At a STOP sign (B7) you stop completely at the line, then give way to traffic on the road you join. A triangle pointing down (B6) means give way: you stop only if you need to.",
       why:"A STOP sign is placed where you can only see the other road properly when you stand still.", src:SRC.gov(7)},
      {scene:"parkStop", h:"One stripe: no parking. A cross: no stopping",
       t:"A blue sign with a red border and one red stripe (E1) bans parking, but you may still stop to let someone in or out. With a red cross (E2) you may not stop at all.",
       why:"One stripe takes away parking. The cross takes away stopping as well.", src:SRC.gov(9)},
      {scene:"advisory", h:"Red circle is a limit, blue square is advice",
       t:"A number in a red circle (A1) is the maximum speed. A white number on a blue square (A4) is an advised speed, for example before a sharp bend.",
       why:"The limit is the law. The advice tells you the speed that suits the road there.", src:SRC.gov(7)}
    ],
    "Motorway": [
      {scene:"mwJoin", h:"Joining: speed up, then fit in",
       t:"Use the whole acceleration lane (invoegstrook) to reach the speed of the traffic, then move in where there is a gap. Traffic already on the motorway goes first.",
       why:"Joining at a low speed forces others to brake hard.", src:SRC.rvv54},
      {scene:"missedExit", h:"No reversing, U-turns or stopping",
       t:"Missed your exit? Drive on to the next one. Stop on the hard shoulder only in an emergency.",
       why:"On a road this fast, anything standing still or going backwards is very dangerous.", src:SRC.gov(34)},
      {scene:"speedSigns", h:"130 by law, often 100 by day",
       t:"The maximum is 130 km/h, but on many motorways signs set 100 km/h from 06:00 to 19:00. A speed on a matrix sign above your lane always wins.",
       why:"Signs and matrix signs adjust the limit to the road, the time of day and the traffic.", src:SRC.speedRules}
    ]
  },
  /* the €385 eigen risico applies to 2026 and 2027: recheck every year */
  civic: {
    "Healthcare": [
      {scene:"insCard", h:"Health insurance is a must: arrange it within 4 months",
       t:"When you start working here, take out Dutch basic health insurance (zorgverzekering) within 4 months. People who live here need it too.",
       why:"Care is only paid from the day your insurance starts, so starting late means you pay the bills yourself.", src:SRC.insurance},
      {scene:"referralPath", h:"Start at the huisarts",
       t:"Register with a huisarts (GP) near your home soon after you arrive. For a specialist in a hospital you need a referral letter (verwijsbrief) from the huisarts.",
       why:"Without a valid referral you may have to pay for the specialist yourself.", src:SRC.referral},
      {scene:"eigenRisico", h:"Eigen risico: the first €385 a year is yours",
       t:"From age 18 you pay the first €385 a year of most basic-package care yourself (2026 and 2027). Visits to the huisarts and the huisartsenpost don't count, and children under 18 pay nothing.",
       why:"So you know which bills to expect: a hospital visit can cost you money, a visit to the huisarts does not.", src:SRC.eigenRisico},
      {scene:"phone112", h:"112 only when every second counts",
       t:"Call 112 when a life is in danger or you see a crime happening, for example a fire, a serious accident or a strong smell of gas. For police matters that aren't urgent, call 0900-8844.",
       why:"112 lines must stay free for people who need help right now.", src:SRC.call112}
    ],
    "Work life": [
      {scene:"probationBars", h:"A probation period (proeftijd) depends on the contract",
       t:"A contract of 6 months or less may have no probation period. Longer than 6 months but under 2 years: at most 1 month. A permanent contract, or one of 2 years or longer: at most 2 months.",
       why:"The shorter the contract, the less time an employer gets to try you out.", src:SRC.probation},
      {scene:"holidayPay", h:"Holiday pay (vakantiegeld): at least 8%",
       t:"You get at least 8% of your gross yearly salary as holiday pay, paid at least once a year. Most people get it in May or June.",
       why:"It is part of your pay, saved up for you through the year.", src:SRC.holidayPay},
      {scene:"sickPay", h:"Ill? Your employer keeps paying",
       t:"If you are ill, your employer pays at least 70% of your wage in the first and the second year. In the first year it is never less than the minimum wage.",
       why:"During those 2 years your employer is responsible for you, so you are not left without income.", src:SRC.sickPay},
      {scene:"wwWeek", h:"Lost your job? Apply for WW within 1 week",
       t:"Apply for unemployment benefit (WW) at UWV no later than 1 week after your first day without work.",
       why:"The deadline is short, so apply as soon as you know your last working day.", src:SRC.ww}
    ],
    "Administration": [
      {scene:"bsnCard", h:"Your BSN comes when you register at the gemeente",
       t:"You get your citizen service number (BSN) once you are registered in the Personal Records Database (BRP), which you do at your gemeente. You need it for work, tax and healthcare.",
       why:"Every government office finds you by this one number.", src:SRC.bsn},
      {scene:"birthDays", h:"A baby is born: report it within 3 days",
       t:"Report the birth within 3 days at the gemeente where your baby was born. If the mother lives in the Netherlands, the baby then gets a BSN automatically.",
       why:"This first registration gives your child the BSN that everything else needs.", src:SRC.birth},
      {scene:"toeslagWeeks", h:"Toeslagen: report changes within 4 weeks",
       t:"Do you get a toeslag, such as zorgtoeslag or huurtoeslag? Report changes like a new job, a higher income or a move to the Belastingdienst within 4 weeks.",
       why:"Your toeslag is based on your situation. If it is based on old information, you may have to pay money back later.", src:SRC.toeslagChange},
      {scene:"digidLock", h:"Never share your DigiD",
       t:"Never give your DigiD login, PIN or app to anyone, not even family. If someone helps you with things online, authorise them with DigiD Machtigen.",
       why:"With your DigiD, someone can act as you at every government office.", src:SRC.digid}
    ]
  }
};
/* the order lessons come in: basics first, motorway and hazards later */
window.LESSON_ORDER = {drive:["Priority", "Signs", "Road markings", "Speed limits", "Distances", "Lane use", "Stopping & parking", "Lights & visibility", "Railway crossings", "Motorway", "Hazard perception"], civic:["Administration", "Healthcare", "Work life"]};
window.LESSON_SCENE = function(id){ return SCENES[id] ? SCENES[id]() : ""; };
})();
