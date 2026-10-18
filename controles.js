// =====================================================
// CONTRÔLES : état et logique (souris / main / voix)
// =====================================================

// ----- contrôle du serpent : souris / doigts (MediaPipe) / voix -----
let controle = 'souris';
let etatMain = {
  actif: false, pret: false, erreur: '', lm: null, lisse: null, vu: 0, debutCam: 0,
  pince: false, pinceAvant: false, poing: false, trace: [], boucle: false, occupe: false, dernierT: -1
};
let etatVoix = {
  actif: false, erreur: '', bloque: false, texte: '', dir: null, stop: false, centre: false,
  turbo: 0, lent: 0, derniere: '', tDerniere: 0,
  niveau: 0, ctx: null, analyseur: null, tampon: null, fluxMicro: null, micEnCours: false
};
let videoCam = null, handsInst = null, recoVoix = null;
let cartesControle = {};
let divStatut, selectCamera, ligneCamera, barreMic, barreMicInner;

// =====================================================
// CONTRÔLES : SOURIS / MAIN & DOIGTS (MediaPipe Hands) / VOIX (Web Speech)
//
// Principe : le serpent n'est JAMAIS bloqué. Quand il n'y a aucune consigne
// (main hors caméra, aucun ordre vocal), il croise tout seul (wander) et on
// reprend la main quand on veut. Dans tous les cas il reste piloté par
// arrive() vers une cible ; seule la façon de produire la cible change.
//
//  - Souris : le serpent suit le curseur.
//  - Main   : la paume guide le serpent (stable, même si les doigts bougent)
//             🤏 pincer pouce + index = turbo
//             ✊ poing fermé           = frein
//             Sur un écran de fin, pincer sur un bouton = clic.
//  - Voix   : « haut » « bas » « gauche » « droite » (deux mots = diagonale),
//             « stop », « centre », « turbo », « lent »,
//             écrans de fin : « rejouer », « suivant », « menu ».
//             Secours si le micro ne marche pas : flèches ou Z Q S D.
// =====================================================

const MEDIAPIPE_BASE = (typeof window.MEDIAPIPE_BASE === 'string')
  ? window.MEDIAPIPE_BASE
  : 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/';

const LIAISONS_MAIN = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

const MOTS_VOIX = {
  haut: ['haut', 'hauts', 'monte', 'montes', 'monter', 'up'],
  bas: ['bas', 'descend', 'descends', 'descendre', 'down'],
  gauche: ['gauche', 'gauches', 'left'],
  droite: ['droite', 'droit', 'droites', 'right'],
  stop: ['stop', 'stoppe', 'stoppes', 'arrete', 'arreter', 'pause', 'halte', 'attends'],
  turbo: ['turbo', 'vite', 'rapide', 'accelere', 'go', 'allez'],
  lent: ['lent', 'doucement', 'calme'],
  centre: ['centre', 'milieu'],
  rejouer: ['rejouer', 'recommence', 'recommencer', 'encore'],
  suivant: ['suivant', 'continue', 'continuer'],
  menu: ['menu', 'retour', 'quitter']
};
const DIRECTIONS_VOIX = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
const MOT_VERS_CMD = {};
Object.keys(MOTS_VOIX).forEach(c => MOTS_VOIX[c].forEach(m => { MOT_VERS_CMD[m] = c; }));

const TOUCHES_DIRECTION = {
  37: 'gauche', 38: 'haut', 39: 'droite', 40: 'bas', // flèches
  81: 'gauche', 90: 'haut', 68: 'droite', 83: 'bas', // Q Z D S (AZERTY)
  65: 'gauche', 87: 'haut'                           // A W (QWERTY)
};

const REGEX_CAMERA_IR = /\bir\b|infra|hello/i; // caméra infrarouge de Windows Hello : image grise inutilisable

function estEcranFin() {
  return gameState === 'GAME_OVER' || gameState === 'WIN' || gameState === 'DUEL_FIN';
}

function mainVisible() {
  return !!etatMain.lisse && millis() - etatMain.vu < 500;
}

function mainActive() {
  return controle === 'doigts' && !etatMain.erreur; // caméra en panne => souris en secours
}

// Position du pointeur (paume si contrôle par la main, sinon souris)
function pointeur() {
  if (mainActive() && mainVisible()) return { x: etatMain.lisse.x, y: etatMain.lisse.y };
  return { x: mouseX, y: mouseY };
}

