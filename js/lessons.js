/* Topic lessons: short steps with an animated scene, the rule, and why it works that way.
   Shown once, before the first questions on that topic. Scenes are drawn in SVG and animated with CSS,
   so they work offline and weigh almost nothing. Traffic drives on the right. */
(function(){
"use strict";
var SRC = {
  anwbPriority: "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/voorrang",
  gov: "https://www.government.nl/binaries/government/documenten/reports/2024/02/09/road-traffic-signs-and-regulations-in-the-netherlands/Road+Traffic+Signs+and+Regulations+in+the+Netherlands.pdf",
  anwbDistance: "https://www.anwb.nl/verkeer/veiligheid/verkeersregels/afstand-houden",
  anwbSpeed: "https://www.anwb.nl/verzekeringen/autoverzekering/veilig-rijden/rijtips-snelheid",
  rvv23: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=23",
  rvv54: "https://wetten.overheid.nl/jci1.3:c:BWBR0004825&artikel=54",
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
  badge: function(c, t){ return '<circle class="sc-badge" r="9"/><text class="sc-num" x="0" y="3.5">' + t + '</text>'; }
};
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
       why:"A tram runs on rails, can't steer around you and needs a long distance to stop.", src:SRC.gov},
      {scene:"signsWin", h:"Signs and markings beat the rule",
       t:"A yellow diamond means you are on a priority road. Shark teeth (haaientanden) or a give-way sign mean you give way, even to traffic from your left. Traffic lights and police beat signs.",
       why:"Signs are put where the simple rule isn't safe enough, so they always win.", src:SRC.gov},
      {scene:"driveway", h:"Special manoeuvres: you give way to everyone",
       t:"Coming out of a driveway or parking place, reversing, a U-turn or changing lanes is a special manoeuvre (bijzondere manoeuvre). You let all other traffic go first, from every direction.",
       why:"You are joining or crossing traffic that is already moving, so it goes first.", src:SRC.anwbPriority}
    ],
    "Hazard perception": [
      {scene:"hzBrake", h:"Brake: the danger is close",
       t:"Someone is on your path, or about to be, and close by. A ball rolling out between parked cars means a child may follow. Only braking gives you enough room.",
       why:"Releasing the accelerator slows you too little when the danger is a few seconds away.", src:SRC.gov},
      {scene:"hzRelease", h:"Release the accelerator: something might happen",
       t:"Nothing is in your way yet, but it could be soon: children playing beside the road, a car that might pull out, brake lights far ahead. Take your foot off the accelerator and get ready to brake.",
       why:"Losing a little speed early gives you time and room if it turns into real danger.", src:SRC.gov},
      {scene:"hzNothing", h:"Do nothing: the road stays clear",
       t:"Your speed fits the situation and nobody is heading into your path. Keep going as you are.",
       why:"Braking without a reason surprises the driver behind you.", src:SRC.gov},
      {scene:"secondsAway", h:"Distance and speed decide",
       t:"The same situation can need a different answer. Close or fast: brake. Far away or slow: release. Ask yourself how many seconds it takes to get there.",
       why:"At 50 km/h you cover about 14 m every second (50 ÷ 3.6).", src:SRC.gov}
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
       why:"Something just out of sight still needs you to be able to stop for it.", src:SRC.gov}
    ],
    "Lane use": [
      {scene:"keepRight", h:"Keep right, overtake on the left",
       t:"Drive in the right-hand lane when it is free. Overtake on the left, then move back to the right.",
       why:"The left lane stays free for overtaking, so nobody needs to pass on the wrong side.", src:SRC.gov},
      {scene:"zip", h:"Lane ends? Zip merge (ritsen)",
       t:"Use both lanes up to the point where one ends, then take turns, one by one. This is the advised way, not a legal duty: the driver who changes lanes must give way.",
       why:"Using both lanes to the end keeps the queue shorter and moving.", src:SRC.rvv54}
    ],
    "Railway crossings": [
      {scene:"railStop", h:"Flashing red lights: stop, even if you see no train",
       t:"Stop before the crossing as soon as the red lights flash or the bell rings, even before the barriers come down. Wait until the lights are off.",
       why:"A train can't stop or steer, and it can come faster than you expect.", src:SRC.gov},
      {scene:"railRoom", h:"Never stop on the tracks",
       t:"Only drive onto the crossing when there is room to get off it completely on the other side. If traffic is queuing, wait before the crossing.",
       why:"If the barriers close while you are stuck on the tracks, you can't get out of the way.", src:SRC.rvv23}
    ],
    "Road markings": [
      {scene:"overtake", h:"Solid line: don't cross it. Broken line: you may, when safe",
       t:"A solid line in the middle of the road may not be crossed, so finish overtaking before it starts. Where the line is broken you may cross it if it is safe.",
       why:"Solid lines are painted where you can't see far enough ahead to overtake safely.", src:SRC.gov},
      {scene:"blueZone", h:"Blue line: park with a parking disc",
       t:"In a disc zone (blauwe zone) you may park only in spaces with a blue line or marked bays, with a parking disc showing your arrival time. You may round the time up to the next half hour.",
       why:"It gives everyone free short-term parking without a meter.", src:SRC.gov}
    ],
    "Motorway": [
      {scene:"mwJoin", h:"Joining: speed up, then fit in",
       t:"Use the whole acceleration lane (invoegstrook) to reach the speed of the traffic, then move in where there is a gap. Traffic already on the motorway goes first.",
       why:"Joining at a low speed forces others to brake hard.", src:SRC.rvv54},
      {scene:"missedExit", h:"No reversing, U-turns or stopping",
       t:"Missed your exit? Drive on to the next one. Stop on the hard shoulder only in an emergency.",
       why:"On a road this fast, anything standing still or going backwards is very dangerous.", src:SRC.gov},
      {scene:"speedSigns", h:"130 by law, often 100 by day",
       t:"The maximum is 130 km/h, but on many motorways signs set 100 km/h from 06:00 to 19:00. A speed on a matrix sign above your lane always wins.",
       why:"Signs and matrix signs adjust the limit to the road, the time of day and the traffic.", src:SRC.speedRules}
    ]
  },
  civic: {}
};
/* the order lessons come in: basics first, motorway and hazards later */
window.LESSON_ORDER = {drive:["Priority", "Road markings", "Distances", "Lane use", "Railway crossings", "Motorway", "Hazard perception"], civic:[]};
window.LESSON_SCENE = function(id){ return SCENES[id] ? SCENES[id]() : ""; };
})();
