/**
 * ViralForge - Générateur de Shorts Viraux
 * 100% client-side : Canvas + Web Speech API + MediaRecorder
 */

const state = {
  script: '',
  words: [],
  recording: false,
  playing: false,
  recBlob: null,
  audioCtx: null,
  musicGain: null,
  musicOsc: null,
  frame: 0,
  startTime: 0,
  totalDuration: 0,
  bgImages: [],
  currentBg: 0,
  zoomTarget: 1,
  zoomCurrent: 1,
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const topicInput = $('topic');
const categorySel = $('category');
const voiceSel = $('voice');
const styleSel = $('style');
const musicSel = $('music');
const scriptTA = $('script');
const scriptMeta = $('scriptMeta');
const statusEl = $('status');
const canvas = $('canvas');
const ctx2d = canvas.getContext('2d');
const subtitleLayer = $('subtitleLayer');
const progressBar = $('progressBar');

const btnScript = $('btnScript');
const btnPreview = $('btnPreview');
const btnGenerate = $('btnGenerate');
const btnPlay = $('btnPlay');
const btnStop = $('btnStop');
const btnDownload = $('btnDownload');

// ---------- STATUS ----------
function setStatus(msg, type = 'info') {
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
}

function hideStatus() {
  statusEl.className = 'status hidden';
}

// ---------- VOICES ----------
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSel.innerHTML = '';
  const fr = voices.filter(v => v.lang.startsWith('fr'));
  const others = voices.filter(v => !v.lang.startsWith('fr'));
  [...fr, ...others].forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSel.appendChild(opt);
  });
  if (fr.length) voiceSel.value = fr[0].name;
}

if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