// Cible que le leader du joueur rejoint avec ARRIVE (null = pas de consigne : croisière)
function cibleControle() {
  if (mainActive()) {
    if (!mainVisible()) return null;
    if (etatMain.poing) return leader.pos.copy(); // poing = frein
    return createVector(etatMain.lisse.x, etatMain.lisse.y);
  }
  if (controle === 'voix') {
    if (etatVoix.stop) return leader.pos.copy();
    if (etatVoix.centre) return createVector(width / 2, height / 2);
    const d = etatVoix.dir;
    if (!d) return null;
    return createVector(
      constrain(leader.pos.x + d.x * 400, 60, width - 60),
      constrain(leader.pos.y + d.y * 400, 100, height - 60)
    );
  }
  return createVector(mouseX, mouseY);
}

function turboControle() {
  if (mainActive()) return mainVisible() && etatMain.pince;
  if (controle === 'voix') return etatVoix.turbo > millis();
  return false;
}

function reinitialiserControle() {
  etatVoix.dir = null;
  etatVoix.stop = false;
  etatVoix.centre = false;
  etatVoix.turbo = 0;
  etatVoix.lent = 0;
  etatMain.trace = [];
  etatMain.pinceAvant = true; // évite un clic fantôme au lancement
}

// Appelé à chaque image : clic par pincement, traînée lumineuse, jauge du micro
function majControle() {
  if (mainActive()) {
    const visible = mainVisible();
    const pince = visible && etatMain.pince;
    if (pince && !etatMain.pinceAvant && estEcranFin()) cliquer(etatMain.lisse.x, etatMain.lisse.y);
    etatMain.pinceAvant = pince;
    if (visible) {
      etatMain.trace.push({ x: etatMain.lisse.x, y: etatMain.lisse.y });
      if (etatMain.trace.length > 18) etatMain.trace.shift();
    } else if (etatMain.trace.length) {
      etatMain.trace.shift();
    }
  }
  if (controle === 'voix') {
    majNiveauMicro();
    // la reconnaissance ne démarre jamais (Edge : service vocal en ligne désactivé, pas d'internet…)
    if (!etatVoix.actif && !etatVoix.bloque && millis() - etatVoix.tDebut > 4000) {
      if ((etatVoix.essai || 0) < 3) relancerVoixAutrement();
      else if (!etatVoix.erreur) etatVoix.erreur = 'La reconnaissance vocale ne démarre pas';
    }
  }
}

// ---------- choix du contrôle dans le menu ----------

function choisirControle(k) {
  if (controle === 'doigts' && k !== 'doigts') arreterMain();
  if (controle === 'voix' && k !== 'voix') arreterVoix();
  controle = k;
  for (const c in cartesControle) {
    if (c === k) cartesControle[c].addClass('sel'); else cartesControle[c].removeClass('sel');
  }
  if (ligneCamera) ligneCamera.style('display', k === 'doigts' ? 'flex' : 'none');
  if (barreMic) barreMic.style('display', k === 'voix' ? 'block' : 'none');
  if (k === 'doigts') demarrerMain();
  if (k === 'voix') demarrerVoix();
  majStatutControle();
}

const EST_EDGE = /Edg\//.test(navigator.userAgent);

function conseilVoix() {
  if (/aucun micro/i.test(etatVoix.erreur)) return ' Branche ou active un micro, ou joue avec les flèches / Z Q S D.';
  if (EST_EDGE) return ' Dans Edge : Windows > Confidentialité et sécurité > Voix > « Reconnaissance vocale en ligne » doit être activée (internet requis). Sinon essaie Chrome, ou joue avec les flèches / Z Q S D.';
  return ' Vérifie Windows > Confidentialité > Voix > « Reconnaissance vocale en ligne », ou joue avec les flèches / Z Q S D.';
}

