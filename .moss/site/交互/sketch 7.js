var angle;
var trees = [];           // Store tree data for consistent animation
var time = 0;             // Animation time
var prevMouseX = 0;       // Previous mouse X for velocity
var wind = 0;             // Current wind force (what trees feel)
var targetWind = 0;       // What wind is easing toward

// Global wind state for absolute coordinate response
var windAngle = 0;        // Wind direction in world space (radians)
var windStrength = 0;     // Combined wind magnitude
var gustStrength = 0;     // Mouse-driven gust component

// Wind detail tiers (performance: only compute trig for visible branches)
var idleSwayAmplitude = 0.5;
var WIND_DETAIL_GEN = 8;   // Full 3-harmonic wind for gen < this
var WIND_SIMPLE_GEN = 10;  // Inherited sway for gen < this; none beyond
var flexLookup = [];
var yellowColor;

function setup() {
  // Disable friendly errors for better performance
  p5.disableFriendlyErrors = true;

  // Reduce pixel density for performance on retina displays
  pixelDensity(1);

  // Use 2D canvas (WebGL is slower for immediate mode line drawing with 110K+ shapes)
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 100);

  // Pre-compute lookup tables (replaces per-branch Math.pow)
  for (var g = 0; g < 20; g++) {
    flexLookup[g] = Math.pow(1.25, g) * 0.02;
  }
  yellowColor = color('yellow');

  // Pre-compute star data
  initStarData();

  // Pre-generate tree data for consistent animation
  generateTrees();
}

