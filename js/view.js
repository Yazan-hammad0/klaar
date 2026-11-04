/* Driver's-eye pictures for hazard-perception questions: the road ahead through the windscreen, in perspective.
   Everything is placed in metres (X = metres to the right of you, d = metres ahead, Y = metres up), so a ball at
   15 m looks like a ball at 15 m. The picture shows the situation only, never the answer. Right-hand traffic. */
(function(){
"use strict";
var W = 320, HOR = 70, F = 520, CH = 1.25, NEAR = 3.2, FAR = 600;
function sx(X, d){ return W / 2 + F * X / d; }
function sy(d, Y){ return HOR + F * (CH - (Y || 0)) / d; }
function n(v){ return Math.round(v * 10) / 10; }
function pt(X, d, Y){ return n(sx(X, d)) + " " + n(sy(d, Y)); }
/* a flat strip on the ground between X1 and X2, from d1 to d2 */
function band(cls, X1, X2, d1, d2){ return '<path class="' + cls + '" d="M' + pt(X1, d1) + "L" + pt(X2, d1) + "L" + pt(X2, d2) + "L" + pt(X1, d2) + 'Z"/>'; }
/* a wall standing along the road at X, from d1 to d2, h metres tall */
function wall(cls, X, d1, d2, h){ return '<path class="' + cls + '" d="M' + pt(X, d1) + "L" + pt(X, d2) + "L" + pt(X, d2, h) + "L" + pt(X, d1, h) + 'Z"/>'; }
function dashes(X, from, to, len, gap){ var s = ""; for (var d = from; d < to; d += len + gap) s += band("dv-line", X - 0.07, X + 0.07, Math.max(d, NEAR), Math.min(d + len, to)); return s; }
/* an upright object drawn in metres around its foot point, scaled for its distance */
function at(X, d, inner){ var k = F / d; return '<g transform="translate(' + n(sx(X, d)) + " " + n(sy(d)) + ") scale(" + (Math.round(k * 1000) / 1000) + ')">' + inner + "</g>"; }

/* ---- things, drawn in metres, foot at 0,0, up is negative y ---- */
var LAMP = 0.16;
function carRear(c, o){
  o = o || {};
  var lit = o.brake ? "dv-brake" : "dv-tail", ind = '<rect class="dv-ind" x="' + (o.blink === "left" ? -0.9 : 0.62) + '" y="-0.95" width="0.28" height="0.14"/>';
  return '<rect class="dv-shadow" x="-1" y="-0.08" width="2" height="0.16" rx="0.08"/><rect class="dv-car ' + c + '" x="-0.9" y="-1.45" width="1.8" height="1.25" rx="0.22"/>' +
    '<rect class="dv-glass" x="-0.72" y="-1.38" width="1.44" height="0.42" rx="0.12"/><rect class="dv-tyre" x="-0.86" y="-0.28" width="0.34" height="0.28"/><rect class="dv-tyre" x="0.52" y="-0.28" width="0.34" height="0.28"/>' +
    '<rect class="' + lit + '" x="-0.86" y="-0.82" width="0.36" height="' + LAMP + '"/><rect class="' + lit + '" x="0.5" y="-0.82" width="0.36" height="' + LAMP + '"/>' +
    (o.hazard ? '<rect class="dv-ind" x="-0.9" y="-0.98" width="0.28" height="0.14"/><rect class="dv-ind" x="0.62" y="-0.98" width="0.28" height="0.14"/>' : (o.blink ? ind : "")) +
    (o.brake ? '<rect class="dv-brake" x="-0.3" y="-1.44" width="0.6" height="0.07"/>' : "");
}
function carFront(c){
  return '<rect class="dv-shadow" x="-1" y="-0.08" width="2" height="0.16" rx="0.08"/><rect class="dv-car ' + c + '" x="-0.9" y="-1.45" width="1.8" height="1.25" rx="0.22"/>' +
    '<rect class="dv-glass" x="-0.72" y="-1.38" width="1.44" height="0.46" rx="0.12"/><rect class="dv-head" x="-0.82" y="-0.78" width="0.4" height="0.18" rx="0.06"/><rect class="dv-head" x="0.42" y="-0.78" width="0.4" height="0.18" rx="0.06"/>' +
    '<rect class="dv-tyre" x="-0.86" y="-0.28" width="0.34" height="0.28"/><rect class="dv-tyre" x="0.52" y="-0.28" width="0.34" height="0.28"/>';
}
/* seen from the side, nose to the left (dir -1) or right (dir 1) */
function carSide(c, dir, o){
  o = o || {}; var f = dir < 0 ? -1 : 1;
  return '<g transform="scale(' + f + ' 1)"><rect class="dv-shadow" x="-2.3" y="-0.08" width="4.6" height="0.16" rx="0.08"/><path class="dv-car ' + c + '" d="M-2.2 -0.25V-0.85Q-2.2 -0.95 -2.05 -0.98L-1.3 -1.02L-0.7 -1.45H0.9L1.6 -1.02L2.1 -0.95Q2.25 -0.9 2.25 -0.75V-0.25Z"/>' +
    '<path class="dv-glass" d="M-0.55 -1.36H0.1V-1.03H-1.05ZM0.25 -1.36H0.85L1.35 -1.03H0.25Z"/><circle class="dv-tyre" cx="1.45" cy="-0.3" r="0.32"/><circle class="dv-tyre" cx="-1.4" cy="-0.3" r="0.32"/>' +
    '<rect class="dv-head" x="2.05" y="-0.82" width="0.18" height="0.14"/>' + (o.blink ? '<rect class="dv-ind" x="2.02" y="-0.66" width="0.2" height="0.12"/>' : "") + "</g>";
}
function busRearSide(o){
  o = o || {};
  return '<rect class="dv-shadow" x="-1.4" y="-0.08" width="2.8" height="0.16"/><rect class="dv-bus" x="-1.27" y="-3" width="2.55" height="2.8" rx="0.2"/><rect class="dv-glass" x="-1.05" y="-2.75" width="2.1" height="0.9" rx="0.1"/>' +
    '<rect class="dv-tail" x="-1.15" y="-0.75" width="0.3" height="0.2"/><rect class="dv-tail" x="0.85" y="-0.75" width="0.3" height="0.2"/><rect class="dv-tyre" x="-1.15" y="-0.3" width="0.4" height="0.3"/><rect class="dv-tyre" x="0.75" y="-0.3" width="0.4" height="0.3"/>' +
    (o.blink ? '<rect class="dv-ind" x="-1.22" y="-1.05" width="0.3" height="0.2"/>' : "");
}
function truckRear(){
  return '<rect class="dv-shadow" x="-1.35" y="-0.08" width="2.7" height="0.16"/><rect class="dv-truck" x="-1.25" y="-3.6" width="2.5" height="3.2" rx="0.08"/><path class="dv-seam" d="M0 -3.5V-0.5"/>' +
    '<rect class="dv-tail" x="-1.15" y="-0.62" width="0.34" height="0.18"/><rect class="dv-tail" x="0.81" y="-0.62" width="0.34" height="0.18"/><rect class="dv-tyre" x="-1.15" y="-0.4" width="0.6" height="0.4"/><rect class="dv-tyre" x="0.55" y="-0.4" width="0.6" height="0.4"/>';
}
function tractor(dir){
  var f = dir < 0 ? -1 : 1;
  return '<g transform="scale(' + f + ' 1)"><rect class="dv-shadow" x="-1.8" y="-0.08" width="3.6" height="0.16"/><rect class="dv-tractor" x="-1.5" y="-1.6" width="2.4" height="0.9"/><rect class="dv-tractor" x="-1.5" y="-2.7" width="1.3" height="1.2"/>' +
    '<rect class="dv-glass" x="-1.38" y="-2.58" width="1.05" height="0.75"/><circle class="dv-tyre" cx="-1" cy="-0.75" r="0.75"/><circle class="dv-tyre" cx="1" cy="-0.45" r="0.45"/></g>';
}
function tractorRear(){
  return '<rect class="dv-shadow" x="-1.3" y="-0.08" width="2.6" height="0.16"/><rect class="dv-tyre" x="-1.25" y="-1.5" width="0.5" height="1.5" rx="0.15"/><rect class="dv-tyre" x="0.75" y="-1.5" width="0.5" height="1.5" rx="0.15"/>' +
    '<rect class="dv-tractor" x="-0.75" y="-2.8" width="1.5" height="2.2"/><rect class="dv-glass" x="-0.6" y="-2.65" width="1.2" height="0.9"/><rect class="dv-ind" x="-0.7" y="-0.85" width="0.25" height="0.15"/><rect class="dv-ind" x="0.45" y="-0.85" width="0.25" height="0.15"/>';
}
function person(h, cls, o){
  o = o || {}; var s = h / 1.75, head = 0.13 * s;
  return '<g transform="scale(' + s + ')"><rect class="dv-shadow" x="-0.3" y="-0.05" width="0.6" height="0.1" rx="0.05"/>' +
    '<path class="dv-legs" d="M-0.12 0V-0.85H0.12V0Z"/><rect class="' + cls + '" x="-0.22" y="-1.5" width="0.44" height="0.72" rx="0.14"/>' +
    (o.run ? '<path class="' + cls + '" d="M0.2 -1.4L0.5 -1.1L0.42 -1.02L0.14 -1.25Z"/>' : "") +
    '<circle class="dv-skin" cx="' + (o.look ? -0.05 : 0) + '" cy="-1.63" r="' + (head / s) + '"/></g>';
}
function pram(){ return '<rect class="dv-shadow" x="-0.4" y="-0.05" width="0.8" height="0.1"/><path class="dv-pram" d="M-0.35 -0.35H0.35V-0.85Q0.05 -0.95 -0.35 -0.75Z"/><circle class="dv-tyre" cx="-0.25" cy="-0.1" r="0.1"/><circle class="dv-tyre" cx="0.25" cy="-0.1" r="0.1"/>'; }
function cyclist(o){
  o = o || {};
  if (o.side) return '<g transform="scale(' + (o.side < 0 ? -1 : 1) + ' 1)"><circle class="dv-wheel" cx="-0.55" cy="-0.33" r="0.33"/><circle class="dv-wheel" cx="0.55" cy="-0.33" r="0.33"/><path class="dv-frame" d="M-0.55 -0.33L-0.1 -0.75H0.45L0.55 -0.33M-0.1 -0.75L-0.2 -0.95"/>' +
    '<rect class="dv-rider" x="-0.32" y="-1.55" width="0.36" height="0.7" rx="0.12" transform="rotate(12 -0.14 -1.2)"/><circle class="dv-skin" cx="0.02" cy="-1.68" r="0.13"/></g>';
  return '<rect class="dv-shadow" x="-0.3" y="-0.05" width="0.6" height="0.1"/><rect class="dv-tyre" x="-0.05" y="-0.66" width="0.1" height="0.66"/><path class="dv-legs" d="M-0.14 -0.4V-0.95H0.14V-0.4Z"/>' +
    '<rect class="dv-rider" x="-0.24" y="-1.6" width="0.48" height="0.72" rx="0.16"/><rect class="dv-tail" x="-0.07" y="-0.82" width="0.14" height="0.08"/>' +
    '<circle class="dv-skin" cx="' + (o.look ? -0.08 : 0) + '" cy="-1.74" r="0.13"/>' + (o.look ? '<path class="dv-hair" d="M-0.01 -1.86A0.13 0.13 0 0 1 0.12 -1.72H0.02Z"/>' : "");
}
function ball(){ return '<ellipse class="dv-shadow" cx="0" cy="0" rx="0.13" ry="0.03"/><circle class="dv-ball" cx="0" cy="-0.11" r="0.11"/>'; }
function trafficLight(color){
  return '<rect class="dv-pole" x="-0.06" y="-3.6" width="0.12" height="3.6"/><rect class="dv-tl" x="-0.22" y="-4.6" width="0.44" height="1.1" rx="0.08"/>' +
    ["red", "amber", "green"].map(function(c, i){ return '<circle class="' + (c === color ? "dv-on-" + c : "dv-off") + '" cx="0" cy="' + (-4.42 + i * 0.36) + '" r="0.13"/>'; }).join("");
}
function bendSign(){ return '<rect class="dv-pole" x="-0.04" y="-2.2" width="0.08" height="2.2"/><path class="dv-warn" d="M0 -3.05L0.5 -2.18H-0.5Z"/><path class="dv-sym" d="M-0.12 -2.32V-2.6Q-0.12 -2.75 0.05 -2.78L0.1 -2.72"/>'; }
function tree(h){ return '<rect class="dv-trunk" x="-0.15" y="-' + (h * 0.45) + '" width="0.3" height="' + (h * 0.45) + '"/><ellipse class="dv-leaf" cx="0" cy="-' + (h * 0.68) + '" rx="' + (h * 0.26) + '" ry="' + (h * 0.34) + '"/>'; }

/* ---- the road itself ---- */
function ground(s){
  var g = '<rect class="dv-sky" width="320" height="' + (HOR + 1) + '"/><rect class="dv-grass" y="' + HOR + '" width="320" height="' + (190 - HOR) + '"/>';
  if (s.road === "motorway"){
    g += band("dv-road", -10.5, 4.8, NEAR, FAR) + band("dv-line", -10.45, -10.3, NEAR, FAR) + band("dv-line", 1.68, 1.82, NEAR, FAR) + dashes(-1.75, NEAR, 400, 3, 9) + dashes(-5.25, NEAR, 400, 3, 9) +
      wall("dv-rail", 5.6, NEAR, FAR, 0.75) + wall("dv-rail", -11.2, NEAR, FAR, 0.75);
    if (s.ramp) g += band("dv-road", 1.8, 5.3, s.ramp - 60, s.ramp + 40) + dashes(1.75, s.ramp - 60, s.ramp + 40, 1.5, 1.5);
    return g;
  }
  if (s.road === "rural"){
    g += band("dv-road", -4.8, 1.6, NEAR, FAR) + band("dv-line", 1.35, 1.47, NEAR, FAR) + band("dv-line", -4.67, -4.55, NEAR, FAR) + dashes(-1.6, NEAR, 400, 3, 9);
    if (s.ditch) g += band("dv-water", 3.2, 6, NEAR, FAR) + band("dv-track", 7, 9.2, NEAR, FAR);
    return g;
  }
  /* town: pavements, optional parking strips */
  var pR = s.parked === "both" || s.parked === "right" ? 2.2 : 0, pL = s.parked === "both" ? 2.2 : 0;
  g += band("dv-pave", 1.6 + pR, 6 + pR, NEAR, FAR) + band("dv-pave", -4.8 - pL - 4.4, -4.8 - pL, NEAR, FAR);
  g += band("dv-road", -4.8 - pL, 1.6 + pR, NEAR, FAR) + band("dv-kerb", 1.6 + pR, 1.75 + pR, NEAR, FAR) + band("dv-kerb", -4.95 - pL, -4.8 - pL, NEAR, FAR);
  if (!s.narrow) g += dashes(-1.6, NEAR, 400, 1.5, 4.5);
  return g;
}
/* a side road joining from the right (or left) at distance d */
function sideRoad(o, s){
  var side = o.side || 1, d = o.d, w = 6, e = s.road === "town" ? (s.parked === "both" || s.parked === "right" ? 3.8 : 1.6) : 1.6;
  var X1 = side > 0 ? e - 0.2 : -40, X2 = side > 0 ? 40 : -4.8 - (s.parked === "both" ? 2.2 : 0) + 0.2;
  var out = band("dv-road", X1, X2, d - w / 2, d + w / 2);
  if (o.teeth){ for (var x = e + 0.4; x < e + 3.2; x += 0.7) out += '<path class="dv-line" d="M' + pt(x, d - w / 2 + 0.2) + "L" + pt(x + 0.5, d - w / 2 + 0.2) + "L" + pt(x + 0.25, d - w / 2 + 1) + 'Z"/>'; }
  return out;
}
function zebra(d){ var z = ""; for (var X = -4.4; X < 1.5; X += 1.0) z += band("dv-zebra", X, X + 0.5, d, d + 3); return z; }

var DRAW = {
  car: function(o){ return at(o.x, o.d, o.front ? carFront(o.c || "dv-c2") : (o.side ? carSide(o.c || "dv-c1", o.side, o) : carRear(o.c || "dv-c1", o))); },
  bus: function(o){ return wall("dv-busside", o.x - 1.27, o.d, o.d + 12, 3) + at(o.x, o.d, busRearSide(o)); },
  truck: function(o){ return at(o.x, o.d, truckRear()); },
  tractor: function(o){ return at(o.x, o.d, o.rear ? tractorRear() : tractor(o.side || -1)); },
  parkedCar: function(o){ return wall("dv-carside " + (o.c || "dv-c3"), o.x - 0.9 * (o.x > 0 ? 1 : -1), o.d, o.d + 4.3, 1.3) + at(o.x, o.d, carRear(o.c || "dv-c3", o)); },
  child: function(o){ return at(o.x, o.d, person(1.25, "dv-kid", o)); },
  adult: function(o){ return at(o.x, o.d, person(1.75, o.c || "dv-coat", o)); },
  pram: function(o){ return at(o.x, o.d, pram()); },
  bike: function(o){ return at(o.x, o.d, cyclist(o)); },
  ball: function(o){ return at(o.x, o.d, ball()); },
  light: function(o){ return at(o.x, o.d, trafficLight(o.color || "green")); },
  bend: function(o){ return at(o.x, o.d, bendSign()); },
  tree: function(o){ return at(o.x, o.d, tree(o.h || 7)); },
  hedge: function(o){ return wall("dv-hedge", o.x, o.d1, o.d2, o.h || 2.2); }
};
var FLAT = {side: sideRoad, zebra: function(o){ return zebra(o.d); },
  bay: function(o){ return band("dv-road", 1.4, 4.6, o.d - 6, o.d + 16) + band("dv-kerb", 4.6, 4.75, o.d - 6, o.d + 16); }};

/* parked cars along the kerb, skipping gaps for side roads and items that stand in the strip */
function parkedRow(s){
  var out = [], rows = s.parked === "both" ? [2.7, -5.9] : s.parked === "right" ? [2.7] : [];
  var gaps = (s.items || []).filter(function(i){ return i.k === "side" || i.gap; }).map(function(i){ return i.d; });
  rows.forEach(function(X, r){ for (var d = 10 + r * 2.5; d < 90; d += 6.2){
    if (gaps.some(function(g){ return Math.abs(g - d - 2) < 5; })) continue;
    out.push({k:"parkedCar", x:X, d:d, c:["dv-c3", "dv-c4", "dv-c5", "dv-c6"][Math.floor(d) % 4]});
  } });
  return out;
}
function hood(){ return '<path class="dv-hood" d="M0 190V176Q160 160 320 176V190Z"/><path class="dv-hoodline" d="M40 181Q160 168 280 181"/>'; }

window.KLAAR_VIEW = function(s){
  if (!s) return "";
  var g = ground(s), flats = "", items = parkedRow(s).concat((s.items || []).filter(function(i){ return !FLAT[i.k]; }));
  (s.items || []).forEach(function(i){ if (FLAT[i.k]) flats += FLAT[i.k](i, s); });
  if (s.trees) for (var d = 12; d < 220; d += 22){ items.push({k:"tree", x:s.road === "motorway" ? 9 : 5.5, d:d + (d % 3)}); items.push({k:"tree", x:s.road === "motorway" ? -14 : -9, d:d + 9}); }
  items.sort(function(a, b){ return (b.d2 || b.d) - (a.d2 || a.d); });
  var things = items.map(function(i){ return DRAW[i.k] ? DRAW[i.k](i) : ""; }).join("");
  return '<svg class="dview" viewBox="0 0 320 190" role="img" aria-hidden="true"><defs><clipPath id="dvc"><rect width="320" height="190" rx="14"/></clipPath></defs><g clip-path="url(#dvc)">' +
    g + flats + things + hood() + "</g></svg>";
};
})();
