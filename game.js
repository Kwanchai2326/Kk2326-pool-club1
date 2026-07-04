/**
 * Pocket Club - Retro 8-Ball Shootout Game
 * Core JavaScript with custom Web Audio API synthesizer, 2D physics engine, pocket triggers, and particle systems.
 */

// --- Audio Synthesizer Class ---
class BilliardsAudio {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  createGainNode(duration) {
    this.init();
    if (!this.ctx || this.muted) return null;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    gainNode.connect(this.ctx.destination);
    return gainNode;
  }

  playStrike(powerPct) {
    const gainNode = this.createGainNode(0.3);
    if (!gainNode) return;

    // Sweeping friction / stroke sound
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    // Noise burst overlay for wood hit
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18 * powerPct, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(gainNode);
    osc.connect(gainNode);

    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.2);
    noise.stop(this.ctx.currentTime + 0.2);
  }

  playBallCollision(speed) {
    const intensity = Math.min(1.0, speed / 8);
    if (intensity < 0.05) return; // Silent on tiny touches
    
    const gainNode = this.createGainNode(0.15);
    if (!gainNode) return;
    gainNode.gain.setValueAtTime(this.volume * intensity, this.ctx.currentTime);

    // High frequency knock
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    // Slightly randomize pitch for realistic acoustic variety
    const baseFreq = 1600 + Math.random() * 200;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

    osc.connect(gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCushion(speed) {
    const intensity = Math.min(1.0, speed / 6);
    if (intensity < 0.08) return;

    const gainNode = this.createGainNode(0.25);
    if (!gainNode) return;
    gainNode.gain.setValueAtTime(this.volume * intensity * 0.7, this.ctx.currentTime);

    // Low wood thud
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);

    // Noise layer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(gainNode);
    osc.connect(gainNode);

    osc.start();
    noise.start();
    osc.stop(this.ctx.currentTime + 0.25);
    noise.stop(this.ctx.currentTime + 0.25);
  }

  playPocket() {
    const gainNode = this.createGainNode(0.6);
    if (!gainNode) return;

    // Resonant bubble plop
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);

    // Second oscillator for hollow ring
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gain2);
    gain2.connect(gainNode);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.4);
    osc2.stop(this.ctx.currentTime + 0.4);
  }

  playScore() {
    const gainNode = this.createGainNode(0.5);
    if (!gainNode) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
      
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.3);
      
      osc.connect(subGain);
      subGain.connect(gainNode);
      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
    });
  }

  playScratch() {
    const gainNode = this.createGainNode(0.6);
    if (!gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.4);

    osc.connect(gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.55);
  }
}

const audio = new BilliardsAudio();

// --- Game Settings & Local Highscores ---
const settings = {
  volume: 80,
  guidelineEnabled: true
};

const scores = {
  classic: [],
  survival: []
};

function loadSavedData() {
  const savedSettings = localStorage.getItem('poolclub_settings');
  if (savedSettings) {
    const parsed = JSON.parse(savedSettings);
    settings.volume = parsed.volume ?? 80;
    settings.guidelineEnabled = parsed.guidelineEnabled ?? true;
    audio.setVolume(settings.volume / 100);
    
    document.getElementById('volume-slider').value = settings.volume;
    document.getElementById('volume-label').textContent = `${settings.volume}%`;
    document.getElementById('guideline-toggle').checked = settings.guidelineEnabled;
  }
  
  const savedScores = localStorage.getItem('poolclub_scores');
  if (savedScores) {
    Object.assign(scores, JSON.parse(savedScores));
  }
}

function saveSettings() {
  localStorage.setItem('poolclub_settings', JSON.stringify(settings));
}

function saveScores() {
  localStorage.setItem('poolclub_scores', JSON.stringify(scores));
}

function addHighScore(mode, score) {
  const entry = {
    date: new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric'}),
    score: score
  };
  scores[mode].push(entry);
  scores[mode].sort((a, b) => b.score - a.score);
  scores[mode] = scores[mode].slice(0, 5); // top 5
  saveScores();
  return scores[mode][0].score === score;
}

// --- Canvas Configuration ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const virtualWidth = 900;
const virtualHeight = 480;
let scaleFactor = 1;