function generateTrees() {
  trees = [];
  // Scale tree size based on smaller dimension
  var baseScale = min(width, height) / 800 * 130;

  for (var i = 0; i < 2 * PI; i += 2 * PI / 13) {
    var baseX = sin(i) * width / sqrt(2) + width / 2;
    var baseY = cos(i) * height / sqrt(2) + height / 2;
    trees.push({
      angle: i,
      x: baseX * random(0.9, 1.1),
      y: baseY * random(0.9, 1.1),
      rotation: -i * random(0.9, 1.1),
      scale: baseScale * random(0.6, 1.4),
      branchSeeds: generateBranchSeeds()
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateTrees();
}

function mousePressed() {
  // Request fullscreen on click
  var fs = fullscreen();
  fullscreen(!fs);
}

function generateBranchSeeds() {
  var seeds = [];
  for (var i = 0; i < 100; i++) {
    seeds.push({
      split: random(),
      leftAngle: random(1, 1.2),
      rightAngle: random(0.8, 1),
      lengthMult: random(0.9, 1.1),
      curve: random(-1, 1),  // curve direction for organic bezier
      phase1: random(TWO_PI),
      phase2: random(TWO_PI),
      phase3: random(TWO_PI)
    });
  }
  return seeds;
}

function draw() {
  background(0);

  noFill();
  a = 3;
  b = 0.25;
  d = 1.8;

  // Update time (frame-independent, scaled to match original 60fps timing)
  // Original: time += 0.01 at 60fps = 0.6 units/sec
  // deltaTime * 0.001 = 1.0 units/sec, so use 0.0006 to match original
  var dt = deltaTime * 0.001;
  time += dt * 0.6;  // Scale to match original timing

  // Frame-rate independent lerp factor: converts per-frame factor to time-based
  // Formula: 1 - (1 - factor)^(dt * 60) approximates frame-independent smoothing
  var lerpFactor = 1 - Math.pow(0.92, dt * 60);  // ~0.08 equivalent at 60fps
  var lerpFactorSlow = 1 - Math.pow(0.95, dt * 60);  // ~0.05 equivalent at 60fps

  // Calculate mouse velocity
  var mouseVelocity = mouseX - prevMouseX;
  prevMouseX = mouseX;

  // Two-stage easing for mouse-driven gusts (now frame-rate independent)
  targetWind = lerp(targetWind, mouseVelocity * 0.01, lerpFactor);
  wind = lerp(wind, targetWind, lerpFactorSlow);

  // === GLOBAL WIND (absolute coordinates) ===
  // Perlin noise for natural wind variation (slower)
  var baseWindStrength = (noise(time * 0.3) - 0.5) * 0.15;
  windAngle = noise(time * 0.1, 100) * TWO_PI;  // Direction shifts slowly

  // Mouse gusts add horizontal force (frame-rate independent)
  gustStrength = lerp(gustStrength, mouseVelocity * 0.008, lerpFactorSlow);

  // Combined wind strength
  windStrength = baseWindStrength + gustStrength;

  // === STARS: Rotating + Zooming Fractal ===
  // Cyclic zoom: size oscillates for infinite zoom effect
  var zoomCycle = 3.5 + sin(time * 0.15) * 1.5;  // very slow oscillation

  push();
  translate(width / 2, height / 2);
  rotate(time * 0.04);  // Very slow rotation
  translate(-width / 2, -height / 2);
  stars(width / 2, height / 2, zoomCycle);
  pop();

  // === TREES: Wind in absolute coordinates ===
  angle = PI / 14;

  for (var i = 0; i < trees.length; i++) {
    var tree = trees[i];

    // Dual-frequency ambient sway at tree base (non-repeating, organic)
    var ambientSway = sin(time * 0.8 + i * 0.5) * 0.015
                    + sin(time * 1.7 + i * 1.3) * 0.005;

    push();
    stroke(255);
    translate(tree.x, tree.y);
    rotate(tree.rotation + ambientSway);

    currentSeedIndex = 0;
    currentBranchSeeds = tree.branchSeeds;

    // Pass tree's base rotation as initial worldRotation
    branch(tree.scale, 1, tree.rotation + ambientSway, 0, 0);
    pop();
  }
}

var currentSeedIndex = 0;
var currentBranchSeeds = [];

// Pre-computed star colors and angles for performance
var starColors = [];
var starAngles = [];
var n_circle = 40;

function initStarData() {
  for (var i = 0; i < n_circle; i++) {
    starColors[i] = color(i * 100 / n_circle, 70, 70, 50);
    starAngles[i] = i * 2 * PI / 11;
  }
}

function stars(x, y, size) {
  for (var i = 0; i < n_circle; i++) {
    var theta = starAngles[i];
    var r = a * Math.exp(b * theta) * size;
    var xNew = x + r * Math.cos(theta);
    var yNew = y + r * Math.sin(theta);

    stroke(starColors[i]);

    if (size > d) {
      stars(xNew, yNew, size * 0.6);
    } else {
      ellipse(xNew, yNew, d, d);
    }
  }
}

function branch(len, generation, worldRotation, phaseOffset, parentSway) {
  var seed = currentBranchSeeds[currentSeedIndex % currentBranchSeeds.length];
  currentSeedIndex++;

  strokeWeight(map(generation, 1, 10, 4, 0.2));

  if (len < 3) {
    stroke(yellowColor);
  }

  // Draw curved branch using quadratic bezier
  var curveOffset = len * 0.15 * seed.curve;
  noFill();
  beginShape();
  vertex(0, 0);
  quadraticVertex(curveOffset, -len * 0.5, 0, -len);
  endShape();

  translate(0, -len);

  len *= (0.66 * seed.lengthMult);
  generation++;

  // === THREE-TIER WIND PHYSICS ===
  var flexibility = flexLookup[generation] || 0;
  var branchSway;
  var newPhaseOffset;

  if (generation < WIND_DETAIL_GEN) {
    // === RICH: multi-harmonic idle sway + wind (gen 0-7, ~3% of branches) ===
    newPhaseOffset = phaseOffset + 0.15;
    var effectiveTime = time - newPhaseOffset;

    // 3-harmonic idle sway — tips flutter faster than main branches
    var freq1 = 1.2 + generation * 0.3;
    var idleSway = flexibility * idleSwayAmplitude * (
      Math.sin(effectiveTime * freq1 + seed.phase1) * 0.6 +
      Math.sin(effectiveTime * freq1 * 2.1 + seed.phase2) * 0.3 +
      Math.sin(effectiveTime * freq1 * 4.7 + seed.phase3) * 0.1
    );

    // Wind: directional bias layered on top of idle sway
    var localWindComponent = Math.sin(windAngle - worldRotation);
    var windSway = windStrength * localWindComponent * flexibility;

    branchSway = idleSway + windSway;
  } else if (generation < WIND_SIMPLE_GEN) {
    // === SIMPLE: inherit parent sway with damping (gen 8-9, ~6%) ===
    newPhaseOffset = phaseOffset;
    branchSway = parentSway * 0.7;
  } else {
    // === NONE: sub-pixel branches, skip wind entirely (gen 10+, ~91%) ===
    newPhaseOffset = phaseOffset;
    branchSway = 0;
  }

  if (len > 0.5) {
    if (seed.split < 0.8) {
      var leftRot = angle * seed.leftAngle + branchSway;
      push();
      rotate(leftRot);
      branch(len, generation, worldRotation + leftRot, newPhaseOffset, branchSway);
      pop();
    }

    var rightRot = -angle * seed.rightAngle + branchSway;
    push();
    rotate(rightRot);
    branch(len, generation, worldRotation + rightRot, newPhaseOffset, branchSway);
    pop();
  }
}
