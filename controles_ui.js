// =====================================================
// CONTRÔLES : affichage par-dessus le jeu (aperçu caméra, curseur, badge voix)
// =====================================================

// ---------- affichage par-dessus le jeu ----------

function pilule(txt, y, col, taille = 13) {
  push();
  textFont('sans-serif');
  textSize(taille);
  textStyle(BOLD);
  const w = textWidth(txt) + 30;
  noStroke();
  fill(0, 0, 0, 150);
  rect(width / 2 - w / 2, y, w, taille + 16, 20);
  fill(col);
  textAlign(CENTER, CENTER);
  text(txt, width / 2, y + (taille + 16) / 2 + 1);
  pop();
}

function messageEtatMain() {
  if (etatMain.erreur) return '⚠️ ' + etatMain.erreur + ' — souris activée en secours';
  if (!etatMain.actif) return '📷 Démarrage de la caméra…';
  if (!etatMain.pret) return '⏳ Chargement de la détection des mains…' + (millis() - etatMain.debutCam > 20000 ? ' (long : vérifie ta connexion)' : '');
  if (!mainVisible()) return '✋ Montre ta main à la caméra — en attendant, le serpent avance tout seul';
  return '';
}

function dessinerOverlayControle() {
  const th = THEMES[themeCourant];
  const enJeu = ['JEU_TEXTE', 'ARCADE', 'DUEL', 'CIRCUIT'].includes(gameState);
  const actif = enJeu || gameState === 'COUNTDOWN';

  if (controle === 'doigts') {
    if (gameState !== 'MENU' || menuEtape === 2) dessinerApercuCamera();
    if (gameState !== 'MENU' && mainActive() && mainVisible()) dessinerCurseurMain();
    if (actif) {
      pilule('✋ ta paume guide   ·   🤏 pince = turbo   ·   ✊ poing = frein', 74, th.accent);
      const m = messageEtatMain();
      if (m) pilule(m, 108, color(255, 215, 0), 14);
    }
  } else if (controle === 'voix' && gameState !== 'MENU') {
    dessinerBadgeVoix();
    if (actif) pilule('🎤 haut · bas · gauche · droite · stop · turbo   (ou flèches)', 74, th.accent);
  }

  if (gameState === 'MENU' && menuEtape === 2) {
    if (frameCount % 10 === 0) majStatutControle();
    if (controle === 'voix' && barreMicInner) barreMicInner.elt.style.width = Math.round(etatVoix.niveau * 100) + '%';
  }
}

function dessinerApercuCamera() {
  const w = 170, h = 128, x = width - w - 12, y = height - h - 12; // petit, pour ne pas cacher le terrain
  const th = THEMES[themeCourant];
  const ctx = drawingContext;
  push();
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 14); else ctx.rect(x, y, w, h);
  ctx.clip();
  noStroke();
  fill(10, 12, 24);
  rect(x, y, w, h);

  if (etatMain.actif && videoCam && videoCam.readyState >= 2) {
    ctx.save();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1); // effet miroir
    ctx.drawImage(videoCam, 0, 0, w, h);
    const L = etatMain.lm;
    if (L) {
      ctx.strokeStyle = th.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      LIAISONS_MAIN.forEach(([a, b]) => {
        ctx.moveTo(L[a].x * w, L[a].y * h);
        ctx.lineTo(L[b].x * w, L[b].y * h);
      });
      ctx.stroke();
      ctx.fillStyle = etatMain.pince ? '#ffd700' : '#ffffff';
      L.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, (i === 4 || i === 8) ? 5 : 2.5, 0, TWO_PI);
        ctx.fill();
      });
    }
    ctx.restore();
  } else {
    fill(255);
    textFont('sans-serif');
    textAlign(CENTER, CENTER);
    textSize(13);
    text(etatMain.erreur ? '⚠️ ' + etatMain.erreur : '📷 Démarrage de la caméra…', x + 12, y + 10, w - 24, h - 20);
  }
  ctx.restore();

  // pastille d'état
  textFont('sans-serif');
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, CENTER);
  let etat = 'AUCUNE MAIN';
  let col = color(255, 120, 120);
  if (mainVisible()) {
    etat = etatMain.poing ? '✊ FREIN' : etatMain.pince ? '🤏 TURBO' : '✋ MAIN OK';
    col = color(etatMain.poing || etatMain.pince ? '#ffd700' : th.accent);
  }
  const pw = textWidth(etat) + 20;
  noStroke();
  fill(0, 0, 0, 170);
  rect(x + 8, y + 8, pw, 22, 11);
  fill(col);
  text(etat, x + 18, y + 19);

  noFill();
  stroke(th.accent);
  strokeWeight(2);
  rect(x, y, w, h, 14);
  pop();
}