// Table Layout Specifications
const table = {
  x: 50,
  y: 50,
  width: 800,
  height: 380,
  cushionWidth: 26,
  
  // Cushion Boundaries
  get left() { return this.x + this.cushionWidth; },
  get right() { return this.x + this.width - this.cushionWidth; },
  get top() { return this.y + this.cushionWidth; },
  get bottom() { return this.y + this.height - this.cushionWidth; }
};

// 6 Table Pocket Coordinates
const pockets = [
  { x: table.left, y: table.top, radius: 24 }, // Top-Left
  { x: table.x + table.width / 2, y: table.top - 4, radius: 22 }, // Top-Middle
  { x: table.right, y: table.top, radius: 24 }, // Top-Right
  
  { x: table.left, y: table.bottom, radius: 24 }, // Bottom-Left
  { x: table.x + table.width / 2, y: table.bottom + 4, radius: 22 }, // Bottom-Middle
  { x: table.right, y: table.bottom, radius: 24 } // Bottom-Right
];

// Physics Coefficients
const physics = {
  friction: 0.988,       // Exponential deceleration
  ballRadius: 11,
  pocketShrink: 0.85,    // speed of shrink when falling
  elasticity: 0.8,       // restitution on cushion bounce
  restitution: 0.95      // restitution on ball-to-ball bounce
};

// Colors mapping for standard 8-ball set
const ballColors = {
  1: '#f9d300', // Yellow
  2: '#0054ff', // Blue
  3: '#ff003c', // Red
  4: '#7a00ff', // Purple
  5: '#ff7000', // Orange
  6: '#00a316', // Green
  7: '#a00030', // Maroon
  8: '#111115', // Black (Solid)
  9: '#f9d300', // Stripe Yellow
  10: '#0054ff', // Stripe Blue
  11: '#ff003c', // Stripe Red
  12: '#7a00ff', // Stripe Purple
  13: '#ff7000', // Stripe Orange
  14: '#00a316', // Stripe Green
  15: '#a00030' // Stripe Maroon
};

// --- Game Objects ---
class Ball {
  constructor(number, x, y) {
    this.number = number; // 0 = cue ball, 1-15 = colored balls
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = physics.ballRadius;
    this.active = true;
    this.pocketing = false;
    this.scale = 1.0;
    this.pocketTarget = null;
  }

  update() {
    if (!this.active) return;

    if (this.pocketing) {
      // Guide the ball slowly into the center of the pocket while shrinking
      const dx = this.pocketTarget.x - this.x;
      const dy = this.pocketTarget.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist > 2) {
        this.x += (dx / dist) * 2.5;
        this.y += (dy / dist) * 2.5;
      }
      
      this.scale *= physics.pocketShrink;
      
      if (this.scale < 0.1) {
        this.active = false;
        this.pocketing = false;
        handleBallPocketed(this);
      }
      return;
    }

    // Apply Velocity
    this.x += this.vx;
    this.y += this.vy;

    // Apply Friction
    this.vx *= physics.friction;
    this.vy *= physics.friction;

    // Clamp tiny velocities to zero
    if (Math.abs(this.vx) < 0.05) this.vx = 0;
    if (Math.abs(this.vy) < 0.05) this.vy = 0;
    
