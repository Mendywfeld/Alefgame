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

// Phonetic spellings for en-US TTS — letter names are spoken by an English voice
// so pronunciation is accurate for Ashkenazic names (Lomid, Dawlid, Veis, etc.)
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

const ALL_LETTERS = Object.keys(LETTER_NAMES); // 27 symbols

// Letters where both the regular and final form share the same spoken name
const PAIRED_LETTERS = {
  'כ': 'ך', 'ך': 'כ',
  'מ': 'ם', 'ם': 'מ',
  'נ': 'ן', 'ן': 'נ',
  'פ': 'ף', 'ף': 'פ',
  'צ': 'ץ', 'ץ': 'צ',
};

// Visually similar letters — used to pick meaningful distractors
const SIMILARITY_MAP = {
  'א': ['ע', 'ד', 'ר'],
  'ב': ['כ', 'ד', 'פ'],
  'ג': ['נ', 'ז', 'צ'],
  'ד': ['ר', 'ב', 'כ'],
  'ה': ['ח', 'ת', 'ב'],
  'ו': ['י', 'ז', 'ן'],
  'ז': ['ו', 'י', 'נ'],
  'ח': ['ה', 'ת', 'כ'],
  'ט': ['מ', 'ס', 'ם'],
  'י': ['ו', 'ז', 'ן'],
  'כ': ['ב', 'ך', 'ד'],
  'ך': ['כ', 'ל', 'ד'],
  'ל': ['ך', 'ו', 'ד'],
  'מ': ['ם', 'ס', 'נ'],
  'ם': ['מ', 'ס', 'ט'],
  'נ': ['ג', 'ן', 'ז'],
  'ן': ['ו', 'י', 'נ'],
  'ס': ['מ', 'ם', 'ט'],
  'ע': ['א', 'צ', 'ץ'],
  'פ': ['ף', 'ב', 'כ'],
  'ף': ['פ', 'ץ', 'צ'],
  'צ': ['ץ', 'ג', 'ע'],
  'ץ': ['צ', 'ף', 'פ'],
  'ק': ['ר', 'ד', 'פ'],
  'ר': ['ד', 'כ', 'ק'],
  'ש': ['ת', 'ה', 'ח'],
  'ת': ['ש', 'ח', 'ה'],
};

// Progressive learning groups — introduced in order
const LETTER_GROUPS = [
  ['א', 'ב', 'מ', 'ש', 'ל'],              // Group 0 — beginner
  ['ה', 'ו', 'י', 'נ', 'ת'],              // Group 1
  ['ג', 'ד', 'ז', 'ח', 'ט', 'כ', 'ך'],   // Group 2
  ['ס', 'ע', 'פ', 'ף', 'ק', 'ר'],         // Group 3
  ['ם', 'ן', 'ץ', 'צ'],                   // Group 4 — final forms
];

// Card background colors (one per card slot)
const CARD_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcb77'];

const STORAGE_KEY = 'alefgame_v2';

/* ============================================================
   2. STATE MANAGEMENT
   ============================================================ */

const DEFAULT_STATE = {
  progress: {},      // { 'א': { correct: 0, wrong: 0 }, ... }
  stars: 0,
  settings: {
    specialLetterMode: false,
    progressionEnabled: true,
    muted: false,
    unlockedGroup: 0,
  },
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));

function initProgress() {
  for (const letter of ALL_LETTERS) {
    if (!state.progress[letter]) {
      state.progress[letter] = { correct: 0, wrong: 0 };
    }
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state.stars = saved.stars ?? 0;
      state.settings = Object.assign({}, DEFAULT_STATE.settings, saved.settings || {});
      state.progress = saved.progress || {};
    }
  } catch (e) {
    console.warn('[AlefGame] Could not load state:', e);
  }
  initProgress();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[AlefGame] Could not save state:', e);
  }
}

/* ============================================================
   3. AUDIO — SPEECH SYNTHESIS
   ============================================================ */

let hebrewVoice = null;
let englishVoice = null;

function findBestHebrewVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority 1: he-IL + Google
  const googleHe = voices.find(v =>
    v.lang === 'he-IL' && v.name.toLowerCase().includes('google'));
  if (googleHe) return googleHe;

  // Priority 2: he-IL + Microsoft
  const msHe = voices.find(v =>
    v.lang === 'he-IL' && v.name.toLowerCase().includes('microsoft'));
  if (msHe) return msHe;

  // Priority 3: any he-IL
  const heIL = voices.find(v => v.lang === 'he-IL');
  if (heIL) return heIL;

  // Priority 4: any he- locale
  const heAny = voices.find(v => v.lang.startsWith('he'));
  if (heAny) return heAny;

  // Priority 5: voice named "Hebrew"
  const named = voices.find(v => v.name.toLowerCase().includes('hebrew'));
  return named || null;
}

function findBestEnglishVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const googleEn = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('google'));
  if (googleEn) return googleEn;
  const msEn = voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('microsoft'));
  if (msEn) return msEn;
  const enUS = voices.find(v => v.lang === 'en-US');
  if (enUS) return enUS;
  return voices.find(v => v.lang.startsWith('en')) || null;
}

function initVoice() {
  const voice = findBestHebrewVoice();
  if (voice) {
    hebrewVoice = voice;
    document.getElementById('voice-warning').hidden = true;
  } else {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Voices loaded but none is Hebrew — show warning for parents
      document.getElementById('voice-warning').hidden = false;
    }
  }
  englishVoice = findBestEnglishVoice();
}

// iOS Safari: call speechSynthesis.speak once inside a user gesture to unlock it
function unlockSpeech() {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance('');
  utter.volume = 0;
  speechSynthesis.speak(utter);
  // Cancel immediately — we just needed the gesture unlock
  setTimeout(() => speechSynthesis.cancel(), 200);
}

let speechUnlocked = false;

function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    if (!hebrewVoice) initVoice(); // last-chance attempt

    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'he-IL';
    if (hebrewVoice) utter.voice = hebrewVoice;
    utter.rate = 0.82;
    utter.pitch = 1.05;
    utter.volume = 1.0;

    utter.onend = () => resolve();
    utter.onerror = () => resolve();

    // Short delay prevents speech queue issues on some browsers
    setTimeout(() => {
      try { speechSynthesis.speak(utter); } catch (e) { resolve(); }
    }, 40);
  });
}

function speakEnglish(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    if (!englishVoice) englishVoice = findBestEnglishVoice();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    if (englishVoice) utter.voice = englishVoice;
    utter.rate = 0.80;
    utter.pitch = 1.05;
    utter.volume = 1.0;

    utter.onend = () => resolve();
    utter.onerror = () => resolve();

    setTimeout(() => {
      try { speechSynthesis.speak(utter); } catch (e) { resolve(); }
    }, 40);
  });
}

/* ============================================================
   3b. AUDIO — SOUND EFFECTS (Web Audio API, no external files)
   ============================================================ */

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function unlockAudioCtx() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (_) { /* ignore */ }
}

function scheduleTone(ctx, freq, startTime, duration, gain = 0.28, type = 'sine') {
  const osc = ctx.createOscillator();
  const gn  = ctx.createGain();
  osc.connect(gn);
  gn.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gn.gain.setValueAtTime(0, startTime);
  gn.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

const SOUNDS = {
  correct: (ctx, t) => {
    // Ascending C major arpeggio
    [[261.63, 0], [329.63, 0.12], [392.00, 0.24]].forEach(([f, d]) =>
      scheduleTone(ctx, f, t + d, 0.35, 0.28));
  },
  star: (ctx, t) => {
    scheduleTone(ctx, 880,  t,       0.20, 0.22);
    scheduleTone(ctx, 1320, t + 0.06, 0.18, 0.15);
  },
  wrong: (ctx, t) => {
    // Single soft low thud — gentle, not punishing
    scheduleTone(ctx, 160, t, 0.18, 0.10, 'triangle');
  },
  celebration: (ctx, t) => {
    // Fanfare
    [[261.63, 0], [329.63, 0.14], [392.00, 0.28], [523.25, 0.42]].forEach(([f, d]) =>
      scheduleTone(ctx, f, t + d, 0.45, 0.30));
    // Sparkle layer
    [[659.25, 0.70], [783.99, 0.84], [1046.50, 0.98]].forEach(([f, d]) =>
      scheduleTone(ctx, f, t + d, 0.30, 0.18));
  },
};

function playSound(type) {
  if (state.settings.muted) return;
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const handler = SOUNDS[type];
    if (handler) handler(ctx, ctx.currentTime);
  } catch (_) { /* audio not available */ }
}

