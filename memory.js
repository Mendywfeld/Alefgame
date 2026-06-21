'use strict';

/* ============================================================
   1. CONSTANTS
   ============================================================ */

const LETTER_NAMES = {
  'א': 'Alef',        'ב': 'Veis',          'ג': 'Gimel',
  'ד': 'Daled',       'ה': 'Hey',            'ו': 'Vov',
  'ז': 'Zayin',       'ח': 'Ches',           'ט': 'Tes',
  'י': 'Yud',         'כ': 'Chuf',           'ך': 'Langer Chuf',
  'ל': 'Lamed',       'מ': 'Mem',            'ם': 'Shluss Mem',
  'נ': 'Nun',         'ן': 'Langer Nun',     'ס': 'Samech',
  'ע': 'Ayin',        'פ': 'Fey',            'ף': 'Langer Fey',
  'צ': 'Tzaddik',     'ץ': 'Langer Tzaddik', 'ק': 'Kuf',
  'ר': 'Reish',       'ש': 'Shin',           'ת': 'Sov',
};

const LETTER_PHONETICS = {
  'א': 'Alef',        'ב': 'Veis',          'ג': 'Gimel',
  'ד': 'Dawlid',      'ה': 'Hey',            'ו': 'Vov',
  'ז': 'Zayin',       'ח': 'Ches',           'ט': 'Tes',
  'י': 'Yud',         'כ': 'Chuf',           'ך': 'Langer Chuf',
  'ל': 'Lomid',       'מ': 'Mem',            'ם': 'Shluss Mem',
  'נ': 'Nun',         'ן': 'Langer Nun',     'ס': 'Samech',
  'ע': 'Ayin',        'פ': 'Fey',            'ף': 'Langer Fey',
  'צ': 'Tzaddik',     'ץ': 'Langer Tzaddik', 'ק': 'Kuf',
  'ר': 'Reish',       'ש': 'Shin',           'ת': 'Sov',
};

const ALL_LETTERS = Object.keys(LETTER_NAMES);
const STORAGE_KEY = 'alefgame_v2';
const PAIRS_PER_ROUND = 4;
const FONTS = ['font-rubik', 'font-frank-ruhl'];

/* ============================================================
   2. STATE
   ============================================================ */

let state = {};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) { /* ignore */ }
  state.stars = state.stars || 0;
  state.settings = state.settings || {};
  state.settings.muted = state.settings.muted || false;
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

/* ============================================================
   3. AUDIO
   ============================================================ */

let hebrewVoice  = null;
let englishVoice = null;

function findBestHebrewVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(v => v.lang === 'he-IL' && v.name.toLowerCase().includes('google')) ||
    voices.find(v => v.lang === 'he-IL' && v.name.toLowerCase().includes('microsoft')) ||
    voices.find(v => v.lang === 'he-IL') ||
    voices.find(v => v.lang.startsWith('he')) ||
    null
  );
}

function findBestEnglishVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  return (
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ||
    voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('microsoft')) ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

function initVoice() {
  hebrewVoice  = findBestHebrewVoice();
  englishVoice = findBestEnglishVoice();
}

function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || state.settings.muted) { resolve(); return; }
    if (!hebrewVoice) hebrewVoice = findBestHebrewVoice();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    if (hebrewVoice) u.voice = hebrewVoice;
    u.rate = 0.82; u.pitch = 1.05; u.volume = 1.0;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    setTimeout(() => { try { speechSynthesis.speak(u); } catch(e) { resolve(); } }, 40);
  });
}

function speakEnglish(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || state.settings.muted) { resolve(); return; }
    if (!englishVoice) englishVoice = findBestEnglishVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    if (englishVoice) u.voice = englishVoice;
    u.rate = 0.80; u.pitch = 1.05; u.volume = 1.0;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    setTimeout(() => { try { speechSynthesis.speak(u); } catch(e) { resolve(); } }, 40);
  });
}

/* ── Web Audio sound effects ─── */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  if (state.settings.muted) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const notes = {
      correct:     [[523.25, 0, 0.12], [659.25, 0.12, 0.12], [783.99, 0.24, 0.18]],
      star:        [[880, 0, 0.2]],
      wrong:       [[146.83, 0, 0.3]],
      celebration: [[523.25,0,0.12],[659.25,0.12,0.12],[783.99,0.24,0.12],[1046.5,0.36,0.25]],
    }[type] || [];
    notes.forEach(([freq, delay, dur]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.28, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.05);
    });
  } catch (e) { /* ignore */ }
}

/* ============================================================
   4. CONFETTI
   ============================================================ */

let confettiRunning = false;
let confettiParticles = [];

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  confettiParticles = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    r: Math.random() * 7 + 4,
    d: Math.random() * 5 + 2,
    color: `hsl(${Math.random()*360},80%,60%)`,
    tilt: Math.random() * 10 - 10,
    tiltSpeed: Math.random() * 0.1 + 0.05,
    tiltAngle: 0,
  }));

  confettiRunning = true;
  animateConfetti(ctx, canvas);
}