    // Check Pocket Collisions
    for (let p of pockets) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      // Center of the ball entering pocket threshold
      if (dist < p.radius - 2) {
        this.pocketing = true;
        this.pocketTarget = p;
        this.vx *= 0.25;
        this.vy *= 0.25;
        audio.playPocket();
        break;
      }
    }
  }

  draw() {
    if (!this.active) return;

    const r = this.radius * this.scale;
    
    ctx.save();
    ctx.translate(this.x, this.y);

    // Ball Base Color
    let color = '#ffffff'; // Cue Ball
    if (this.number > 0) color = ballColors[this.number];
    
    // Smooth 3D sphere gradient highlight
    const radial = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
    radial.addColorStop(0, '#ffffff');
    radial.addColorStop(0.2, color);
    radial.addColorStop(1, this.number === 8 ? '#000000' : adjustColorBrightness(color, -0.4));
    ctx.fillStyle = radial;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Draw Stripes
    if (this.number >= 9) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      // Draw white sides
      ctx.arc(0, 0, r, Math.PI/4, 3*Math.PI/4);
      ctx.arc(0, 0, r, 5*Math.PI/4, 7*Math.PI/4);
      ctx.fill();
    }

    // Number Circle overlay (if not cue ball)
    if (this.number > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Number text
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.max(6, r * 0.6)}px Montserrat`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.number, 0, 0);
    }
    
    ctx.restore();
  }
}

// Cue stick and Aiming line helper
const cue = {
  angle: 0,
  power: 0,
  maxPower: 12,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  currentDragX: 0,
  currentDragY: 0,
  striking: false,
  strikeOffset: 0
};

// Particles list
const particles = [];
class SparkParticle {
  constructor(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.life--;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

function spawnImpactSparks(x, y, speed) {
  const count = Math.min(25, Math.floor(speed * 3) + 4);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const pSpeed = Math.random() * (speed * 0.3) + 0.5;
    particles.push(new SparkParticle(
      x, y,
      Math.cos(angle) * pSpeed,
      Math.sin(angle) * pSpeed,
      '#00f3ff',
      Math.random() * 2 + 1,
      Math.random() * 20 + 20
    ));
  }
}

function spawnPocketWave(x, y) {
  const colors = ['#ff007f', '#00f3ff', '#ffffff'];
  for (let i = 0; i < 35; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1.5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new SparkParticle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      Math.random() * 3 + 1.5,
      Math.random() * 15 + 15
    ));
  }
}

// Game State Values
let balls = [];
let cueBall = null;
const gameState = {
  mode: 'classic', // classic, survival
  status: 'menu',  // menu, playing, gameover
  score: 0,
  combo: 1,
  pocketedInTurn: 0,
  ballsRemaining: 15,
  timeLeft: 90,
  gameTimer: null
};

// Helper: darken colors for gradient depth
function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (1 + percent));
  G = parseInt(G * (1 + percent));
  B = parseInt(B * (1 + percent));

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// --- Ball Triangle Rack Positioning ---
function rackBalls() {
  balls = [];
  
  // Create Cue Ball
  cueBall = new Ball(0, 250, table.y + table.height/2);
  balls.push(cueBall);

  // Position apex of triangle
  const apexX = 620;
  const apexY = table.y + table.height/2;
  const spacing = physics.ballRadius * 2 + 1.5;
  
  // Ball arrangement indices to match standard 8-ball layouts
  // Row 1: (1)
  // Row 2: (2, 3)
  // Row 3: (4, 8, 5) <-- 8-ball in center!
  // Row 4: (6, 7, 9, 10)
  // Row 5: (11, 12, 13, 14, 15)
  const numbers = [1, 2, 9, 3, 8, 10, 4, 11, 5, 12, 6, 13, 7, 14, 15];
  let numIdx = 0;

  for (let r = 0; r < 5; r++) {
    const rowX = apexX + r * (spacing * 0.866); // cos(30 deg) projection
    for (let c = 0; c <= r; c++) {
      const rowY = apexY + (c - r * 0.5) * spacing;
      balls.push(new Ball(numbers[numIdx++], rowX, rowY));
    }
  }

  gameState.ballsRemaining = 15;
}

// --- Core Game Flow State Managers ---

function startGame() {
  audio.init();
  showOverlay(''); // hide menus
  
  gameState.status = 'playing';
  gameState.score = 0;
  gameState.combo = 1;
  gameState.pocketedInTurn = 0;
  
  // Show UI panels
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('power-gauge').classList.remove('hidden');
  document.getElementById('score-value').textContent = '00000';
  document.getElementById('multiplier-value').textContent = '1x';
  document.getElementById('multiplier-bar').style.width = '0%';
  document.getElementById('power-bar').style.height = '0%';
  
  rackBalls();
  particles.length = 0;

  // Manage Game Timer Countdown
  if (gameState.mode === 'classic') {
    gameState.timeLeft = 90;
    document.getElementById('time-value').textContent = '90';
    document.getElementById('time-value').parentElement.classList.remove('low-status');
    
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = setInterval(() => {
      gameState.timeLeft--;
      document.getElementById('time-value').textContent = gameState.timeLeft;
      
      if (gameState.timeLeft <= 15) {
        document.getElementById('time-value').parentElement.classList.add('low-status');
      }
      
      if (gameState.timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  } else {
    // Survival Mode starts with fewer seconds but strict penalties
    gameState.timeLeft = 60;
    document.getElementById('time-value').textContent = '60';
    document.getElementById('time-value').parentElement.classList.remove('low-status');
    
    clearInterval(gameState.gameTimer);
    gameState.gameTimer = setInterval(() => {
      gameState.timeLeft--;
      document.getElementById('time-value').textContent = gameState.timeLeft;
      
      if (gameState.timeLeft <= 10) {
        document.getElementById('time-value').parentElement.classList.add('low-status');
      }
      
      if (gameState.timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }
}

function endGame() {
  clearInterval(gameState.gameTimer);
  gameState.status = 'gameover';
  audio.playScratch(); // fail tone
  
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('power-gauge').classList.add('hidden');
  
  showOverlay('game-over-menu');
  
  const finalScoreEl = document.getElementById('final-score');
  finalScoreEl.textContent = String(gameState.score).padStart(5, '0');
  
  const sunkCount = 15 - gameState.ballsRemaining;
  document.getElementById('balls-sunk-val').textContent = `${sunkCount} / 15`;
  
  // Record record scores
  const isNewRecord = addHighScore(gameState.mode, gameState.score);
  const tag = document.getElementById('new-high-score-tag');
  if (isNewRecord && gameState.score > 0) {
    tag.style.display = 'block';
  } else {
    tag.style.display = 'none';
  }
}

function handleBallPocketed(ball) {
  if (ball.number === 0) {
    // Cue Ball Pocketed (SCRATCH!)
    audio.playScratch();
    
    // Penalize Time
    gameState.timeLeft = Math.max(0, gameState.timeLeft - 10);
    document.getElementById('time-value').textContent = gameState.timeLeft;
    
    // Flash HUD timer warning red
    const hudItem = document.getElementById('time-value').parentElement;
    hudItem.style.borderColor = 'var(--neon-magenta)';
    setTimeout(() => { hudItem.style.borderColor = ''; }, 600);
    
    // Reset Cue ball back to kitchen after frame rolling ends
    // Wait for all balls to settle before spawning cue ball back
    setTimeout(() => {
      if (gameState.status === 'playing') {
        cueBall.x = 250;
        cueBall.y = table.y + table.height/2;
        cueBall.vx = 0;
        cueBall.vy = 0;
        cueBall.scale = 1.0;
        cueBall.active = true;
        cueBall.pocketing = false;
      }
    }, 1000);
    
    // Reset Streak Multiplier
    gameState.combo = 1;
    document.getElementById('multiplier-value').textContent = '1x';
    document.getElementById('multiplier-bar').style.width = '0%';
    
  } else {
    // Sunk object ball successfully
    gameState.ballsRemaining--;
    gameState.pocketedInTurn++;
    
    // Calculate Score gained
    audio.playScore();
    spawnPocketWave(ball.x, ball.y);
    
    // Reward points scaled by streak multiplier
    const basePoints = 200;
    const gainedPoints = basePoints * gameState.combo;
    gameState.score += gainedPoints;
    document.getElementById('score-value').textContent = String(gameState.score).padStart(5, '0');
    
    // Add Bonus Time
    const rewardSeconds = gameState.mode === 'classic' ? 10 : 8;
    gameState.timeLeft += rewardSeconds;
    document.getElementById('time-value').textContent = gameState.timeLeft;
    
    // Flash Timer green for bonus time success
    const hudItem = document.getElementById('time-value').parentElement;
    hudItem.style.borderColor = 'var(--neon-green)';
    setTimeout(() => { hudItem.style.borderColor = ''; }, 600);
    
    // Check Win condition (all 15 balls cleared)
    if (gameState.ballsRemaining <= 0) {
      // Rerack and keep going to score higher!
      audio.playScore();
      rackBalls();
      gameState.timeLeft += 30; // bonus time for clearing table
    }
  }
}

// Check if any balls are still moving on table
function isTableRolling() {
  for (let b of balls) {
    if (b.active && (b.vx !== 0 || b.vy !== 0 || b.pocketing)) {
      return true;
    }
  }
  return false;
}

// --- Aiming Guideline Projection Math ---
function getGuidelineImpactPoint() {
  const startX = cueBall.x;
  const startY = cueBall.y;
  
  // Aiming direction vectors
  const dx = Math.cos(cue.angle);
  const dy = Math.sin(cue.angle);
  
  let closestDist = Infinity;
  let collisionTarget = null;
  let collisionType = ''; // 'cushion' or 'ball'
  let impactX = 0;
  let impactY = 0;
  
  // 1. Raycast Cushion boundary intersections
  // Left Cushion: x = table.left
  if (dx < 0) {
    const dist = (table.left + physics.ballRadius - startX) / dx;
    if (dist > 0 && dist < closestDist) {
      closestDist = dist;
      impactX = table.left + physics.ballRadius;
      impactY = startY + dy * dist;
      collisionType = 'cushion';
    }
  }
  // Right Cushion: x = table.right
  if (dx > 0) {
    const dist = (table.right - physics.ballRadius - startX) / dx;
    if (dist > 0 && dist < closestDist) {
      closestDist = dist;
      impactX = table.right - physics.ballRadius;
      impactY = startY + dy * dist;
      collisionType = 'cushion';
    }
  }
  // Top Cushion: y = table.top
  if (dy < 0) {
    const dist = (table.top + physics.ballRadius - startY) / dy;
    if (dist > 0 && dist < closestDist) {
      closestDist = dist;
      impactX = startX + dx * dist;
      impactY = table.top + physics.ballRadius;
      collisionType = 'cushion';
    }
  }
  // Bottom Cushion: y = table.bottom
  if (dy > 0) {
    const dist = (table.bottom - physics.ballRadius - startY) / dy;
    if (dist > 0 && dist < closestDist) {
      closestDist = dist;
      impactX = startX + dx * dist;
      impactY = table.bottom - physics.ballRadius;
      collisionType = 'cushion';
    }
  }
  
  // 2. Raycast against all other active balls
  const r2 = physics.ballRadius * 2;
  for (let b of balls) {
    if (!b.active || b.number === 0 || b.pocketing) continue;
    
    // Vector from cue ball to target ball center
    const cx = b.x - startX;
    const cy = b.y - startY;
    
    // Project target center onto ray
    const proj = cx * dx + cy * dy;
    if (proj <= 0) continue; // target ball is behind cue ball
    
    // Distance squared from target center to ray path
    const perpSq = (cx*cx + cy*cy) - proj*proj;
    const limitSq = r2 * r2;
    
    if (perpSq < limitSq) {
      // Intersection exists! Find exact distance along ray
      const offset = Math.sqrt(limitSq - perpSq);
      const dist = proj - offset;
      
      if (dist > 0 && dist < closestDist) {
        closestDist = dist;
        impactX = startX + dx * dist;
        impactY = startY + dy * dist;
        collisionTarget = b;
        collisionType = 'ball';
      }
    }
  }
  
  return {
    type: collisionType,
    target: collisionTarget,
    x: impactX,
    y: impactY,
    dist: closestDist
  };
}

// --- Physics Engine Loops ---

function updatePhysics() {
  if (gameState.status !== 'playing') return;

  const rollingBefore = isTableRolling();

  // 1. Update individual ball positions
  for (let b of balls) {
    b.update();
  }

  // 2. Resolve Ball-to-Ball Collisions (Elastic momentum + overlap resolution)
  const len = balls.length;
  for (let i = 0; i < len; i++) {
    const bi = balls[i];
    if (!bi.active || bi.pocketing) continue;

    for (let j = i + 1; j < len; j++) {
      const bj = balls[j];
      if (!bj.active || bj.pocketing) continue;

      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 0.0001;
      const minDist = bi.radius + bj.radius;

      if (dist < minDist) {
        // Resolve Overlap (push apart equally)
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        bi.x -= nx * overlap * 0.5;
        bi.y -= ny * overlap * 0.5;
        bj.x += nx * overlap * 0.5;
        bj.y += ny * overlap * 0.5;

        // Relative velocity projection
        const rvx = bi.vx - bj.vx;
        const rvy = bi.vy - bj.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        // If moving towards each other, resolve momentum exchange
        if (velAlongNormal > 0) {
          const impulse = velAlongNormal * physics.restitution;
          
          bi.vx -= nx * impulse;
          bi.vy -= ny * impulse;
          bj.vx += nx * impulse;
          bj.vy += ny * impulse;

          // Sound trigger and spark particles based on collision magnitude
          audio.playBallCollision(velAlongNormal);
          if (velAlongNormal > 1.5) {
            spawnImpactSparks((bi.x + bj.x)/2, (bi.y + bj.y)/2, velAlongNormal);
          }
        }
      }
    }
  }

  // 3. Resolve Ball-to-Cushion boundary limits
  for (let b of balls) {
    if (!b.active || b.pocketing) continue;

    // Left cushion
    if (b.x - b.radius < table.left) {
      b.x = table.left + b.radius;
      b.vx = -b.vx * physics.elasticity;
      audio.playCushion(Math.abs(b.vx));
    }
    // Right cushion
    if (b.x + b.radius > table.right) {
      b.x = table.right - b.radius;
      b.vx = -b.vx * physics.elasticity;
      audio.playCushion(Math.abs(b.vx));
    }
    // Top cushion
    if (b.y - b.radius < table.top) {
      b.y = table.top + b.radius;
      b.vy = -b.vy * physics.elasticity;
      audio.playCushion(Math.abs(b.vy));
    }
    // Bottom cushion
    if (b.y + b.radius > table.bottom) {
      b.y = table.bottom - b.radius;
      b.vy = -b.vy * physics.elasticity;
      audio.playCushion(Math.abs(b.vy));
    }
  }

  // 4. Check Turn Completion Settle State
  const rollingAfter = isTableRolling();
  if (rollingBefore && !rollingAfter) {
    // All balls have settled down!
    handleTurnSettled();
  }
}

// Manage combo streaks when balls settle
function handleTurnSettled() {
  if (gameState.pocketedInTurn > 0) {
    // Player pocketed object ball(s) this turn, advance multiplier
    gameState.combo += gameState.pocketedInTurn;
    
    // Clamp max streak multiplier
    gameState.combo = Math.min(10, gameState.combo);
    
    document.getElementById('multiplier-value').textContent = `${gameState.combo}x`;
    
    // Bar animations
    const multBar = document.getElementById('multiplier-bar');
    const pct = Math.min(100, (gameState.combo / 10) * 100);
    multBar.style.width = `${pct}%`;
    
    if (gameState.combo >= 5) {
      document.getElementById('multiplier-value').classList.add('blinking');
    }
  } else {
    // Missed this turn, break combo back to 1x
    gameState.combo = 1;
    document.getElementById('multiplier-value').textContent = '1x';
    document.getElementById('multiplier-value').classList.remove('blinking');
    document.getElementById('multiplier-bar').style.width = '0%';
  }
  
  gameState.pocketedInTurn = 0;
}

// --- Aiming Controls and Input Handling ---
function initInputs() {
  const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) / (rect.width / virtualWidth),
      y: (clientY - rect.top) / (rect.height / virtualHeight)
    };
  };

  const handleStart = (e) => {
    if (gameState.status !== 'playing' || isTableRolling() || !cueBall.active) return;
    
    audio.init(); // setup audio on interaction

    const pos = getMousePos(e);
    
    // Check if player clicked near the cue ball to start aiming/dragging
    const dx = pos.x - cueBall.x;
    const dy = pos.y - cueBall.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 45) { // broad tap zone around cue ball
      cue.dragging = true;
      cue.dragStartX = pos.x;
      cue.dragStartY = pos.y;
      cue.currentDragX = pos.x;
      cue.currentDragY = pos.y;
      cue.power = 0;
    }
  };

  const handleMove = (e) => {
    if (!cue.dragging) return;
    const pos = getMousePos(e);
    
    cue.currentDragX = pos.x;
    cue.currentDragY = pos.y;
    
    // Aim angle is drawn opposite to pull-back direction
    const dx = cue.dragStartX - cue.currentDragX;
    const dy = cue.dragStartY - cue.currentDragY;
    const dist = Math.sqrt(dx*dx + dy*dy) || 0.001;

    // Angle of shot projection
    cue.angle = Math.atan2(dy, dx);
    
    // Power proportional to drag length
    cue.power = Math.min(cue.maxPower, dist * 0.07);
    
    // Update vertical HUD power meter height percentage
    const powerPct = (cue.power / cue.maxPower) * 100;
    document.getElementById('power-bar').style.height = `${powerPct}%`;
  };

  const handleEnd = () => {
    if (!cue.dragging) return;
    cue.dragging = false;
    
    // Strike ball if power is registered
    if (cue.power > 0.6) {
      cue.striking = true;
      cue.strikeOffset = -25; // animate pull forward impact
      
      const shoot = () => {
        // Strike cue ball in angle direction with power speed
        cueBall.vx = Math.cos(cue.angle) * cue.power;
        cueBall.vy = Math.sin(cue.angle) * cue.power;
        
        audio.playStrike(cue.power / cue.maxPower);
        
        cue.power = 0;
        cue.striking = false;
        document.getElementById('power-bar').style.height = '0%';
      };
      
      // Short strike stick delay for premium hit feel
      setTimeout(shoot, 80);
    } else {
      cue.power = 0;
      document.getElementById('power-bar').style.height = '0%';
    }
  };

  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart, { passive: true });
  canvas.addEventListener('touchmove', handleMove, { passive: true });
  window.addEventListener('touchend', handleEnd);
}

// Initialize Menu HUD controls
function initUI() {
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.mode = btn.dataset.mode;
    });
  });

  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('retry-btn').addEventListener('click', startGame);
  
  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    showOverlay('main-menu');
    gameState.status = 'menu';
  });

  document.getElementById('menu-settings-btn').addEventListener('click', () => {
    showOverlay('settings-menu');
  });

  document.getElementById('settings-back-btn').addEventListener('click', () => {
    showOverlay('main-menu');
  });

  document.getElementById('menu-leaderboard-btn').addEventListener('click', () => {
    showOverlay('leaderboard-menu');
    renderLeaderboard();
  });

  document.getElementById('leaderboard-back-btn').addEventListener('click', () => {
    showOverlay('main-menu');
  });

  document.getElementById('volume-slider').addEventListener('input', (e) => {
    settings.volume = parseInt(e.target.value);
    document.getElementById('volume-label').textContent = `${settings.volume}%`;
    audio.setVolume(settings.volume / 100);
    saveSettings();
  });

  document.getElementById('guideline-toggle').addEventListener('change', (e) => {
    settings.guidelineEnabled = e.target.checked;
    saveSettings();
  });

  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLeaderboard(btn.dataset.tab);
    });
  });
}

function showOverlay(panelId) {
  const panels = ['main-menu', 'settings-menu', 'leaderboard-menu', 'game-over-menu'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (id === panelId) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function renderLeaderboard(mode = 'classic') {
  const body = document.getElementById('leaderboard-body');
  body.innerHTML = '';
  
  const entries = scores[mode] || [];
  if (entries.length === 0) {
    body.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-gray);">NO RECORDS FOUND</td></tr>`;
    return;
  }
  
  entries.forEach((e, idx) => {
    const row = document.createElement('tr');
    let rank = idx + 1;
    if (idx === 0) rank = '🥇 1';
    else if (idx === 1) rank = '🥈 2';
    else if (idx === 2) rank = '🥉 3';

    row.innerHTML = `
      <td>${rank}</td>
      <td>${e.date}</td>
      <td class="digital-text">${String(e.score).padStart(5, '0')}</td>
    `;
    body.appendChild(row);
  });
}

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const rect = container.getBoundingClientRect();
  
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  
  scaleFactor = Math.min(canvas.width / virtualWidth, canvas.height / virtualHeight);
  ctx.imageSmoothingEnabled = true;
}

