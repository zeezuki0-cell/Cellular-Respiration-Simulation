// Cellular respiration simulation
var atp = 0, nadh = 0, fadh = 0, co2 = 0;
var current = 1;     // stage we are looking at
var unlocked = 1;    // furthest stage unlocked
var done = {};       // which stages are finished
var turns = 0;
var carriersUsed = 0;

function $(id) { return document.getElementById(id); }

function updateTotals() {
  $("tATP").textContent = atp;
  $("tNADH").textContent = nadh;
  $("tFADH").textContent = fadh;
  $("tCO2").textContent = co2;
}

function show(n) {
  current = n;
  for (var i = 1; i <= 4; i++) {
    $("s" + i).className = (i === n) ? "stage show" : "stage";
  }
  var tabs = document.querySelectorAll("#tabs button");
  for (var j = 0; j < tabs.length; j++) {
    var num = j + 1;
    tabs[j].className = (num === n) ? "active" : "";
    tabs[j].disabled = num > unlocked;
  }
  $("back").disabled = (n === 1);
  $("next").disabled = !done[n] || n === 4;
}

function finish(n) {
  done[n] = true;
  if (n < 4 && unlocked < n + 1) unlocked = n + 1;
  show(current);
}

// tabs + back/next
var tabButtons = document.querySelectorAll("#tabs button");
for (var t = 0; t < tabButtons.length; t++) {
  tabButtons[t].onclick = function () { show(Number(this.dataset.n)); };
}
$("back").onclick = function () { show(current - 1); };
$("next").onclick = function () { show(current + 1); };

// ---------- Stage 1: Glycolysis ----------
$("b1a").onclick = function () {
  $("m1").textContent = "2 ATP spent to get the glucose ready.";
  $("b1a").disabled = true;
  $("b1b").disabled = false;
};
$("b1b").onclick = function () {
  $("area1").innerHTML = '<div class="mol pyr done">Pyruvate (3C)</div><div class="mol pyr done">Pyruvate (3C)</div>';
  $("m1").textContent = "Glucose split into 2 pyruvate!";
  $("b1b").disabled = true;
  $("b1c").disabled = false;
};
$("b1c").onclick = function () {
  atp += 2;   // 4 made - 2 spent = net 2
  nadh += 2;
  updateTotals();
  $("m1").textContent = "Made 4 ATP, spent 2, so net +2 ATP. Also +2 NADH.";
  $("b1c").disabled = true;
  finish(1);
};

// ---------- Stage 2: Pyruvate oxidation ----------
var converted = 0;
function convert(id) {
  var el = $(id);
  if (el.classList.contains("done")) return;
  el.classList.add("done");
  el.textContent = "Acetyl-CoA";
  co2 += 1;
  nadh += 1;
  converted++;
  updateTotals();
  $("m2").textContent = "CO2 released and NADH made. (" + converted + "/2)";
  if (converted === 2) {
    $("m2").textContent = "Both done! Total from this stage: 2 CO2 and 2 NADH.";
    finish(2);
  }
}
$("p1").onclick = function () { convert("p1"); };
$("p2").onclick = function () { convert("p2"); };

// ---------- Stage 3: Krebs cycle ----------
$("b3").onclick = function () {
  if (turns >= 2) return;
  turns++;
  $("cycle").style.transform = "rotate(" + (turns * 360) + "deg)";
  atp += 1;
  nadh += 3;
  fadh += 1;
  co2 += 2;
  updateTotals();
  $("turns").textContent = turns;
  $("m3").textContent = "Turn " + turns + ": +1 ATP, +3 NADH, +1 FADH2, +2 CO2";
  if (turns === 2) {
    $("b3").disabled = true;
    $("m3").textContent = "Cycle finished! Now the carriers go to the electron transport chain.";
    finish(3);
  }
};

// ---------- Stage 4: Electron transport chain ----------
function carriersTotal() { return nadh + fadh; }

$("s4").addEventListener("click", function () {}); // (nothing, just here for clarity)

$("tabs").addEventListener("click", function () {
  if (current === 4 && carriersUsed === 0) $("left").textContent = carriersTotal();
});
$("next").addEventListener("click", function () {
  if (current === 4 && carriersUsed === 0) $("left").textContent = carriersTotal();
});

$("b4a").onclick = function () {
  var total = carriersTotal();
  if (carriersUsed >= total) return;
  carriersUsed++;
  $("left").textContent = total - carriersUsed;
  $("fill").style.width = (carriersUsed / total * 100) + "%";
  $("m4").textContent = "Protons pumped across the membrane...";
  if (carriersUsed === total) {
    $("b4a").disabled = true;
    $("b4b").disabled = false;
    $("m4").textContent = "Gradient is full! Open ATP synthase.";
  }
};
$("b4b").onclick = function () {
  atp += 26;
  updateTotals();
  $("fill").style.width = "0%";
  $("b4b").disabled = true;
  $("m4").textContent = "+26 ATP! Oxygen took the electrons and made 6 H2O. Total ATP = " + atp + ". You finished cellular respiration!";
  $("again").style.display = "inline-block";
  finish(4);
};
$("again").onclick = function () { location.reload(); };

updateTotals();
show(1);
