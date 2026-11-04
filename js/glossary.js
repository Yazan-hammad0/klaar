/* Words to know: every term with what it means and the logic behind it. One page per goal.
   The short definitions also pop up when you tap an underlined word in a question (content.js GLOSSARY).
   Facts follow the lessons and the sourced questions; the logic lines explain why the rule exists. */
(function(){
"use strict";
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

/* why it works this way, for the terms that already exist in content.js */
var WHY = {
  drive: {
    voorrangRechts:"With no signs, everyone needs one rule that works the same at every junction.",
    giveWay:"Signs are placed where the simple right-first rule isn't safe enough.",
    builtUpArea:"Inside towns there are pedestrians, cyclists and children, so the default speed is lower.",
    roundabout:"Signs decide here, because both rules (right-first or circulating traffic first) are in use.",
    roadLine:"Solid lines are painted where you can't see far enough ahead to overtake safely.",
    hazardLights:"They warn the traffic behind you about something it can't see yet.",
    hardShoulder:"It is the only place a broken-down car can stand without blocking fast traffic.",
    perMille:"Alcohol slows your reactions long before you feel drunk.",
    noviceDriver:"New drivers have less experience, so mistakes from alcohol are more likely.",
    zipMerging:"Using both lanes to the end keeps the queue shorter. It is advised, not a legal duty.",
    beams:"High beam lights far but blinds other drivers, so you dip it for them.",
    railwayCrossing:"A train can't stop or steer, so you are the one who has to wait.",
    zebraCrossing:"Pedestrians have no protection, so the driver gives way.",
    sharksTeeth:"The triangles point at the driver who must wait, so you can read them from far away.",
    flashingBeacon:"It asks for attention, not priority. Only blue lights with a siren give priority.",
    bestemmingsverkeer:"It keeps through-traffic out of quiet streets while residents and visitors can still get in.",
    priorityRoad:"Main roads keep traffic moving, so side roads give way to them.",
    noParking:"Short stops for passengers or loading are fine; leaving the car is not.",
    noStopping:"Even a short stop here would block traffic or sight lines."
  },
  civic: {
    polderModel:"Many groups have a say, so decisions take longer but are widely supported.",
    gedoogbeleid:"Tolerating something under strict rules can be easier to control than banning it.",
    bsn:"One number for everything means you don't need a separate number at every office.",
    digid:"One secure login keeps your personal data safe across government websites.",
    gemeente:"Daily matters are best handled close to where you live.",
    toeslag:"It helps people on lower incomes pay for things everyone needs, like rent and care.",
    ondernemingsraad:"Employees know the work best, so they get a say in big decisions.",
    vakantiegeld:"It makes sure everyone can afford a holiday.",
    waterschappen:"Much of the country lies below sea level, so water needs its own authority.",
    aow:"Everyone who lived or worked here builds it up, so nobody is left without income in old age."
  }
};
/* terms that were missing */
var MORE = {
  drive: [
    {label:"Special manoeuvre (bijzondere manoeuvre)", def:"Leaving a driveway or parking place, reversing, a U-turn or changing lanes. You give way to all other traffic.", why:"You are joining or crossing traffic that is already moving."},
    {label:"Tram priority", def:"At an equal junction a tram goes first, even from the left. Trams still follow signs and lights.", why:"A tram runs on rails and can't steer around you."},
    {label:"Reaction distance", def:"How far you travel between seeing danger and pressing the brake, about 1 second. It doubles when your speed doubles.", why:"Your car keeps its full speed until your foot reaches the brake."},
    {label:"Braking distance", def:"How far you travel once you brake. Twice the speed means four times the braking distance.", why:"The brakes have to remove the car's energy, which grows with the square of speed."},
    {label:"2-second rule", def:"Stay at least 2 seconds behind the car ahead. Count from when it passes a fixed point.", why:"You need about a second to react and then room to brake."},
    {label:"Hazard perception (gevaarherkenning)", def:"The exam part where you choose: brake, release the accelerator, or do nothing.", why:"Seeing danger early is what prevents most crashes."},
    {label:"Acceleration lane (invoegstrook)", def:"The lane next to the motorway where you speed up before joining. Traffic on the motorway goes first.", why:"Joining at the same speed as the traffic is the safest way in."},
    {label:"Matrix sign", def:"An electronic sign above a lane. Its speed or red cross always beats the signs at the roadside.", why:"It can change the limit for accidents, roadworks or traffic jams."},
    {label:"Blue zone (blauwe zone)", def:"An area where you may park for free for a limited time, using a parking disc.", why:"Free short parking for everyone, without a meter."},
    {label:"Parking disc (parkeerschijf)", def:"A blue card behind your windscreen that shows your arrival time. You may round up to the next half hour.", why:"It lets anyone check how long you have been parked."},
    {label:"Woonerf", def:"A residential zone where children may play on the street. Drive at walking pace and park only in marked spots.", why:"The street belongs to the people who live there."},
    {label:"Bicycle street (fietsstraat)", def:"A street where cyclists come first and cars are guests. Do not push cyclists.", why:"It gives bikes a safe route without a separate cycle path."}
  ],
  civic: [
    {label:"Inburgering", def:"Integration: learning Dutch and how the Netherlands works. For many newcomers from outside the EU it is required.", why:"Speaking the language and knowing the rules makes work, school and daily life easier."},
    {label:"KNM (Kennis van de Nederlandse Maatschappij)", def:"The exam part about Dutch society: work, health, housing, government, history and norms.", why:"It covers what you need to manage daily life here."},
    {label:"DUO", def:"The government agency that runs the inburgering exams and student finance.", why:"One agency for exams keeps the rules the same for everyone."},
    {label:"IND", def:"The Immigration and Naturalisation Service. It decides on residence permits and citizenship.", why:"One national service keeps decisions consistent."},
    {label:"Huisarts", def:"Your family doctor. The first stop for health problems; you need a referral for a specialist.", why:"Specialists and hospitals stay available for the people who really need them."},
    {label:"Zorgverzekering", def:"Health insurance. Basic insurance is compulsory for everyone who lives or works in the Netherlands.", why:"If everyone pays in, care stays affordable for everyone."},
    {label:"Eigen risico", def:"Your own risk: the part of your care costs you pay yourself each year before insurance pays. GP visits are not part of it.", why:"It keeps premiums lower and stops unneeded care."},
    {label:"Naturalisatie", def:"Becoming Dutch by applying at your gemeente, usually after 5 years of legal residence and passing the inburgering exam.", why:"Citizenship comes with voting rights, so it asks for time and integration first."}
  ]
};

function terms(t){
  var lib = t === "drive" ? window.DRIVE : window.CIVIC, out = [];
  if (lib && lib.GLOSSARY) Object.keys(lib.GLOSSARY).forEach(function(k){ var g = lib.GLOSSARY[k]; out.push({label:g.label, def:g.def, why:(WHY[t] || {})[k] || "", icon:g.icon}); });
  return out.concat(MORE[t] || []).sort(function(a, b){ return a.label.localeCompare(b.label); });
}
function render(v, t, back){
  var list = terms(t);
  v.innerHTML = '<div class="run-top"><button class="link" data-act="gl-back">&larr; Back</button><b>Words to know</b><span></span></div>' +
    '<input class="inp gl-search" id="gl-q" type="search" placeholder="Search" aria-label="Search" autocomplete="off">' +
    '<div class="gl-list">' + list.map(function(g){
      return '<article class="gl-card" data-k="' + esc(g.label.toLowerCase() + " " + g.def.toLowerCase()) + '"><div class="gl-head">' + (g.icon ? '<span class="gl-ic" aria-hidden="true">' + g.icon + '</span>' : '<span class="gl-ic gl-aa" aria-hidden="true">Aa</span>') +
        '<h3 translate="no">' + esc(g.label) + '</h3></div><p class="gl-def" translate="no">' + esc(g.def) + '</p>' + (g.why ? '<p class="pr-why"><b>Why</b><span translate="no">' + esc(g.why) + '</span></p>' : "") + '</article>';
    }).join("") + '</div><p class="note gl-none" hidden>No term matches.</p>';
  v.querySelector('[data-act="gl-back"]').addEventListener("click", back);
  var q = v.querySelector("#gl-q"), none = v.querySelector(".gl-none");
  q.addEventListener("input", function(){
    var s = q.value.trim().toLowerCase(), n = 0;
    Array.prototype.forEach.call(v.querySelectorAll(".gl-card"), function(c){ var on = !s || c.getAttribute("data-k").indexOf(s) >= 0; c.hidden = !on; if (on) n++; });
    none.hidden = n > 0;
  });
}
window.KLAAR_GLOSSARY = {count:function(t){ return terms(t).length; }, render:render};
})();