function texteStatutControle() {
  if (controle === 'souris') return '🖱️ Le serpent suit ton curseur.';
  if (controle === 'doigts') {
    if (etatMain.erreur) return '⚠️ ' + etatMain.erreur + ' — la souris prend le relais.';
    if (!etatMain.actif) return '📷 Démarrage de la caméra… autorise l’accès dans le navigateur.';
    if (!etatMain.pret) return '⏳ Chargement de la détection des mains (quelques secondes)…';
    return mainVisible()
      ? '✋ Main détectée ! Ta paume guide le serpent · 🤏 pince = turbo · ✊ poing = frein.'
      : '✋ Montre ta main devant la caméra (si le serpent n’a pas de consigne, il avance tout seul).';
  }
  if (etatVoix.erreur) return '⚠️ ' + etatVoix.erreur + conseilVoix() + ' [diag : ' + ((etatVoix.log || []).join(' › ') || 'aucun événement') + ']';
  if (!etatVoix.actif) return '🎤 Démarrage du micro… autorise l’accès dans le navigateur.';
  return '🎤 Micro actif (la barre bouge quand tu parles). Dis « haut », « bas », « gauche », « droite », « stop », « turbo »…'
    + (etatVoix.texte ? ' — entendu : « ' + etatVoix.texte + ' »' : '');
}

function majStatutControle() {
  if (divStatut) divStatut.html(texteStatutControle());
}

// ---------- MAIN : MediaPipe Hands ----------

function chargerScript(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = ok;
    s.onerror = () => ko(new Error('Chargement impossible : ' + src));
    document.head.appendChild(s);
  });
}

// Si le <script> hands.js n'est pas dans index.html, on le charge ici
function assurerHands() {
  if (typeof Hands !== 'undefined') return Promise.resolve();
  return chargerScript(MEDIAPIPE_BASE + 'hands.js');
}

// Dans une page intégrée (iframe : aperçu, itch.io…) le navigateur bloque souvent caméra et micro
function enIframe() {
  try { return window.self !== window.top; } catch (e) { return true; }
}

function messageErreurCamera(e) {
  const n = e && e.name;
  if (n === 'TimeoutError' || ((n === 'NotAllowedError' || n === 'SecurityError') && enIframe())) {
    return 'Caméra bloquée dans cette page intégrée : ouvre le jeu dans un nouvel onglet ou en local (http://127.0.0.1)';
  }
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'Caméra refusée : autorise-la dans la barre d’adresse';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'Aucune caméra détectée';
  if (n === 'NotReadableError') return 'Caméra déjà utilisée par une autre application';
  return 'Caméra indisponible' + (e && e.message ? ' (' + e.message + ')' : '');
}

function fermerFluxCamera() {
  try { if (videoCam && videoCam.srcObject) videoCam.srcObject.getTracks().forEach(t => t.stop()); } catch (e) {}
  if (videoCam) videoCam.srcObject = null;
}

async function ouvrirCamera(deviceId) {
  fermerFluxCamera();
  const video = { width: { ideal: 640 }, height: { ideal: 480 } };
  if (deviceId) video.deviceId = { exact: deviceId }; else video.facingMode = 'user';
  // si le navigateur ne répond jamais (permission bloquée en silence), on abandonne après 10 s
  const flux = await Promise.race([
    navigator.mediaDevices.getUserMedia({ video, audio: false }),
    new Promise((ok, ko) => setTimeout(() => ko({ name: 'TimeoutError' }), 10000))
  ]);
  videoCam.srcObject = flux;
  await videoCam.play();
  return flux;
}

function remplirSelectCamera(cams, idActuel) {
  if (!selectCamera) return;
  selectCamera.elt.innerHTML = '';
  cams.forEach((c, i) => selectCamera.option(c.label || ('Caméra ' + (i + 1)), c.deviceId));
  if (idActuel) selectCamera.elt.value = idActuel;
}

async function demarrerMain(deviceId) {
  etatMain.erreur = '';
  etatMain.actif = false;
  etatMain.pret = false;
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('utilise http://127.0.0.1 ou https');
    }
    await assurerHands();
    if (!videoCam) {
      videoCam = document.createElement('video');
      videoCam.setAttribute('playsinline', '');
      videoCam.muted = true;
      videoCam.style.cssText = 'position:fixed;left:-9999px;top:0;width:640px;height:480px;';
      document.body.appendChild(videoCam);
    }
    if (!handsInst) {
      handsInst = new Hands({ locateFile: f => MEDIAPIPE_BASE + f });
      handsInst.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      handsInst.onResults(surMain);
    }
    let flux = await ouvrirCamera(deviceId || null);
    if (controle !== 'doigts') { fermerFluxCamera(); return; }

    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    // la caméra infrarouge (Windows Hello) donne une image grise : on prend la vraie webcam
    if (!deviceId && REGEX_CAMERA_IR.test(flux.getVideoTracks()[0].label)) {
      const autre = cams.find(c => c.label && !REGEX_CAMERA_IR.test(c.label));
      if (autre) flux = await ouvrirCamera(autre.deviceId);
    }
    if (controle !== 'doigts') { fermerFluxCamera(); return; }

    remplirSelectCamera(cams, flux.getVideoTracks()[0].getSettings().deviceId);
    etatMain.actif = true;
    etatMain.debutCam = millis();
    boucleMain();
  } catch (e) {
    etatMain.actif = false;
    etatMain.erreur = messageErreurCamera(e);
  }
}

