// Cellular respiration simulation
var NS = "http://www.w3.org/2000/svg";
var atp = 0, nadh = 0, fadh = 0, co2 = 0;
var current = 1, unlocked = 1, done = {};

function $(id) { return document.getElementById(id); }
function sv(tag, attrs) {
  var e = document.createElementNS(NS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function dots(n) {
  var s = "";
  for (var i = 0; i < n; i++) s += '<span class="c"></span>';
  return s;
}
function updateTotals() {
  $("tATP").textContent = atp;
  $("tNADH").textContent = nadh;
  $("tFADH").textContent = fadh;
  $("tCO2").textContent = co2;
}

// ---------- navigation ----------
function show(n) {
  current = n;
  for (var i = 1; i <= 4; i++) $("s" + i).className = (i === n) ? "stage show" : "stage";
  var tabs = document.querySelectorAll("#tabs button");
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].className = (j + 1 === n) ? "active" : "";
    tabs[j].disabled = (j + 1) > unlocked;
  }
  $("back").disabled = (n === 1);
  $("next").disabled = !done[n] || n === 4;
  if (n === 4 && !queueBuilt) buildQueue();
}
function finish(n) {
  done[n] = true;
  if (n < 4 && unlocked < n + 1) unlocked = n + 1;
  show(current);
}
var tabButtons = document.querySelectorAll("#tabs button");
for (var t = 0; t < tabButtons.length; t++) {
  tabButtons[t].onclick = function () { show(Number(this.dataset.n)); };
}
$("back").onclick = function () { show(current - 1); };
$("next").onclick = function () { show(current + 1); };

// ---------- Stage 1: Glycolysis ----------
var G = [
  { names: ["Glucose"], g: [6], t: "Glucose has 6 carbons. It is the starting molecule.", atp: 0, nadh: 0 },
  { names: ["Glucose-6-phosphate"], g: [6], t: "A phosphate from ATP is added. This COSTS 1 ATP.", atp: -1, nadh: 0 },
  { names: ["Fructose-6-phosphate"], g: [6], t: "The molecule is rearranged into a different sugar.", atp: 0, nadh: 0 },
  { names: ["Fructose-1,6-bisphosphate"], g: [6], t: "A second phosphate is added. This COSTS another ATP.", atp: -1, nadh: 0 },
  { names: ["G3P", "G3P"], g: [3, 3], t: "The 6-carbon sugar splits into two 3-carbon molecules (G3P).", atp: 0, nadh: 0 },
  { names: ["1,3-BPG", "1,3-BPG"], g: [3, 3], t: "Each G3P gives electrons to NAD+. Gain: 2 NADH.", atp: 0, nadh: 2 },
  { names: ["3-PG", "3-PG"], g: [3, 3], t: "Each molecule makes 1 ATP. Gain: 2 ATP.", atp: 2, nadh: 0 },
  { names: ["Pyruvate", "Pyruvate"], g: [3, 3], t: "Two more ATP are made and 2 pyruvate form. Gain: 2 ATP.", atp: 2, nadh: 0 }
];
var g1 = 0;
function draw1() {
  var s = G[g1], html = "";
  for (var i = 0; i < s.g.length; i++) {
    html += '<div class="grp">' + dots(s.g[i]) + '<br>' + s.names[i] + '</div>';
  }
  $("area1").innerHTML = html;
  $("txt1").textContent = s.t;
  $("n1").textContent = g1;
}
draw1();
$("b1").onclick = function () {
  if (g1 >= 7) return;
  g1++;
  atp += G[g1].atp;
  nadh += G[g1].nadh;
  updateTotals();
  draw1();
  if (g1 === 7) {
    $("b1").disabled = true;
    $("m1").textContent = "Spent 2 ATP, made 4. Net: +2 ATP and +2 NADH. Pyruvate goes into the mitochondrion.";
    finish(1);
  }
};

