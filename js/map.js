/* Top-down pictures for driving questions: the junction or road from above, your blue car marked "You",
   the other road users, and arrows for where each one is going. Static: it shows the situation, never the answer.
   Same look as the lesson scenes (css .sc-*). Traffic drives on the right. Each question has a `map` spec:
   {g:"cross"|"tee"|"road"|"lanes"|"round"|"motor"|"exit"|"zip", items:[...], plus ground options}.
   An item sits at a junction arm (at:"S" you, "N" oncoming, "W" from your left, "E" from your right)
   or at x,y with heading r (0 = up, 90 = right). go:"straight"|"left"|"right" or path:"M.." draws its arrow. */
(function(){
"use strict";
var C = 100, ARM = {S:[115, 162, 0], E:[162, 85, -90], N:[85, 38, 180], W:[38, 115, 90]};
var ROT = {S:0, W:90, N:180, E:-90};
var GO = {straight:"M0 -20V-118", left:"M0 -20V-50Q0 -77 -27 -77H-82", right:"M0 -20V-33Q0 -47 14 -47H52",
  uturn:"M0 -20V-46Q0 -62 -20 -62Q-40 -62 -40 -42V0", reverse:"M0 20V70"};
var uid = 0;
function n(v){ return Math.round(v * 10) / 10; }
function g(tf, inner){ return '<g transform="' + tf + '">' + inner + "</g>"; }
function turn(dir, inner){ return ROT[dir] ? g("rotate(" + ROT[dir] + " " + C + " " + C + ")", inner) : inner; }

/* ---- road users, drawn around 0,0 facing up ---- */
var SHAPE = {
  car: function(c){ return '<rect x="-8" y="-14" width="16" height="28" rx="4" class="sc-car ' + c + '"/><rect x="-6" y="-9" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  police: function(){ return SHAPE.car("c-police") + '<rect x="-6" y="-2" width="5" height="3" class="sc-bluelight"/><rect x="1" y="-2" width="5" height="3" class="sc-bluelight"/>'; },
  bus: function(c){ return '<rect x="-9" y="-24" width="18" height="48" rx="3" class="sc-car ' + (c || "c-bus") + '"/><rect x="-7" y="-21" width="14" height="6" rx="1.5" class="sc-glass"/>'; },
  truck: function(c){ return '<rect x="-9" y="-22" width="18" height="44" rx="3" class="sc-car ' + (c || "c-truck") + '"/><rect x="-7" y="-19" width="14" height="7" rx="1.5" class="sc-glass"/>'; },
  tram: function(){ return '<rect x="-8" y="-34" width="16" height="68" rx="5" class="sc-car c-tram"/><rect x="-6" y="-29" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  bike: function(){ return '<g transform="scale(1.4)"><rect x="-1.5" y="-10" width="3" height="20" rx="1.5" class="sc-bike"/><circle cx="0" cy="1" r="4.5" class="sc-rider"/></g>'; },
  ped: function(c){ return '<circle r="6.5" class="sc-kid ' + (c || "") + '"/>'; },
  blind: function(){ return '<circle r="6.5" class="sc-kid"/><path class="sc-cane" d="M4 4L13 15"/>'; },
  officer: function(){ return '<circle r="6" class="sc-officer"/><path class="sc-arm" d="M-12 0H12"/>'; }
};
/* the arrow head, drawn at the end of a path */
function arrow(d, cls){
  var id = "mk" + (++uid);
  return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" class="' + cls + '-h"/></marker></defs>' +
    '<path class="mp-halo" d="' + d + '"/><path class="' + cls + '" d="' + d + '" marker-end="url(#' + id + ')"/>';
}
function place(it){
  if (it.at && ARM[it.at]){ var a = ARM[it.at]; return [it.x != null ? it.x : a[0], it.y != null ? it.y : a[1], it.r != null ? it.r : a[2]]; }
  return [it.x, it.y, it.r || 0];
}
function item(it){
  var p = place(it), you = !!it.you, kind = it.k || "car", out = "";
  var cls = you ? "mp-you" : "mp-go";
  if (it.go && GO[it.go]) out += g("translate(" + n(p[0]) + " " + n(p[1]) + ") rotate(" + p[2] + ")", arrow(GO[it.go], cls));
  if (it.path) out += arrow(it.path, cls);
  var body = SHAPE[kind] ? SHAPE[kind](you ? "c-you" : (it.c || "c-red")) : "";
  if (it.tow) body = '<rect x="-9" y="20" width="18" height="30" rx="3" class="sc-car c-parked"/><path class="sc-post" d="M0 14V20"/>' + body;
  if (it.blink) body += '<rect class="sc-ind mp-blink" x="' + (it.blink === "left" ? -9 : 5) + '" y="' + (kind === "bus" ? -26 : -16) + '" width="4" height="4" rx="1"/>';
  out += g("translate(" + n(p[0]) + " " + n(p[1]) + ") rotate(" + p[2] + ")", body);
  var lbl = you ? "You" : it.lbl;
  if (lbl){ var below = kind === "bus" || kind === "truck" ? 34 : (kind === "tram" ? 46 : (kind === "car" || kind === "police" ? 27 : 17)), ly = p[1] + (Math.abs(p[2]) === 90 ? 18 : below);
    if (it.lblUp) ly = p[1] - (Math.abs(p[2]) === 90 ? 12 : below - 6);
    /* no room below: put the label beside it */
    if (ly > 194 || it.lblSide) out += '<text class="sc-label" style="text-anchor:start" x="' + n(p[0] + 14) + '" y="' + n(p[1] + 4) + '">' + lbl + "</text>";
    else out += '<text class="sc-label" x="' + n(p[0]) + '" y="' + n(ly) + '">' + lbl + "</text>"; }
  return out;
}

/* ---- ground ---- */
function teeth(dir, dist){
  var s = ""; for (var x = 103; x < 129; x += 6.5) s += '<path class="sc-teeth" d="M' + x + " " + (C + dist) + "L" + (x + 5) + " " + (C + dist) + "L" + (x + 2.5) + " " + (C + dist + 7) + 'Z"/>';
  return turn(dir, s);
}
/* shark teeth along any line, tips pointing to one side (side 1 or -1) */
function teethLine(x1, y1, x2, y2, side){
  var L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, vx = -uy * side, vy = ux * side, s = "";
  for (var t = 0; t + 5 <= L; t += 6.5){ var ax = x1 + ux * t, ay = y1 + uy * t;
    s += '<path class="sc-teeth" d="M' + n(ax) + " " + n(ay) + "L" + n(ax + ux * 5) + " " + n(ay + uy * 5) + "L" + n(ax + ux * 2.5 + vx * 7) + " " + n(ay + uy * 2.5 + vy * 7) + 'Z"/>'; }
  return s;
}
function pedLight(x, y, col){ return '<rect class="mp-lbox" x="' + (x - 5) + '" y="' + (y - 9) + '" width="10" height="18" rx="2.5"/><circle class="' + (col === "red" ? "mp-l-red" : "mp-l-off") + '" cx="' + x + '" cy="' + (y - 4) + '" r="3"/><circle class="' + (col === "green" ? "mp-l-green" : "mp-l-off") + '" cx="' + x + '" cy="' + (y + 4) + '" r="3"/><circle class="sc-kid" cx="' + (x + 11) + '" cy="' + y + '" r="3"/>'; }
function zebraAcross(dir, dist, x1, x2){ var s = ""; for (var x = x1 + 2; x < x2 - 3; x += 9) s += '<rect class="sc-zebra" x="' + x + '" y="' + (C + dist) + '" width="5" height="16"/>'; return turn(dir, s); }
function signAt(dir, kind, dist){
  var sv = window.DRIVE && DRIVE.signSvg ? DRIVE.signSvg(kind) : ""; if (!sv) return "";
  /* signs stay upright: place by the arm, without rotating the drawing */
  var a = {S:[146, C + (dist || 40)], E:[C + (dist || 40), 54], N:[54, C - (dist || 40)], W:[C - (dist || 40), 146]}[dir];
  return '<path class="sc-post" d="M' + a[0] + " " + (a[1] + 6) + "V" + (a[1] + 16) + '"/>' + sv.replace("<svg ", '<svg x="' + (a[0] - 9) + '" y="' + (a[1] - 9) + '" width="18" height="18" ');
}
function lightAt(dir, dist){ return {S:[140, C + (dist || 38)], E:[C + (dist || 38), 60], N:[60, C - (dist || 38)], W:[C - (dist || 38), 140]}[dir]; }
function light(a, col){
  var on = function(c, i){ var lit = col === c || (col === "blink" && c === "amber"); return '<circle class="' + (lit ? "mp-l-" + c + (col === "blink" ? " mp-blink" : "") : "mp-l-off") + '" cx="' + a[0] + '" cy="' + (a[1] - 8 + i * 8) + '" r="3"/>'; };
  return '<rect class="mp-lbox" x="' + (a[0] - 5) + '" y="' + (a[1] - 13) + '" width="10" height="26" rx="2.5"/>' + ["red", "amber", "green"].map(on).join("");
}
var GROUND = {
  cross: function(o){
    var s = '<rect class="sc-road" x="70" y="0" width="60" height="200"/><rect class="sc-road" x="0" y="70" width="200" height="60"/>';
    if (o.cycle) s += '<rect class="sc-cyclelane" x="136" y="0" width="12" height="200"/><path class="mp-cross" d="M136 70V130M148 70V130"/>';
    s += '<path class="sc-dash" d="M100 0V68M100 132V200M0 100H68M132 100H200"/>';
    if (o.rails) s += '<path class="sc-rail" d="M0 111H200M0 119H200"/>';
    return s;
  },
  /* a side road (yours, from the bottom) meeting a through road; from: what you come out of */
  tee: function(o){
    var surf = {unpaved:"mp-unpaved", drive:"sc-drive", woonerf:"mp-brick", exit:"mp-brick"}[o.from] || "sc-road";
    var s = '<rect class="sc-road" x="0" y="70" width="200" height="60"/><path class="sc-dash" d="M0 100H200"/><rect class="' + surf + '" x="85" y="130" width="60" height="70"/>';
    if (o.from === "exit") s += '<rect class="mp-pave" x="0" y="130" width="200" height="10"/><rect class="mp-brick" x="85" y="130" width="60" height="10"/><path class="mp-kerbline" d="M85 130H145"/>';
    else if (o.from !== "unpaved") s += '<path class="sc-kerb" d="M85 131H145"/>';
    if (o.where) s += '<text class="sc-mark" x="160" y="' + (o.from === "exit" ? 168 : 160) + '" style="text-anchor:middle">' + o.where + "</text>";
    return s;
  },
  /* a straight two-way road going up: your lane x=120, oncoming x=80 */
  road: function(o){
    var s = '<rect class="sc-road" x="60" y="0" width="80" height="200"/>';
    if (o.park) s += '<rect class="sc-drive" x="140" y="0" width="24" height="200"/>' + (o.park === "both" ? '<rect class="sc-drive" x="36" y="0" width="24" height="200"/>' : "");
    if (o.stop) s += '<path class="sc-road" d="M140 50L156 62V120L140 132Z"/><text class="sc-mark" x="174" y="150" style="text-anchor:middle">Bus stop</text>';
    if (o.rails) s += '<path class="sc-rail" d="M96 0V200M104 0V200"/>'; else s += o.centre === "solid" ? '<path class="sc-solid" d="M100 0V200"/>' : '<path class="sc-dash" d="M100 0V200"/>';
    if (o.kerb) s += '<rect class="sc-drive" x="140" y="0" width="16" height="200"/><path class="mp-kerb-' + o.kerb + '" d="M137 0V200"/>';
    return s;
  },
  /* three lanes in your direction (x=80, 120, 160) */
  lanes3: function(){ return '<rect class="sc-road" x="40" y="0" width="140" height="200"/><path class="sc-dash" d="M86 0V200M134 0V200"/><path class="sc-solid" d="M42 0V200"/>'; },
  /* motorway with a peak-hour lane on the right, behind a solid line */
  peak: function(){ return '<rect class="sc-road" x="50" y="0" width="134" height="200"/><path class="sc-dash" d="M96 0V200"/><path class="sc-solid" d="M52 0V200M140 0V200"/>'; },
  /* a level crossing: road going up, tracks across */
  rail: function(o){
    var s = '<rect class="sc-road" x="60" y="0" width="80" height="200"/><path class="sc-dash" d="M100 0V78M100 122V200"/><rect class="mp-ballast" x="0" y="86" width="200" height="28"/>';
    for (var x = 4; x < 200; x += 12) s += '<rect class="sc-sleeper" x="' + x + '" y="88" width="5" height="24"/>';
    s += '<path class="sc-rail" d="M0 94H200M0 106H200"/>';
    /* barriers standing up beside the road, lights flashing */
    s += '<rect class="mp-barrier" x="146" y="118" width="4" height="34" rx="2"/><rect class="mp-barrier" x="50" y="48" width="4" height="34" rx="2"/>';
    s += '<rect class="mp-lbox" x="152" y="126" width="16" height="9" rx="2"/><circle class="mp-l-red mp-blink" cx="156" cy="130.5" r="3"/><circle class="mp-l-red mp-blink2" cx="164" cy="130.5" r="3"/>';
    s += '<rect class="mp-lbox" x="32" y="66" width="16" height="9" rx="2"/><circle class="mp-l-red mp-blink" cx="36" cy="70.5" r="3"/><circle class="mp-l-red mp-blink2" cx="44" cy="70.5" r="3"/>';
    return s;
  },
  /* two lanes in your direction */
  lanes: function(){ return '<rect class="sc-road" x="60" y="0" width="80" height="200"/><path class="sc-dash" d="M100 0V200"/>'; },
  round: function(o){
    var s = '<rect class="sc-road" x="70" y="0" width="60" height="200"/><rect class="sc-road" x="0" y="70" width="200" height="60"/>';
    if (o.cycle) s += '<circle class="mp-cring" cx="100" cy="100" r="66"/>';
    s += '<circle class="sc-road" cx="100" cy="100" r="46"/><circle class="mp-island" cx="100" cy="100" r="18"/>';
    s += '<path class="sc-dash" d="M100 200V148M100 0V52M0 100H52M200 100H148"/>';
    return s;
  },
  /* motorway going up (lanes x=90 and x=130) with an on-ramp joining from the right */
  motor: function(){ return '<rect class="sc-road" x="70" y="0" width="80" height="200"/><path class="sc-road" d="M150 200V95L150 50L178 95V200Z"/><path class="sc-dash" d="M110 0V200M150 100V200"/><path class="sc-solid" d="M70 0V200"/>'; },
  /* motorway with an exit lane leaving to the right */
  exit: function(){ return '<rect class="sc-road" x="70" y="0" width="80" height="200"/><path class="sc-road" d="M150 165L178 120V78Q178 48 200 34V2Q160 22 150 70Z"/><path class="sc-dash" d="M110 0V200M150 72V140"/><path class="sc-solid" d="M70 0V200"/>'; },
  /* your lane (left) ends; merge into the right lane */
  zip: function(){ return '<rect class="sc-road" x="100" y="0" width="40" height="200"/><path class="sc-road" d="M60 200V95L100 55V200Z"/><path class="sc-dash" d="M100 98V200"/>'; }
};

window.KLAAR_MAP = function(m){
  if (!m || !GROUND[m.g]) return "";
  var s = GROUND[m.g](m), extra = "";
  (m.teeth || []).forEach(function(d){ extra += teeth(d, m.g === "round" ? 48 : 32); });
  if (m.cteeth) m.cteeth.forEach(function(d){ extra += teeth(d, 61); });
  (m.signs || []).forEach(function(x){ extra += signAt(x[0], x[1], m.g === "round" ? 60 : 40); });
  (m.zebra || []).forEach(function(z){ extra += m.g === "road" ? zebraAcross("S", z - C, 60, 140) : zebraAcross(z, 33, 70, 130); });
  (m.lights || []).forEach(function(x){ extra += typeof x[0] === "number" ? light([x[0], x[1]], x[2]) : light(lightAt(x[0], x[2]), x[1]); });
  (m.plights || []).forEach(function(x){ extra += pedLight(x[0], x[1], x[2]); });
  (m.tline || []).forEach(function(x){ extra += teethLine.apply(null, x); });
  (m.matrix || []).forEach(function(b){ var x = b[0];
    extra += '<rect class="mp-mx" x="' + (x - 13) + '" y="6" width="26" height="22" rx="3"/>' +
      (b[1] === "x" ? '<path class="mp-mx-x" d="M' + (x - 6) + ' 11L' + (x + 6) + ' 23M' + (x + 6) + ' 11L' + (x - 6) + ' 23"/>' :
       '<path class="' + (b[1] === "green" ? "mp-mx-g" : "mp-mx-a") + '" d="M' + x + ' 24V11M' + (x - 5) + ' 16L' + x + ' 11L' + (x + 5) + ' 16"/>'); });
  if (m.note) extra += '<rect class="mp-note" x="6" y="6" width="' + (m.note.length * 5.6 + 12) + '" height="18" rx="9"/><text class="mp-notet" x="12" y="18.5">' + m.note + "</text>";
  var items = (m.items || []).map(item).join("");
  return '<svg class="mp" viewBox="0 0 200 200" role="img" aria-hidden="true"><rect class="sc-bg" width="200" height="200"/>' + s + extra + items + "</svg>";
};
})();
