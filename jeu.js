// =====================================================
// LOGIQUE DE JEU : niveaux, modes, fin de partie
// Progression sauvegardée, paramètres par niveau, lancement, logique de chaque mode.
// =====================================================

// =====================================================
// PROGRESSION (niveaux débloqués)
// =====================================================

function progression(mode) {
  try { return parseInt(localStorage.getItem('snakeProg_' + mode)) || 1; } catch (e) { return 1; }
}

function debloquerNiveau() {
  try {
    const actuel = progression(modeCourant);
    if (niveauCourant >= actuel && niveauCourant < NB_NIVEAUX) {
      localStorage.setItem('snakeProg_' + modeCourant, niveauCourant + 1);
    }
  } catch (e) {}
}

// =====================================================
// PIÈCES, COLLECTION ET BOUTIQUE (sauvegardées dans le navigateur)
// =====================================================

// prix 0 = disponible dès le départ
const CATALOGUE = {
  modeles: { 'Python Géant': 0, 'Crotale': 0, 'Cobra Royal': 150, 'Dragon Électrique': 400, 'Cyber Mécha': 600, 'Cristal': 900 },
  skins: { 'Naturel': 0, 'Custom Couleur': 0, 'Arc-en-ciel': 120, 'Feu & Lave': 200, 'Océan Profond': 200, 'Néon Cyber': 250 }
};
const ICONES_BOUTIQUE = {
  'Python Géant': '🐍', 'Crotale': '🔔', 'Cobra Royal': '👑', 'Dragon Électrique': '🐉', 'Cyber Mécha': '🤖', 'Cristal': '💎',
  'Naturel': '🌿', 'Custom Couleur': '🎨', 'Arc-en-ciel': '🌈', 'Feu & Lave': '🔥', 'Océan Profond': '🌊', 'Néon Cyber': '⚡'
};
let gainPieces = 0;

function pieces() {
  try { return parseInt(localStorage.getItem('snakePieces')) || 0; } catch (e) { return 0; }
}
function ajouterPieces(n) {
  try { localStorage.setItem('snakePieces', Math.max(0, pieces() + n)); } catch (e) {}
}
function collection() {
  try { return JSON.parse(localStorage.getItem('snakeCollection')) || []; } catch (e) { return []; }
}
function possede(type, nom) {
  return CATALOGUE[type][nom] === 0 || collection().includes(type + ':' + nom);
}
function acheter(type, nom) {
  const prix = CATALOGUE[type][nom];
  if (possede(type, nom) || pieces() < prix) return false;
  try {
    ajouterPieces(-prix);
    localStorage.setItem('snakeCollection', JSON.stringify(collection().concat(type + ':' + nom)));
    return true;
  } catch (e) { return false; }
}

// Récompense de fin de partie : proportionnelle au score + bonus de victoire
function recompenser() {
  gainPieces = min(150, floor(score / 8)) + (victoire ? 20 + 10 * niveauCourant : 5);
  ajouterPieces(gainPieces);
}

// =====================================================
// NIVEAUX : PARAMÈTRES ET OBJECTIFS
// =====================================================

function calculerParams() {
  const n = niveauCourant;
  paramsNiv = { temps: 30, vies: 3, nbMeteores: 0, vMeteor: 2, nbPred: 0, vPred: 2.5, objectif: 0, nbAnneaux: 0, vIA: 10 };
  switch (modeCourant) {
    case 'TEXTE':
      paramsNiv.temps = max(14, 38 - 4 * n);
      break;
    case 'ARCADE':
      paramsNiv.objectif = 4 + 3 * n;
      paramsNiv.nbMeteores = 3 + n;
      paramsNiv.vMeteor = 1.8 + 0.3 * n;
      paramsNiv.nbPred = n >= 3 ? (n >= 5 ? 2 : 1) : 0;
      paramsNiv.vPred = 2.4 + 0.3 * n;
      break;
    case 'CIRCUIT':
      paramsNiv.nbAnneaux = 4 + n;
      paramsNiv.nbMeteores = 5 + 2 * n;
      paramsNiv.vMeteor = 0.8 + 0.15 * n;
      paramsNiv.nbPred = n >= 2 ? (n >= 4 ? 2 : 1) : 0;
      paramsNiv.vPred = 2.2 + 0.3 * n;
      paramsNiv.temps = 80 - 6 * n;
      break;
    case 'DUEL':
      paramsNiv.temps = 30;
      paramsNiv.vIA = 7.5 + 0.9 * n;
      break;
  }
}