// ---------- Stage 2: Pyruvate oxidation ----------
var converted = 0;
function setupPyr(id) {
  var el = $(id);
  el.innerHTML = dots(3) + "<br>Pyruvate (3C)<br><small>click me</small>";
  el.onclick = function () {
    if (el.classList.contains("done")) return;
    el.classList.add("done");
    el.innerHTML = '<span class="c gone"></span>' + dots(2) + "<br>Acetyl-CoA (2C)<br><small>1 carbon left as CO2</small>";
    co2 += 1; nadh += 1; converted++;
    updateTotals();
    $("m2").textContent = "CO2 released, NADH made. (" + converted + "/2)";
    if (converted === 2) {
      $("m2").textContent = "Done! +2 CO2 and +2 NADH. The 2-carbon acetyl-CoA molecules go to the Krebs cycle.";
      finish(2);
    }
  };
}
setupPyr("p1");
setupPyr("p2");

// ---------- Stage 3: Krebs cycle ----------
var NODES = [
  ["Oxaloacetate", "OAA", 4], ["Citrate", "Citrate", 6], ["Isocitrate", "Isocit.", 6],
  ["Alpha-ketoglutarate", "a-KG", 5], ["Succinyl-CoA", "Suc-CoA", 4], ["Succinate", "Succin.", 4],
  ["Fumarate", "Fumar.", 4], ["Malate", "Malate", 4]
];
var K = [
  { to: 1, t: "Acetyl-CoA (2C) joins oxaloacetate (4C) to make citrate (6C).", atp: 0, nadh: 0, fadh: 0, co2: 0 },
  { to: 2, t: "Citrate is rearranged into isocitrate (6C).", atp: 0, nadh: 0, fadh: 0, co2: 0 },
  { to: 3, t: "Isocitrate loses a carbon as CO2 and becomes alpha-ketoglutarate (5C). Makes NADH.", atp: 0, nadh: 1, fadh: 0, co2: 1 },
  { to: 4, t: "Another CO2 is lost. Succinyl-CoA (4C) forms. Makes NADH.", atp: 0, nadh: 1, fadh: 0, co2: 1 },
  { to: 5, t: "Succinyl-CoA becomes succinate (4C). Makes 1 ATP.", atp: 1, nadh: 0, fadh: 0, co2: 0 },
  { to: 6, t: "Succinate becomes fumarate (4C). Makes FADH2.", atp: 0, nadh: 0, fadh: 1, co2: 0 },
  { to: 7, t: "Fumarate becomes malate (4C).", atp: 0, nadh: 0, fadh: 0, co2: 0 },
  { to: 0, t: "Malate becomes oxaloacetate (4C). Makes NADH. The cycle is ready to turn again.", atp: 0, nadh: 1, fadh: 0, co2: 0 }
];
var pos = [];
var kg = $("krebs");
for (var i = 0; i < 8; i++) {
  var a = (-90 + i * 45) * Math.PI / 180;
  pos.push({ x: 150 + 100 * Math.cos(a), y: 150 + 100 * Math.sin(a) });
}
// arrows (simple lines) between nodes
for (var i = 0; i < 8; i++) {
  var p1 = pos[i], p2 = pos[(i + 1) % 8];
  kg.appendChild(sv("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#aaa", "stroke-width": 3 }));
}
var nodeEls = [];
for (var i = 0; i < 8; i++) {
  var c = sv("circle", { cx: pos[i].x, cy: pos[i].y, r: 27, class: "node" });
  kg.appendChild(c);
  nodeEls.push(c);
  var l1 = sv("text", { x: pos[i].x, y: pos[i].y - 1, "text-anchor": "middle", "font-size": 9, "font-weight": "bold" });
  l1.textContent = NODES[i][1];
  var l2 = sv("text", { x: pos[i].x, y: pos[i].y + 11, "text-anchor": "middle", "font-size": 9, fill: "#555" });
  l2.textContent = NODES[i][2] + "C";
  kg.appendChild(l1);
  kg.appendChild(l2);
}
var mid = sv("text", { x: 150, y: 146, "text-anchor": "middle", "font-size": 12 });
mid.textContent = "Krebs cycle";
kg.appendChild(mid);
// acetyl-CoA label + moving token
var ac = sv("text", { x: 8, y: 14, "font-size": 10 });
ac.textContent = "Acetyl-CoA (2C) enters here";
kg.appendChild(ac);
var token = sv("g", { id: "token" });
token.appendChild(sv("circle", { r: 8, fill: "#f4a259", stroke: "#b5651d", "stroke-width": 2 }));
kg.appendChild(token);
function moveToken(x, y) { token.style.transform = "translate(" + x + "px," + y + "px)"; }
moveToken(20, 30);