// Envoie chaque nouvelle image de la caméra à MediaPipe (une à la fois)
function boucleMain() {
  if (etatMain.boucle) return;
  etatMain.boucle = true;
  const tick = async () => {
    if (controle !== 'doigts' || !etatMain.actif) { etatMain.boucle = false; return; }
    if (!etatMain.occupe && videoCam.readyState >= 2 && videoCam.currentTime !== etatMain.dernierT) {
      etatMain.dernierT = videoCam.currentTime;
      etatMain.occupe = true;
      try {
        await handsInst.send({ image: videoCam });
      } catch (e) {
        etatMain.erreur = 'Détection des mains indisponible' + (e && e.message ? ' (' + e.message + ')' : '');
        etatMain.boucle = false;
        etatMain.occupe = false;
        return;
      }
      etatMain.occupe = false;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function arreterMain() {
  fermerFluxCamera();
  etatMain.actif = false;
  etatMain.pret = false;
  etatMain.lm = null;
  etatMain.lisse = null;
  etatMain.pince = false;
  etatMain.poing = false;
  etatMain.trace = [];
}

// Résultats MediaPipe : 21 points par main, coordonnées normalisées 0..1
function surMain(res) {
  etatMain.pret = true;
  const L = res.multiHandLandmarks && res.multiHandLandmarks[0];
  etatMain.lm = L || null;
  if (!L) return;
  etatMain.vu = millis();

  // poing fermé : au moins 3 doigts dont le bout est ramené près du poignet
  let plies = 0;
  [[8, 5], [12, 9], [16, 13], [20, 17]].forEach(([bout, base]) => {
    if (dist(L[bout].x, L[bout].y, L[0].x, L[0].y) < 1.2 * dist(L[base].x, L[base].y, L[0].x, L[0].y)) plies++;
  });
  etatMain.poing = plies >= 3;

  // pincement pouce (4) - index (8), relatif à la taille de la main, avec hystérésis
  const tailleMain = dist(L[0].x, L[0].y, L[9].x, L[9].y) || 1;
  const rp = dist(L[4].x, L[4].y, L[8].x, L[8].y) / tailleMain;
  if (etatMain.poing) etatMain.pince = false;
  else if (!etatMain.pince && rp < 0.3) etatMain.pince = true;
  else if (etatMain.pince && rp > 0.5) etatMain.pince = false;

  // pointeur = centre de la paume (ne bouge pas quand les doigts se plient ou se pincent)
  const cx = (L[0].x + L[5].x + L[9].x + L[13].x + L[17].x) / 5;
  const cy = (L[0].y + L[5].y + L[9].y + L[13].y + L[17].y) / 5;
  // image miroir + marges : pas besoin d'aller jusqu'au bord de la caméra
  const x = constrain(map(1 - cx, 0.18, 0.82, 0, width), 0, width);
  const y = constrain(map(cy, 0.15, 0.8, 0, height), 0, height);
  if (!etatMain.lisse) {
    etatMain.lisse = createVector(x, y);
  } else {
    // lissage adaptatif : tremblements amortis, grands gestes suivis vite
    const d = dist(etatMain.lisse.x, etatMain.lisse.y, x, y);
    const a = constrain(map(d, 3, 120, 0.18, 0.75), 0.18, 0.75);
    etatMain.lisse.x = lerp(etatMain.lisse.x, x, a);
    etatMain.lisse.y = lerp(etatMain.lisse.y, y, a);
  }
}

// ---------- VOIX : Web Speech API + jauge du micro ----------

function normaliserVoix(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ');
}

// Jauge de niveau : prouve que le micro t'entend, même si la reconnaissance est lente
async function demarrerMicro() {
  if (etatVoix.analyseur || etatVoix.micEnCours) return;
  etatVoix.micEnCours = true;
  try {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (controle !== 'voix') { flux.getTracks().forEach(t => t.stop()); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    etatVoix.ctx = new AC();
    if (etatVoix.ctx.state === 'suspended') etatVoix.ctx.resume();
    const src = etatVoix.ctx.createMediaStreamSource(flux);
    etatVoix.analyseur = etatVoix.ctx.createAnalyser();
    etatVoix.analyseur.fftSize = 512;
    src.connect(etatVoix.analyseur);
    etatVoix.tampon = new Uint8Array(etatVoix.analyseur.fftSize);
    etatVoix.fluxMicro = flux;
  } catch (e) {
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
      etatVoix.erreur = enIframe() ? 'Micro bloqué dans cette page intégrée : ouvre le jeu dans un nouvel onglet ou en local' : 'Micro refusé';
      etatVoix.bloque = true;
    } else if (e && e.name === 'NotFoundError') {
      etatVoix.erreur = 'Aucun micro détecté';
      etatVoix.bloque = true;
    }
  }
  etatVoix.micEnCours = false;
}

function arreterMicro() {
  try { if (etatVoix.fluxMicro) etatVoix.fluxMicro.getTracks().forEach(t => t.stop()); } catch (e) {}
  try { if (etatVoix.ctx) etatVoix.ctx.close(); } catch (e) {}
  etatVoix.fluxMicro = null;
  etatVoix.ctx = null;
  etatVoix.analyseur = null;
  etatVoix.niveau = 0;
}

function majNiveauMicro() {
  if (!etatVoix.analyseur) {
    // pas de jauge audio (Edge) : on anime la barre avec les événements « son détecté » de la reconnaissance
    etatVoix.niveau = max(etatVoix.niveau * 0.92, etatVoix.pic || 0);
    etatVoix.pic = 0;
    return;
  }
  etatVoix.analyseur.getByteTimeDomainData(etatVoix.tampon);
  let s = 0;
  for (let i = 0; i < etatVoix.tampon.length; i++) {
    const v = (etatVoix.tampon[i] - 128) / 128;
    s += v * v;
  }
  const rms = Math.sqrt(s / etatVoix.tampon.length);
  etatVoix.niveau = lerp(etatVoix.niveau, constrain(rms * 6, 0, 1), 0.4);
}

// Langues essayées tour à tour si la reconnaissance ne démarre pas (les mots anglais up / down /
// left / right / stop / go sont aussi compris par le jeu)
const LANGUES_VOIX = ['fr-FR', 'en-US', 'fr'];

function logVoix(txt) {
  etatVoix.log = (etatVoix.log || []).concat(txt).slice(-4);
}

function creerRecoVoix(SR, lang) {
  try { if (recoVoix) { recoVoix.onend = null; recoVoix.abort(); } } catch (e) {}
  const r = new SR();
  r.lang = lang;
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 3;
  r.onstart = () => { etatVoix.actif = true; etatVoix.erreur = ''; logVoix('start ' + lang); };
  r.onaudiostart = () => { etatVoix.actif = true; etatVoix.erreur = ''; logVoix('audio'); };
  r.onsoundstart = () => { etatVoix.pic = 0.8; };
  r.onspeechstart = () => { etatVoix.pic = 1; };
  r.onresult = surVoix;
  r.onerror = e => {
    logVoix('erreur ' + e.error);
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      etatVoix.erreur = 'Micro ou reconnaissance vocale bloqués';
      etatVoix.bloque = true;
    } else if (e.error === 'network') {
      etatVoix.erreur = 'Reconnaissance vocale indisponible (connexion internet requise)';
    } else if (e.error === 'audio-capture') {
      etatVoix.erreur = 'Aucun micro détecté';
      etatVoix.bloque = true;
    } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
      etatVoix.erreur = 'Reconnaissance vocale impossible (' + e.error + ')';
    }
  };
  r.onend = () => {
    etatVoix.actif = false;
    logVoix('fin');
    // la reconnaissance s'arrête d'elle-même après un silence : on la relance
    if (controle === 'voix' && !etatVoix.bloque && recoVoix === r) {
      setTimeout(() => lancerReco(), etatVoix.erreur ? 1500 : 250);
    }
  };
  return r;
}

function lancerReco() {
  if (controle !== 'voix' || !recoVoix) return;
  try { recoVoix.start(); } catch (e) {
    if (e && e.name !== 'InvalidStateError') { etatVoix.erreur = 'Démarrage impossible (' + e.name + ')'; logVoix('exception ' + e.name); }
  }
}

function demarrerVoix() {
  etatVoix.erreur = '';
  etatVoix.bloque = false;
  etatVoix.tDebut = millis();
  etatVoix.essai = 0;
  etatVoix.log = [];
  demarrerMicro(); // jauge de niveau + demande l'autorisation du micro (comme dans la version d'origine)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    etatVoix.erreur = 'Reconnaissance vocale non supportée par ce navigateur (utilise Chrome ou Edge)';
    return;
  }
  recoVoix = creerRecoVoix(SR, LANGUES_VOIX[0]);
  lancerReco();
}