function descriptionObjectif() {
  switch (modeCourant) {
    case 'TEXTE': return `Attrape tous les points en ${paramsNiv.temps}s`;
    case 'ARCADE': return `Collecte ${paramsNiv.objectif} ${THEMES[themeCourant].proie.toLowerCase()} · ${paramsNiv.vies} vies`;
    case 'CIRCUIT': return `Franchis ${paramsNiv.nbAnneaux} anneaux en ${paramsNiv.temps}s · ${paramsNiv.vies} vies`;
    default: return `Bats l'IA en ${paramsNiv.temps}s`;
  }
}

// =====================================================
// COMPTE À REBOURS / LANCEMENT / FIN
// =====================================================

function lancerCompteARebours() {
  calculerParams();
  gameState = 'COUNTDOWN';
  countdownValue = 3;
  jouerSonReady();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownValue--;
    if (countdownValue > 0) {
      jouerSonReady();
    } else {
      clearInterval(countdownTimer);
      lancerJeu();
    }
  }, 1000);
}

function creerSerpent(x, y) {
  const segs = [];
  for (let i = 0; i < nbSegmentsInitiaux; i++) segs.push(new Snake(x + i * 5, y));
  return segs;
}

function positionLibre(distMin, depuis) {
  for (let essai = 0; essai < 50; essai++) {
    const p = createVector(random(120, width - 120), random(140, height - 120));
    if (!depuis || p.dist(depuis) > distMin) return p;
  }
  return createVector(random(120, width - 120), random(140, height - 120));
}

function genererCircuit() {
  anneaux = [];
  obstacles = [];
  departCircuit = createVector(width * 0.1, height * 0.55);
  const pts = [];
  let essais = 0;
  while (pts.length < paramsNiv.nbAnneaux && essais < 3000) {
    essais++;
    const p = createVector(random(110, width - 110), random(150, height - 110));
    const prev = pts.length ? pts[pts.length - 1] : departCircuit;
    if (p.dist(prev) > 200 && pts.every(q => q.dist(p) > 160)) pts.push(p);
  }
  pts.forEach((p, i) => anneaux.push(new Anneau(p.x, p.y, i)));
  essais = 0;
  while (obstacles.length < paramsNiv.nbMeteores && essais < 4000) {
    essais++;
    const p = createVector(random(80, width - 80), random(120, height - 80));
    if (pts.every(q => q.dist(p) > 110) && p.dist(departCircuit) > 150) {
      obstacles.push(new Obstacle(p.x, p.y, paramsNiv.vMeteor));
    }
  }
}

function lancerJeu() {
  score = 0;
  scoreJ2 = 0;
  tempsEcoule = 0;
  tempsRestant = paramsNiv.temps;
  vies = paramsNiv.vies;
  invulJusqua = 0;
  secousse = 0;
  sonJoue = false;
  victoire = false;
  anneauSuivant = 0;
  nourrituresMangees = 0;
  effets = { aimant: 0, bouclier: false, ralenti: 0, turbo: 0 };
  particules = [];
  nourritures = [];
  obstacles = [];
  predateurs = [];
  boids = [];
  powerups = [];
  escortes = [];
  anneaux = [];
  cibles = [];
  vehiclesJ2 = [];
  reinitialiserControle();
  panneauComportements.show();
  arreterDemo();
  rafraichirBoutons();

  const depart = createVector(width / 2, height / 2);
  if (modeCourant === 'CIRCUIT') {
    genererCircuit();
    depart.set(departCircuit.x, departCircuit.y);
  }
  leader = new Vehicle(depart.x, depart.y);
  leader.debugWander = true;
  leaderJ2 = new Vehicle(width / 3, height / 3);
  vehicles = creerSerpent(depart.x, depart.y);

  if (modeCourant !== 'TEXTE') {
    for (let i = 0; i < 4; i++) escortes.push(new Escorte(depart.x, depart.y, i));
    const nb = modeCourant === 'DUEL' ? 25 : 35;
    for (let i = 0; i < nb; i++) boids.push(new Boid(random(width), random(height)));
  }

  switch (modeCourant) {
    case 'TEXTE':
      gameState = 'JEU_TEXTE';
      cibles = ciblesTexte(champTexte.value());
      break;
    case 'ARCADE':
      gameState = 'ARCADE';
      for (let i = 0; i < 6; i++) nourritures.push(new Food(random(100, width - 100), random(140, height - 100)));
      for (let i = 0; i < paramsNiv.nbMeteores; i++) {
        const p = positionLibre(220, depart);
        obstacles.push(new Obstacle(p.x, p.y, paramsNiv.vMeteor));
      }
      for (let i = 0; i < paramsNiv.nbPred; i++) {
        const p = positionLibre(400, depart);
        predateurs.push(new Predator(p.x, p.y, paramsNiv.vPred));
      }
      break;
    case 'CIRCUIT':
      gameState = 'CIRCUIT';
      for (let i = 0; i < paramsNiv.nbPred; i++) {
        const p = positionLibre(400, depart);
        predateurs.push(new Predator(p.x, p.y, paramsNiv.vPred));
      }
      break;
    case 'DUEL':
      gameState = 'DUEL';
      for (let i = 0; i < 8; i++) nourritures.push(new Food(random(100, width - 100), random(140, height - 100)));
      vehiclesJ2 = creerSerpent(width / 3, height / 3);
      break;
  }
  if (modeCourant !== 'TEXTE') powerups.push(new PowerUp(...positionLibre(0, null).array().slice(0, 2), choisirTypePower()));
  demarrerTimer();
}

