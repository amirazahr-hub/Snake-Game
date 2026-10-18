// =====================================================
// SNAKE GAME : steering behaviors, thèmes, niveaux, contrôle souris / main / voix
// =====================================================
// PLAN DU PROJET (ordre de chargement dans index.html)
//
//   vehicle.js    *  classe Vehicle + TOUS les steering behaviors   <-- à lire
//   entites.js    *  objets du jeu : tous des Vehicle (Snake, Food, Obstacle...)
//   sketch.js     *  ce fichier : état global, setup, draw, pilotage du serpent
//   jeu.js           modes (Texte, Arcade, Circuit, Duel), niveaux, fin de partie
//   controles.js     contrôle souris / main (MediaPipe) / voix (Web Speech)
//   decors.js, serpents.js, ui.js, controles_ui.js, audio.js : dessin et interface
//
// Les fichiers marqués * contiennent la matière « steering ».
// Tous les objets sont des Vehicle ; chaque comportement renvoie une FORCE
// que l'on additionne avec applyForce().
// =====================================================

// Comportements activables / désactivables par les boutons du panneau STEERING
const comportements = {
  souris: true,       // arrive : la tête suit le contrôle (souris, main ou voix)
  wander: false,      // errance
  separation: true,   // les véhicules s'écartent les uns des autres
  evitement: true,    // avoid (obstacles) / evade (IA du duel)
  fuite: false,       // flee : proies qui fuient le serpent
  poursuite: false,   // pursue : obstacles qui poursuivent le serpent
  predateurs: true,   // pursue : prédateurs qui chassent le serpent (sinon ils errent)
  flocking: true,     // bancs de créatures : séparation + alignement + cohésion
  limites: true,      // boundaries : murs invisibles (sinon téléportation aux bords)
  escorte: true,      // leader following : drones d'escorte qui suivent la tête
  debug: false        // affiche vecteurs et rayons
};

// Multiplicateur de force de chaque comportement (curseurs du panneau, 0 à 3).
// Chaque poids du code est multiplié par cette valeur : 1 = réglage d'origine.
const poids = {
  souris: 1, wander: 1, separation: 1, evitement: 1, fuite: 1,
  poursuite: 1, predateurs: 1, flocking: 1, limites: 1, escorte: 1
};
let vitesseBase = 12; // vitesse max du serpent (curseur du panneau)

// [clé, libellé, description (infobulle), couleur, touche, a un curseur de poids]
const defsComportements = [
  ['souris',     'Arrive (contrôle)',   'La tête rejoint la cible (souris, main, voix) et freine en approchant.', '#00e5ff', '1', true],
  ['wander',     'Wander',              'Errance : un point glisse sur un cercle devant le véhicule.',            '#ffe14d', '2', true],
  ['separation', 'Séparation',          'Les véhicules voisins se repoussent.',                                    '#ff9f43', '3', true],
  ['evitement',  'Avoid / Evade',       'Le serpent contourne les obstacles ; l\'IA du duel fuit le joueur.',     '#ff4d6d', '4', true],
  ['fuite',      'Flee (proies)',       'Les proies fuient la tête du serpent.',                                   '#c77dff', '5', true],
  ['poursuite',  'Pursue (obstacles)',  'Les obstacles anticipent ta trajectoire et te chassent.',                 '#ff6b35', '6', true],
  ['predateurs', 'Pursue (prédateurs)', 'Les prédateurs te traquent (désactivé : ils errent).',                    '#ff3b9a', '7', true],
  ['flocking',   'Flocking (banc)',     'Séparation + alignement + cohésion des petits poissons / lucioles.',      '#7bed9f', '8', true],
  ['limites',    'Boundaries',          'Murs invisibles (désactivé : téléportation de l\'autre côté).',          '#74b9ff', '9', true],
  ['escorte',    'Leader following',    'Des drones d\'escorte suivent le serpent en formation (arrive + séparation).', '#55efc4', '0', true],
  ['debug',      'Debug',               'Dessine vecteurs, forces colorées, rayons et capteurs.',                  '#ffffff', 'b', false]
];

let font;
let vehicles = [];
let vehiclesJ2 = [];
let leader;
let leaderJ2;
let cibles = [];
let ciblesFin = [];
let nourritures = [];
let obstacles = [];
let predateurs = [];
let boids = [];
let powerups = [];
let escortes = [];
let anneaux = [];
let particules = [];
let decor = [];
let departCircuit;

let gameState = 'MENU';
let modeCourant = 'ARCADE';
let themeCourant = 'Espace';
let niveauCourant = 1;
const NB_NIVEAUX = 5;