// Si rien ne démarre au bout de 4 s : on recrée la reconnaissance avec une autre langue
function relancerVoixAutrement() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  etatVoix.essai = (etatVoix.essai || 0) + 1;
  const lang = LANGUES_VOIX[etatVoix.essai % LANGUES_VOIX.length];
  logVoix('nouvel essai ' + lang);
  etatVoix.tDebut = millis();
  recoVoix = creerRecoVoix(SR, lang);
  lancerReco();
}

function arreterVoix() {
  try { if (recoVoix) { recoVoix.onend = null; recoVoix.abort(); } } catch (e) {}
  recoVoix = null;
  arreterMicro();
  etatVoix.actif = false;
  etatVoix.dir = null;
  etatVoix.stop = false;
  etatVoix.centre = false;
}

function surVoix(e) {
  const r = e.results[e.results.length - 1];
  etatVoix.erreur = '';
  let cmds = [];
  let txt0 = '';
  // on regarde les alternatives proposées : la bonne est parfois la 2e ou la 3e
  for (let j = 0; j < r.length; j++) {
    const txt = normaliserVoix(r[j].transcript);
    if (j === 0) txt0 = txt;
    const c = txt.split(/\s+/).map(m => MOT_VERS_CMD[m]).filter(Boolean);
    if (c.length) { cmds = c; break; }
  }
  etatVoix.texte = txt0.trim().split(/\s+/).slice(-5).join(' ');
  if (cmds.length) appliquerCommandes(cmds, r.isFinal);
}