function choisirTypePower() {
  const liste = {
    TEXTE: ['aimant', 'turbo'],
    ARCADE: ['aimant', 'bouclier', 'ralenti', 'turbo'],
    CIRCUIT: ['bouclier', 'ralenti', 'turbo'],
    DUEL: ['aimant', 'turbo']
  }[modeCourant];
  return random(liste);
}

function demarrerTimer() {
  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = setInterval(() => {
    if (gameState === 'ARCADE') {
      tempsEcoule++;
    } else if (gameState === 'JEU_TEXTE' || gameState === 'CIRCUIT') {
      tempsRestant--;
      if (tempsRestant <= 5 && tempsRestant > 0) jouerSonStress();
      if (tempsRestant <= 0) {
        clearInterval(intervalTimer);
        declencherFin("GAME OVER", 'GAME_OVER');
      }
    } else if (gameState === 'DUEL') {
      tempsRestant--;
      if (tempsRestant <= 5 && tempsRestant > 0) jouerSonStress();
      if (tempsRestant <= 0) {
        clearInterval(intervalTimer);
        gameState = 'DUEL_FIN';
        victoire = score > scoreJ2;
        recompenser();
        if (victoire) { messageDuelFin = "VICTOIRE DU JOUEUR 1 ! 👑"; debloquerNiveau(); jouerSonWinner(); }
        else if (scoreJ2 > score) { messageDuelFin = "VICTOIRE DE L'IA ! 🤖"; jouerSonGameOver(); }
        else { messageDuelFin = "ÉGALITÉ PARFAITE !"; jouerSonWinner(); }
      }
    }
  }, 1000);
}

function gagnerNiveau() {
  if (intervalTimer) clearInterval(intervalTimer);
  victoire = true;
  debloquerNiveau();
  declencherFin(niveauCourant >= NB_NIVEAUX ? "CHAMPION" : "WINNER", 'WIN');
}

function toucher(x, y) {
  const now = millis();
  if (now < invulJusqua) return;
  if (effets.bouclier) {
    effets.bouclier = false;
    invulJusqua = now + 1500;
    burst(x, y, [120, 220, 255], 20);
    texteFlottant(x, y - 24, 'BOUCLIER !', [120, 220, 255]);
    jouerSonPower();
    return;
  }
  vies--;
  invulJusqua = now + 2000;
  secousse = 14;
  burst(x, y, [255, 70, 70], 24);
  jouerSonHit();
  if (vies <= 0) {
    if (intervalTimer) clearInterval(intervalTimer);
    declencherFin("GAME OVER", 'GAME_OVER');
  }
}

function activerPower(type) {
  const now = millis();
  if (type === 'aimant') effets.aimant = now + 9000;
  if (type === 'bouclier') effets.bouclier = true;
  if (type === 'ralenti') effets.ralenti = now + 6000;
  if (type === 'turbo') effets.turbo = now + 5000;
  jouerSonPower();
}

function declencherFin(texte, etatSuivant) {
  recompenser();
  gameState = 'FIN_EXPLOSION';
  vehicles.forEach(v => { v.vel = p5.Vector.random2D().mult(random(10, 22)); });
  preparerTexteFin(texte, etatSuivant);
}