/* ============================================================
   4. LETTER SELECTION ALGORITHM
   ============================================================ */

function getUnlockedLetters() {
  if (!state.settings.progressionEnabled) return ALL_LETTERS.slice();
  const letters = [];
  for (let i = 0; i <= state.settings.unlockedGroup && i < LETTER_GROUPS.length; i++) {
    letters.push(...LETTER_GROUPS[i]);
  }
  return letters;
}

function computeWeight(letter) {
  const p = state.progress[letter];
  if (!p) return 2;
  const total = p.correct + p.wrong;
  if (total === 0) return 2;                      // not yet seen
  const acc = p.correct / total;
  if (acc < 0.50) return 3;                       // struggling — focus heavily
  if (acc < 0.80) return 2;                       // learning — extra practice
  return 1;                                        // mastered — maintain
}

function weightedRandom(letters) {
  const weights = letters.map(computeWeight);
  const total   = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < letters.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return letters[i];
  }
  return letters[letters.length - 1];
}

function selectTargetLetter(unlocked) {
  return weightedRandom(unlocked);
}

function selectDistractors(target, unlocked) {
  // First, try visually similar letters that are unlocked
  const similar = (SIMILARITY_MAP[target] || [])
    .filter(l => unlocked.includes(l) && l !== target);

  const shuffledSimilar = shuffle(similar.slice());

  // Fill remaining slots from other unlocked letters
  const others = unlocked.filter(l => l !== target && !shuffledSimilar.includes(l));
  const shuffledOthers = shuffle(others.slice());

  const distractors = [...shuffledSimilar, ...shuffledOthers].slice(0, 3);

  // Safety: ensure exactly 3 (edge case with very few unlocked letters)
  while (distractors.length < 3) {
    const extra = unlocked.find(l => !distractors.includes(l) && l !== target);
    if (extra) distractors.push(extra);
    else break;
  }

  return distractors;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================
   5. PROGRESSION UNLOCK
   ============================================================ */

function checkProgressionUnlock() {
  if (!state.settings.progressionEnabled) return;
  const nextGroup = state.settings.unlockedGroup + 1;
  if (nextGroup >= LETTER_GROUPS.length) return;

  const currentGroupLetters = LETTER_GROUPS[state.settings.unlockedGroup];
  const totalAttempts = currentGroupLetters.reduce((sum, l) => {
    const p = state.progress[l];
    return sum + (p ? p.correct + p.wrong : 0);
  }, 0);

  // Need at least 3 attempts per letter before considering unlock
  if (totalAttempts < currentGroupLetters.length * 3) return;

  const totalCorrect = currentGroupLetters.reduce((sum, l) => {
    return sum + (state.progress[l] ? state.progress[l].correct : 0);
  }, 0);

  if (totalCorrect / totalAttempts >= 0.80) {
    state.settings.unlockedGroup = nextGroup;
    saveState();
    updateTopBar();
    showUnlockToast(LETTER_GROUPS[nextGroup]);
  }
}

function showUnlockToast(newLetters) {
  const toast = document.createElement('div');
  toast.className = 'unlock-toast';
  toast.textContent = `אותיות חדשות! ${newLetters.join(' ')}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 600);
  }, 2600);
}

/* ============================================================
   6. CONFETTI
   ============================================================ */

let confettiRaf = null;

function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const COLORS  = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcb77', '#a78bfa', '#fb923c', '#f472b6'];
  const particles = Array.from({ length: 80 }, () => ({
    x:       Math.random() * canvas.width,
    y:       -16 - Math.random() * 80,
    w:       7 + Math.random() * 9,
    h:       4 + Math.random() * 5,
    color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    angle:   Math.random() * Math.PI * 2,
    vx:      (Math.random() - 0.5) * 4.5,
    vy:      2.2 + Math.random() * 3.5,
    va:      (Math.random() - 0.5) * 0.18,
    opacity: 1,
  }));

  let start = null;

  function frame(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allGone = true;
    for (const p of particles) {
      p.x     += p.vx;
      p.y     += p.vy;
      p.angle += p.va;
      p.vy    += 0.09; // gravity
      if (elapsed > 1400) p.opacity = Math.max(0, p.opacity - 0.018);
      if (p.y < canvas.height + 40) allGone = false;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (allGone || elapsed > 2600) {
      stopConfetti();
      return;
    }
    confettiRaf = requestAnimationFrame(frame);
  }

  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  confettiRaf = requestAnimationFrame(frame);
}

function stopConfetti() {
  if (confettiRaf) {
    cancelAnimationFrame(confettiRaf);
    confettiRaf = null;
  }
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = 'none';
}

/* ============================================================
   7. CELEBRATION SCREEN
   ============================================================ */

function createBalloons() {
  const container = document.getElementById('balloon-container');
  container.innerHTML = '';
  const BCOLORS = ['#ff6b6b', '#4ecdc4', '#ffd93d', '#6bcb77', '#a78bfa', '#fb923c', '#f472b6', '#38bdf8'];
  for (let i = 0; i < 8; i++) {
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.setProperty('--bc', BCOLORS[i % BCOLORS.length]);
    b.style.setProperty('--bd', `${i * 0.18}s`);
    b.style.setProperty('--bx', `${6 + i * 12}%`);
    container.appendChild(b);
  }
}

function showCelebration() {
  const screen = document.getElementById('celebration-screen');
  screen.hidden = false;

  createBalloons();
  launchConfetti();
  playSound('celebration');

  setTimeout(() => speak('וואו! עשרה כוכבים!'), 350);

  setTimeout(() => {
    screen.hidden = true;
    stopConfetti();
    startRound();
  }, 4200);
}

/* ============================================================
   8. GAME FLOW
   ============================================================ */

let currentTarget = null;
let currentCards  = [];
let roundActive   = false;

function lockCards() {
  roundActive = false;
  document.getElementById('cards-grid').classList.add('locked');
}

function unlockCards() {
  roundActive = true;
  document.getElementById('cards-grid').classList.remove('locked');
}

function startRound() {
  const unlocked = getUnlockedLetters();
  currentTarget  = selectTargetLetter(unlocked);
  const distract = selectDistractors(currentTarget, unlocked);
  currentCards   = shuffle([currentTarget, ...distract]);

  renderCards(currentCards);
  updateTopBar();
  lockCards();

  // Cards stay locked until both utterances finish
  setTimeout(async () => {
    await speak('איפה האות');
    await speakEnglish(LETTER_PHONETICS[currentTarget]);
    unlockCards();
  }, 430);
}

function handleAnswer(tappedLetter) {
  if (!roundActive) return;

  if (isCorrectAnswer(tappedLetter, currentTarget)) {
    lockCards();

    recordCorrect(currentTarget);
    playSound('correct');
    animateCard(tappedLetter, 'correct');

    // In special-letter mode, also highlight the canonical form
    if (tappedLetter !== currentTarget && state.settings.specialLetterMode) {
      animateCard(currentTarget, 'correct');
    }

    launchConfetti();

    // Build speech feedback
    const name     = LETTER_PHONETICS[currentTarget];
    const isMirror = tappedLetter !== currentTarget &&
                     PAIRED_LETTERS[currentTarget] === tappedLetter;

    (async () => {
      await speak('כל הכבוד');
      await speak('זו האות');
      await speakEnglish(name);
    })();

    addStar();

    setTimeout(() => {
      stopConfetti();
      if (state.stars > 0 && state.stars % 10 === 0) {
        showCelebration();
      } else {
        startRound();
      }
    }, 2800);

  } else {
    recordWrong(currentTarget);
    playSound('wrong');
    animateCard(tappedLetter, 'wrong');
    lockCards();
    setTimeout(() => speak('נסה שוב').then(() => unlockCards()), 80);
  }
}

function isCorrectAnswer(tapped, target) {
  if (tapped === target) return true;
  if (state.settings.specialLetterMode && PAIRED_LETTERS[target] === tapped) return true;
  return false;
}

function recordCorrect(letter) {
  state.progress[letter].correct++;
  saveState();
  checkProgressionUnlock();
}

function recordWrong(letter) {
  state.progress[letter].wrong++;
  saveState();
}

function addStar() {
  state.stars++;
  saveState();
  playSound('star');
  updateTopBar();
  // Visual pop animation
  const counter = document.getElementById('star-counter');
  counter.classList.remove('star-pop');
  void counter.offsetWidth; // force reflow
  counter.classList.add('star-pop');
}

/* ============================================================
   9. UI RENDERING
   ============================================================ */

function renderCards(letters) {
  const grid = document.getElementById('cards-grid');
  grid.innerHTML = '';

  letters.forEach((letter, i) => {
    const btn = document.createElement('button');
    btn.className = 'letter-card';
    btn.dataset.letter = letter;
    btn.style.setProperty('--card-color', CARD_COLORS[i]);
    btn.style.setProperty('--delay', `${i * 0.075}s`);
    btn.textContent = letter;
    btn.setAttribute('aria-label', `האות ${LETTER_NAMES[letter]}`);
    btn.setAttribute('type', 'button');

    // Touch handler (prevents 300ms ghost-click on older iOS)
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleAnswer(letter);
    }, { passive: false });

    // Mouse click handler (desktop)
    btn.addEventListener('click', () => handleAnswer(letter));

    grid.appendChild(btn);
  });
}

function updateTopBar() {
  document.getElementById('star-count').textContent = state.stars;
}

function animateCard(letter, type) {
  document.querySelectorAll('.letter-card').forEach(card => {
    if (card.dataset.letter === letter) {
      card.classList.add(type);
      if (type === 'wrong') {
        card.addEventListener('animationend', () => card.classList.remove('wrong'), { once: true });
      }
    }
  });
}

function replayPrompt() {
  if (currentTarget) {
    speak('איפה האות').then(() => speakEnglish(LETTER_PHONETICS[currentTarget]));
  }
}

/* ============================================================
   10. PARENT DASHBOARD
   ============================================================ */

let pendingMathAnswer = null;

function showParentGate() {
  const a = 2 + Math.floor(Math.random() * 7);
  const b = 2 + Math.floor(Math.random() * 7);
  pendingMathAnswer = a + b;

  document.getElementById('math-question').textContent = `${a} + ${b} = ?`;
  document.getElementById('math-answer').value = '';
  document.getElementById('gate-error').hidden = true;
  document.getElementById('parent-gate').hidden = false;

  // Focus input after animation
  setTimeout(() => document.getElementById('math-answer').focus(), 120);
}

function checkParentGate() {
  const entered = parseInt(document.getElementById('math-answer').value, 10);
  if (entered === pendingMathAnswer) {
    document.getElementById('parent-gate').hidden = true;
    showParentDashboard();
  } else {
    document.getElementById('gate-error').hidden = false;
    document.getElementById('math-answer').value = '';
    document.getElementById('math-answer').focus();
  }
}

function showParentDashboard() {
  // Sync toggles to current settings
  document.getElementById('toggle-special-mode').checked = state.settings.specialLetterMode;
  document.getElementById('toggle-progression').checked  = state.settings.progressionEnabled;

  renderStatsTable();
  document.getElementById('parent-dashboard').hidden = false;
}

function renderStatsTable() {
  const tbody = document.getElementById('stats-tbody');
  tbody.innerHTML = '';

  const rows = ALL_LETTERS.map(letter => {
    const p     = state.progress[letter] || { correct: 0, wrong: 0 };
    const total = p.correct + p.wrong;
    const acc   = total > 0 ? Math.round((p.correct / total) * 100) : null;
    return { letter, name: LETTER_NAMES[letter], correct: p.correct, wrong: p.wrong, acc, total };
  });

  // Sort: worst accuracy first; untried letters at end
  rows.sort((a, b) => {
    if (a.acc === null && b.acc === null) return 0;
    if (a.acc === null) return 1;
    if (b.acc === null) return -1;
    return a.acc - b.acc;
  });

  for (const row of rows) {
    const tr = document.createElement('tr');
    let accCell;
    if (row.acc === null) {
      accCell = `<td class="num-cell acc-none">—</td>`;
    } else {
      const cls = row.acc >= 80 ? 'acc-good' : row.acc >= 50 ? 'acc-ok' : 'acc-bad';
      accCell = `<td class="num-cell ${cls}">${row.acc}%</td>`;
    }
    tr.innerHTML = `
      <td class="letter-cell">${row.letter}</td>
      <td>${row.name}</td>
      <td class="num-cell">${row.correct}</td>
      <td class="num-cell">${row.wrong}</td>
      ${accCell}
    `;
    tbody.appendChild(tr);
  }
}

function closeParentDashboard() {
  document.getElementById('parent-dashboard').hidden = true;
}

/* ============================================================
   11. EVENT BINDING
   ============================================================ */

function bindEventListeners() {
  // Replay button
  document.getElementById('replay-btn')
    .addEventListener('click', replayPrompt);

  // Parent access
  document.getElementById('parent-btn')
    .addEventListener('click', showParentGate);

  // Gate modal
  document.getElementById('gate-submit')
    .addEventListener('click', checkParentGate);
  document.getElementById('gate-cancel')
    .addEventListener('click', () => { document.getElementById('parent-gate').hidden = true; });
  document.getElementById('math-answer')
    .addEventListener('keydown', e => { if (e.key === 'Enter') checkParentGate(); });

  // Dashboard close
  document.getElementById('dashboard-close')
    .addEventListener('click', closeParentDashboard);

  // Dashboard — Reset Progress
  document.getElementById('btn-reset-progress').addEventListener('click', () => {
    if (!confirm('לאפס את כל נתוני ההתקדמות?')) return;
    for (const letter of ALL_LETTERS) {
      state.progress[letter] = { correct: 0, wrong: 0 };
    }
    state.settings.unlockedGroup = 0;
    saveState();
    renderStatsTable();
    updateTopBar();
  });

  // Dashboard — Reset Stars
  document.getElementById('btn-reset-stars').addEventListener('click', () => {
    if (!confirm('לאפס את ספירת הכוכבים?')) return;
    state.stars = 0;
    saveState();
    updateTopBar();
  });

  // Dashboard — Unlock All
  document.getElementById('btn-unlock-all').addEventListener('click', () => {
    state.settings.unlockedGroup = LETTER_GROUPS.length - 1;
    saveState();
    updateTopBar();
    alert('כל האותיות פתוחות!');
  });

  // Dashboard — Lock to Beginner
  document.getElementById('btn-lock-beginner').addEventListener('click', () => {
    state.settings.unlockedGroup = 0;
    saveState();
    updateTopBar();
    alert('ננעל לרמת מתחילים');
  });

  // Toggle — Special Letter Mode
  document.getElementById('toggle-special-mode').addEventListener('change', e => {
    state.settings.specialLetterMode = e.target.checked;
    saveState();
  });

  // Toggle — Progressive Unlocking
  document.getElementById('toggle-progression').addEventListener('change', e => {
    state.settings.progressionEnabled = e.target.checked;
    saveState();
    updateTopBar();
  });

  // Mute / Unmute (sound effects only — speech stays on)
  document.getElementById('mute-btn').addEventListener('click', () => {
    state.settings.muted = !state.settings.muted;
    saveState();
    document.getElementById('mute-btn').textContent = state.settings.muted ? '🔇' : '🔊';
    document.getElementById('mute-btn').setAttribute(
      'aria-label',
      state.settings.muted ? 'בטל השתקה' : 'השתק צלילים'
    );
  });

  // First user interaction — unlock Web Audio API + Speech Synthesis on iOS
  const firstInteraction = () => {
    unlockAudioCtx();
    if (!speechUnlocked) {
      unlockSpeech();
      speechUnlocked = true;
    }
    if (!hebrewVoice) initVoice();
  };
  document.addEventListener('touchstart', firstInteraction, { once: true });
  document.addEventListener('mousedown',  firstInteraction, { once: true });

  // Voice loaded asynchronously (common on Chrome/Firefox)
  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', initVoice);
  }
}

/* ============================================================
   12. INITIALIZATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Sync mute button icon to saved preference
  if (state.settings.muted) {
    document.getElementById('mute-btn').textContent = '🔇';
  }

  // Try loading voices immediately (works on desktop, often fails on iOS until interaction)
  if (window.speechSynthesis && speechSynthesis.getVoices().length > 0) {
    initVoice();
  }

  bindEventListeners();
  updateTopBar();
  startRound();
});