// ---------- GÉNÉRATION DE SCRIPT ----------
const CATEGORIES = {
  ia: {
    hooks: [
      "L'IA vient de faire quelque chose d'incroyable 🤯",
      "Personne ne parle de cette IA... et pourtant 😱",
      "Tu utilises l'IA comme un débutant, voici pourquoi 🚀",
      "Cette IA va te faire gagner 10 heures par semaine ⏰"
    ],
    body: [
      "La plupart des gens pensent que l'IA sert juste à écrire des textes.",
      "En réalité, elle peut analyser des milliers de documents en quelques secondes.",
      "Elle peut générer des images, du code, des vidéos et même des voix réalistes.",
      "Les entreprises qui l'utilisent ont augmenté leur productivité de 40%.",
      "Le pire ? Ce n'est que le début."
    ],
    cta: [
      "Abonne-toi pour ne pas rater la prochaine vague 🚀",
      "Commente IA si tu veux la suite 👇",
      "Suis-moi pour rester à jour sur la tech ⚡"
    ]
  },
  money: {
    hooks: [
      "Voici comment gagner 1000€ par mois passivement 💰",
      "Personne ne t'a jamais expliqué ça sur l'argent 🤫",
      "J'ai testé cette méthode pendant 30 jours et voilà le résultat 💸",
      "Arrête de faire ça avec ton argent, c'est une erreur ❌"
    ],
    body: [
      "Il existe une règle simple que 90% des gens ignorent.",
      "Investir 100€ par mois à 7% de rendement te donne 120 000€ en 30 ans.",
      "Mais le vrai secret, c'est de commencer tôt.",
      "Chaque année d'attente te coûte des dizaines de milliers d'euros.",
      "La différence entre riche et pauvre n'est pas le salaire, c'est l'habitude."
    ],
    cta: [
      "Abonne-toi pour devenir libre financièrement 💪",
      "Sauvegarde cette vidéo, tu me remercieras 🔖",
      "Commente 'RICHESSE' pour le guide complet 💎"
    ]
  },
  facts: {
    hooks: [
      "Ce fait va te retourner le cerveau 🤯",
      "99% des gens ignorent ce détail incroyable 👀",
      "Attends de voir ça, tu ne vas pas y croire 😱",
      "Voici le fait qui m'a choqué aujourd'hui 🧠"
    ],
    body: [
      "Le corps humain contient assez de fer pour fabriquer un clou de 7 cm.",
      "Une journée sur Vénus est plus longue qu'une année sur Vénus.",
      "Les pieuvres ont trois cœurs et un cerveau dans chaque tentacule.",
      "Il y a plus d'arbres sur Terre que d'étoiles dans la Voie Lactée.",
      "Et ce n'est que la partie émergée de l'iceberg."
    ],
    cta: [
      "Suis-moi pour un fait incroyable par jour 🧠",
      "Commente le fait qui t'a le plus choqué 👇",
      "Abonne-toi, tu vas apprendre des choses folles ⚡"
    ]
  },
  gaming: {
    hooks: [
      "Ce joueur a fait l'impossible en 3 secondes 🎮",
      "Personne n'avait jamais réussi ça avant 😱",
      "Cette technique secrète va changer ta façon de jouer 🔥",
      "Tu joues à ce jeu depuis des années et tu ne savais pas ça 👀"
    ],
    body: [
      "Les pros utilisent une technique que les débutants ignorent complètement.",
      "En modifiant un seul paramètre, tu doubles ta vitesse de réaction.",
      "Le hitbox de ton personnage n'est pas centré, il est décalé de quelques pixels.",
      "C'est cette différence qui sépare les amateurs des pros.",
      "Maintenant tu sais pourquoi tu perds tes duels."
    ],
    cta: [
      "Abonne-toi pour devenir un pro 🏆",
      "Commente ton jeu préféré 👇",
      "Suis-moi pour les meilleures astuces gaming 🎯"
    ]
  },
  motivation: {
    hooks: [
      "Personne ne va te sauver. Lis bien ça. 🔥",
      "Si tu es fatigué, c'est que tu progresses 💪",
      "Le succès n'est pas pour les gens intelligents, mais pour les patients ⏳",
      "Arrête d'attendre le bon moment, il n'existe pas ⚡"
    ],
    body: [
      "Chaque matin, tu as deux choix : continuer ou abandonner.",
      "Les gens qui réussissent ne sont pas meilleurs que toi.",
      "Ils ont juste arrêté d'écouter les gens qui n'osaient pas rêver.",
      "Ta situation actuelle n'est pas ta destination finale.",
      "Ton futur dépend de ce que tu fais dans les 5 prochaines minutes."
    ],
    cta: [
      "Abonne-toi si tu veux progresser chaque jour 💯",
      "Commente 'JE SUIS LÀ' pour la motiv' 🔥",
      "Partage à quelqu'un qui en a besoin ❤️"
    ]
  },
  news: {
    hooks: [
      "Breaking : ce qui vient de se passer est énorme 🚨",
      "Personne n'a vu ça venir, et c'est historique 👀",
      "Ce matin, tout a changé dans ce domaine 🌍",
      "Voici ce que les médias ne te disent pas 📰"
    ],
    body: [
      "Une annonce majeure vient de bouleverser le secteur.",
      "Les experts sont divisés, mais les chiffres parlent d'eux-mêmes.",
      "Cette décision va impacter des millions de personnes.",
      "Les marchés ont réagi en quelques minutes seulement.",
      "Ce n'est que le début d'une transformation majeure."
    ],
    cta: [
      "Abonne-toi pour ne rien rater de l'actu 📰",
      "Commente ton avis 👇",
      "Partage si tu es concerné 🔁"
    ]
  },
  story: {
    hooks: [
      "Il est entré dans cette maison. Il n'en est jamais ressorti. 🚪",
      "Ce matin, elle a reçu un message de son propre numéro. 📱",
      "Personne ne sait ce qui s'est vraiment passé cette nuit-là 🌙",
      "Il a fait une chose. Une seule. Et tout a basculé. ⚡"
    ],
    body: [
      "Tout a commencé par un détail qu'elle aurait dû remarquer.",
      "Mais elle était trop occupée pour voir la vérité en face.",
      "Quand elle a compris, il était déjà trop tard.",
      "Les preuves étaient effacées, les témoins avaient disparu.",
      "Et pourtant, quelque part, quelqu'un savait."
    ],
    cta: [
      "Abonne-toi pour connaître la suite 👀",
      "Commente si tu veux la partie 2 👇",
      "Suis-moi pour ne pas rater la fin 📖"
    ]
  }
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateScript(topic, category) {
  const cat = CATEGORIES[category] || CATEGORIES.facts;
  const hook = pick(cat.hooks);
  const bodyLines = cat.body.slice(0, 3);
  const cta = pick(cat.cta);

  const lines = [
    hook,
    ...bodyLines,
    cta
  ];

  return lines.join(' ');
}

function estimateDuration(text) {
  // ~2.4 mots/sec pour voix IA
  const words = text.split(/\s+/).length;
  return Math.max(8, Math.round(words / 2.4));
}

// ---------- GÉNÉRATION DU SCRIPT ----------
btnScript.addEventListener('click', () => {
  const topic = topicInput.value.trim();
  if (!topic) { setStatus('Écris un sujet pour commencer !', 'error'); return; }

  setStatus('✍️ Génération du script viral...', 'info');
  btnScript.disabled = true;

  setTimeout(() => {
    const script = generateScript(topic, categorySel.value);
    scriptTA.value = script;
    state.script = script;
    const dur = estimateDuration(script);
    scriptMeta.textContent = `${script.split(/\s+/).length} mots · ~${dur}s`;
    setStatus('✅ Script généré ! Prêt à être converti en vidéo.', 'success');
    btnScript.disabled = false;
    btnPreview.disabled = false;
    btnGenerate.disabled = false;
  }, 500);
});

// ---------- IMAGES DE FOND (Unsplash) ----------
const UNSPLASH_KEYWORDS = {
  ia: ['technology', 'artificial-intelligence', 'cyberpunk'],
  money: ['money', 'luxury', 'finance'],
  facts: ['space', 'nature', 'science'],
  gaming: ['gaming', 'esports', 'neon'],
  motivation: ['fitness', 'sunrise', 'success'],
  news: ['city', 'news', 'world'],
  story: ['mystery', 'dark', 'night']
};

function loadImages(category) {
  const keywords = UNSPLASH_KEYWORDS[category] || UNSPLASH_KEYWORDS.facts;
  const imgs = keywords.map(kw => {
    // Utilise picsum pour des images stables (fallback si Unsplash bloque)
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${kw}${seed}/540/960`;
  });
  state.bgImages = imgs;
  state.currentBg = 0;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ---------- STYLES ----------
const STYLES = {
  neon: {
    bgGradient: ['#0a0018', '#1a0033'],
    accent: '#ff3d8b',
    accent2: '#00e0ff',
    text: '#ffffff'
  },
  clean: {
    bgGradient: ['#111111', '#1f1f2e'],
    accent: '#ffffff',
    accent2: '#7a5cff',
    text: '#ffffff'
  },
  hype: {
    bgGradient: ['#1a0010', '#330022'],
    accent: '#ff0055',
    accent2: '#ffcc00',
    text: '#ffffff'
  },
  dark: {
    bgGradient: ['#000000', '#0a0a15'],
    accent: '#7a5cff',
    accent2: '#00e0ff',
    text: '#ffffff'
  }
};

// ---------- RENDU CANVAS ----------
let renderedImages = [];

async function prepareImages() {
  renderedImages = [];
  for (const url of state.bgImages) {
    try {
      const img = await loadImage(url);
      renderedImages.push(img);
    } catch (e) {
      console.warn('Image failed:', url);
    }
  }
}

function drawFrame(t, elapsed, duration) {
  const style = STYLES[styleSel.value] || STYLES.neon;
  const w = canvas.width;
  const h = canvas.height;

  // fond gradient
  const grad = ctx2d.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, style.bgGradient[0]);
  grad.addColorStop(1, style.bgGradient[1]);
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, w, h);

  // image de fond dynamique avec zoom
  if (renderedImages.length) {
    const idx = Math.floor((elapsed / (duration / renderedImages.length)) % renderedImages.length);
    const img = renderedImages[idx % renderedImages.length];
    if (img) {
      // zoom pulse
      const zoom = 1.05 + Math.sin(elapsed * 1.2) * 0.05;
      const imgW = w * zoom;
      const imgH = h * zoom;
      const dx = (w - imgW) / 2;
      const dy = (h - imgH) / 2;

      ctx2d.save();
      ctx2d.globalAlpha = 0.45;
      ctx2d.drawImage(img, dx, dy, imgW, imgH);
      ctx2d.restore();
    }
  }

  // overlay gradient sombre pour lisibilité
  const dark = ctx2d.createLinearGradient(0, 0, 0, h);
  dark.addColorStop(0, 'rgba(0,0,0,0.25)');
  dark.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  dark.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx2d.fillStyle = dark;
  ctx2d.fillRect(0, 0, w, h);

  // effet scanline néon
  if (styleSel.value === 'neon') {
    ctx2d.save();
    ctx2d.globalAlpha = 0.05;
    for (let y = 0; y < h; y += 4) {
      ctx2d.fillStyle = '#00e0ff';
      ctx2d.fillRect(0, y, w, 1);
    }
    ctx2d.restore();
  }

  // bandeau titre (haut)
  ctx2d.save();
  ctx2d.fillStyle = 'rgba(0,0,0,0.55)';
  ctx2d.fillRect(0, h * 0.08, w, 70);
  ctx2d.fillStyle = style.accent;
  ctx2d.font = 'bold 22px Inter, sans-serif';
  ctx2d.textAlign = 'center';
  ctx2d.fillText((topicInput.value || 'VIRAL').toUpperCase().slice(0, 32), w / 2, h * 0.08 + 44);
  ctx2d.restore();

  // emoji flottant
  const emojis = ['🔥', '⚡', '💯', '🚀', '✨'];
  const emojiIdx = Math.floor(elapsed * 2) % emojis.length;
  ctx2d.save();
  ctx2d.font = '48px sans-serif';
  ctx2d.textAlign = 'right';
  ctx2d.fillText(emojis[emojiIdx], w - 30, h * 0.18 + Math.sin(elapsed * 3) * 10);
  ctx2d.restore();
}

// ---------- SOUS-TITRES MOT PAR MOT ----------
function buildWords(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  subtitleLayer.innerHTML = '';
  return tokens.map(w => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = w;
    subtitleLayer.appendChild(span);
    return span;
  });
}

// ---------- MUSIQUE GÉNÉRÉE (Web Audio) ----------
function startMusic(type) {
  if (type === 'none') return;
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ac = state.audioCtx;
  state.musicGain = ac.createGain();
  state.musicGain.gain.value = 0.06;
  state.musicGain.connect(ac.destination);

  // Petit arpège synthwave simple
  const notes = type === 'phonk' ? [55, 82.4, 110, 164.8] :
                type === 'epic' ? [65.4, 98, 130.8, 196] :
                [65.4, 78, 98, 130.8]; // lofi

  let step = 0;
  const interval = type === 'lofi' ? 500 : 300;
  state.musicInterval = setInterval(() => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type === 'lofi' ? 'sine' : 'triangle';
    osc.frequency.value = notes[step % notes.length] * (Math.random() > 0.8 ? 2 : 1);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.4, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
    osc.connect(g);
    g.connect(state.musicGain);
    osc.start();
    osc.stop(ac.currentTime + 0.4);
    step++;
  }, interval);
}

function stopMusic() {
  if (state.musicInterval) {
    clearInterval(state.musicInterval);
    state.musicInterval = null;
  }
  if (state.musicGain) {
    try { state.musicGain.disconnect(); } catch(e) {}
    state.musicGain = null;
  }
}

// ---------- LECTURE + ENREGISTREMENT ----------
async function playVideo(record = false) {
  const text = scriptTA.value.trim();
  if (!text) {
    setStatus('Génère un script avant !', 'error');
    return;
  }

  state.script = text;
  state.playing = true;
  state.recording = record;
  state.startTime = performance.now();
  state.totalDuration = estimateDuration(text) * 1000;

  btnPlay.disabled = true;
  btnGenerate.disabled = true;
  btnPreview.disabled = true;
  btnStop.disabled = false;

  // Charger images
  setStatus('🖼️ Chargement des visuels...', 'info');
  loadImages(categorySel.value);
  await prepareImages();

  // Sous-titres
  const wordSpans = buildWords(text);
  subtitleLayer.querySelectorAll('.word').forEach(w => w.classList.remove('active', 'done'));

  // Musique
  if (record) startMusic(musicSel.value);

  // Voix
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'fr-FR';
  utter.rate = 1.05;
  utter.pitch = 1.05;
  const voiceName = voiceSel.value;
  const voices = speechSynthesis.getVoices();
  const v = voices.find(x => x.name === voiceName);
  if (v) utter.voice = v;

  // Animation sous-titres synchronisée
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  let wordIdx = 0;
  utter.onboundary = (e) => {
    if (e.name === 'word') {
      if (wordIdx > 0 && wordSpans[wordIdx - 1]) {
        wordSpans[wordIdx - 1].classList.remove('active');
        wordSpans[wordIdx - 1].classList.add('done');
      }
      if (wordSpans[wordIdx]) {
        wordSpans[wordIdx].classList.add('active');
      }
      wordIdx++;
      const progress = (wordIdx / totalWords) * 100;
      progressBar.style.width = progress + '%';
    }
  };

  utter.onend = () => {
    wordSpans.forEach(w => { w.classList.remove('active'); w.classList.add('done'); });
    finishPlayback();
  };

  // Fallback : si la voix ne se lance pas en 300ms, on lance l'anim manuelle
  setTimeout(() => {
    if (!speechSynthesis.speaking && state.playing) {
      // fallback timing basé sur l'estimation
      let fi = 0;
      const interval = setInterval(() => {
        if (!state.playing) { clearInterval(interval); return; }
        if (fi > 0 && wordSpans[fi - 1]) {
          wordSpans[fi - 1].classList.remove('active');
          wordSpans[fi - 1].classList.add('done');
        }
        if (wordSpans[fi]) wordSpans[fi].classList.add('active');
        progressBar.style.width = ((fi + 1) / totalWords * 100) + '%';
        fi++;
        if (fi >= totalWords) {
          clearInterval(interval);
          finishPlayback();
        }
      }, (state.totalDuration / totalWords));
    }
  }, 300);

  // Rendu canvas en boucle
  function renderLoop() {
    if (!state.playing) return;
    const elapsed = (performance.now() - state.startTime) / 1000;
    drawFrame(elapsed, elapsed, state.totalDuration / 1000);
    state.frame = requestAnimationFrame(renderLoop);
  }
  drawFrame(0, 0, state.totalDuration / 1000);
  renderLoop();

  // Enregistrement via MediaRecorder sur le canvas
  if (record) {
    startRecording();
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function finishPlayback() {
  state.playing = false;
  cancelAnimationFrame(state.frame);
  progressBar.style.width = '100%';
  stopMusic();
  if (state.recording) stopRecording();
  btnPlay.disabled = false;
  btnPreview.disabled = false;
  btnGenerate.disabled = false;
  btnStop.disabled = true;
  setStatus('✅ Lecture terminée !', 'success');
}

function stopPlayback() {
  state.playing = false;
  speechSynthesis.cancel();
  cancelAnimationFrame(state.frame);
  stopMusic();
  if (state.recording) stopRecording();
  progressBar.style.width = '0%';
  subtitleLayer.querySelectorAll('.word').forEach(w => w.classList.remove('active', 'done'));
  btnPlay.disabled = false;
  btnPreview.disabled = false;
  btnGenerate.disabled = false;
  btnStop.disabled = true;
  setStatus('⏸️ Arrêté.', 'info');
}

// ---------- RECORDING ----------
let mediaRecorder = null;
let chunks = [];

function startRecording() {
  const stream = canvas.captureStream(30);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  chunks = [];
  mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  mediaRecorder.onstop = () => {
    state.recBlob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(state.recBlob);
    btnDownload.disabled = false;
    btnDownload.onclick = () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = `viralforge-${Date.now()}.webm`;
      a.click();
    };
    setStatus('✅ Vidéo prête ! Clique sur Télécharger.', 'success');
  };
  mediaRecorder.start();
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// ---------- BOUTONS ----------
btnPreview.addEventListener('click', () => {
  playVideo(false);
});

btnGenerate.addEventListener('click', () => {
  setStatus('🎬 Génération de la vidéo en cours...', 'info');
  playVideo(true);
});

btnPlay.addEventListener('click', () => playVideo(false));
btnStop.addEventListener('click', stopPlayback);

// ---------- INIT ----------
function init() {
  // Dessin initial placeholder
  ctx2d.fillStyle = '#0a0a0f';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);
  ctx2d.fillStyle = '#ff3d8b';
  ctx2d.font = 'bold 32px Inter, sans-serif';
  ctx2d.textAlign = 'center';
  ctx2d.fillText('⚡ ViralForge', canvas.width / 2, canvas.height / 2 - 10);
  ctx2d.fillStyle = '#8a8aa0';
  ctx2d.font = '16px Inter, sans-serif';
  ctx2d.fillText('Prêt à générer ta vidéo', canvas.width / 2, canvas.height / 2 + 30);

  btnPlay.disabled = true;
  btnStop.disabled = true;
  btnDownload.disabled = true;
  btnPreview.disabled = true;
  btnGenerate.disabled = true;

  setStatus('👋 Bienvenue ! Écris un sujet puis clique sur "Générer le script".', 'info');
}

init();
