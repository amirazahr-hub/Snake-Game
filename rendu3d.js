// =====================================================
// RENDU « PSEUDO-3D » : lumière, profondeur, parallaxe
// -----------------------------------------------------
// Tout est dessiné en 2D (canvas) mais avec les codes de la 3D :
//   - une source de lumière unique (en haut à gauche) : dégradés sphériques, reflets, ombres ;
//   - des plans de profondeur (parallaxe) : le décor lointain bouge moins que le proche
//     quand le serpent se déplace, comme une caméra ;
//   - brume atmosphérique, halos lumineux (additifs) et vignettage.
// Aucun steering ici : ce fichier ne fait que de l'habillage.
// =====================================================

const LUMIERE = { x: -0.55, y: -0.8 }; // direction vers la lumière (haut gauche)
const camLisse = { x: 0, y: 0 };

// Caméra virtuelle : suit (en douceur) la tête du serpent, ou la souris dans le menu
function majCamera() {
  let px = mouseX, py = mouseY;
  if (gameState !== 'MENU' && vehicles && vehicles[0]) { px = vehicles[0].pos.x; py = vehicles[0].pos.y; }
  camLisse.x = lerp(camLisse.x, constrain(px, 0, width) - width / 2, 0.05);
  camLisse.y = lerp(camLisse.y, constrain(py, 0, height) - height / 2, 0.05);
}

// ---------- briques de base ----------

