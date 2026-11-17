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
  /* KNM: government, housing, education. Checked on 17 Nov 2026 */
  seats: "https://www.rijksoverheid.nl/themas/overheid-en-democratie/parlement/zetelverdeling-parlement",
  parliament: "https://prodemos.nl/kennis/informatie-over-politiek/nederland/het-parlement/",
  ministers: "https://wetten.overheid.nl/jci1.3:c:BWBR0001840&hoofdstuk=2&artikel=42",
  article1: "https://wetten.overheid.nl/jci1.3:c:BWBR0001840&hoofdstuk=1&artikel=1",
  mayor: "https://www.rijksoverheid.nl/themas/overheid-en-democratie/gemeenten/burgemeesters",
  voteTK: "https://www.kiesraad.nl/verkiezingen/tweede-kamer/stemmen/kiesgerechtigdheid",
  voteLocal: "https://www.kiesraad.nl/verkiezingen/gemeenteraden/stemmen/kiesgerechtigdheid",
  localEvery4: "https://www.kiesraad.nl/verkiezingen/gemeenteraden",
  europe5: "https://www.kiesraad.nl/verkiezingen/europees-parlement",
  deposit: "https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/woning-huren/woning-huren-waarborgsom",
  repairs: "https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/woning-huren/welke-kosten-zijn-voor-de-huurder-en-welke-voor-de-verhuurder",
  smoke: "https://www.rijksoverheid.nl/onderwerpen/gezond-en-veilig-wonen/vraag-en-antwoord/hoeveel-rookmelders-moet-ik-in-mijn-huis-hebben",
  repairWrite: "https://www.rijksoverheid.nl/onderwerpen/woning-huren/vraag-en-antwoord/hoe-zorg-ik-ervoor-dat-de-verhuurder-slecht-onderhoud-aanpakt",
  rentRise: "https://www.rijksoverheid.nl/vraag-en-antwoord/woning-huren/welke-regels-gelden-er-voor-een-huurverhoging",
  rentEnd: "https://www.rijksoverheid.nl/onderwerpen/woning-huren/vraag-en-antwoord/huur-opzeggen-woning",
  schoolAge: "https://www.rijksoverheid.nl/onderwerpen/leerplicht/leerplicht-en-kwalificatieplicht",
  schoolLeave: "https://www.rijksoverheid.nl/onderwerpen/leerplicht/vraag-en-antwoord/leerplicht-schoolvakanties",
  parentFee: "https://www.rijksoverheid.nl/onderwerpen/financiering-onderwijs/vraag-en-antwoord/is-de-vrijwillige-ouderbijdrage-op-de-basisschool-en-middelbare-school-verplicht",
  tracks: "https://www.rijksoverheid.nl/onderwerpen/voortgezet-onderwijs/vraag-en-antwoord/hoe-lang-mogen-leerlingen-doen-over-het-voortgezet-onderwijs",
  studyGrant: "https://duo.nl/particulier/studiefinanciering/",
  /* Dutch language: the ANS (the reference grammar of Dutch), Taaladvies, Onze Taal, and the official exam pages */
  clock: "https://e-ans.ivdnt.org/topics/pid/topic-19079431619093292",
  numbers: "https://e-ans.ivdnt.org/topics/pid/topic-16981467104435191",
  wordOrder: "https://onzetaal.nl/taalloket/woordvolgorde-in-bijzinnen-en-hoofdzinnen",
  inversion: "https://taaladvies.net/termen-inversie/",
  nietGeen: "https://taaladvies.net/hij-spreekt-niet-of-geen-goed-nederlands/",
  deHet: "https://taaladvies.net/woordgeslacht-algemeen/",
  a2exams: "https://www.inburgeren.nl/examen-doen/inhoud-taalexamens-a2-b1-b2.jsp",
  cbr: "https://www.cbr.nl/nl/rijbewijs-halen/auto/theorie-examen-auto/onderwerpen-in-het-theorie-examen.htm",
  anwbDistance: "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/afstand-houden",
  anwbSpeed: "https://www.anwb.nl/verzekeringen/autoverzekering/veilig-rijden/rijtips-snelheid",
  rvv18: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=18",
  rvv23: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=23",
  rvv24: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=24",
  rvv54: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=54",
  rvv20: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=20",
  rvv21: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=21",
  rvv45: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=45",
  /* checked on 10 Nov 2026 */
  cbrAlc: "https://www.cbr.nl/alcohol-en-drugs/met-hoeveel-alcohol-mag-ik-nog-rijden/",
  alcGlass: "https://www.alcoholinfo.nl/effecten/standaardglazen/",
  roPhone: "https://www.rijksoverheid.nl/onderwerpen/voertuigen-op-de-weg/vraag-en-antwoord/mag-ik-appen-bellen-en-naar-muziek-luisteren-als-ik-op-de-weg-rijd",
  roAlc: "https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/mag-ik-met-alcohol-op-deelnemen-aan-het-verkeer",
  roGordel: "https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/wanneer-moet-ik-de-autogordel-gebruiken",
  roZitje: "https://www.rijksoverheid.nl/onderwerpen/verkeersveiligheid/vraag-en-antwoord/moet-ik-mijn-kind-in-de-auto-in-een-kinderzitje-vervoeren",
  roFiets: "https://www.rijksoverheid.nl/onderwerpen/fiets/vraag-en-antwoord/welke-regels-gelden-voor-mijn-elektrische-fiets-e-bike",
  rdwTips: "https://www.rdw.nl/particulier/voertuigen/auto/apk/tips-voor-een-veilige-auto",
  rdwApk: "https://www.rdw.nl/particulier/voertuigen/auto/apk/wanneer-en-hoe-vaak-apk-keuren",
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
  bike: function(){ return '<g transform="scale(1.45)"><rect x="-1.4" y="-13" width="2.8" height="9" rx="1.4" class="sc-bike"/><rect x="-1.4" y="4" width="2.8" height="9" rx="1.4" class="sc-bike"/><rect x="-5" y="-8.5" width="10" height="1.8" rx=".9" class="sc-bike"/><ellipse cx="0" cy="1" rx="5.6" ry="3.4" class="sc-rider"/><circle cx="0" cy="0" r="2.6" class="sc-head"/></g>'; },
  tram: function(){ return '<rect x="-8" y="-30" width="16" height="60" rx="5" class="sc-car c-tram"/><rect x="-6" y="-25" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  train: function(){ return '<rect x="-9" y="-60" width="18" height="120" rx="5" class="sc-car c-train"/><path class="sc-glass" d="M-6 -50H6M-6 -20H6M-6 10H6M-6 40H6" stroke-width="3"/>'; },
  ball: function(){ return '<circle r="4.5" class="sc-ball"/><path class="sc-seam" d="M-4.5 0Q0 -3 4.5 0"/>'; },
  person: function(){ return PERSON; },
  /* cars at night: beam in front (dipped or high), rear lights, rear fog light */
  lit: function(c){ return '<path class="sc-beam" d="M-6 -14L6 -14L18 -62L-18 -62Z"/>' + SHAPES.car(c) + TAIL; },
  high: function(c){ return '<path class="sc-beam" d="M-6 -14L6 -14L26 -130L-26 -130Z"/>' + SHAPES.car(c) + TAIL; },
  fogcar: function(c){ return SHAPES.car(c) + TAIL + SHAPES.foglamp(); },
  foglamp: function(){ return '<circle class="sc-fogglow" cx="0" cy="13" r="8"/><rect class="sc-foglight" x="-2.5" y="11.5" width="5" height="2.5" rx="1"/>'; },
  flash: function(c){ return '<path class="sc-ray" d="M-5 -18L-12 -34M0 -19V-37M5 -18L12 -34"/>' + SHAPES.car(c); },
  /* a car indicating left: amber lights on its left side */
  left: function(c){ return SHAPES.car(c) + '<rect class="sc-ind sc-blink" x="-9" y="-15" width="4" height="4" rx="1"/><rect class="sc-ind sc-blink" x="-9" y="11" width="4" height="4" rx="1"/>'; },
  badge: function(c, t){ return '<circle class="sc-badge" r="9"/><text class="sc-num" x="0" y="3.5">' + t + '</text>'; }
};
var PERSON = '<ellipse class="sc-kid" rx="8.5" ry="4.8"/><circle class="sc-head" r="3.8"/>';
function kid(x, y){ return '<g transform="translate(' + x + ' ' + y + ')">' + PERSON + '</g>'; }
function ball(x, y){ return '<g transform="translate(' + x + ' ' + y + ')">' + SHAPES.ball() + '</g>'; }
var TAIL = '<rect class="sc-tail" x="-7" y="11.5" width="4" height="2.5"/><rect class="sc-tail" x="3" y="11.5" width="4" height="2.5"/>';
/* a sign from the question bank, placed at x,y with size s */
function roadSign(kind, x, y, s){ return window.DRIVE && DRIVE.signSvg ? DRIVE.signSvg(kind).replace('<svg ', '<svg x="' + (x - s / 2) + '" y="' + (y - s / 2) + '" width="' + s + '" height="' + s + '" ') : ""; }
function label(x, y, t){ return '<text class="sc-mark" x="' + x + '" y="' + y + '">' + t + '</text>'; }
/* civic drawings: flat, static pictures on a light card */
function civ(id, inner){ return '<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><rect class="cv-bg" width="200" height="200"/>' + inner + '</svg>'; }
function ctext(x, y, t, cls){ return '<text class="' + (cls || "cv-t") + '" x="' + x + '" y="' + y + '">' + t + '</text>'; }
function calendar(x, y, big, small){ return '<rect class="cv-card" x="' + (x - 34) + '" y="' + (y - 30) + '" width="68" height="66" rx="8"/><rect class="cv-red" x="' + (x - 34) + '" y="' + (y - 30) + '" width="68" height="16" rx="8"/><rect class="cv-red" x="' + (x - 34) + '" y="' + (y - 22) + '" width="68" height="8"/>' + ctext(x, y + 18, big, "cv-big") + ctext(x, y + 32, small, "cv-s"); }
/* a clock face showing h:m, with a caption under it */
function clockFace(cx, cy, r, h, m, cap){
  var ma = m / 60 * 2 * Math.PI, ha = ((h % 12) + m / 60) / 12 * 2 * Math.PI, t = "";
  for (var i = 0; i < 12; i++){ var a = i / 12 * 2 * Math.PI; t += '<path class="cv-tick" d="M' + (cx + Math.sin(a) * r * 0.82).toFixed(1) + " " + (cy - Math.cos(a) * r * 0.82).toFixed(1) + "L" + (cx + Math.sin(a) * r * 0.94).toFixed(1) + " " + (cy - Math.cos(a) * r * 0.94).toFixed(1) + '"/>'; }
  return '<circle class="cv-card" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' + t +
    '<path class="cv-hand-h" d="M' + cx + " " + cy + "L" + (cx + Math.sin(ha) * r * 0.5).toFixed(1) + " " + (cy - Math.cos(ha) * r * 0.5).toFixed(1) + '"/>' +
    '<path class="cv-hand-m" d="M' + cx + " " + cy + "L" + (cx + Math.sin(ma) * r * 0.78).toFixed(1) + " " + (cy - Math.cos(ma) * r * 0.78).toFixed(1) + '"/>' +
    '<circle class="cv-pin" cx="' + cx + '" cy="' + cy + '" r="3"/>' + (cap ? [].concat(cap).map(function(line, k){ return ctext(cx, cy + r + 16 + k * 15, line, "cv-nl"); }).join("") + ctext(cx, cy + r + 16 + [].concat(cap).length * 15, (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m, "cv-s") : "");
}
/* a row of word blocks; hi = index of the block to highlight */
function blocks(y, words, hi){
  var w = words.map(function(x){ return Math.max(34, x.length * 7.4 + 14); }), gap = 6, total = w.reduce(function(a, b){ return a + b; }, 0) + gap * (w.length - 1), x = 100 - total / 2, out = "";
  words.forEach(function(word, i){ out += '<rect class="' + (i === hi ? "cv-blue" : "cv-card") + '" x="' + x.toFixed(1) + '" y="' + y + '" width="' + w[i].toFixed(1) + '" height="28" rx="7"/>' + ctext((x + w[i] / 2).toFixed(1), y + 19, word, i === hi ? "cv-wnl" : "cv-nl"); x += w[i] + gap; });
  var k = total > 186 ? 186 / total : 1;  /* a long sentence shrinks to fit */
  return k < 1 ? '<g transform="translate(100 ' + (y + 14) + ') scale(' + k.toFixed(3) + ') translate(-100 -' + (y + 14) + ')">' + out + '</g>' : out;
}
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
        (a.label ? '<text class="sc-label" x="' + (a.lx || 0) + '" y="' + (a.ly || 30) + '">' + a.label + '</text>' : "") + '</g>';
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
  /* turning right: the cyclist beside you and the person walking along your road go straight on, so they go first */
  turnStraight: function(){ return svg("ts", crossroads(), "", [
    {shape:"bike", badge:"1", path:[[0, 127, 215, 0], [50, 127, -25, 0], [100, 127, -25, 0]], still:[0, 127, 52, 0]},
    {shape:"person", path:[[0, 146, 160], [50, 146, 52], [100, 146, -20]], still:[0, 146, 100]},
    you([[0, 115, 215, 0], [20, 115, 150, 0], [55, 115, 150, 0], [64, 117, 126, 20], [74, 140, 115, 90], [95, 225, 115, 90], [100, 225, 115, 90]], {badge:"2", still:[0, 115, 152]})
  ]); },
  /* turning left: the oncoming car turning right goes first */
  leftWaits: function(){ return svg("lw", crossroads(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 85, -25, 180], [30, 85, 55, 180], [42, 72, 80, 225], [52, 50, 85, 270], [72, -30, 85, 270], [100, -30, 85, 270]], still:[0, 85, 50, 180]},
    you([[0, 115, 215, 0], [20, 115, 150, 0], [55, 115, 150, 0], [65, 115, 108, 0], [75, 98, 87, -90], [95, -30, 85, -90], [100, -30, 85, -90]], {badge:"2", still:[0, 115, 152]})
  ]); },
  /* someone waits at a zebra: you stop and let them cross */
  zebraWait: function(){
    var z = ""; for (var x = 63; x < 138; x += 10) z += '<rect class="sc-zebra" x="' + x + '" y="80" width="6" height="18"/>';
    return svg("zw", road("none"), z, [
      {shape:"person", path:[[0, 152, 89], [35, 152, 89], [70, 46, 89], [100, 46, 89]], still:[0, 150, 89]},
      you([[0, 120, 215], [25, 120, 128], [75, 120, 128], [100, 120, -40]], {still:[0, 120, 128]})
    ]);
  },
  /* a tram stopped in the road: its passengers cross your lane, you wait */
  tramStop: function(){ return svg("tq", road("none") + '<path class="sc-rail" d="M86 0V200M94 0V200"/>', "", [
    {shape:"tram", path:[[0, 90, 70], [100, 90, 70]], still:[0, 90, 70]},
    {shape:"person", path:[[0, 104, 62], [10, 104, 62], [45, 156, 62], [100, 156, 62]], still:[0, 128, 62]},
    {shape:"person", path:[[0, 104, 80], [18, 104, 80], [52, 156, 80], [100, 156, 80]], still:[0, 112, 80]},
    you([[0, 124, 215], [25, 124, 140], [60, 124, 140], [100, 124, -40]], {still:[0, 124, 140]})
  ]); },
  driveway: function(){ return svg("dw", drivewayRoad(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, -25, 105, 90], [48, 225, 105, 90], [100, 225, 105, 90]], still:[0, 100, 105, 90]},
    you([[0, 45, 205], [15, 45, 145], [52, 45, 145], [62, 45, 120], [72, 70, 105, 90], [100, 230, 105, 90]], {badge:"2", still:[0, 45, 145]})
  ]); },

  /* hazard perception */
  hzBrake: function(){ return svg("hb", road(), '<rect class="sc-drive" x="140" y="0" width="22" height="200"/>' + parked(151, 40) + parked(151, 122) + parked(151, 158), [
    {shape:"ball", path:[[0, 151, 84, 0, 0], [20, 151, 84, 0, 1], [55, 72, 84, 0, 1], [70, 72, 84, 0, 0], [100, 72, 84, 0, 0]], still:[0, 110, 84, 0, 1]},
    you([[0, 120, 215], [25, 120, 160], [38, 120, 138], [46, 120, 128], [100, 120, 128]], {steady:true, still:[0, 120, 128]})
  ]); },
  hzRelease: function(){ return svg("hr", road(), '' + kid(166, 58) + '' + kid(176, 70) + '' + ball(170, 84) + '', [
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
  /* a car that has moved left and indicates left: you pass it on the right */
  passRight: function(){ return svg("pr", road(), "", [
    {shape:"left", color:"c-red", path:[[0, 108, 82], [100, 108, 82]], still:[0, 108, 82]},
    you([[0, 122, 215, 0], [30, 122, 140, 0], [42, 130, 115, 12], [70, 130, 40, 0], [100, 128, -40, 0]], {still:[0, 130, 120]})
  ]); },
  /* a queue in two lanes going the same way: your lane moves a little faster */
  queuePass: function(){
    var g = '<rect class="sc-road" x="60" y="0" width="80" height="200"/><path class="sc-dash" d="M100 0V200"/>';
    return svg("qp", g, parked(80, 20) + parked(80, 60) + parked(80, 100) + parked(80, 140) + parked(80, 180), [
      {shape:"car", color:"c-red", steady:true, path:[[0, 120, 40], [100, 120, -10]], still:[0, 120, 30]},
      you([[0, 120, 215], [100, 120, 90]], {steady:true, still:[0, 120, 130]})
    ]);
  },
  /* a two-lane roundabout: you go round in the outer lane and pass the car in the inner lane on its right */
  roundRight: function(){
    function lap(r, a0, turns){ var p = []; for (var k = 0; k <= 48; k++){ var a = a0 + turns * 360 * k / 48, rad = a * Math.PI / 180; p.push([k * 100 / 48, +(100 + r * Math.cos(rad)).toFixed(1), +(100 - r * Math.sin(rad)).toFixed(1), -a]); } return p; }
    var g = '<rect class="sc-road" x="80" y="0" width="40" height="200"/><rect class="sc-road" x="0" y="80" width="200" height="40"/><circle class="sc-road" cx="100" cy="100" r="74"/><circle class="mp-island" cx="100" cy="100" r="32"/><circle class="sc-dash" cx="100" cy="100" r="53"/>';
    var me = lap(64, 0, 2), other = lap(43, 40, 1);
    return svg("rr2", g, "", [
      {shape:"car", color:"c-red", steady:true, path:other, still:other[8]},
      you(me, {steady:true, still:me[2]})
    ]);
  },
  /* before a left turn: move close to the middle of the road */
  turnPos: function(){ return svg("tp", crossroads(), "", [
    you([[0, 118, 215, 0], [25, 118, 175, 0], [38, 106, 150, -12], [45, 104, 140, 0], [60, 104, 140, 0], [70, 104, 112, 0], [80, 88, 88, -90], [100, -30, 85, -90]], {still:[0, 104, 142]})
  ]); },
  zip: function(){ return svg("zp", zipRoad(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 120, 150], [30, 120, 40], [60, 120, -40], [100, 120, -40]], still:[0, 120, 45]},
    you([[0, 80, 180], [30, 80, 108], [42, 96, 80, 25], [52, 120, 60, 0], [85, 120, -40, 0], [100, 120, -40, 0]], {badge:"2", still:[0, 98, 82, 25]}),
    {shape:"car", color:"c-red", badge:"3", path:[[0, 120, 215], [30, 120, 168], [52, 120, 140], [90, 120, 24], [100, 120, 24]], still:[0, 120, 152]}
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
  /* an open peak-hour lane on the right behind a solid line: you cross into it */
  peakOpen: function(){
    function mx(x, cls){ return '<rect class="mp-mx" x="' + (x - 13) + '" y="6" width="26" height="22" rx="3"/><path class="' + cls + '" d="M' + x + ' 24V11M' + (x - 5) + ' 16L' + x + ' 11L' + (x + 5) + ' 16"/>'; }
    return svg("po", '<rect class="sc-road" x="50" y="0" width="134" height="200"/><path class="sc-dash" d="M96 0V200"/><path class="sc-solid" d="M52 0V200M140 0V200"/>',
      mx(73, "mp-mx-a") + mx(118, "mp-mx-a") + mx(162, "mp-mx-g"), [
      {shape:"car", color:"c-parked", steady:true, path:[[0, 73, 230], [100, 73, -40]], still:[0, 73, 60]},
      you([[0, 118, 220, 0], [30, 118, 150, 0], [42, 140, 122, 25], [55, 162, 95, 0], [100, 162, -30, 0]], {still:[0, 140, 122, 25]})
    ]);
  },
  /* a cycle lane behind a solid line: the cyclist crosses into it, you drive past without stopping */
  cycleLane: function(){
    return svg("cl", road() + '<rect class="sc-cyclelane" x="140" y="0" width="16" height="200"/><path class="sc-solid" d="M140 0V200"/>', '<rect class="sc-nozone" x="140" y="70" width="16" height="60"/>', [
      {shape:"bike", path:[[0, 128, 215, 0], [25, 128, 160, 0], [40, 148, 130, 20], [55, 148, 100, 0], [100, 148, -20, 0]], still:[0, 148, 110, 0]},
      you([[0, 120, 230], [30, 120, 230], [100, 120, -40]], {steady:true, still:[0, 120, 160]})
    ]);
  },
  /* solid yellow on the left kerb, broken yellow on the right: you stop briefly at the broken line */
  yellowKerb: function(){
    return svg("yk", road() + '<rect class="sc-drive" x="44" y="0" width="16" height="200"/><rect class="sc-drive" x="140" y="0" width="16" height="200"/>',
      '<path class="mp-kerb-yellow" d="M62 0V200"/><path class="mp-kerb-yellowdash" d="M138 0V200"/>' +
      '<text class="sc-mark" transform="translate(28 100) rotate(-90)">No stopping</text><text class="sc-mark" transform="translate(176 100) rotate(90)">No parking</text>', [
      you([[0, 126, 230], [30, 126, 100], [65, 126, 100], [100, 126, -40]], {still:[0, 126, 100]})
    ]);
  },
  /* a left-turn lane with a stop line: stop behind the line, then turn left as the arrow says */
  laneArrow: function(){
    return svg("la", crossroads(), '<path class="sc-solid" style="stroke-width:3" d="M115 196V186Q115 179 109 179"/><path class="sc-zebra" d="M109 173L100 179L109 185Z"/><path class="sc-solid" style="stroke-width:3.5" d="M101 134H129"/>', [
      you([[0, 115, 230], [25, 115, 148], [50, 115, 148], [62, 115, 112, 0], [72, 95, 87, -90], [100, -30, 85, -90]], {still:[0, 115, 148], lx:-26, ly:4})
    ]);
  },
  /* a lane marked BUS: a bus uses it, you stay in your own lane */
  busLane: function(){
    return svg("bl", road() + '<rect class="sc-road" x="140" y="0" width="26" height="200"/><path class="sc-solid" d="M140 0V200"/>',
      '<text class="sc-mark" transform="translate(157 165) rotate(-90)">BUS</text><text class="sc-mark" transform="translate(157 35) rotate(-90)">BUS</text>', [
      {shape:"truck", color:"c-bus", steady:true, path:[[0, 153, 240], [100, 153, -50]], still:[0, 153, 95]},
      you([[0, 120, 230], [100, 120, -40]], {steady:true, still:[0, 120, 150]})
    ]);
  },

  /* seconds and metres */
  secondsAway: function(){
    var m = ""; [["3 s", 170], ["2 s", 125], ["1 s", 80]].forEach(function(x){ m += '<path class="sc-tick" d="M60 ' + x[1] + 'H140"/><text class="sc-mark" x="32" y="' + (x[1] + 4) + '">' + x[0] + '</text>'; });
    return svg("sa", road(), m + '' + kid(146, 44) + '' + ball(134, 52) + '', [
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
  /* signs above the motorway lanes: red cross, white arrow, green arrow */
  matrixLanes: function(){
    var g = '<rect class="sc-road" x="40" y="0" width="140" height="200"/><path class="sc-dash" d="M86 0V200M134 0V200"/><path class="sc-solid" d="M42 0V200M178 0V200"/>';
    function box(x){ return '<rect class="mp-mx" x="' + (x - 13) + '" y="6" width="26" height="22" rx="3"/>'; }
    var m = box(63) + '<path class="mp-mx-x" d="M57 11L69 23M69 11L57 23"/>' + box(110) + '<path class="mp-mx-a" d="M105 12L115 22M109 22H115V16"/>' + box(157) + '<path class="mp-mx-g" d="M157 24V11M152 16L157 11L162 16"/>';
    return svg("mx", g, m, [
      you([[0, 110, 220, 0], [30, 110, 150, 0], [42, 133, 122, 25], [55, 157, 95, 0], [100, 157, -30, 0]], {still:[0, 133, 124, 25]})
    ]);
  },
  minSpeed: function(){
    return svg("ms", "", roadSign("g1", 55, 76, 70) + roadSign("g3", 145, 76, 70) + label(55, 132, "Motorway") + label(145, 132, "Autoweg") + label(55, 150, "faster than 60") + label(145, 150, "faster than 50"), []);
  },
  lorryLanes: function(){
    var g = '<rect class="sc-road" x="40" y="0" width="140" height="200"/><path class="sc-dash" d="M86 0V200M134 0V200"/><path class="sc-solid" d="M42 0V200M178 0V200"/><rect class="sc-nozone" x="42" y="0" width="44" height="200"/>';
    return svg("ll", g, '<text class="sc-mark" transform="translate(64 100) rotate(-90)">Not for lorries</text>', [
      {shape:"truck", steady:true, path:[[0, 157, 240], [100, 157, -50]], still:[0, 157, 120]},
      {shape:"truck", color:"c-red", steady:true, path:[[0, 110, 260], [100, 110, -60]], still:[0, 110, 60]}
    ]);
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
    return svg("ef", road("none"), sides + '' + kid(88, 58) + '' + ball(76, 66) + '' + kid(158, 120) + '' + parked(40, 150), [
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
    you([[0, 115, 225], [45, 115, 172], [100, 115, 172]], {still:[0, 115, 172], lx:26, ly:4})
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
  /* the car ahead drives into the fog: the car fades, its rear fog light stays visible (drawn again above the fog) */
  rearFog: function(){
    var away = [[0, 120, 96], [100, 120, 26]], still = [0, 120, 78];
    return svg("rf2", road(), '<path class="sc-tick" d="M104 150H140M104 110H140"/>' + label(160, 134, "50 m") + '<defs><linearGradient id="rfG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sc-fog1"/><stop offset="1" class="sc-fog2"/></linearGradient></defs>', [
      {shape:"fogcar", color:"c-red", steady:true, path:away, still:still},
      you([[0, 120, 165], [100, 120, 165]], {shape:"lit", still:[0, 120, 165]})
    ]).replace('</svg>', '<rect x="0" y="0" width="200" height="100" fill="url(#rfG)"/>' + actors("rf3", [{shape:"foglamp", steady:true, path:away, still:still}]) + '</svg>'); },
  /* a tunnel from above with the roof taken off: concrete walls, lamps along them. Rear lights come on at the mouth */
  tunnelLights: function(){
    var lamps = ""; for (var y = 12; y < 96; y += 20) lamps += '<rect class="sc-lamp" x="62" y="' + y + '" width="3" height="8" rx="1.5"/><rect class="sc-lamp" x="135" y="' + y + '" width="3" height="8" rx="1.5"/>';
    return svg("tl", road(), '<rect class="sc-wall" x="44" y="0" width="112" height="104"/><rect class="sc-tunnel" x="60" y="0" width="80" height="104"/><path class="sc-dash" d="M100 0V104"/>' + lamps +
      '<path class="sc-mouth" d="M44 104H60M140 104H156"/><path class="sc-shade" d="M60 104H140"/>' + label(22, 56, "Tunnel"), [
      you([[0, 120, 230, 0, 1], [44, 120, 111, 0, 1], [46, 120, 106, 0, 0], [100, 120, -40, 0, 0]], {steady:true, still:[0, 120, 60, 0, 0]}),
      you([[0, 120, 230, 0, 0], [44, 120, 111, 0, 0], [46, 120, 106, 0, 1], [100, 120, -40, 0, 1]], {shape:"lit", steady:true, still:[0, 120, 60, 0, 1]})
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
  prioSigns: function(){
    return svg("pg", "", roadSign("priority-road", 55, 48, 56) + roadSign("b2", 145, 48, 56) + roadSign("crossroads-priority", 55, 132, 56) + roadSign("b4", 145, 132, 56) +
      label(55, 90, "Priority road") + label(145, 90, "Priority ends") + label(55, 176, "Next junction") + label(145, 176, "Side road waits"), []);
  },
  endSigns: function(){
    return svg("es", "", label(100, 44, "These end here") + roadSign("a2-50", 34, 92, 52) + roadSign("f8", 100, 92, 52) + roadSign("g2", 166, 92, 52) +
      label(34, 138, "Limit") + label(100, 138, "All bans") + label(166, 138, "Motorway"), []);
  },
  amberLight: function(){
    return svg("al", "", '<rect class="mp-lbox" x="78" y="22" width="44" height="120" rx="10"/><circle class="mp-l-off" cx="100" cy="48" r="14"/><circle class="mp-l-amber" cx="100" cy="82" r="14"/><circle class="mp-l-off" cx="100" cy="116" r="14"/>' +
      label(100, 166, "Amber: stop, if you safely can"), []);
  },
  parkStop: function(){
    return svg("ps", "", roadSign("no-parking", 55, 72, 70) + roadSign("no-stopping", 145, 72, 70) +
      label(55, 128, "No parking") + label(145, 128, "No stopping") + label(55, 146, "Drop-off OK") + label(145, 146, "Not even briefly"), []);
  },
  advisory: function(){
    return svg("ad", "", '<circle class="sc-sign" cx="58" cy="80" r="34"/><text class="sc-signnum" x="58" y="89">70</text>' +
      '<rect class="sc-adv" x="110" y="46" width="68" height="68" rx="5"/><text class="sc-advt" x="144" y="89">70</text>' + label(58, 140, "Limit") + label(144, 140, "Advice"), []);
  },

  /* driving knowledge topics: flat pictures on a light card (alcohol, phones, seat belts, your car, safety) */
  alcLimit: function(){ return civ("al",
    '<rect class="cv-card" x="10" y="34" width="86" height="116" rx="10"/><rect class="cv-card" x="104" y="34" width="86" height="116" rx="10"/>' +
    ctext(53, 56, "Experienced", "cv-s") + ctext(53, 92, "0.5", "cv-big") + ctext(53, 108, "per mille", "cv-s") + ctext(53, 134, "220 µg/l", "cv-t") +
    ctext(147, 56, "Beginner", "cv-s") + ctext(147, 92, "0.2", "cv-num") + ctext(147, 108, "per mille", "cv-s") + ctext(147, 134, "88 µg/l", "cv-t") +
    ctext(100, 176, "µg/l = micrograms per litre of breath", "cv-s")); },
  alcGlass: function(){ return civ("ag",
    ctext(100, 34, "One standard glass", "cv-t") +
    '<rect class="cv-card" x="28" y="58" width="28" height="52" rx="5"/><rect class="cv-warm" x="30" y="70" width="24" height="38" rx="3"/><rect class="cv-card" x="29" y="58" width="26" height="12" rx="5"/>' +
    '<path class="cv-card" d="M86 58H114Q116 90 100 96Q84 90 86 58Z"/><path class="cv-red" d="M88 72H112Q111 90 100 94Q89 90 88 72Z"/><path class="cv-line" d="M100 96V116M90 118H110"/>' +
    '<path class="cv-card" d="M148 84H172L169 110H151Z"/><path class="cv-warm" d="M150.5 94H169.5L168 108H152Z"/>' +
    ctext(42, 132, "250 ml", "cv-t") + ctext(42, 146, "beer", "cv-s") + ctext(100, 132, "100 ml", "cv-t") + ctext(100, 146, "wine", "cv-s") + ctext(160, 132, "35 ml", "cv-t") + ctext(160, 146, "spirits", "cv-s") +
    ctext(100, 178, "about 10 g of alcohol each", "cv-t")); },
  alcOther: function(){ return civ("ao",
    ctext(100, 22, "Any substance that", "cv-t") + ctext(100, 38, "makes you unfit", "cv-t") +
    '<g transform="rotate(-35 52 82)"><rect class="cv-card" x="28" y="71" width="48" height="22" rx="11"/><path class="cv-blue" d="M52 71H65A11 11 0 0 1 65 93H52Z"/></g>' +
    '<path class="cv-card" d="M138 56H166Q168 84 152 90Q136 84 138 56Z"/><path class="cv-red" d="M140 70H164Q163 84 152 88Q141 84 140 70Z"/><path class="cv-line" d="M152 90V108M142 110H162"/>' +
    ctext(52, 122, "Medicine", "cv-s") + ctext(152, 126, "Alcohol", "cv-s") +
    '<circle class="cv-dark2" cx="100" cy="150" r="17" fill="none" style="stroke-width:5"/><path class="cv-dark2" style="stroke-width:4" d="M100 150V166M100 150L86 143M100 150L114 143"/><path class="cv-plus" d="M82 168L118 132"/>'); },
  alcBob: function(){
    var p = function(x, cls){ return '<circle class="' + cls + '" cx="' + x + '" cy="78" r="9"/><rect class="' + cls + '" x="' + (x - 11) + '" y="90" width="22" height="30" rx="8"/>'; };
    return civ("ab", ctext(100, 30, "Agree before you go out", "cv-t") + p(36, "cv-blue") + p(86, "cv-warm") + p(126, "cv-warm") + p(166, "cv-warm") +
      '<circle class="cv-dark2" cx="36" cy="52" r="9" fill="none" style="stroke-width:3"/><path class="cv-dark2" style="stroke-width:2.5" d="M36 52V61M36 52L29 48M36 52L43 48"/>' +
      ctext(36, 140, "Bob", "cv-t") + ctext(36, 154, "no alcohol", "cv-s") + ctext(126, 140, "May drink", "cv-s") + ctext(100, 182, "The Bob drives everyone home", "cv-t")); },
  phoneHold: function(){ return civ("ph",
    ctext(100, 26, "While you drive", "cv-t") +
    '<rect class="cv-dark" x="30" y="48" width="44" height="80" rx="8"/><rect class="cv-card" x="35" y="56" width="34" height="58" rx="3"/><path class="cv-plus" d="M18 130L88 46"/>' +
    ctext(52, 152, "Held", "cv-t") + ctext(52, 166, "not allowed", "cv-s") +
    '<path class="cv-dark2" style="stroke-width:5" d="M114 128H186"/><rect class="cv-blue" x="141" y="112" width="18" height="14" rx="3"/><rect class="cv-dark" x="136" y="50" width="28" height="66" rx="6"/><rect class="cv-card" x="140" y="56" width="20" height="50" rx="2"/>' +
    '<path d="M168 56L174 63L186 48" fill="none" stroke="#1F9D6B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    ctext(150, 152, "In a holder", "cv-t") + ctext(150, 166, "not held", "cv-s")); },
  phoneBike: function(){ return civ("pb",
    '<rect class="cv-card" x="10" y="30" width="86" height="124" rx="10"/><rect class="cv-card" x="104" y="30" width="86" height="124" rx="10"/>' +
    '<path class="cv-dark2" style="stroke-width:5" d="M36 78Q36 52 53 52Q70 52 70 78" fill="none"/><rect class="cv-dark" x="30" y="76" width="12" height="20" rx="5"/><rect class="cv-dark" x="64" y="76" width="12" height="20" rx="5"/>' +
    '<path d="M62 52L68 59L82 42" fill="none" stroke="#1F9D6B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
    ctext(53, 126, "Hands-free", "cv-t") + ctext(53, 141, "if no danger", "cv-s") +
    '<rect class="cv-dark" x="130" y="46" width="34" height="58" rx="7"/><rect class="cv-card" x="135" y="53" width="24" height="40" rx="2"/><path class="cv-plus" d="M124 100L170 44"/>' +
    ctext(147, 126, "Holding it", "cv-t") + ctext(147, 141, "while riding", "cv-s") +
    ctext(100, 180, "Standing still: you may hold it", "cv-t")); },
  beltAlways: function(){
    var seat = function(x, y){ return '<circle class="cv-blue" cx="' + x + '" cy="' + (y - 6) + '" r="7"/><rect class="cv-blue" x="' + (x - 11) + '" y="' + (y + 2) + '" width="22" height="13" rx="5"/><rect class="cv-warm" x="' + (x - 13) + '" y="' + (y + 6) + '" width="26" height="4" rx="2"/>'; };
    return civ("ba", '<rect class="cv-card" x="52" y="14" width="96" height="140" rx="22"/><path class="cv-line" d="M70 30H130"/>' +
      seat(76, 54) + seat(124, 54) + seat(70, 112) + seat(100, 112) + seat(130, 112) + ctext(100, 180, "One belt each. No sharing.", "cv-t")); },
  beltChild: function(){ return civ("bc",
    '<path class="cv-line" style="stroke-dasharray:4 4" d="M18 84H182"/><text class="cv-t" x="168" y="76" style="fill:#C0392B">1.35 m</text>' +
    '<path class="cv-blue" d="M36 150V118Q36 110 44 110H70V150Z"/><circle class="cv-warm" cx="58" cy="100" r="8"/><rect class="cv-warm" x="50" y="108" width="16" height="22" rx="5"/>' +
    '<rect class="cv-card" x="120" y="92" width="32" height="58" rx="6"/><circle class="cv-warm" cx="136" cy="52" r="11"/><rect class="cv-warm" x="126" y="64" width="20" height="54" rx="7"/><path d="M128 66L146 108" stroke="#C0392B" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '<text class="cv-t" x="54" y="168" style="font-size:11px">Under 1.35 m</text>' + ctext(54, 182, "child seat", "cv-s") + '<text class="cv-t" x="140" y="168" style="font-size:11px">Over 1.35 m</text>' + ctext(140, 182, "normal belt", "cv-s")); },
  beltBaby: function(){ return civ("bb",
    '<path class="cv-arrow" d="M50 40H150M142 34L150 40L142 46"/>' + ctext(100, 30, "Travel", "cv-s") +
    '<path class="cv-blue" d="M86 140V96Q86 78 104 78H134V140Z"/><circle class="cv-warm" cx="110" cy="96" r="10"/><rect class="cv-warm" x="104" y="106" width="22" height="22" rx="7"/>' +
    '<path class="cv-arrow" d="M80 100H58M65 94L58 100L65 106"/>' + ctext(38, 118, "Looks back", "cv-s") +
    '<rect class="cv-red" x="142" y="88" width="50" height="34" rx="8"/>' + ctext(167, 102, "Airbag", "cv-w") + ctext(167, 117, "off", "cv-w") +
    ctext(100, 164, "Facing backwards", "cv-t") + ctext(100, 180, "as long as you can", "cv-t")); },
  beltFine: function(){ return civ("bf",
    '<rect class="cv-card" x="10" y="38" width="96" height="40" rx="8"/>' + '<text class="cv-t" x="58" y="62" style="font-size:11px">Child under 12</text>' + '<path class="cv-arrow" d="M110 58H128M122 52L128 58L122 64"/><rect class="cv-red" x="132" y="38" width="58" height="40" rx="8"/>' + ctext(161, 63, "You pay", "cv-w") +
    '<rect class="cv-card" x="10" y="98" width="96" height="40" rx="8"/>' + '<text class="cv-t" x="58" y="122" style="font-size:11px">Child 12 or older</text>' + '<path class="cv-arrow" d="M110 118H128M122 112L128 118L122 124"/><rect class="cv-blue" x="132" y="98" width="58" height="40" rx="8"/>' + ctext(161, 123, "They pay", "cv-w") +
    ctext(100, 172, "If the belt or seat is not used", "cv-s")); },
  tyreDepth: function(){ return civ("td",
    '<rect class="cv-blue" x="24" y="38" width="152" height="30" rx="8"/><rect class="cv-dark" x="30" y="68" width="56" height="46" rx="3"/><rect class="cv-dark" x="114" y="68" width="56" height="46" rx="3"/><path class="cv-line" d="M16 116H184"/>' +
    '<path class="cv-arrow" style="stroke:#C0392B" d="M100 70V112M95 77L100 70L105 77M95 105L100 112L105 105"/>' + '<text class="cv-t" x="100" y="136" style="fill:#C0392B">at least 1.6 mm</text>' +
    ctext(100, 160, "In the main grooves, all the way round", "cv-s") + ctext(100, 176, "Check the pressure every month", "cv-s")); },
  apkWhen: function(){
    var X = function(y){ return 16 + y * 14; }, row = function(y0, years, lbl){ var s = '<path class="cv-line" d="M' + X(years[0]) + " " + y0 + "H" + X(years[years.length - 1]) + '"/>', i;
      for (i = 0; i < years.length; i++){ s += '<circle class="cv-blue" cx="' + X(years[i]) + '" cy="' + y0 + '" r="5.5"/>'; if (i < 3) s += ctext(X(years[i]), y0 + 20, String(years[i]), "cv-t"); }
      return ctext(100, y0 - 16, lbl, "cv-s") + s; };
    return civ("ak", ctext(100, 26, "Age of the car in years", "cv-t") + row(70, [4, 6, 8, 9, 10, 11, 12], "Petrol or electric") + row(128, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "Diesel or gas") + ctext(100, 184, "Up to 2 months early: same date", "cv-s")); },
  lightsCheck: function(){ return civ("lc",
    ctext(100, 30, "Fog lights: when you see less than", "cv-s") +
    '<path class="sc-beam" d="M126 92L190 70V122L126 102Z"/><rect class="cv-blue" x="74" y="84" width="52" height="26" rx="9"/><rect class="cv-card" x="106" y="88" width="10" height="18" rx="2"/>' +
    '<circle class="sc-fogglow" cx="66" cy="97" r="15"/><rect class="sc-foglight" x="68" y="93" width="5" height="8" rx="1"/>' +
    ctext(40, 146, "Rear", "cv-s") + '<text class="cv-t" x="40" y="168" style="fill:#C0392B;font-size:22px">50 m</text>' + ctext(160, 146, "Front", "cv-s") + '<text class="cv-t" x="160" y="168" style="fill:#C0392B;font-size:22px">200 m</text>'); },
  safeHorn: function(){ return civ("sh",
    '<path class="cv-red" style="stroke:#C0392B;stroke-width:6;stroke-linejoin:round" d="M100 34L148 112H52Z"/>' + ctext(100, 100, "!", "cv-hbig") +
    '<path class="cv-line" d="M40 58Q26 76 40 94M28 50Q8 76 28 102M160 58Q174 76 160 94M172 50Q192 76 172 102"/>' +
    ctext(100, 148, "Horn and headlight flash", "cv-t") + ctext(100, 164, "only to warn of danger", "cv-t")); },
  safeTriangle: function(){ return civ("st",
    '<path class="cv-arrow" d="M14 58H46M40 52L46 58L40 64"/>' + ctext(30, 48, "Traffic", "cv-s") +
    '<rect class="cv-dark" x="10" y="80" width="180" height="40" rx="6"/><path class="sc-dash" d="M14 100H186" style="stroke-width:1.4"/>' +
    '<path class="cv-card" style="stroke:#C0392B;stroke-width:4;stroke-linejoin:round" d="M44 84L56 106H32Z"/><rect class="cv-blue" x="138" y="88" width="40" height="24" rx="8"/><rect class="cv-card" x="140" y="92" width="10" height="16" rx="2"/>' +
    '<path class="cv-arrow" d="M62 142H132M69 136L62 142L69 148M125 136L132 142L125 148"/>' + ctext(97, 164, "about 30 m", "cv-t") + ctext(100, 184, "Not needed if hazard lights flash", "cv-s")); },
  safeTow: function(){ return civ("sw",
    '<path class="cv-line" d="M14 120H186"/><rect class="cv-blue" x="26" y="88" width="46" height="24" rx="8"/><rect class="cv-warm" x="128" y="88" width="46" height="24" rx="8"/>' +
    '<path class="cv-dark2" style="stroke-width:3;stroke-dasharray:3 3" d="M72 100H128"/>' +
    '<path class="cv-arrow" d="M74 70H126M81 64L74 70L81 76M119 64L126 70L119 76"/>' + '<text class="cv-t" x="100" y="58" style="fill:#C0392B">5 m at most</text>' +
    ctext(49, 138, "Towed", "cv-s") + ctext(151, 138, "Your car", "cv-s") + ctext(100, 172, "Gap between the two cars", "cv-t")); },

  /* Nov 2026 steps: licence from abroad, hands-free, trailer limits, nobody in the boot, after a crash */
  alcAbroad: function(){ return civ("aa",
    ctext(100, 28, "Your first licence, anywhere", "cv-t") +
    '<path class="cv-line" d="M20 96H180"/><circle class="cv-blue" cx="24" cy="96" r="7"/><path class="cv-dark2" style="stroke-width:3" d="M128 80V112"/>' +
    '<rect class="cv-card" x="30" y="58" width="92" height="26" rx="6"/>' + ctext(76, 76, "0.2 per mille", "cv-t") + ctext(154, 76, "0.5", "cv-t") +
    ctext(24, 126, "Issued", "cv-s") + ctext(128, 126, "+5 years", "cv-s") + ctext(100, 170, "Abroad or here, the same 5 years", "cv-s")); },
  phoneFree: function(){ return civ("pf",
    '<rect class="cv-card" x="10" y="30" width="86" height="110" rx="10"/><rect class="cv-card" x="104" y="30" width="86" height="110" rx="10"/>' +
    '<path class="cv-dark2" style="stroke-width:5" d="M36 84Q36 58 53 58Q70 58 70 84" fill="none"/><rect class="cv-dark" x="30" y="82" width="12" height="20" rx="5"/><rect class="cv-dark" x="64" y="82" width="12" height="20" rx="5"/>' +
    ctext(53, 126, "Hands-free", "cv-t") +
    '<path class="cv-dark2" style="stroke-width:5" d="M140 98V62L168 56V92" fill="none"/><circle class="cv-dark" cx="134" cy="98" r="8"/><circle class="cv-dark" cx="162" cy="92" r="8"/>' +
    ctext(147, 126, "Music, low", "cv-t") + ctext(100, 172, "Hold the phone only once parked", "cv-s")); },
  trailerMax: function(){
    function sign(x, n, l){ return '<circle class="sc-sign" cx="' + x + '" cy="80" r="27" style="stroke-width:7"/><text class="sc-signnum" x="' + x + '" y="87" style="font-size:19px">' + n + '</text><text class="sc-mark" x="' + x + '" y="132">' + l + '</text>'; }
    return svg("tm", "", sign(36, "90", "Motorway") + sign(100, "80", "Other road") + sign(164, "50", "In town") + '<text class="sc-mark" x="100" y="176">With a trailer or caravan</text>', []);
  },
  safeBoot: function(){ return civ("sb",
    '<path class="cv-card" d="M14 120V96L40 72H118L146 96H186V120Z"/><path class="cv-line" d="M146 96V120"/>' +
    '<circle class="cv-blue" cx="74" cy="92" r="7"/><circle class="cv-warm" cx="166" cy="106" r="7"/><path class="cv-plus" d="M150 124L182 88"/>' +
    '<circle class="cv-dark" cx="44" cy="122" r="11"/><circle class="cv-dark" cx="150" cy="122" r="11"/>' +
    ctext(74, 154, "In a seat", "cv-t") + ctext(166, 154, "Boot", "cv-t") + ctext(100, 182, "Not in a boot, van or trailer", "cv-s")); },
  safeCrash: function(){ return civ("sc",
    '<g transform="rotate(-20 64 70)"><rect class="cv-blue" x="40" y="58" width="48" height="24" rx="8"/></g><g transform="rotate(25 136 70)"><rect class="cv-warm" x="112" y="58" width="48" height="24" rx="8"/></g>' +
    '<path class="cv-dark2" style="stroke-width:3" d="M96 60L100 48L104 60M92 74L84 80M108 74L116 80"/>' +
    ctext(100, 120, "Stay until", "cv-t") + ctext(100, 140, "you know who is involved", "cv-s") + ctext(100, 156, "and anyone hurt has help", "cv-s")); },

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

  /* Dutch: listening */
  halfTen: function(){ return civ("ht", clockFace(100, 82, 56, 9, 30, "half tien")); },
  quarters: function(){ return civ("qu", clockFace(54, 70, 40, 7, 15, ["kwart over", "zeven"]) + clockFace(146, 70, 40, 7, 45, ["kwart voor", "acht"])); },
  tienVoorHalf: function(){ return civ("tv", clockFace(54, 70, 40, 2, 20, ["tien voor", "half drie"]) + clockFace(146, 70, 40, 2, 35, ["vijf over", "half drie"])); },
  unitsFirst: function(){ return civ("uf", blocks(46, ["vier", "en", "zestig"], 0) + '<path class="cv-arrow" d="M100 86V110M95 104L100 111L105 104"/>' + ctext(100, 156, "64", "cv-big2") + ctext(100, 180, "4 first, then the tens", "cv-s")); },
  /* Dutch: grammar */
  verbSecond: function(){ return civ("vs", blocks(44, ["Ik", "werk", "morgen."], 1) + blocks(100, ["Morgen", "werk", "ik."], 1) + ctext(100, 156, "The verb stays in place 2", "cv-t")); },
  verbFirst: function(){ return civ("vf", blocks(60, ["Werk", "je", "morgen?"], 0) + ctext(100, 120, "Yes/no question:", "cv-t") + ctext(100, 138, "the verb comes first", "cv-s")); },
  geenNiet: function(){ return civ("gn", blocks(40, ["Ik", "heb", "geen", "auto."], 2) + ctext(100, 84, "geen + noun", "cv-s") + blocks(104, ["Ik", "werk", "vandaag", "niet."], 3) + ctext(100, 148, "niet for the rest", "cv-s")); },
  deHet: function(){ return civ("dh", '<rect class="cv-card" x="14" y="44" width="80" height="80" rx="10"/><rect class="cv-card" x="106" y="44" width="80" height="80" rx="10"/>' +
    ctext(54, 80, "de", "cv-big") + ctext(54, 104, "huizen", "cv-nl") + ctext(146, 80, "het", "cv-big") + ctext(146, 104, "huisje", "cv-nl") + ctext(54, 146, "every plural", "cv-s") + ctext(146, 146, "every -je word", "cv-s")); },
  /* Dutch: reading */
  questionFirst: function(){ return civ("qf", '<rect class="cv-card" x="30" y="30" width="140" height="110" rx="8"/><path class="cv-line" d="M44 52H156M44 66H140M44 80H150M44 94H120M44 108H146M44 122H100"/><rect class="cv-warm" x="96" y="88" width="54" height="12" rx="3" opacity=".55"/>' +
    '<rect class="cv-blue" x="40" y="150" width="120" height="30" rx="8"/>' + ctext(100, 170, "Question first", "cv-w")); },
  smallWords: function(){ return civ("sw", blocks(30, ["niet", "geen", "wel"], -1) + blocks(76, ["verplaatst", "gaat niet door"], -1) + blocks(122, ["vanaf", "tot"], -1) + ctext(100, 178, "They change the meaning", "cv-s")); },

  /* civic: government and elections */
  twoChambers: function(){ return civ("tc", '<rect class="cv-blue" x="14" y="30" width="82" height="70" rx="10"/><rect class="cv-blue2" x="104" y="30" width="82" height="70" rx="10"/>' +
    ctext(55, 60, "150", "cv-hbig") + ctext(55, 78, "Tweede", "cv-w") + ctext(55, 92, "Kamer", "cv-w") + ctext(145, 60, "75", "cv-hbig") + ctext(145, 78, "Eerste", "cv-w") + ctext(145, 92, "Kamer", "cv-w") +
    ctext(55, 122, "Debates, can amend", "cv-s") + ctext(145, 122, "Yes or no only", "cv-s") + ctext(55, 138, "You vote for it", "cv-s") + ctext(145, 138, "Provinciale Staten", "cv-s") + ctext(145, 152, "choose it", "cv-s") + ctext(100, 182, "Together: the Staten-Generaal", "cv-t")); },
  kingMinisters: function(){ return civ("km", '<path class="cv-warm" d="M62 70L70 40L86 58L100 34L114 58L130 40L138 70Z"/><rect class="cv-warm" x="62" y="72" width="76" height="12" rx="3"/>' +
    ctext(100, 108, "King: head of state", "cv-t") + '<path class="cv-arrow" d="M100 118V134M95 128L100 135L105 128"/>' + ctext(100, 156, "Ministers are responsible", "cv-t") + ctext(100, 174, "to parliament", "cv-s")); },
  whoVotes: function(){ return civ("wv", '<rect class="cv-card" x="56" y="22" width="88" height="62" rx="8"/><rect class="cv-dark" x="80" y="18" width="40" height="8" rx="3"/>' + ctext(100, 68, "18+", "cv-big2") +
    ctext(100, 110, "Tweede Kamer: Dutch citizens", "cv-t") + ctext(100, 132, "Gemeenteraad: also EU citizens,", "cv-t") + ctext(100, 148, "and others after 5 years", "cv-t") + ctext(100, 164, "of legal residence", "cv-t")); },
  everyYears: function(){ return civ("ey", calendar(54, 74, "4", "years") + calendar(146, 74, "5", "years") + ctext(54, 132, "Tweede Kamer", "cv-s") + ctext(54, 146, "Gemeenteraad", "cv-s") + ctext(146, 132, "European", "cv-s") + ctext(146, 146, "Parliament", "cv-s")); },
  mayorCrown: function(){ return civ("mc", '<rect class="cv-card" x="20" y="44" width="70" height="56" rx="8"/>' + ctext(55, 70, "Gemeenteraad", "cv-s") + ctext(55, 86, "recommends", "cv-s") +
    '<path class="cv-arrow" d="M94 72H106M101 67L107 72L101 77"/><rect class="cv-blue" x="110" y="44" width="70" height="56" rx="8"/>' + ctext(145, 70, "De Kroon", "cv-w") + ctext(145, 86, "appoints", "cv-w") +
    ctext(100, 132, "Burgemeester", "cv-t") + ctext(100, 150, "Appointed, not elected", "cv-s")); },
  article1: function(){ return civ("a1", '<rect class="cv-card" x="34" y="24" width="132" height="116" rx="8"/><rect class="cv-blue" x="34" y="24" width="132" height="24" rx="8"/><rect class="cv-blue" x="34" y="38" width="132" height="10"/>' +
    ctext(100, 41, "Grondwet, artikel 1", "cv-w") + ctext(100, 76, "Equal cases:", "cv-t") + ctext(100, 94, "equal treatment", "cv-t") + ctext(100, 122, "No discrimination", "cv-s") + ctext(100, 168, "Applies to everyone here", "cv-t")); },

  /* civic: housing */
  depositMax: function(){ return civ("dm", '<rect class="cv-warm" x="30" y="40" width="60" height="70" rx="8"/><rect class="cv-warm" x="110" y="40" width="60" height="70" rx="8"/>' +
    ctext(60, 82, "1", "cv-hbig") + ctext(140, 82, "2", "cv-hbig") + ctext(100, 136, "Borg: at most 2 months", "cv-t") + ctext(100, 154, "of kale huur (rent without costs)", "cv-s") + ctext(100, 176, "Contracts from 1 July 2023", "cv-s")); },
  whoRepairs: function(){ return civ("wr", '<rect class="cv-card" x="12" y="36" width="84" height="100" rx="8"/><rect class="cv-blue" x="104" y="36" width="84" height="100" rx="8"/>' +
    ctext(54, 58, "You", "cv-t") + ctext(54, 84, "Tap washer", "cv-s") + ctext(54, 100, "Toilet seat", "cv-s") + ctext(54, 116, "Small jobs", "cv-s") +
    ctext(146, 58, "Landlord", "cv-w") + ctext(146, 84, "Windows", "cv-w") + ctext(146, 100, "Smoke alarms", "cv-w") + ctext(146, 116, "Big repairs", "cv-w") + ctext(100, 168, "Who fixes what", "cv-t")); },
  rentOnce: function(){ return civ("ro", calendar(100, 74, "12", "months") + ctext(100, 132, "Rent goes up at most", "cv-t") + ctext(100, 150, "once every 12 months", "cv-t") + ctext(100, 170, "Usually on 1 July", "cv-s")); },
  registered: function(){ return civ("rg", '<rect class="cv-card" x="40" y="40" width="120" height="78" rx="6"/><path class="cv-line" d="M40 42L100 86L160 42"/><rect class="cv-red" x="112" y="92" width="44" height="18" rx="3"/>' +
    ctext(134, 105, "R", "cv-w") + ctext(100, 144, "Aangetekende brief", "cv-t") + ctext(100, 162, "You get proof it arrived", "cv-s")); },

  /* civic: education */
  schoolAges: function(){ return civ("sa", '<rect class="cv-card" x="14" y="62" width="172" height="34" rx="8"/><rect class="cv-blue" x="14" y="62" width="110" height="34" rx="8"/><rect class="cv-blue" x="108" y="62" width="16" height="34"/><rect class="cv-blue2" x="124" y="62" width="62" height="34" rx="8"/><rect class="cv-blue2" x="124" y="62" width="14" height="34"/>' +
    ctext(16, 54, "5", "cv-t") + ctext(124, 54, "16", "cv-t") + ctext(184, 54, "18", "cv-t") + ctext(69, 84, "Leerplicht", "cv-w") + ctext(155, 84, "Diploma", "cv-w") +
    ctext(100, 128, "From 16: school until 18,", "cv-t") + ctext(100, 144, "or until a havo, vwo or mbo 2 diploma", "cv-s")); },
  schoolTracks: function(){
    function bar(y, w, a, b){ return '<rect class="cv-blue" x="56" y="' + y + '" width="' + w + '" height="24" rx="6"/>' + ctext(32, y + 16, a, "cv-t") + ctext(56 + w + 22, y + 16, b, "cv-s"); }
    return civ("st", bar(40, 64, "vmbo", "4 yrs") + bar(76, 80, "havo", "5 yrs") + bar(112, 96, "vwo", "6 yrs") + ctext(100, 166, "vwo prepares for university", "cv-t"));
  },
  askDirector: function(){ return civ("ad", calendar(100, 70, "8", "weeks") + ctext(100, 128, "Holiday in school time?", "cv-t") + ctext(100, 146, "Ask the school director first", "cv-s") + ctext(100, 162, "Only if no school holiday is possible", "cv-s")); },
  parentFee: function(){ return civ("pf", '<rect class="cv-card" x="40" y="34" width="120" height="72" rx="8"/>' + ctext(100, 62, "Ouderbijdrage", "cv-t") + ctext(100, 86, "Vrijwillig", "cv-big2") +
    ctext(100, 140, "Not paying? Your child", "cv-t") + ctext(100, 158, "still goes on the trip", "cv-t")); },

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
      {scene:"turnStraight", h:"Turning? Traffic going straight on goes first",
       t:"When you turn left or right, let everyone on your road who goes straight on go first: oncoming traffic, and cyclists, mopeds and people walking beside you or just behind you. That includes a cycle path along your road, and people on foot crossing the street you turn into.",
       why:"You are the one leaving your line, so you cut across people who simply keep going.", src:SRC.rvv18},
      {scene:"leftWaits", h:"Turning left? Wait for an oncoming car turning right",
       t:"If you turn left and an oncoming driver turns right at the same junction, they go first. Your left turn crosses their path, their right turn doesn't cross yours.",
       why:"You both head for the same street, so one fixed rule stops you both waiting for each other.", src:SRC.gov(26)},
      {scene:"zebraWait", h:"Zebra crossing: stop for people waiting, not only crossing",
       t:"At a zebra crossing, let people cross who are on it or clearly waiting to cross. Always let a blind person with a white cane (with red rings) cross, and anyone who has trouble walking, zebra or not. Tram drivers must stop at a zebra too.",
       why:"Someone at the kerb can't step out until a driver stops, so you have to stop first.", src:SRC.gov(35)},
      {scene:"tramStop", h:"Red pedestrian light, and passengers getting off",
       t:"When the pedestrian light at a zebra is red, people on foot have no priority and you may drive on. When you pass a tram or bus that has stopped, on the side where people get on and off, let them get on and off first.",
       why:"The light decides who goes, and passengers have to cross your path to reach the pavement.", src:SRC.gov(36)},
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
      {scene:"passRight", h:"Overtaking on the right: only in these cases",
       t:"A driver who has moved to the left and indicates left is passed on the right. A tram is passed on the right too. Cyclists may pass slower vehicles, your car included, on the right, so check your mirror before you turn right. Never overtake just before or on a zebra crossing.",
       why:"The car turning left and the tram on its rails leave only the right side free.", src:SRC.gov(24)},
      {scene:"queuePass", h:"In a queue you may pass on the right",
       t:"When traffic queues in lanes going the same way, you don't have to keep to the right lane, and you may drive past a slower queue on its right. Even on green, don't drive onto a junction if you would have to stop on it.",
       why:"In a queue everyone crawls side by side, so passing on the right surprises nobody. A car stuck on a junction blocks the crossing traffic.", src:SRC.gov(25)},
      {scene:"roundRight", h:"On a roundabout you may pass on the right",
       t:"On a roundabout with more than one lane, you may use any lane, and you may overtake on the right when you enter it or drive round it.",
       why:"On a roundabout you pick your lane by your exit, not by your speed.", src:SRC.gov(35)},
      {scene:"turnPos", h:"Before a turn: get in position and indicate",
       t:"To turn right, move to the right side of the road in good time. To turn left, move close to the middle of the road, or as far left as you can on a road with a central divider. Indicate before you turn.",
       why:"Traffic behind you can then pass on the side you leave free.", src:SRC.gov(26)},
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
    "Alcohol limit": [
      {scene:"alcLimit", h:"0.5 per mille, and only 0.2 for beginners",
       t:"An experienced driver may have at most 0.5 per mille of alcohol in the blood, or 220 micrograms per litre of breath. In your first 5 years with a first car licence the limit is 0.2 per mille, or 88 micrograms.",
       why:"Even one glass makes an accident more likely, and beginners have the least experience to make up for it.", src:SRC.cbrAlc},
      {scene:"alcAbroad", h:"A licence from abroad counts too",
       t:"If your first car licence came from another country, your beginner years still run from the day it was first issued. Got it abroad 3 years ago? Then the 0.2 limit applies to you here for 2 more years.",
       why:"The lower limit is about how little driving experience you have, wherever you got your licence.", src:SRC.gov(21)},
      {scene:"alcGlass", h:"One standard glass holds about 10 g of alcohol",
       t:"A standard glass is 250 ml of beer, 100 ml of wine or 35 ml of spirits. A bottle of beer counts as more than one. A man reaches 0.5 per mille after about 2 standard glasses and 0.2 after about 1. A woman gets there after slightly fewer.",
       why:"The limit is the alcohol in your blood, not the number of drinks, so you need to know what a drink holds.", src:SRC.alcGlass},
      {scene:"alcOther", h:"Medicine and other substances count too",
       t:"You may not drive under the influence of any substance, alone or mixed with another, that makes you unfit to drive. Some medicines do. You also may not let someone drive when you know, or should know, that they are over the limit or unfit.",
       why:"What matters is whether you can still drive safely, whatever the cause.", src:SRC.gov(21)},
      {scene:"alcBob", h:"Choose the Bob before you go out",
       t:"Agree beforehand who drives. That person drinks no alcohol and is the Bob.",
       why:"A clear agreement in advance keeps the Bob from being tempted to have a drink.", src:SRC.roAlc}
    ],
    "Mobile phones": [
      {scene:"phoneHold", h:"Do not hold a phone while you drive",
       t:"You may not hold a phone, tablet or media player while driving, to call, type or read a route. The rule covers cars, mopeds and e-bikes. It is about holding, so a phone in a holder is not held.",
       why:"A device in your hand takes your hand, your eyes and your mind off the road.", src:SRC.gov(40)},
      {scene:"phoneBike", h:"On a bike: hands-free is fine, holding is not",
       t:"When you cycle you may not hold a phone. Calling hands-free and listening to music are allowed if they cause no danger. When you stand still you may hold and use your phone.",
       why:"The danger is in riding with a device in your hand.", src:SRC.roFiets},
      {scene:"phoneFree", h:"Hands-free and music are fine",
       t:"In the car you may call hands-free and listen to music. Keep the volume low enough to hear the traffic around you. Once you have parked, you may hold your phone and use it.",
       why:"The danger is a device in your hand while you drive, not the sound.", src:SRC.roPhone}
    ],
    "Seatbelts": [
      {scene:"beltAlways", h:"Belt on, in front and at the back",
       t:"Wear a seat belt whenever your seat has one, as driver or passenger, in front or behind. Two people may not share a belt, and you may not carry more passengers than there are belts. An adult shorter than 1.35 m just wears the normal belt.",
       why:"A belt only protects the person it is fitted around.", src:SRC.roGordel},
      {scene:"beltChild", h:"Under 1.35 m and under 18: a child seat",
       t:"Children shorter than 1.35 m must travel in an approved child seat, in front or behind, in your car and in anyone else's. Taller than 1.35 m, they may use the normal belt.",
       why:"A normal belt is made for people over 1.35 m and sits in the wrong place on a smaller child.", src:SRC.roZitje},
      {scene:"beltBaby", h:"Babies: backwards for as long as you can, and mind the airbag",
       t:"It is safer to carry a baby facing backwards for as long as possible. A rear-facing seat may only go on a seat with an airbag if the airbag is switched off. Never use a belt extender with a child seat.",
       why:"An airbag that fires against a rear-facing seat can hurt the child.", src:SRC.roZitje},
      {scene:"beltFine", h:"Who gets the fine",
       t:"If a child under 12 is not secured as required, you, the driver, get the fine. Older children get their own fine if they do not use the belt.",
       why:"The driver decides who rides and how, so the driver is responsible.", src:SRC.roGordel}
    ],
    "Vehicle condition": [
      {scene:"tyreDepth", h:"Tyres: 1.6 mm of tread, all the way round",
       t:"The main grooves must be at least 1.6 mm deep around the whole tyre. A tyre with a bulge, or with damage that shows the cords, fails the APK. Check the pressure every month.",
       why:"Worn tread grips less on a wet road, and the right pressure gives more grip and a shorter braking distance.", src:SRC.rdwTips},
      {scene:"apkWhen", h:"The APK: when to go",
       t:"A petrol or electric car goes for its first APK at 4 years, then every 2 years until it is 8, then every year. A diesel or gas car goes at 3 years, then every year. You may go up to 2 months early and keep your date.",
       why:"The APK is a snapshot of the day, not a promise for the year, so keep checking tyres and lights yourself.", src:SRC.rdwApk},
      {scene:"lightsCheck", h:"Lights and wipers: check them yourself",
       t:"Check your lights, brake lights and reversing lights regularly. Use front fog lights when you can see less than 200 m, and the rear fog light below 50 m. Replace wipers before they look worn and keep the washer fluid topped up.",
       why:"You need to see and be seen, and lights and wipers are how you do both.", src:SRC.rdwTips}
    ],
    "Safety": [
      {scene:"safeHorn", h:"Horn and headlights: only to warn of danger",
       t:"You may only sound your horn or flash your headlights to warn of an emergency. Not to say hello, and not to hurry someone up.",
       why:"If the horn were used for chat, a real warning would get lost.", src:SRC.gov(30)},
      {scene:"safeTriangle", h:"Broken down: the warning triangle",
       t:"If your stopped car could be a danger to approaching traffic, put a warning triangle on the road about 30 m behind it, facing the traffic. You do not need it when your hazard lights flash.",
       why:"Approaching drivers need time to see you and slow down.", src:SRC.gov(37)},
      {scene:"safeTow", h:"Towing: no more than 5 m between the cars",
       t:"When you tow another vehicle, the gap between the back of your car and the front of the towed car may not be more than 5 m.",
       why:"A short, visible link keeps the two cars moving as one.", src:SRC.gov(36)},
      {scene:"safeBoot", h:"Nobody rides in the boot or the back of a van",
       t:"Passengers may not travel in the boot or in the loading space of a van or pick-up, open or closed, and not in or on a trailer. Everyone sits in a seat.",
       why:"A loading space has no seat and no belt, so in a crash nothing holds you.", src:SRC.gov(40)},
      {scene:"safeCrash", h:"After a crash: stay at the scene",
       t:"If you are involved in a crash, you may not just drive off. Stay until everyone's identity and the cars involved are known, and nobody who is hurt is left without help.",
       why:"The people involved need to know who to contact, and anyone injured needs help first.", src:SRC.gov(21)}
    ],
    "Road markings": [
      {scene:"overtake", h:"Solid line: don't cross it. Broken line: you may, when safe",
       t:"A solid line that is not along the edge of the road may not be crossed. That goes for a centre line and for a line between two lanes going the same way, so you can't change lanes across it either. A broken line you may cross when it is safe. With a double line, the line on your side counts: broken on your side means you may cross.",
       why:"Solid lines are painted where crossing is not safe, for example where you can't see far enough ahead to overtake.", src:SRC.gov(46)},
      {scene:"peakOpen", h:"When you may cross a solid line",
       t:"You may cross it to get into or out of an open peak-hour lane (spitsstrook), the hard shoulder or an emergency bay beside your lane. The hard shoulder is still for emergencies only. Cyclists and moped riders may cross the solid line next to their cycle lane to use it.",
       why:"The line keeps traffic in its lane, not out of a lane that is meant to be used.", src:SRC.gov(46)},
      {scene:"cycleLane", h:"A cycle lane is not a place to stop",
       t:"You may not stop on a cycle lane (fietsstrook) or cycle track, not even for a moment to let someone out. Find a place beside the road where stopping is allowed.",
       why:"A car on the cycle lane pushes cyclists out into the traffic.", src:SRC.gov(29)},
      /* the English booklet (page 29) calls both yellow lines 'continuous'; the Dutch text of art. 24 says broken (onderbroken), so cite that */
      {scene:"yellowKerb", h:"Yellow line at the kerb: solid means no stopping, broken means no parking",
       t:"Along a solid yellow line you may not stop at all. Along a broken yellow line you may not park, but you may stop briefly to let someone in or out, or to load and unload.",
       why:"The solid line keeps the kerb completely clear. The broken line only stops cars being left there.", src:SRC.rvv24},
      {scene:"laneArrow", h:"Follow your lane arrow, and stop behind the stop line",
       t:"At a junction you must go the way the arrow in your lane points. In a left-turn lane you turn left, even if you wanted to go straight on. At a STOP sign you stop behind the stop line.",
       why:"Drivers around you plan their moves on the lane you chose, so a late swerve takes them by surprise.", src:SRC.gov(46)},
      {scene:"busLane", h:"BUS and LIJNBUS lanes: not for your car",
       t:"A lane with BUS painted on the road is for scheduled buses, coaches and trams. LIJNBUS is stricter: only scheduled buses and trams.",
       why:"Public transport keeps its own lane so it can run on time through traffic jams.", src:SRC.gov(46)},
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
      {scene:"trailerMax", h:"With a trailer or caravan: 90 at most",
       t:"A car towing a trailer or caravan (up to 3,500 kg) may go at most 90 km/h on a motorway and an autoweg, 80 on other roads outside town and 50 in town. A sign showing 100 or 130 does not change that.",
       why:"A trailer makes the car longer, heavier and less stable, so it needs more room to brake and steer.", src:SRC.gov(28)},
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
       why:"The limit is the law. The advice tells you the speed that suits the road there.", src:SRC.gov(7)},
      {scene:"prioSigns", h:"Priority signs: the yellow diamond and its friends",
       t:"On a priority road (B1, yellow diamond) traffic from side roads gives way to you, even from your right, until the same diamond with stripes ends it (B2). A triangle with a cross (B3) gives you priority at the next junction only. A triangle with a thick and a thin road (B4) means the side road gives way to you at this junction.",
       why:"Without these signs, traffic from the right goes first, so you need to know when they switch that off.", src:SRC.gov(7)},
      {scene:"endSigns", h:"Grey stripes or a red line: the rule ends here",
       t:"A sign with grey or black stripes, or a red line through it, ends what an earlier sign started. The end of a speed limit (A2) means the normal limit for that road applies again, not that there is no limit. F8 ends all bans set by signs. G2 ends the motorway.",
       why:"After the end sign, the general rules for that kind of road take over.", src:SRC.gov(10)},
      {scene:"amberLight", h:"Amber means stop",
       t:"An amber light means stop. Drive on only if you are so close that you can no longer stop safely.",
       why:"Amber is the last warning before red, not a signal to speed up.", src:SRC.gov(44)}
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
       why:"Signs and matrix signs adjust the limit to the road, the time of day and the traffic.", src:SRC.speedRules},
      {scene:"matrixLanes", h:"Signs above your lane: red cross, white arrow, green arrow",
       t:"A red cross above a lane closes it: don't drive in it. A white arrow is the first warning that a red cross is coming, so move over the way it points. A green arrow, or a speed, means the lane is open.",
       why:"The signs clear a lane well before an accident or roadworks, so everyone has time to move over.", src:SRC.gov(45)},
      {scene:"minSpeed", h:"Only for vehicles that can go fast enough",
       t:"A motorway is only for vehicles that can drive faster than 60 km/h. An autoweg (expressway) is only for vehicles that can drive faster than 50 km/h. Slower vehicles may not use them.",
       why:"A vehicle much slower than the traffic around it is a danger on a fast road.", src:SRC.gov(34)},
      {scene:"lorryLanes", h:"Lorries keep to the two right-hand lanes",
       t:"On a motorway with three or more lanes, lorries and vehicles with a trailer that are longer than 7 m together may only use the two right-hand lanes, except when they need to get in lane for an exit or a junction.",
       why:"It keeps the slow, heavy traffic together and leaves the left lane for overtaking.", src:SRC.gov(35)}
    ]
  },
  /* the €385 eigen risico applies to 2026 and 2027: recheck every year */
  civic: {
    "Listening": [
      {scene:"halfTen", h:"Half tien is 9:30, not 10:30",
       t:"Dutch counts the half hour towards the next hour. Half tien is half an hour before ten, so 9:30. Half drie is 2:30.",
       say:[["half tien", "9:30"], ["half drie", "2:30"], ["om half acht", "at 7:30"]],
       why:"English counts from the hour you are in. Dutch looks ahead to the next one.", src:SRC.clock},
      {scene:"quarters", h:"Kwart over and kwart voor",
       t:"Kwart is a quarter of an hour. Kwart over zeven is 7:15. Kwart voor acht is 7:45.",
       say:[["kwart over zeven", "7:15"], ["kwart voor acht", "7:45"]],
       why:"Over means past, voor means to: the same idea as in English.", src:SRC.clock},
      {scene:"tienVoorHalf", h:"From 20 past, count from the half hour",
       t:"Between 20 past and 20 to, Dutch counts from the half hour. Tien voor half drie is 2:20. Vijf over half drie is 2:35.",
       say:[["tien voor half drie", "2:20"], ["vijf over half drie", "2:35"]],
       why:"Dutch uses whichever point is closest: the full hour or the half hour.", src:SRC.clock},
      {scene:"unitsFirst", h:"Numbers: the units come first",
       t:"From 21 to 99 you hear the units first, then en, then the tens. Vierenzestig is 64: four and sixty. When you write a number down, wait for the tens.",
       say:[["eenentwintig", "21"], ["vierenzestig", "64"], ["achtennegentig", "98"]],
       why:"Hearing vier first makes you want to write 4 at the front. The tens come last.", src:SRC.numbers}
    ],
    "Grammar": [
      {scene:"verbSecond", h:"The verb is always in second place",
       t:"In a normal sentence the verb comes second: Ik werk morgen. If you start with another word, the verb stays second and the subject moves behind it: Morgen werk ik.",
       say:[["Ik werk morgen.", "I work tomorrow."], ["Morgen werk ik.", "Tomorrow I work."]],
       why:"Keep the verb in place 2 and the other words can move around it.", src:SRC.wordOrder},
      {scene:"verbFirst", h:"Yes/no questions start with the verb",
       t:"To ask a yes or no question, put the verb first: Werk je morgen? Heb je tijd?",
       say:[["Werk je morgen?", "Do you work tomorrow?"], ["Heb je tijd?", "Do you have time?"]],
       why:"Dutch has no do or does for questions. Moving the verb to the front does that job.", src:SRC.inversion},
      {scene:"geenNiet", h:"Geen before a noun, niet for the rest",
       t:"Use geen for not a or no before a noun: Ik heb geen auto. Use niet for everything else: Ik werk vandaag niet.",
       say:[["Ik heb geen auto.", "I don't have a car."], ["Ik werk vandaag niet.", "I'm not working today."]],
       why:"Geen is the no-form of een, so it goes where een or a plural noun would go.", src:SRC.nietGeen},
      {scene:"deHet", h:"De or het: two rules that always work",
       t:"Every plural takes de: de huizen. Every small word ending in -je takes het: het huisje, het meisje. For other words, learn the article together with the word.",
       say:[["het huis, de huizen", "the house, the houses"], ["het meisje", "the girl"]],
       why:"Most words have no rule, so these two save you from guessing.", src:SRC.deHet}
    ],
    "Reading": [
      {scene:"questionFirst", h:"Read the question first, then find the answer",
       t:"In the A2 reading exam you read short texts on a computer and answer questions about them, in 65 minutes. Read the question first, then look in the text only for what it asks. You don't need to know every word.",
       why:"Looking for one thing is much faster than trying to understand everything.", src:SRC.a2exams},
      {scene:"smallWords", h:"Small words that change everything",
       t:"Notices often turn on one small word. Niet and geen mean not. Wel means it does. Verplaatst means moved, gaat niet door means is cancelled. Vanaf means from, tot means until.",
       say:[["De les gaat niet door.", "The class is cancelled."], ["De afspraak is verplaatst.", "The appointment has been moved."], ["Open vanaf negen uur tot vijf uur.", "Open from nine until five."]],
       why:"Exam questions often test exactly these words, because they flip the meaning.", src:SRC.a2exams}
    ],
    "Government": [
      {scene:"kingMinisters", h:"A king, but parliament decides",
       t:"The Netherlands is a constitutional monarchy. The King is head of state, but the ministers are responsible for what the government does, and they answer to parliament.",
       why:"The King cannot be held to account, so the ministers who can be are the ones who decide.", src:SRC.ministers},
      {scene:"twoChambers", h:"Two chambers: 150 and 75 seats",
       t:"The Tweede Kamer has 150 members and you elect them directly. It debates bills and can change them (amend). The Eerste Kamer has 75 members, chosen by the members of the Provinciale Staten. It can only accept or reject a bill as a whole.",
       why:"The Tweede Kamer does the real work on a law. The Eerste Kamer is a last check.", src:SRC.parliament},
      {scene:"whoVotes", h:"Who may vote",
       t:"For the Tweede Kamer you must be Dutch and 18 or older. For the gemeenteraad (municipal council) EU citizens living there may vote too, and people from outside the EU after 5 years of legal residence.",
       why:"Your town affects your daily life, so you get a say there before you become Dutch.", src:SRC.voteLocal},
      {scene:"everyYears", h:"Elections: every 4 or 5 years",
       t:"The gemeenteraad is elected every 4 years, and so is the Tweede Kamer in a normal term. The Dutch members of the European Parliament are elected every 5 years.",
       why:"Knowing the rhythm helps you spot the odd one out: Europe is the 5.", src:SRC.localEvery4},
      {scene:"mayorCrown", h:"The burgemeester is appointed",
       t:"You do not elect your burgemeester (mayor). The gemeenteraad recommends a candidate and the Crown (the King and a minister) appoints them, for 6 years.",
       why:"It surprises many newcomers, so exams like to ask it.", src:SRC.mayor},
      {scene:"article1", h:"Article 1: everyone is treated equally",
       t:"Article 1 of the Grondwet (constitution) says everyone in the Netherlands is treated equally in equal cases. Discrimination because of religion, belief, politics, race, sex or anything else is not allowed. A landlord who refuses you because of your background breaks this rule.",
       why:"It is the first article on purpose: the rest of the law builds on it.", src:SRC.article1}
    ],
    "Housing": [
      {scene:"depositMax", h:"A deposit (borg) is at most 2 months' rent",
       t:"For a rental contract signed from 1 July 2023, the landlord may ask a deposit (borg) of at most 2 months of kale huur: the rent without service costs.",
       why:"A higher deposit is against the rules, so you can say no to it.", src:SRC.deposit},
      {scene:"whoRepairs", h:"Small jobs are yours, big repairs are the landlord's",
       t:"As a tenant you do the small daily jobs, like a new washer (leertje) in a dripping tap or a new toilet seat. Big repairs, like a broken window, are for the landlord.",
       why:"Small things wear out from normal use, so they are yours. The building itself is the landlord's.", src:SRC.repairs},
      {scene:"registered", h:"Landlord not fixing it? Write first",
       t:"First send your landlord a letter or e-mail listing what is broken, and ask for it to be repaired within 6 weeks. If nothing happens, you can go to the Huurcommissie.",
       why:"A letter or e-mail proves you reported it, which you need if you go to the Huurcommissie later.", src:SRC.repairWrite},
      {scene:"whoRepairs", h:"Smoke alarms: the landlord puts them in",
       t:"Every floor with a living room, bedroom or kitchen needs a smoke alarm. In a rented home, the owner or landlord must put them in.",
       why:"Smoke alarms save lives, so the law makes the owner responsible, not the tenant.", src:SRC.smoke},
      {scene:"rentOnce", h:"The rent goes up at most once a year",
       t:"Your landlord may raise the rent once every 12 months, usually on 1 July. Huurtoeslag (rent benefit) comes from Dienst Toeslagen, part of the Belastingdienst, not from your landlord.",
       why:"Twice in one year is usually not allowed, and you can object to it.", src:SRC.rentRise},
      {scene:"registered", h:"Ending your rental: send a registered letter",
       t:"To end your rental, send your landlord an aangetekende brief (registered letter). You get proof that it arrived. Usually you give 1 month's notice.",
       why:"With proof of the date, nobody can say you gave notice too late.", src:SRC.rentEnd}
    ],
    "Education": [
      {scene:"schoolAges", h:"School is compulsory from 5",
       t:"Children must go to school from age 5 to 16 (leerplicht). Most start at 4. From 16 to 18 they must keep learning until they have a havo, vwo or mbo level 2 diploma (startkwalificatie).",
       why:"Without a basic diploma it is much harder to find work, so the law keeps young people learning until they have one.", src:SRC.schoolAge},
      {scene:"schoolTracks", h:"Three secondary tracks: vmbo, havo, vwo",
       t:"Secondary school has three main tracks. Vmbo takes 4 years and leads to mbo. Havo takes 5 years and leads to a hogeschool. Vwo takes 6 years and prepares for university.",
       why:"The track a child takes decides which studies are open later.", src:SRC.tracks},
      {scene:"askDirector", h:"Holiday outside school holidays? Ask the director",
       t:"Only if your work means you cannot go away in any school holiday, ask the school director for permission, at least 8 weeks before. Without permission, taking your child out of school is not allowed.",
       why:"School time is protected by law. The director decides on the exceptions.", src:SRC.schoolLeave},
      {scene:"parentFee", h:"The parents' contribution is voluntary",
       t:"Schools may ask a vrijwillige ouderbijdrage (voluntary parents' contribution) for extras like a school trip. You do not have to pay it, and the school may not leave your child out if you don't.",
       why:"Every child should be able to join in, whatever the parents can pay.", src:SRC.parentFee},
      {scene:"schoolTracks", h:"Student finance comes from DUO",
       t:"Students at an mbo, hogeschool or university apply for studiefinanciering (student finance) at DUO.",
       why:"DUO handles both student money and the integration exams, so you will meet it more than once.", src:SRC.studyGrant}
    ],
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
window.LESSON_ORDER = {drive:["Priority", "Signs", "Road markings", "Speed limits", "Distances", "Lane use", "Stopping & parking", "Lights & visibility", "Railway crossings", "Motorway", "Seatbelts", "Mobile phones", "Alcohol limit", "Vehicle condition", "Safety", "Hazard perception"], civic:["Listening", "Reading", "Grammar", "Administration", "Healthcare", "Work life", "Housing", "Education", "Government"]};
/* exam-section topics that share a lesson with a skill */
window.LESSON_ALIAS = {civic:{"A2 Luisteren":"Listening", "A2 Lezen":"Reading", "A2 Schrijven":"Grammar", "Writing":"Grammar", "Elections":"Government"}};
window.LESSON_SCENE = function(id){ return SCENES[id] ? SCENES[id]() : ""; };
})();