var turn = 1, ks = 0, playing = false;
function krebsStep() {
  if (turn > 2) return;
  if (ks === 0) {
    moveToken(20, 30); // start each turn at the entry point
  }
  var s = K[ks];
  for (var i = 0; i < 8; i++) nodeEls[i].setAttribute("class", "node");
  nodeEls[s.to].setAttribute("class", "node hot");
  moveToken(pos[s.to].x, pos[s.to].y - 36);
  ks++;
  atp += s.atp; nadh += s.nadh; fadh += s.fadh; co2 += s.co2;
  updateTotals();
  $("txt3").textContent = "Step " + ks + ": " + s.t;
  $("n3").textContent = ks;
  if (ks === 8) {
    ks = 0;
    $("m3").textContent = "Turn " + turn + " done: 3 NADH, 1 FADH2, 1 ATP, 2 CO2.";
    turn++;
    if (turn > 2) {
      $("b3").disabled = true;
      $("b3auto").disabled = true;
      $("m3").textContent = "Both turns done! All 6 glucose carbons are now CO2 (CO2 total = " + co2 + "). Now the carriers go to the electron transport chain.";
      finish(3);
    } else {
      $("turn").textContent = turn;
    }
  }
}
$("b3").onclick = function () { if (!playing) krebsStep(); };
$("b3auto").onclick = function () {
  if (playing || turn > 2) return;
  playing = true;
  var thisTurn = turn;
  var timer = setInterval(function () {
    krebsStep();
    if (turn !== thisTurn) { clearInterval(timer); playing = false; }
  }, 1200);
};

// ---------- Stage 4: Electron transport chain + chemiosmosis ----------
var eg = $("etc");
eg.appendChild(sv("rect", { x: 0, y: 0, width: 340, height: 120, fill: "#fff8dc" }));
eg.appendChild(sv("rect", { x: 0, y: 120, width: 340, height: 30, fill: "#bbb" }));
eg.appendChild(sv("rect", { x: 0, y: 150, width: 340, height: 110, fill: "#e3f1fa" }));
function label(x, y, txt, size, anchor) {
  var t = sv("text", { x: x, y: y, "font-size": size || 10, "text-anchor": anchor || "start" });
  t.textContent = txt;
  eg.appendChild(t);
}
label(5, 14, "Intermembrane space (H+ builds up here)");
label(5, 254, "Matrix (low H+)");
var CX = { I: 45, II: 100, III: 160, IV: 225 };
function complex(name, x, w, color) {
  eg.appendChild(sv("rect", { x: x - w / 2, y: 108, width: w, height: 54, rx: 8, fill: color, stroke: "#555", "stroke-width": 1.5 }));
  label(x, 139, name, 13, "middle");
}
complex("I", CX.I, 46, "#f4a259");
complex("II", CX.II, 36, "#f6d55c");
complex("III", CX.III, 46, "#f4a259");
complex("IV", CX.IV, 46, "#f4a259");
eg.appendChild(sv("circle", { cx: 295, cy: 135, r: 26, fill: "#9bd1a0", stroke: "#2d6a4f", "stroke-width": 2 }));
eg.appendChild(sv("rect", { x: 285, y: 150, width: 20, height: 28, fill: "#9bd1a0", stroke: "#2d6a4f" }));
label(295, 132, "ATP", 10, "middle");
label(295, 144, "synthase", 9, "middle");
label(CX.IV, 195, "O2 + e- + H+  ->  H2O", 10, "middle");
var dotsG = sv("g", {});
eg.appendChild(dotsG);
var etoken = sv("circle", { r: 7, fill: "#ffd60a", stroke: "#b59a00", "stroke-width": 2, style: "transition: transform 0.35s;" });
etoken.style.transform = "translate(-20px,-20px)";
eg.appendChild(etoken);