let score = 0;
let scoreJ2 = 0;
let tempsRestant = 30;
let tempsEcoule = 0;
let vies = 3;
let invulJusqua = 0;
let secousse = 0;
let effets = { aimant: 0, bouclier: false, ralenti: 0, turbo: 0 };
let anneauSuivant = 0;
let nourrituresMangees = 0;
let victoire = false;
let messageDuelFin = "";
let paramsNiv = {};

let intervalTimer = null;
let countdownTimer = null;
let countdownValue = 3;
let sonJoue = false;

const nbSegmentsInitiaux = 12;   // longueur de départ
const espacementSegment = 11;
const nbSegmentsMax = 40;        // le serpent ne s'allonge pas à l'infini

// =====================================================
// DONNÉES : MODES, THÈMES, MODÈLES
// =====================================================

const MODES = {
  TEXTE:   { nom: 'Texte / Grille', icone: '🔤', desc: 'Attrape tous les points du mot avant la fin du temps.' },
  ARCADE:  { nom: 'Arcade',         icone: '🚀', desc: 'Collecte les bonus, esquive obstacles et prédateurs.' },
  CIRCUIT: { nom: 'Circuit',        icone: '🏁', desc: 'Franchis les anneaux dans l\'ordre, évite tout, atteins l\'arrivée.' },
  DUEL:    { nom: 'Duel',           icone: '👑', desc: 'Affronte une IA : le meilleur score gagne la couronne.' }
};

const THEMES = {
  'Espace': { icone: '🌌', accent: '#00ffcc', fond: ['#04040c', '#0b0b2a', '#1a0a38'], obstacle: 'Astéroïde', proie: 'Cristaux' },
  'Jungle': { icone: '🌴', accent: '#9dff3b', fond: ['#021a0b', '#06381a', '#0e5a2c'], obstacle: 'Rocher',    proie: 'Fruits' },
  'Océan':  { icone: '🌊', accent: '#4dd2ff', fond: ['#00131f', '#00406b', '#0a7bb8'], obstacle: 'Oursin',    proie: 'Perles' },
  'Volcan': { icone: '🌋', accent: '#ff8a3d', fond: ['#120300', '#3a0b00', '#7d1e00'], obstacle: 'Roche de lave', proie: 'Gemmes' },
  'Néon':   { icone: '🕹️', accent: '#ff2bd6', fond: ['#07000f', '#1d0640', '#5b1470'], obstacle: 'Cristal glitch', proie: 'Cubes' }
};

const MODELES = {
  'Python Géant':      'Massif et lourd. Losanges sombres sur le dos, tête large en fer de lance.',
  'Cobra Royal':       'Élancé. Capuchon déployé avec lunettes, bandes claires, pupilles rondes.',
  'Dragon Électrique': 'Corps lumineux, piquants, cornes, éclairs et queue en pointe.',
  'Crotale':           'Motifs en diamants, fossettes thermiques, sonnette qui vibre au bout.',
  'Cyber Mécha':       'Serpent robot : plaques métalliques, joints néon qui pulsent, visière rouge.',
  'Cristal':           'Corps de verre facetté aux éclats scintillants, yeux lumineux.'
};

// =====================================================
// PRELOAD / SETUP
// =====================================================

