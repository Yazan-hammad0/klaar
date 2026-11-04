/* Topic lessons: short steps with an animated scene, the rule, and why it works that way.
   Shown once, before the first questions on that topic. Scenes are drawn in SVG and animated with CSS,
   so they work offline and weigh almost nothing. Pilot: Priority. */
(function(){
"use strict";
var SRC_ANWB = "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/voorrang";
var SRC_GOV = "https://www.government.nl/binaries/government/documenten/reports/2024/02/09/road-traffic-signs-and-regulations-in-the-netherlands/Road+Traffic+Signs+and+Regulations+in+the+Netherlands.pdf";

/* ---- drawing ---- */
function crossroads(){
  return '<rect class="sc-road" x="70" y="0" width="60" height="200"/><rect class="sc-road" x="0" y="70" width="200" height="60"/>' +
    '<path class="sc-dash" d="M100 0V68M100 132V200M0 100H68M132 100H200"/>';
}
function straightRoad(){
  return '<rect class="sc-road" x="0" y="60" width="200" height="60"/><path class="sc-dash" d="M0 90H200"/>' +
    '<rect class="sc-drive" x="30" y="120" width="30" height="80"/><path class="sc-kerb" d="M30 121H60"/>';
}
var SHAPES = {
  car: function(c){ return '<rect x="-8" y="-14" width="16" height="28" rx="4" class="sc-car ' + c + '"/><rect x="-6" y="-9" width="12" height="6" rx="1.5" class="sc-glass"/>'; },
  bike: function(){ return '<rect x="-1.5" y="-10" width="3" height="20" rx="1.5" class="sc-bike"/><circle cx="0" cy="1" r="4.5" class="sc-rider"/>'; },
  tram: function(){ return '<rect x="-8" y="-30" width="16" height="60" rx="5" class="sc-car c-tram"/><rect x="-6" y="-25" width="12" height="6" rx="1.5" class="sc-glass"/>'; }
};
/* an actor: shape, badge text, label, and keyframes [percent, x, y, rotation] */
function actors(id, list){
  var css = "", g = "";
  list.forEach(function(a, k){
    var name = "sc-" + id + "-" + k, still = a.still || a.path[0];
    css += "@keyframes " + name + "{" + a.path.map(function(p){ return p[0] + "%{transform:translate(" + p[1] + "px," + p[2] + "px) rotate(" + (p[3] || 0) + "deg)}"; }).join("") + "}";
    css += "@keyframes " + name + "b{" + a.path.map(function(p){ return p[0] + "%{transform:translate(" + p[1] + "px," + p[2] + "px)}"; }).join("") + "}";
    g += '<g class="sc-a" style="animation-name:' + name + '" transform="translate(' + still[1] + ' ' + still[2] + ') rotate(' + (still[3] || 0) + ')">' + SHAPES[a.shape](a.color || "") + '</g>';
    g += '<g class="sc-a" style="animation-name:' + name + 'b" transform="translate(' + still[1] + ' ' + still[2] + ')">' +
      (a.badge ? '<circle class="sc-badge" cx="0" cy="' + (a.shape === "tram" ? -40 : -25) + '" r="9"/><text class="sc-num" x="0" y="' + (a.shape === "tram" ? -36.5 : -21.5) + '">' + a.badge + '</text>' : "") +
      (a.label ? '<text class="sc-label" x="0" y="30">' + a.label + '</text>' : "") + '</g>';
  });
  return '<style>' + css + '</style>' + g;
}
function svg(id, ground, extra, list){
  return '<svg viewBox="0 0 200 200" role="img" aria-hidden="true"><rect class="sc-bg" width="200" height="200"/>' + ground + (extra || "") + actors(id, list) + '</svg>';
}
var SCENES = {
  rightFirst: function(){ return svg("rf", crossroads(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, 215, 85, -90], [40, -25, 85, -90], [100, -25, 85, -90]], still:[0, 112, 85, -90]},
    {shape:"car", color:"c-you", badge:"2", label:"You", path:[[0, 115, 205], [18, 115, 150], [45, 115, 150], [75, 115, -25], [100, 115, -25]], still:[0, 115, 152]}
  ]); },
  bikeFirst: function(){ return svg("bf", crossroads(), "", [
    {shape:"bike", badge:"1", path:[[0, 212, 85, -90], [50, -15, 85, -90], [100, -15, 85, -90]], still:[0, 112, 85, -90]},
    {shape:"car", color:"c-you", badge:"2", label:"You", path:[[0, 115, 205], [18, 115, 150], [52, 115, 150], [80, 115, -25], [100, 115, -25]], still:[0, 115, 152]}
  ]); },
  tramFirst: function(){ return svg("tf", crossroads(), '<path class="sc-rail" d="M0 111H200M0 119H200"/>', [
    {shape:"tram", badge:"1", path:[[0, -45, 115, 90], [50, 250, 115, 90], [100, 250, 115, 90]], still:[0, 80, 115, 90]},
    {shape:"car", color:"c-you", badge:"2", label:"You", path:[[0, 115, 205], [18, 115, 152], [55, 115, 152], [82, 115, -25], [100, 115, -25]], still:[0, 115, 154]}
  ]); },
  signsWin: function(){
    var teeth = ""; for (var y = 71; y < 99; y += 7) teeth += '<path class="sc-teeth" d="M134 ' + y + 'L142 ' + (y + 3) + 'L134 ' + (y + 6) + 'Z"/>';
    var sign = '<path class="sc-post" d="M158 160V176"/><rect class="sc-diamond" x="151" y="146" width="14" height="14" transform="rotate(45 158 153)"/>';
    return svg("sw", crossroads(), teeth + sign, [
      {shape:"car", color:"c-red", badge:"2", path:[[0, 215, 85, -90], [18, 152, 85, -90], [60, 152, 85, -90], [92, -25, 85, -90], [100, -25, 85, -90]], still:[0, 152, 85, -90]},
      {shape:"car", color:"c-you", badge:"1", label:"You", path:[[0, 115, 205], [50, 115, -25], [100, 115, -25]], still:[0, 115, 112]}
    ]);
  },
  driveway: function(){ return svg("dw", straightRoad(), "", [
    {shape:"car", color:"c-red", badge:"1", path:[[0, -25, 105, 90], [48, 225, 105, 90], [100, 225, 105, 90]], still:[0, 100, 105, 90]},
    {shape:"car", color:"c-you", badge:"2", label:"You", path:[[0, 45, 205], [15, 45, 145], [52, 45, 145], [62, 45, 120], [72, 70, 105, 90], [100, 230, 105, 90]], still:[0, 45, 145]}
  ]); }
};