function rgba(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
function mixer(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }

// Halo lumineux additif (lumières, énergie, lave…)
function halo(x, y, r, c, a = 0.6) {
  const ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}

// Ombre portée douce sur le « sol » (donne la sensation de hauteur)
function ombreSol(x, y, w, h, a = 0.35) {
  const ctx = drawingContext;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, h / w);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

// Sphère éclairée : dégradé radial décalé vers la lumière + terminateur + reflet + lumière de contour
function bille(x, y, r, c, opts = {}) {
  const ctx = drawingContext;
  const clair = mixer(c, [255, 255, 255], 0.65);
  const sombre = mixer(c, [0, 0, 10], 0.7);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.clip();
  let g = ctx.createRadialGradient(LUMIERE.x * r * 0.55, LUMIERE.y * r * 0.55, r * 0.05, 0, 0, r * 1.05);
  g.addColorStop(0, rgba(clair));
  g.addColorStop(0.35, rgba(c));
  g.addColorStop(1, rgba(sombre));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  // lumière de contour (rim light) côté opposé à la source
  g = ctx.createRadialGradient(-LUMIERE.x * r * 0.9, -LUMIERE.y * r * 0.9, r * 0.1, -LUMIERE.x * r * 0.5, -LUMIERE.y * r * 0.5, r * 0.9);
  g.addColorStop(0, rgba(opts.rim || mixer(c, [120, 200, 255], 0.5), 0.35));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.restore();
  if (opts.reflet !== false) {
    noStroke();
    fill(255, 255, 255, 200);
    ellipse(LUMIERE.x * r * 0.45, LUMIERE.y * r * 0.5, r * 0.34, r * 0.22);
  }
}

// Polygone irrégulier (rocher) éclairé : même principe, forme libre. rot = rotation du rocher.
function polyEclaire(forme, r, c, rot, trait) {
  const ctx = drawingContext;
  const clair = mixer(c, [255, 255, 255], 0.45);
  const sombre = mixer(c, [0, 0, 10], 0.75);
  ctx.save();
  ctx.beginPath();
  forme.forEach((f, i) => {
    const a = (TWO_PI * i) / forme.length;
    const px = cos(a) * r * f, py = sin(a) * r * f;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
  // la lumière reste « en haut à gauche » même si le rocher tourne
  const lx = (LUMIERE.x * cos(-rot) - LUMIERE.y * sin(-rot)) * r * 0.7;
  const ly = (LUMIERE.x * sin(-rot) + LUMIERE.y * cos(-rot)) * r * 0.7;
  const g = ctx.createRadialGradient(lx, ly, r * 0.1, -lx * 0.3, -ly * 0.3, r * 1.4);
  g.addColorStop(0, rgba(clair));
  g.addColorStop(0.45, rgba(c));
  g.addColorStop(1, rgba(sombre));
  ctx.fillStyle = g;
  ctx.fill();
  if (trait) { ctx.strokeStyle = trait; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.restore();
}

// Silhouette de collines (plans de profondeur) ; décalage horizontal = parallaxe
function collines(y0, amp, freq, c, alpha, decalage, bosse = 0.25, fond = true) {
  const ctx = drawingContext;
  ctx.save();
  ctx.fillStyle = rgba(c, alpha);
  ctx.beginPath();
  ctx.moveTo(-10, height + 10);
  for (let x = -10; x <= width + 14; x += 12) {
    const u = (x - decalage) * freq;
    const y = y0 - amp * (0.55 + 0.3 * sin(u) + 0.2 * sin(u * 2.3 + 1.7) + bosse * 0.35 * sin(u * 6.1));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width + 10, height + 10);
  ctx.closePath();
  if (fond) {
    const g = ctx.createLinearGradient(0, y0 - amp, 0, height);
    g.addColorStop(0, rgba(c, alpha));
    g.addColorStop(1, rgba(mixer(c, [0, 0, 0], 0.6), alpha));
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.restore();
}

// Planète éclairée avec anneau optionnel
function planete(x, y, r, c, anneau) {
  push();
  translate(x, y);
  if (anneau) {
    push();
    rotate(-0.42);
    noFill();
    for (let k = 0; k < 3; k++) {
      stroke(255, 235 - k * 30, 200 - k * 40, 55 - k * 12);
      strokeWeight(r * (0.16 - k * 0.04));
      arc(0, 0, r * (3.1 + k * 0.22), r * (0.95 + k * 0.07), PI, TWO_PI);
    }
    pop();
  }
  halo(0, 0, r * 1.7, mixer(c, [80, 140, 255], 0.4), 0.25);
  bille(0, 0, r, c, { reflet: false });
  // bandes atmosphériques
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TWO_PI);
  ctx.clip();
  noStroke();
  for (let k = -2; k <= 2; k++) {
    fill(255, 255, 255, 10 + abs(k) * 2);
    rect(-r, k * r * 0.3 - r * 0.07, r * 2, r * 0.14);
  }
  ctx.restore();
  if (anneau) {
    push();
    rotate(-0.42);
    noFill();
    for (let k = 0; k < 3; k++) {
      stroke(255, 235 - k * 30, 200 - k * 40, 110 - k * 25);
      strokeWeight(r * (0.16 - k * 0.04));
      arc(0, 0, r * (3.1 + k * 0.22), r * (0.95 + k * 0.07), 0, PI);
    }
    pop();
  }
  pop();
}

// =====================================================
// FOND EN PROFONDEUR : un décor 3D différent par thème
// =====================================================

function dessinerProfondeur(th) {
  const ctx = drawingContext;
  const t = frameCount;
  const cx = camLisse.x, cy = camLisse.y;
  push();
  noStroke();

  if (themeCourant === 'Espace') {
    // planètes très lointaines : presque immobiles
    planete(width * 0.82 - cx * 0.03, height * 0.28 - cy * 0.02, 120, [70, 110, 200], true);
    planete(width * 0.14 - cx * 0.05, height * 0.74 - cy * 0.03, 58, [200, 110, 90], false);
    // petite lune qui orbite devant la planète bleue
    const ma = t * 0.006;
    bille(width * 0.82 - cx * 0.045 + cos(ma) * 190, height * 0.28 - cy * 0.03 + sin(ma) * 36, 15, [185, 185, 195]);
    // étoile filante
    const ph = (t % 520) / 520;
    if (ph < 0.18) {
      const x = lerp(width * 0.9, width * 0.4, ph / 0.18), y = lerp(40, height * 0.45, ph / 0.18);
      stroke(255, 255, 255, 220 * (1 - ph / 0.18));
      strokeWeight(2);
      line(x, y, x + 90, y - 50);
      noStroke();
    }
  } else if (themeCourant === 'Jungle') {
    // rais de lumière + 3 plans de canopée dans la brume
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const x = width * (0.1 + k * 0.27) + sin(t * 0.006 + k) * 50 - cx * 0.04;
      const g = ctx.createLinearGradient(x, 0, x + 160, height);
      g.addColorStop(0, 'rgba(255,245,160,0.17)');
      g.addColorStop(1, 'rgba(255,245,160,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 330, height); ctx.lineTo(x + 100, height);
      ctx.fill();
    }
    ctx.restore();
    collines(height * 0.60, 150, 0.006, [60, 120, 90], 0.55, -cx * 0.05 + 40, 0.5);
    collines(height * 0.74, 130, 0.009, [28, 90, 50], 0.75, -cx * 0.10, 0.6);
    collines(height * 0.90, 110, 0.013, [10, 55, 28], 0.95, -cx * 0.17 + 90, 0.7);
    // brume
    const g = ctx.createLinearGradient(0, height * 0.55, 0, height);
    g.addColorStop(0, 'rgba(180,255,200,0)');
    g.addColorStop(1, 'rgba(120,230,150,0.15)');
    ctx.fillStyle = g;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);
    // lucioles en parallaxe
    decor.forEach((e, i) => {
      if (i % 3) return;
      halo(e.x - cx * e.s * 0.01, e.y + sin(t * 0.03 + e.ph) * 6, 16, [200, 255, 90], 0.35 + 0.3 * sin(t * 0.07 + e.ph));
    });
  } else if (themeCourant === 'Océan') {
    // rais de surface + « caustiques » additives
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    noFill();
    for (let k = 0; k < 7; k++) {
      stroke(120, 220, 255, 16);
      strokeWeight(3 + k % 3);
      beginShape();
      for (let x = 0; x <= width; x += 18) vertex(x, 30 + k * 55 + sin(x * 0.012 + t * 0.02 * (1 + k * 0.1) + k) * 16 + sin(x * 0.03 - t * 0.03) * 6);
      endShape();
    }
    ctx.restore();
    noStroke();
    // baleine lointaine
    const wx = ((t * 0.35) % (width + 800)) - 400 - cx * 0.03;
    push();
    translate(wx, height * 0.33 - cy * 0.02);
    fill(0, 40, 70, 90);
    ellipse(0, 0, 330, 90);
    triangle(-150, 0, -240, -48, -230, 38);
    ellipse(70, 38, 120, 26);
    pop();
    collines(height * 0.70, 140, 0.007, [10, 70, 110], 0.5, -cx * 0.06, 0.4);
    collines(height * 0.85, 120, 0.011, [6, 45, 80], 0.8, -cx * 0.12 + 60, 0.5);
    collines(height * 0.96, 90, 0.016, [2, 25, 50], 0.95, -cx * 0.2, 0.6);
    // coraux lumineux au premier plan lointain
    for (let k = 0; k < 9; k++) {
      const x = (k + 0.5) * width / 9 - cx * 0.14;
      halo(x, height - 40, 70, [255, 120, 180], 0.12 + 0.05 * sin(t * 0.04 + k));
    }
  } else if (themeCourant === 'Volcan') {
    // ciel de cendres
    halo(width * 0.62 - cx * 0.03, height * 0.46, 420, [255, 80, 0], 0.28);
    collines(height * 0.60, 190, 0.005, [70, 22, 10], 0.9, -cx * 0.04, 0.3);
    // coulées de lave sur la crête du 2e plan
    collines(height * 0.78, 150, 0.008, [40, 12, 6], 0.95, -cx * 0.09 + 80, 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    noFill();
    stroke(255, 100, 20, 120);
    strokeWeight(3);
    beginShape();
    for (let x = -10; x <= width + 14; x += 12) {
      const u = (x + cx * 0.09 - 80) * 0.008;
      vertex(x, height * 0.78 - 150 * (0.55 + 0.3 * sin(u) + 0.2 * sin(u * 2.3 + 1.7) + 0.5 * 0.35 * sin(u * 6.1)));
    }
    endShape();
    ctx.restore();
    noStroke();
    collines(height * 0.94, 110, 0.012, [18, 5, 2], 1, -cx * 0.16, 0.6);
    // fumée
    for (let k = 0; k < 6; k++) {
      const y = height * 0.35 - ((t * 0.4 + k * 90) % 300);
      fill(40, 25, 20, 40);
      ellipse(width * 0.62 + sin(t * 0.01 + k) * 40 + k * 14 - cx * 0.03, y + 150, 120 + k * 26, 70 + k * 10);
    }
  } else if (themeCourant === 'Néon') {
    // soleil rétro à bandes
    const hy = height * 0.58;
    const sx = width / 2 - cx * 0.03, sy = hy - 70 - cy * 0.02;
    halo(sx, sy, 380, [255, 60, 180], 0.35);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 140, 0, TWO_PI);
    ctx.clip();
    const g = ctx.createLinearGradient(0, sy - 140, 0, sy + 140);
    g.addColorStop(0, '#ffe45e');
    g.addColorStop(0.55, '#ff4fa8');
    g.addColorStop(1, '#8a2be2');
    ctx.fillStyle = g;
    ctx.fillRect(sx - 140, sy - 140, 280, 280);
    ctx.fillStyle = 'rgba(10,0,25,1)';
    for (let k = 0; k < 7; k++) ctx.fillRect(sx - 140, sy + 10 + k * 20 + (t * 0.15) % 20 * 0, 280, 3 + k * 1.6);
    ctx.restore();
    // montagnes fil de fer
    noFill();
    stroke(0, 240, 255, 140);
    strokeWeight(1.6);
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f0ff';
    for (let layer = 0; layer < 2; layer++) {
      beginShape();
      for (let x = -20; x <= width + 20; x += 40) {
        const u = (x + cx * (0.05 + layer * 0.05)) * 0.012 + layer * 3;
        vertex(x, hy - (22 + layer * 18) * (1.3 + sin(u * 2) + 0.5 * sin(u * 5.3 + 1)) - layer * 10);
      }
      endShape();
    }
    ctx.restore();
    // sol : grille en perspective qui défile vers nous
    noStroke();
    const gs = ctx.createLinearGradient(0, hy, 0, height);
    gs.addColorStop(0, 'rgba(120,20,160,0.55)');
    gs.addColorStop(1, 'rgba(10,0,30,0.9)');
    ctx.fillStyle = gs;
    ctx.fillRect(0, hy, width, height - hy);
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff2bd6';
    stroke(255, 60, 220, 170);
    strokeWeight(1.5);
    const N = 14;
    for (let i = 0; i < N; i++) {
      const k = ((i + (t * 0.012) % 1) / N);
      const y = hy + (height - hy) * pow(k, 2.2);
      line(0, y, width, y);
    }
    const vx = width / 2 - cx * 0.1;
    for (let i = -16; i <= 16; i++) line(vx, hy, vx + i * width * 0.12, height);
    ctx.restore();
    // étoiles
    noStroke();
    decor.forEach((e, i) => {
      if (e.y > hy) return;
      fill(255, 255, 255, 140 + sin(t * 0.05 + e.ph) * 90);
      circle(e.x - cx * e.s * 0.01, e.y * 0.9, e.s * 0.9);
    });
  }
  pop();
}

// Vignettage : assombrit les bords, concentre le regard (appelé après la scène)
function dessinerVignette() {
  const ctx = drawingContext;
  const g = ctx.createRadialGradient(width / 2, height / 2, min(width, height) * 0.35, width / 2, height / 2, max(width, height) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,10,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}