function preparerTexteFin(texte, etatSuivant) {
  let taille = 160;
  let b = font.textBounds(texte, 0, 0, taille);
  taille *= min((width * 0.85) / b.w, (height * 0.3) / b.h);
  b = font.textBounds(texte, 0, 0, taille);
  const x0 = width / 2 - (b.x + b.w / 2);
  const y0 = height * 0.3 - (b.y + b.h / 2);
  const points = font.textToPoints(texte, x0, y0, taille, { sampleFactor: 0.15, simplifyThreshold: 0 });
  ciblesFin = points.map(p => createVector(p.x, p.y));
  while (vehicles.length < ciblesFin.length) {
    const dernier = vehicles[vehicles.length - 1];
    vehicles.push(new Snake(dernier.pos.x, dernier.pos.y));
  }
  if (vehicles.length > ciblesFin.length) vehicles.length = ciblesFin.length;
  setTimeout(() => { if (gameState === 'FIN_EXPLOSION') gameState = etatSuivant; }, 700);
}

function ciblesTexte(texte) {
  if (!texte.trim()) texte = "SNAKE";
  let taille = 180;
  let b = font.textBounds(texte, 0, 0, taille);
  taille *= min((width * 0.8) / b.w, (height * 0.5) / b.h);
  b = font.textBounds(texte, 0, 0, taille);
  const x0 = width / 2 - (b.x + b.w / 2);
  const y0 = height / 2 - (b.y + b.h / 2) - 50;
  const points = font.textToPoints(texte, x0, y0, taille, { sampleFactor: 0.15, simplifyThreshold: 0 });
  return points.map(p => new Cible(p.x, p.y));
}

// =====================================================
// LOGIQUE PAR MODE
// =====================================================

function majBoids(mangeable) {
  const tetes = [vehicles[0]];
  boids.forEach((b, i) => {
    b.comportement(boids, tetes);
    b.dessiner();
    if (mangeable && tetes[0] && p5.Vector.dist(tetes[0].pos, b.pos) < 18) {
      score += 5;
      burst(b.pos.x, b.pos.y, [180, 255, 255], 6);
      texteFlottant(b.pos.x, b.pos.y - 10, '+5', [180, 255, 255]);
      jouerSonBonus();
      boids[i] = new Boid(random() < 0.5 ? 0 : width, random(height));
    }
  });
}

function majObstaclesEtPredateurs(tete) {
  obstacles.forEach(o => {
    o.comportement(tete, obstacles);
    dessinerObstacle(o);
    if (gameState !== 'FIN_EXPLOSION' && p5.Vector.dist(tete.pos, o.pos) < o.taille / 2 + 10) toucher(tete.pos.x, tete.pos.y);
  });
  predateurs.forEach(p => {
    p.comportement(tete, predateurs);
    dessinerPredateur(p);
    if (gameState !== 'FIN_EXPLOSION' && p5.Vector.dist(tete.pos, p.pos) < p.taille / 2 + 10) toucher(tete.pos.x, tete.pos.y);
  });
}

function majTexte() {
  const tete = vehicles[0];
  cibles.forEach(c => {
    if (!c.actif) return;
    c.comportement(tete);
    if (p5.Vector.dist(tete.pos, c.pos) < 18) {
      c.actif = false;
      score += 10;
      if ((score / 10) % 4 === 0) agrandir(vehicles); // 1 segment tous les 4 points
    }
  });

  push();
  noStroke();
  fill(colorPickerTexte.value());
  cibles.forEach(c => { if (c.actif) circle(c.pos.x, c.pos.y, 8); });
  pop();

  if (cibles.length > 0 && cibles.every(c => !c.actif)) gagnerNiveau();
}

function majArcade() {
  const tete = vehicles[0];
  nourritures.forEach((n, idx) => {
    n.comportement([tete], nourritures);
    dessinerNourriture(n);
    if (p5.Vector.dist(tete.pos, n.pos) < 24) {
      score += 30;
      nourrituresMangees++;
      burst(n.pos.x, n.pos.y, [255, 230, 90], 14);
      texteFlottant(n.pos.x, n.pos.y - 14, '+30', [255, 230, 90]);
      jouerSonBonus();
      nourritures[idx] = new Food(random(100, width - 100), random(140, height - 100));
      agrandir(vehicles);
      if (nourrituresMangees >= paramsNiv.objectif && gameState === 'ARCADE') gagnerNiveau();
    }
  });
  majBoids(true);
  majObstaclesEtPredateurs(tete);
}