// --- Graphical Rendering Loop ---

function drawTable() {
  // Clear canvas
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, virtualWidth, virtualHeight);

  // Table Outer Wooden frame borders
  ctx.fillStyle = '#100c0a';
  ctx.strokeStyle = 'var(--neon-cyan)';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'var(--neon-cyan)';
  ctx.shadowBlur = 8;
  
  ctx.beginPath();
  ctx.roundRect(table.x, table.y, table.width, table.height, 14);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0; // reset

  // Glowing felt area (Deep Green Felt)
  const feltGrad = ctx.createRadialGradient(
    virtualWidth/2, virtualHeight/2, 50,
    virtualWidth/2, virtualHeight/2, virtualWidth/2
  );
  feltGrad.addColorStop(0, '#06261f');
  feltGrad.addColorStop(1, '#02120e');
  ctx.fillStyle = feltGrad;
  
  ctx.fillRect(table.left, table.top, table.right - table.left, table.bottom - table.top);

  // Felt cushion segment lines
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(table.left, table.top, table.right - table.left, table.bottom - table.top);

  // Draw table pockets
  for (let p of pockets) {
    ctx.fillStyle = '#020305';
    ctx.strokeStyle = 'var(--neon-cyan)';
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pocket metallic rim cover
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius - 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw D-Zone kitchen head string and spot markings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Kitchen line (x = 250)
  ctx.moveTo(250, table.top);
  ctx.lineTo(250, table.bottom);
  ctx.stroke();

  // D-Zone semi-circle curve
  ctx.beginPath();
  ctx.arc(250, table.y + table.height/2, 55, Math.PI/2, 3*Math.PI/2);
  ctx.stroke();

  // Pyramid apex spot (x = 620)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(620, table.y + table.height/2, 3, 0, Math.PI*2);
  ctx.fill();
}