function appliquerCommandes(cmds, finale) {
  const c = cmds[cmds.length - 1];
  const p = cmds[cmds.length - 2];
  const maintenant = millis();
  const etiquette = t => { etatVoix.derniere = t; etatVoix.tDerniere = maintenant; };

  if (DIRECTIONS_VOIX[c]) {
    let v = DIRECTIONS_VOIX[c].slice();
    let nom = c;
    // « haut droite » : deux axes différents => diagonale
    if (p && DIRECTIONS_VOIX[p] && (DIRECTIONS_VOIX[p][0] !== 0) !== (v[0] !== 0)) {
      v = [v[0] + DIRECTIONS_VOIX[p][0], v[1] + DIRECTIONS_VOIX[p][1]];
      nom = p + ' ' + c;
    }
    const n = Math.hypot(v[0], v[1]) || 1;
    etatVoix.dir = { x: v[0] / n, y: v[1] / n };
    etatVoix.stop = false;
    etatVoix.centre = false;
    etiquette(nom);
  } else if (c === 'stop') {
    etatVoix.stop = true;
    etatVoix.centre = false;
    etatVoix.dir = null;
    etiquette('stop');
  } else if (c === 'centre') {
    etatVoix.centre = true;
    etatVoix.stop = false;
    etatVoix.dir = null;
    etiquette('centre');
  } else if (c === 'turbo') {
    etatVoix.turbo = maintenant + 4000;
    etatVoix.lent = 0;
    etiquette('turbo');
  } else if (c === 'lent') {
    etatVoix.lent = maintenant + 5000;
    etatVoix.turbo = 0;
    etiquette('lent');
  } else if (finale && estEcranFin()) {
    if (c === 'rejouer') lancerCompteARebours();
    else if (c === 'suivant' && victoire && niveauCourant < NB_NIVEAUX) { niveauCourant++; lancerCompteARebours(); }
    else if (c === 'menu') afficherMenu();
  }
}