function majCircuit() {
  const tete = vehicles[0];

  // tracé du circuit
  push();
  noFill();
  stroke(255, 255, 255, 45);
  strokeWeight(3);
  drawingContext.setLineDash([10, 12]);
  beginShape();
  vertex(departCircuit.x, departCircuit.y);
  anneaux.forEach(a => vertex(a.pos.x, a.pos.y));
  endShape();
  drawingContext.setLineDash([]);
  // départ
  noStroke();
  fill(255, 255, 255, 120);
  textAlign(CENTER, CENTER);
  textSize(13);
  text('DÉPART', departCircuit.x, departCircuit.y - 34);
  pop();

  anneaux.forEach((a, i) => {
    a.comportement();
    a.dessiner(i === anneauSuivant);
    if (!a.passe && i === anneauSuivant && p5.Vector.dist(tete.pos, a.pos) < a.rayon) {
      a.passe = true;
      anneauSuivant++;
      score += 100;
      burst(a.pos.x, a.pos.y, [255, 215, 0], 22);
      texteFlottant(a.pos.x, a.pos.y - 40, '+100', [255, 215, 0]);
      jouerSonBonus();
      if (anneauSuivant >= anneaux.length && gameState === 'CIRCUIT') gagnerNiveau();
    }
  });

  // flèche guide vers l'anneau suivant
  if (anneauSuivant < anneaux.length) {
    const cible = anneaux[anneauSuivant].pos;
    const dir = p5.Vector.sub(cible, tete.pos);
    if (dir.mag() > 80) {
      dir.setMag(60);
      push();
      translate(tete.pos.x + dir.x, tete.pos.y + dir.y);
      rotate(dir.heading());
      fill(255, 215, 0, 190);
      noStroke();
      triangle(10, 0, -6, -7, -6, 7);
      pop();
    }
  }

  majBoids(false);
  majObstaclesEtPredateurs(tete);
}

function majJoueurEtIA() {
  majLeader(leader);
  majCorps(vehicles, leader, vitesseJoueur(), 1.2);

  // IA : arrive vers la nourriture la plus proche, evade du joueur, boundaries
  let proche = null;
  let minDist = Infinity;
  nourritures.forEach(n => {
    const d = p5.Vector.dist(leaderJ2.pos, n.pos);
    if (d < minDist) { minDist = d; proche = n; }
  });
  leaderJ2.maxSpeed = paramsNiv.vIA;
  leaderJ2.maxForce = 1.1;
  if (proche) leaderJ2.applyForce(leaderJ2.arrive(proche.pos, 0));
  if (comportements.wander) leaderJ2.applyForce(leaderJ2.wander().mult(0.5 * poids.wander));
  if (comportements.evitement && vehicles[0] && p5.Vector.dist(leaderJ2.pos, vehicles[0].pos) < 150) {
    leaderJ2.applyForce(leaderJ2.evade(vehicles[0]).mult(2 * poids.evitement));
  }
  if (comportements.limites || comportements.wander) leaderJ2.applyForce(leaderJ2.boundaries(60).mult(1.5 * poids.limites));
  leaderJ2.update();
  majCorps(vehiclesJ2, leaderJ2, paramsNiv.vIA, 1.1);
}

function majDuel() {
  const tete1 = vehicles[0];
  const tete2 = vehiclesJ2[0];
  nourritures.forEach((n, idx) => {
    n.comportement([tete1, tete2], nourritures);
    dessinerNourriture(n);
    if (tete1 && p5.Vector.dist(tete1.pos, n.pos) < 24) {
      score += 30;
      burst(n.pos.x, n.pos.y, [255, 230, 90], 12);
      texteFlottant(n.pos.x, n.pos.y - 14, '+30', [255, 230, 90]);
      jouerSonBonus();
      nourritures[idx] = new Food(random(100, width - 100), random(140, height - 100));
      agrandir(vehicles);
    } else if (tete2 && p5.Vector.dist(tete2.pos, n.pos) < 24) {
      scoreJ2 += 30;
      nourritures[idx] = new Food(random(100, width - 100), random(140, height - 100));
      agrandir(vehiclesJ2);
    }
  });
  majBoids(true);
}