function drawCueStick() {
  if (gameState.status !== 'playing' || isTableRolling() || !cueBall.active) return;
  if (!cue.dragging && !cue.striking) return;

  ctx.save();
  ctx.translate(cueBall.x, cueBall.y);
  ctx.rotate(cue.angle);

  // Power backup offset calculation
  const powerOffset = cue.striking ? cue.strikeOffset : -cue.power * 5;
  
  // Draw cue stick handle (Wood with Neon cyan ring borders)
  const cueLength = 180;
  const startDist = 18 + powerOffset; // gap from cue ball

  // Cue Stick tip segment
  ctx.fillStyle = '#f0f8ff'; // tip white
  ctx.fillRect(-startDist - 8, -2, 8, 4);

  // Ivory joint
  ctx.fillStyle = '#b0c4de';
  ctx.fillRect(-startDist - 16, -2, 8, 4);

  // Cue body (gradient wood with cyan glowing accent strip)
  const cueGrad = ctx.createLinearGradient(-startDist - 16, 0, -startDist - cueLength, 0);
  cueGrad.addColorStop(0, '#ffffff');
  cueGrad.addColorStop(0.1, 'var(--neon-cyan)');
  cueGrad.addColorStop(0.2, '#5c4033'); // mahogany
  cueGrad.addColorStop(1, '#1b120f'); // dark grip
  ctx.fillStyle = cueGrad;
  
  ctx.beginPath();
  // Tapered cue shape (skinny near tip, wider at grip)
  ctx.moveTo(-startDist - 16, -2.5);
  ctx.lineTo(-startDist - cueLength, -4.5);
  ctx.lineTo(-startDist - cueLength, 4.5);
  ctx.lineTo(-startDist - 16, 2.5);
  ctx.fill();

  // Glow line overlay on cue handle
  ctx.shadowColor = 'var(--neon-cyan)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'var(--neon-cyan)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-startDist - 40, 0);
  ctx.lineTo(-startDist - cueLength + 10, 0);
  ctx.stroke();

  ctx.restore();
}