var queue = [], queueBuilt = false, busy = false, pDots = [], totalDots = 0;
function buildQueue() {
  queue = [];
  for (var i = 0; i < nadh; i++) queue.push("N");
  for (var j = 0; j < fadh; j++) queue.push("F");
  queueBuilt = true;
  $("left").textContent = queue.length;
}
function addDots(n) {
  for (var i = 0; i < n; i++) {
    var d = sv("circle", { cx: 8 + Math.random() * 324, cy: 26 + Math.random() * 74, r: 4, fill: "#e63946" });
    dotsG.appendChild(d);
    pDots.push(d);
  }
  totalDots += n;
  $("pcount").textContent = pDots.length;
}
function sendOne(cb) {
  if (queue.length === 0 || busy) return;
  busy = true;
  var type = queue.shift();
  $("left").textContent = queue.length;
  // route: [x, label, protonDotsToAdd]
  var route = (type === "N")
    ? [[CX.I, "I", 2], [CX.III, "III", 2], [CX.IV, "IV", 1]]
    : [[CX.II, "II", 0], [CX.III, "III", 2], [CX.IV, "IV", 1]];
  $("m4").textContent = (type === "N" ? "NADH" : "FADH2") + " drops its electrons at Complex " + route[0][1] + "...";
  etoken.style.transform = "translate(" + route[0][0] + "px,135px)";
  var i = 0;
  function nextStop() {
    addDots(route[i][2]);
    if (route[i][2] > 0) $("m4").textContent = "Complex " + route[i][1] + " pumps protons into the intermembrane space.";
    i++;
    if (i < route.length) {
      etoken.style.transform = "translate(" + route[i][0] + "px,135px)";
      setTimeout(nextStop, 450);
    } else {
      setTimeout(function () {
        etoken.style.transform = "translate(" + CX.IV + "px,180px)";
        setTimeout(function () {
          etoken.style.transform = "translate(-20px,-20px)";
          busy = false;
          afterCarrier();
          if (cb) cb();
        }, 450);
      }, 450);
    }
  }
  setTimeout(nextStop, 450);
}
function afterCarrier() {
  if (queue.length === 0) {
    $("b4a").disabled = true;
    $("b4all").disabled = true;
    $("b4b").disabled = false;
    $("m4").textContent = "All carriers used. Lots of H+ is on one side. Open ATP synthase!";
  }
}
$("b4a").onclick = function () { sendOne(); };
$("b4all").onclick = function () {
  if (busy) return;
  function loop() { if (queue.length > 0) sendOne(loop); }
  loop();
};
$("b4b").onclick = function () {
  $("b4b").disabled = true;
  $("m4").textContent = "Protons rush back through ATP synthase. It spins and makes ATP...";
  var removed = 0, given = 0;
  var timer = setInterval(function () {
    var d = pDots.pop();
    if (d) { d.remove(); removed++; }
    var shouldHave = Math.round(removed / totalDots * 26);
    atp += shouldHave - given;
    given = shouldHave;
    updateTotals();
    $("pcount").textContent = pDots.length;
    if (pDots.length === 0) {
      clearInterval(timer);
      $("m4").textContent = "+26 ATP! Oxygen took the electrons and made 6 H2O. Total ATP = " + atp + ". You finished cellular respiration!";
      $("again").style.display = "inline-block";
      finish(4);
    }
  }, 60);
};
$("again").onclick = function () { location.reload(); };

updateTotals();
show(1);