function animateConfetti(ctx, canvas) {
  if (!confettiRunning) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach(p => {
    p.tiltAngle += p.tiltSpeed;
    p.y += p.d;
    p.tilt = Math.sin(p.tiltAngle) * 12;
    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 5);
    ctx.stroke();
  });
  confettiParticles = confettiParticles.filter(p => p.y < canvas.height + 20);
  if (confettiParticles.length) requestAnimationFrame(() => animateConfetti(ctx, canvas));
  else { confettiRunning = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

function stopConfetti() {
  confettiRunning = false;
  confettiParticles = [];
  const canvas = document.getElementById('confetti-canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/* ============================================================
   5. BALLOONS
   ============================================================ */

function launchBalloons() {
  const container = document.getElementById('balloon-container');
  container.innerHTML = '';
  const emojis = ['🎈','🎉','⭐','💜','🎊'];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    b.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    b.style.left = `${Math.random() * 90}%`;
    b.style.animationDelay = `${Math.random() * 0.8}s`;
    b.style.fontSize = `${Math.random() * 1.5 + 2}rem`;
    container.appendChild(b);
  }
}

/* ============================================================
   6. GAME LOGIC
   ============================================================ */

let cards       = [];
let flipped     = [];   // indices of face-up unmatched cards (max 2)
let matchedCount = 0;
let lockBoard   = false;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selectLetters() {
  return shuffle([...ALL_LETTERS]).slice(0, PAIRS_PER_ROUND);
}

function buildCards(letters) {
  const deck = [];
  letters.forEach(letter => {
    FONTS.forEach((font, fi) => {
      deck.push({ letter, font, id: `${letter}-${fi}`, state: 'hidden' });
    });
  });
  return shuffle(deck);
}

function renderGrid() {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';
  cards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.idx = idx;
    el.style.animationDelay = `${idx * 0.06}s`;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'קלף');
    el.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back"></div>
        <div class="card-face card-front ${card.font}">${card.letter}</div>
      </div>`;
    el.addEventListener('click', () => onCardClick(idx));
    grid.appendChild(el);
  });
}

function getCardEl(idx) {
  return document.querySelector(`.card[data-idx="${idx}"]`);
}

function flipCard(idx, faceUp) {
  const el = getCardEl(idx);
  if (!el) return;
  if (faceUp) el.classList.add('flipped');
  else        el.classList.remove('flipped');
}

function markMatched(idxA, idxB) {
  [idxA, idxB].forEach(idx => {
    const el = getCardEl(idx);
    if (el) { el.classList.add('matched'); el.classList.remove('flipped'); }
    cards[idx].state = 'matched';
  });
}

function markWrong(idxA, idxB) {
  [idxA, idxB].forEach(idx => {
    const el = getCardEl(idx);
    if (el) el.classList.add('wrong');
  });
  setTimeout(() => {
    [idxA, idxB].forEach(idx => {
      const el = getCardEl(idx);
      if (el) { el.classList.remove('wrong'); el.classList.remove('flipped'); }
      cards[idx].state = 'hidden';
    });
  }, 350 + 250);
}

function onCardClick(idx) {
  if (lockBoard) return;
  const card = cards[idx];
  if (card.state === 'matched') return;
  if (flipped.includes(idx)) return;

  card.state = 'flipped';
  flipCard(idx, true);
  flipped.push(idx);

  if (flipped.length < 2) return;

  lockBoard = true;
  const [a, b] = flipped;
  flipped = [];

  if (cards[a].letter === cards[b].letter) {
    // Match!
    playSound('correct');
    launchConfetti();
    markMatched(a, b);
    matchedCount++;
    updatePairsCounter();

    const letter = cards[a].letter;
    (async () => {
      await speak('כל הכבוד');
      await speak('זו האות');
      await speakEnglish(LETTER_PHONETICS[letter]);
    })();

    lockBoard = false;

    if (matchedCount === PAIRS_PER_ROUND) {
      setTimeout(() => {
        stopConfetti();
        addStar();
        showCelebration();
      }, 1200);
    }
  } else {
    // No match
    playSound('wrong');
    markWrong(a, b);
    setTimeout(() => { lockBoard = false; }, 650);
  }
}

function updatePairsCounter() {
  document.getElementById('pairs-found').textContent = matchedCount;
}

/* ============================================================
   7. STARS & CELEBRATION
   ============================================================ */

function addStar() {
  state.stars++;
  saveState();
  playSound('star');
  document.getElementById('star-count').textContent = state.stars;
}

function showCelebration() {
  const screen = document.getElementById('celebration-screen');
  screen.hidden = false;
  launchBalloons();
  launchConfetti();
  playSound('celebration');
  setTimeout(() => speak('כל הכבוד! מצאת את כל הזוגות!'), 300);
  setTimeout(() => {
    screen.hidden = true;
    stopConfetti();
    startRound();
  }, 3500);
}

/* ============================================================
   8. ROUND
   ============================================================ */

function startRound() {
  matchedCount = 0;
  flipped      = [];
  lockBoard    = false;
  updatePairsCounter();
  const letters = selectLetters();
  cards = buildCards(letters);
  renderGrid();
}

/* ============================================================
   9. MUTE TOGGLE
   ============================================================ */

function bindMute() {
  const btn = document.getElementById('mute-btn');
  btn.textContent = state.settings.muted ? '🔇' : '🔊';
  btn.addEventListener('click', () => {
    state.settings.muted = !state.settings.muted;
    btn.textContent = state.settings.muted ? '🔇' : '🔊';
    saveState();
  });
}

/* ============================================================
   10. INIT
   ============================================================ */

function unlockAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  // One silent utterance to unlock iOS speech
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    setTimeout(() => speechSynthesis.cancel(), 200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  document.getElementById('star-count').textContent = state.stars;

  initVoice();
  if (window.speechSynthesis) {
    speechSynthesis.addEventListener('voiceschanged', () => {
      hebrewVoice  = findBestHebrewVoice();
      englishVoice = findBestEnglishVoice();
    });
  }

  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('click',      unlockAudio, { once: true });

  bindMute();
  startRound();
});