function drawGuideline() {
  if (gameState.status !== 'playing' || isTableRolling() || !cue.dragging || !settings.guidelineEnabled || !cueBall.active) return;

  const projection = getGuidelineImpactPoint();
  
  // Dotted aiming line
  ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(cueBall.x, cueBall.y);
  ctx.lineTo(projection.x, projection.y);
  ctx.stroke();
  ctx.setLineDash([]); // clear

  // Draw impact projection details
  if (projection.type === 'ball' && projection.target) {
    const target = projection.target;
    
    // Ghost cue ball position at collision
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(projection.x, projection.y, physics.ballRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Cue ball deflection path line
    const dx = target.x - projection.x;
    const dy = target.y - projection.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    
    // Normal direction of impact (direction target ball will roll)
    const nx = dx / dist;
    const ny = dy / dist;

    ctx.strokeStyle = 'var(--neon-green)';
    ctx.beginPath();
    ctx.moveTo(target.x, target.y);
    ctx.lineTo(target.x + nx * 40, target.y + ny * 40);
    ctx.stroke();

    // Cue ball tangent path line (direction cue ball deflections)
    const tx = -ny; // tangent perpendicular vectors
    const ty = nx;
    
    // Project velocity vector onto tangent
    const aimDx = Math.cos(cue.angle);
    const aimDy = Math.sin(cue.angle);
    const projAlongTangent = aimDx * tx + aimDy * ty;
    
    ctx.strokeStyle = 'var(--neon-cyan)';
    ctx.beginPath();
    ctx.moveTo(projection.x, projection.y);
    ctx.lineTo(projection.x + tx * projAlongTangent * 40, projection.y + ty * projAlongTangent * 40);
    ctx.stroke();
  }
}

// Game tick loops
function loop() {
  // 1. Physics Calcs
  updatePhysics();

  // Particle updates
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }

  // 2. Render Screen
  ctx.save();
  ctx.scale(canvas.width / virtualWidth, canvas.height / virtualHeight);

  drawTable();
  drawGuideline();
  
  // Render active balls
  for (let b of balls) {
    b.draw();
  }

  drawCueStick();

  // Particles layer
  for (let p of particles) {
    p.draw();
  }

  ctx.restore();
  
  requestAnimationFrame(loop);
}

// DOM Setup
window.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  initInputs();
  initUI();
  
  requestAnimationFrame(loop);
});