function dessinerCurseurMain() {
  const th = THEMES[themeCourant];
  const p = etatMain.lisse;
  const special = etatMain.pince || etatMain.poing;
  const col = special ? '#ffd700' : th.accent;
  push();
  // traînée lumineuse : le serpent « chasse » ton doigt comme un pointeur laser
  noStroke();
  etatMain.trace.forEach((t, i) => {
    const a = i / etatMain.trace.length;
    fill(red(color(col)), green(color(col)), blue(color(col)), 120 * a);
    circle(t.x, t.y, 4 + 12 * a);
  });
  noFill();
  stroke(col);
  strokeWeight(3);
  drawingContext.shadowBlur = 18;
  drawingContext.shadowColor = col;
  circle(p.x, p.y, etatMain.poing ? 54 : etatMain.pince ? 26 : 40 + sin(frameCount * 0.2) * 4);
  noStroke();
  fill(255);
  circle(p.x, p.y, 8);
  if (special) {
    textAlign(CENTER, CENTER);
    textSize(20);
    text(etatMain.poing ? '✊' : '⚡', p.x, p.y - 34);
  }
  pop();
}

function dessinerBadgeVoix() {
  const th = THEMES[themeCourant];
  const w = 300, h = 104, x = width - w - 15, y = 78;
  const recent = millis() - etatVoix.tDerniere < 1500;
  const bon = etatVoix.actif && !etatVoix.erreur;
  const col = bon ? color(th.accent) : color(255, 90, 90);
  push();
  textFont('sans-serif');
  noStroke();
  fill(0, 0, 0, 150);
  rect(x, y, w, h, 14);
  noFill();
  stroke(col);
  strokeWeight(1.5);
  rect(x, y, w, h, 14);
  noStroke();
  fill(col);
  circle(x + 24, y + 24, 14 + (bon ? sin(frameCount * 0.2) * 3 : 0));

  fill(255);
  textAlign(LEFT, CENTER);
  textSize(14);
  textStyle(BOLD);
  const titre = etatVoix.erreur
    ? '⚠️ ' + etatVoix.erreur
    : recent ? '✔ ' + etatVoix.derniere.toUpperCase()
    : etatVoix.actif ? 'Je t’écoute…' : 'Démarrage du micro…';
  text(titre, x + 44, y + 8, w - 56, 32);

  fill(200);
  textSize(12);
  textStyle(NORMAL);
  text(etatVoix.texte ? '« ' + etatVoix.texte + ' »'
    : etatVoix.erreur && EST_EDGE ? 'Edge : active « Reconnaissance vocale en ligne » (Windows > Voix), ou flèches / Z Q S D'
    : 'ou flèches / Z Q S D en secours', x + 14, y + 40, w - 28, 30);
  fill(140);
  textSize(10);
  text('diag : ' + ((etatVoix.log || []).join(' › ') || 'aucun événement'), x + 14, y + h - 30, w - 28, 12);
  barre(x + 14, y + h - 16, w - 28, 6, etatVoix.niveau, th.accent); // jauge du micro
  pop();

  // flèche indiquant la direction ordonnée
  const d = etatVoix.dir;
  if (d && leader) {
    push();
    translate(leader.pos.x + d.x * 90, leader.pos.y + d.y * 90);
    rotate(atan2(d.y, d.x));
    noStroke();
    fill(th.accent);
    drawingContext.shadowBlur = 14;
    drawingContext.shadowColor = th.accent;
    triangle(14, 0, -8, -10, -8, 10);
    pop();
  }
}