window.LESSONS = {
  drive: {
    "Priority": [
      {scene:"rightFirst", h:"Equal junction: traffic from the right goes first",
       t:"No signs, no lines, no lights? Then whoever comes from your right goes first. This is called an equal junction (gelijkwaardige kruising).",
       why:"With no signs, everyone needs one simple rule that works the same at every junction.", src:SRC_ANWB},
      {scene:"bikeFirst", h:"Cyclists and mopeds count too",
       t:"The rule is for every driver, including a cyclist or moped rider coming from your right. A bus gets no exception.",
       why:"On a bike you are a driver (bestuurder) under Dutch traffic law, so the same rule applies.", src:SRC_ANWB},
      {scene:"tramFirst", h:"Trams go first, even from the left",
       t:"At an equal junction a tram has priority over all other traffic, from any side. Trams must still obey signs and lights.",
       why:"A tram runs on rails, can't steer around you and needs a long distance to stop.", src:SRC_GOV},
      {scene:"signsWin", h:"Signs and markings beat the rule",
       t:"A yellow diamond means you are on a priority road. Shark teeth (haaientanden) or a give-way sign mean you give way, even to traffic from your left. Traffic lights and police beat signs.",
       why:"Signs are put where the simple rule isn't safe enough, so they always win.", src:SRC_GOV},
      {scene:"driveway", h:"Special manoeuvres: you give way to everyone",
       t:"Coming out of a driveway or parking place, reversing, a U-turn or changing lanes is a special manoeuvre (bijzondere manoeuvre). You let all other traffic go first, from every direction.",
       why:"You are joining or crossing traffic that is already moving, so it goes first.", src:SRC_ANWB}
    ]
  },
  civic: {}
};
window.LESSON_SCENE = function(id){ return SCENES[id] ? SCENES[id]() : ""; };
})();