function preload() {
  font = loadFont('./assets/inconsolata.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  initialiserDecor();
  leader = new Vehicle(width / 2, height / 2);
  leaderJ2 = new Vehicle(width / 3, height / 3);
  injecterStyles();
  creerInterfaceMenu();
  creerPanneauComportements();
}

function keyPressed() {
  const jeu = ['JEU_TEXTE', 'ARCADE', 'DUEL', 'CIRCUIT'];
  if (!jeu.includes(gameState)) return;
  if (keyCode === ESCAPE) {
    if (intervalTimer) clearInterval(intervalTimer);
    afficherMenu();
    return;
  }
  if (key === 'h' || key === 'H') {
    basculerPanneau(); // ouvre / ferme la liste des comportements
    return;
  }
  // secours du mode Voix : flèches / Z Q S D pour tourner, espace pour stopper
  if (controle === 'voix') {
    const c = keyCode === 32 ? 'stop' : TOUCHES_DIRECTION[keyCode];
    if (c) {
      appliquerCommandes([c], true);
      return false;
    }
  }
  if (key === 'p' || key === 'P') { basculerDemo(); return; }
  const d = defsComportements.find(c => c[4] === String(key).toLowerCase());
  if (d) basculerComportement(d[0]);
}

// =====================================================
// MOUVEMENT DES SERPENTS (STEERING)
// =====================================================

function vitesseJoueur() {
  if (effets.turbo > millis() || turboControle()) return vitesseBase * 1.5;
  if (controle === 'voix' && etatVoix.lent > millis()) return vitesseBase * 0.5;
  return vitesseBase;
}

// Chaque force du chef est mémorisée (ld.forces) pour le mode Debug.
function majLeader(ld) {
  ld.maxSpeed = vitesseJoueur();
  ld.maxForce = 2.8; // réactif : le serpent colle au curseur
  ld.forces = [];
  ld.rayonFreinage = 70;
  const ajouter = (cle, f) => {
    ld.applyForce(f);
    if (comportements.debug) ld.forces.push({ cle, f });
  };
  if (comportements.souris) {
    const cible = cibleControle(); // souris, paume (MediaPipe) ou direction vocale
    if (cible) {
      ajouter('souris', ld.arrive(cible, 0).mult(poids.souris));
    } else {
      // aucune consigne (main hors caméra, pas encore d'ordre vocal) : le serpent
      // croise tout seul, il n'est jamais bloqué
      ld.maxSpeed = vitesseBase * 0.5;
      ajouter('wander', ld.wander().mult(0.6 * poids.wander));
    }
  }
  if (comportements.wander) ajouter('wander', ld.wander().mult((comportements.souris ? 0.6 : 1.5) * poids.wander));
  if (comportements.evitement && (gameState === 'ARCADE' || gameState === 'CIRCUIT')) {
    ajouter('evitement', ld.avoid(obstacles.concat(predateurs)).mult(2 * poids.evitement));
  }
  if (comportements.limites || comportements.wander) ajouter('limites', ld.boundaries(60).mult(1.5 * poids.limites));
  if (!comportements.souris && !comportements.wander) ld.vel.mult(0.96);
  ld.update();
}

function majCorps(segs, ld, vMax, fMax) {
  segs.forEach((v, i) => {
    v.maxSpeed = i === 0 ? vMax * 1.35 : vMax; // la tête rattrape le chef
    v.maxForce = i === 0 ? fMax * 2.5 : fMax; // la tête rattrape vite le chef
    if (i === 0) v.applyForce(v.arrive(ld.pos, 0));
    else v.applyForce(v.arrive(segs[i - 1].pos, espacementSegment));
    if (comportements.separation) v.applyForce(v.separate(segs, 9).mult(0.8 * poids.separation));
    v.update();
  });
  // Contrainte de longueur : chaque segment reste à portée du précédent, sinon le corps
  // s'étire en ligne droite quand on va vite et le serpent paraît interminable.
  const maxLien = espacementSegment * 1.5;
  segs.forEach((v, i) => {
    const cible = i === 0 ? ld.pos : segs[i - 1].pos;
    const lim = i === 0 ? 45 : maxLien;
    const d = p5.Vector.dist(v.pos, cible);
    if (d > lim) v.pos.add(p5.Vector.sub(cible, v.pos).setMag(d - lim));
  });
}

// Drones d'escorte : LEADER FOLLOWING (arrive vers un point derrière / à côté de la tête)
function majEscortes() {
  if (!comportements.escorte || !vehicles[0]) return;
  escortes.forEach(e => { e.comportement(vehicles[0], escortes); e.dessiner(); });
}

const MAX_SEGMENTS = 34; // longueur max du serpent : reste jouable et fluide

function agrandir(segs) {
  if (segs.length >= nbSegmentsMax) return;
  if (segs.length >= MAX_SEGMENTS) return;
  const dernier = segs[segs.length - 1];
  segs.push(new Snake(dernier.pos.x, dernier.pos.y));
}

// =====================================================
// BOUCLE PRINCIPALE
// =====================================================

function draw() {
  majControle();
  push();
  if (secousse > 0) {
    translate(random(-secousse, secousse), random(-secousse, secousse));
    secousse *= 0.85;
    if (secousse < 0.5) secousse = 0;
  }
  dessinerScene();
  pop();
  dessinerVignette();
  dessinerOverlayControle();
  dessinerToast();
}

function dessinerScene() {
  dessinerFond();

  if (gameState === 'MENU') {
    dessinerApercuMenu();
    return;
  }

  if (gameState === 'COUNTDOWN') {
    const th = THEMES[themeCourant];
    push();
    textAlign(CENTER, CENTER);
    textFont('sans-serif');
    noFill();
    stroke(th.accent);
    strokeWeight(4);
    const tc = 200 + sin(frameCount * 0.2) * 20;
    ellipse(width / 2, height / 2, tc, tc);
    noStroke();
    fill(th.accent);
    textSize(20);
    text(`${MODES[modeCourant].icone} ${MODES[modeCourant].nom.toUpperCase()} · NIVEAU ${niveauCourant} · ${th.icone} ${themeCourant}`, width / 2, height / 2 - 170);
    fill(255);
    textSize(28);
    text("ARE YOU READY ??", width / 2, height / 2 - 120);
    fill(th.accent);
    textSize(76);
    text(countdownValue, width / 2, height / 2 + 5);
    fill(220);
    textSize(18);
    text(descriptionObjectif(), width / 2, height / 2 + 150);
    pop();
    return;
  }

  const skin = selectSkin.value();
  const custom = colorPickerTexte.value();
  const modele = selectModeleSerpent.value();
  const modeleIA = modele === 'Crotale' ? 'Python Géant' : 'Crotale';

  // ---------- écrans de fin ----------
  if (gameState === 'DUEL_FIN') {
    dessinerSerpentReel(vehicles, { skin, custom, modele, gagnant: score > scoreJ2, echelle: 1 });
    dessinerSerpentReel(vehiclesJ2, { skin: 'Feu & Lave', custom, modele: modeleIA, gagnant: scoreJ2 > score, echelle: 1 });
    dessinerEcranFin(messageDuelFin, color(0, 255, 204), `Score J1 : ${score}   |   Score IA : ${scoreJ2}`);
    return;
  }

  if (gameState === 'FIN_EXPLOSION') {
    if (!sonJoue) { jouerSonGameOver(); sonJoue = true; }
    vehicles.forEach((v, i) => {
      v.pos.add(v.vel);
      v.showPoint(i, vehicles.length, 14, skin, custom, modele);
    });
    majParticules();
    return;
  }

  if (gameState === 'GAME_OVER' || gameState === 'WIN') {
    if (!sonJoue) {
      if (gameState === 'WIN') jouerSonWinner(); else jouerSonGameOver();
      sonJoue = true;
    }
    vehicles.forEach((v, i) => {
      v.maxSpeed = 14;
      v.maxForce = 1.2;
      v.applyForce(v.arrive(ciblesFin[i], 0));
      v.update();
      v.showPoint(i, vehicles.length, 6, skin, custom, modele);
    });
    if (gameState === 'WIN') {
      let sous = `Score : ${score}`;
      dessinerEcranFin(null, color(46, 204, 113), sous);
    } else {
      dessinerEcranFin(null, color(255, 80, 80), `Score : ${score}`);
    }
    return;
  }

  // ---------- jeu en cours ----------
  const tete = vehicles[0];

  // power-ups (apparition + ramassage)
  if (frameCount % 420 === 0 && powerups.length < 2) {
    const p = positionLibre(0, null);
    powerups.push(new PowerUp(p.x, p.y, choisirTypePower()));
  }

  if (gameState === 'DUEL') {
    majJoueurEtIA();
  } else {
    majLeader(leader);
    majCorps(vehicles, leader, vitesseJoueur(), 1.2);
  }

  if (gameState === 'JEU_TEXTE') majTexte();
  else if (gameState === 'ARCADE') majArcade();
  else if (gameState === 'CIRCUIT') majCircuit();
  else if (gameState === 'DUEL') majDuel();

  // power-ups
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.comportement();
    p.dessiner();
    if (tete && p5.Vector.dist(tete.pos, p.pos) < 30) {
      activerPower(p.type);
      burst(p.pos.x, p.pos.y, [255, 255, 120], 18);
      texteFlottant(p.pos.x, p.pos.y - 20, p.type.toUpperCase() + ' !', [255, 255, 120]);
      powerups.splice(i, 1);
    } else if (p.vie <= 0) {
      powerups.splice(i, 1);
    }
  }

  majEscortes();

  // serpents (réalistes)
  if (gameState !== 'FIN_EXPLOSION') {
    const clignote = millis() < invulJusqua && (gameState === 'ARCADE' || gameState === 'CIRCUIT');
    const j1Gagne = score >= scoreJ2;
    dessinerSerpentReel(vehicles, {
      skin, custom, modele, bouclier: effets.bouclier, clignote,
      gagnant: gameState === 'DUEL' && j1Gagne, echelle: 1
    });
    if (gameState === 'DUEL') {
      dessinerSerpentReel(vehiclesJ2, { skin: 'Feu & Lave', custom, modele: modeleIA, gagnant: !j1Gagne, echelle: 1 });
    }
  }

  majParticules();
  majDemo();
  if (comportements.debug) dessinerDebug();
  dessinerHUD();
}

// =====================================================
// SOURIS / FENÊTRE
// =====================================================

// x, y : position de la souris OU de l'index (pincement sur écran de fin)
function cliquer(x, y) {
  const jeu = ['JEU_TEXTE', 'ARCADE', 'DUEL', 'CIRCUIT'];
  if (jeu.includes(gameState)) {
    if (x > width - 150 && x < width - 20 && y > 20 && y < 56) {
      if (intervalTimer) clearInterval(intervalTimer);
      afficherMenu();
    }
  } else if (estEcranFin()) {
    listeBoutonsFin().forEach(b => {
      if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) {
        if (b.act === 'next') { niveauCourant++; lancerCompteARebours(); }
        else if (b.act === 'again') { lancerCompteARebours(); }
        else { afficherMenu(); }
      }
    });
  }
}

function mousePressed() {
  cliquer(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initialiserDecor();
}
