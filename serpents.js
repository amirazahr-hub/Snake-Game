// =====================================================
// RENDU DES SERPENTS (habillage graphique)
// 4 modèles : Python Géant, Cobra Royal, Dragon Électrique, Crotale.
// =====================================================

// =====================================================
// SERPENTS : RENDU RÉALISTE ET DIFFÉRENT SELON LE MODÈLE
// =====================================================

function sombre(c, f = 0.5) { return color(hue(c), saturation(c), brightness(c) * f); }
function claire(c) { return color(hue(c), saturation(c) * 0.5, min(100, brightness(c) * 1.4)); }

// À appeler en colorMode HSB (360,100,100,255)
function couleurCorps(i, n, skin, custom, modele) {
  const t = n > 1 ? i / (n - 1) : 0;
  switch (skin) {
    case 'Custom Couleur': return color(custom);
    case 'Néon Cyber': return color((frameCount * 3 + i * 10) % 360, 90, 100);
    case 'Feu & Lave': return color(map(t, 0, 1, 0, 40), 85, 100);
    case 'Océan Profond': return color(map(t, 0, 1, 180, 260), 85, 100);
    case 'Arc-en-ciel': return color(map(t, 0, 1, 0, 360), 85, 100);
  }
  switch (modele) {
    case 'Python Géant': return color(38, 62, map(t, 0, 1, 66, 46));
    case 'Cobra Royal': return color(44, 50, map(t, 0, 1, 80, 58));
    case 'Dragon Électrique': return color(map(t, 0, 1, 195, 262), 85, 95);
    case 'Cyber Mécha': return color(215, 28, map(t, 0, 1, 72, 46));
    case 'Cristal': return color(map(t, 0, 1, 300, 185), 62, 100);
    default: return color(36, 40, map(t, 0, 1, 82, 62)); // Crotale
  }
}

function oeil(x, y, r, type, iris) {
  oeilBrut(x, y, r, type, iris);
  noStroke();
  fill(0, 0, 100, 230);
  circle(x - r * 0.12, y - r * 0.22, r * 0.28); // reflet : donne de la vie au regard
}

function oeilBrut(x, y, r, type, iris) {
  noStroke();
  if (type === 'rond') {
    fill(0, 0, 100);
    circle(x, y, r * 1.5);
    fill(0, 0, 5);
    circle(x + r * 0.1, y, r * 0.9);
  } else if (type === 'fente') {
    fill(iris);
    ellipse(x, y, r * 1.3, r * 1.1);
    fill(0, 0, 5);
    ellipse(x, y, r * 0.35, r * 1.0);
  } else {
    fill(iris);
    ellipse(x, y, r * 1.4, r * 0.8);
    fill(0, 0, 100);
    ellipse(x + r * 0.15, y, r * 0.6, r * 0.3);
  }
}

function langue(x0, hs, col, electrique) {
  const L = hs * (0.9 + 0.6 * abs(sin(frameCount * 0.22)));
  stroke(col);
  strokeWeight(2.5);
  noFill();
  if (electrique) {
    beginShape();
    vertex(x0, 0); vertex(x0 + L * 0.4, -3); vertex(x0 + L * 0.7, 3); vertex(x0 + L, 0);
    endShape();
    line(x0 + L, 0, x0 + L + 7, -6);
    line(x0 + L, 0, x0 + L + 7, 6);
  } else {
    line(x0, 0, x0 + L, 0);
    line(x0 + L, 0, x0 + L + 6, -5);
    line(x0 + L, 0, x0 + L + 6, 5);
  }
}

// repère local : +x = avant de la tête
function dessinerTete(modele, hs, c) {
  const contour = sombre(c, 0.35);
  stroke(contour);
  strokeWeight(2);
  fill(c);
  const rouge = color(355, 90, 95);
  switch (modele) {
    case 'Python Géant':
      ellipse(hs * 0.45, 0, hs * 1.8, hs * 1.25);
      noStroke();
      fill(sombre(c, 0.45));
      ellipse(hs * 0.05, 0, hs * 0.55, hs * 0.95);
      oeil(hs * 0.62, -hs * 0.42, hs * 0.26, 'fente', color(50, 90, 100));
      oeil(hs * 0.62, hs * 0.42, hs * 0.26, 'fente', color(50, 90, 100));
      fill(0, 0, 5);
      circle(hs * 1.25, -hs * 0.18, 3);
      circle(hs * 1.25, hs * 0.18, 3);
      langue(hs * 1.3, hs, rouge, false);
      break;
    case 'Cobra Royal':
      ellipse(hs * 0.5, 0, hs * 1.5, hs * 1.0);
      oeil(hs * 0.62, -hs * 0.34, hs * 0.3, 'rond', null);
      oeil(hs * 0.62, hs * 0.34, hs * 0.3, 'rond', null);
      noStroke();
      fill(0, 0, 5);
      circle(hs * 1.1, -hs * 0.12, 2.5);
      circle(hs * 1.1, hs * 0.12, 2.5);
      langue(hs * 1.2, hs, rouge, false);
      break;
    case 'Dragon Électrique': {
      const cyan = color(185, 80, 100);
      fill(sombre(cyan, 0.5));
      noStroke();
      triangle(0, -hs * 0.4, -hs * 1.0, -hs * 1.05, -hs * 0.1, -hs * 0.7);
      triangle(0, hs * 0.4, -hs * 1.0, hs * 1.05, -hs * 0.1, hs * 0.7);
      fill(c);
      stroke(contour);
      strokeWeight(2);
      beginShape();
      vertex(hs * 1.3, 0); vertex(hs * 0.5, -hs * 0.75); vertex(-hs * 0.3, -hs * 0.55);
      vertex(-hs * 0.3, hs * 0.55); vertex(hs * 0.5, hs * 0.75);
      endShape(CLOSE);
      oeil(hs * 0.55, -hs * 0.35, hs * 0.38, 'lueur', color(55, 100, 100));
      oeil(hs * 0.55, hs * 0.35, hs * 0.38, 'lueur', color(55, 100, 100));
      langue(hs * 1.25, hs, color(185, 60, 100), true);
      break;
    }
    case 'Cyber Mécha': {
      fill(sombre(c, 0.7));
      stroke(sombre(c, 0.3));
      strokeWeight(2);
      beginShape();
      vertex(hs * 1.35, 0); vertex(hs * 0.7, -hs * 0.62); vertex(-hs * 0.35, -hs * 0.7);
      vertex(-hs * 0.45, 0); vertex(-hs * 0.35, hs * 0.7); vertex(hs * 0.7, hs * 0.62);
      endShape(CLOSE);
      noStroke();
      fill(c);
      beginShape();
      vertex(hs * 1.1, 0); vertex(hs * 0.6, -hs * 0.4); vertex(-hs * 0.2, -hs * 0.42); vertex(-hs * 0.2, hs * 0.42); vertex(hs * 0.6, hs * 0.4);
      endShape(CLOSE);
      drawingContext.shadowBlur = 16;
      drawingContext.shadowColor = '#ff2a4d';
      fill(355, 90, 100);
      rect(hs * 0.15, -hs * 0.2, hs * 0.7, hs * 0.4, 4);   // visière rouge
      drawingContext.shadowBlur = 0;
      fill(0, 0, 100, 200);
      rect(hs * 0.3, -hs * 0.06, hs * 0.4, hs * 0.1, 3);
      stroke(185, 80, 100);
      strokeWeight(2.5);
      line(-hs * 0.1, -hs * 0.7, -hs * 0.8, -hs * 1.15); // antennes
      line(-hs * 0.1, hs * 0.7, -hs * 0.8, hs * 1.15);
      break;
    }
    case 'Cristal': {
      fill(c);
      stroke(0, 0, 100, 200);
      strokeWeight(2);
      beginShape();
      vertex(hs * 1.3, 0); vertex(hs * 0.55, -hs * 0.7); vertex(-hs * 0.25, -hs * 0.6);
      vertex(-hs * 0.4, 0); vertex(-hs * 0.25, hs * 0.6); vertex(hs * 0.55, hs * 0.7);
      endShape(CLOSE);
      noStroke();
      fill(0, 0, 100, 90);
      triangle(hs * 1.3, 0, hs * 0.55, -hs * 0.7, hs * 0.3, 0);
      fill(0, 0, 100, 40);
      triangle(hs * 0.3, 0, hs * 0.55, -hs * 0.7, -hs * 0.25, -hs * 0.6);
      fill(280, 80, 60, 70);
      triangle(hs * 0.3, 0, hs * 0.55, hs * 0.7, -hs * 0.25, hs * 0.6);
      drawingContext.shadowBlur = 14;
      drawingContext.shadowColor = '#ffffff';
      fill(0, 0, 100);
      circle(hs * 0.62, -hs * 0.26, hs * 0.22);
      circle(hs * 0.62, hs * 0.26, hs * 0.22);
      drawingContext.shadowBlur = 0;
      break;
    }
    default: // Crotale
      beginShape();
      vertex(hs * 1.25, 0); vertex(hs * 0.7, -hs * 0.55); vertex(0, -hs * 0.85); vertex(-hs * 0.45, -hs * 0.3);
      vertex(-hs * 0.45, hs * 0.3); vertex(0, hs * 0.85); vertex(hs * 0.7, hs * 0.55);
      endShape(CLOSE);
      stroke(sombre(c, 0.4));
      strokeWeight(3);
      line(hs * 0.55, -hs * 0.3, -hs * 0.2, -hs * 0.6);
      line(hs * 0.55, hs * 0.3, -hs * 0.2, hs * 0.6);
      noStroke();
      fill(0, 0, 10);
      circle(hs * 0.95, -hs * 0.18, 3);
      circle(hs * 0.95, hs * 0.18, 3);
      oeil(hs * 0.5, -hs * 0.38, hs * 0.28, 'fente', color(40, 95, 100));
      oeil(hs * 0.5, hs * 0.38, hs * 0.28, 'fente', color(40, 95, 100));
      langue(hs * 1.2, hs, rouge, false);
  }
}

// o : { skin, custom, modele, gagnant, bouclier, clignote, echelle }
function dessinerSerpentReel(segs, o) {
  const n = segs.length;
  if (n < 2) return;
  const modele = o.modele;
  const ech = o.echelle || 1;
  const baseW = ({ 'Python Géant': 30, 'Cobra Royal': 20, 'Dragon Électrique': 23, 'Crotale': 25, 'Cyber Mécha': 24, 'Cristal': 22 }[modele] || 22) * ech;
  const larg = i => max(5 * ech, baseW * (1 - 0.78 * pow(i / (n - 1), 1.4)));

  push();
  colorMode(HSB, 360, 100, 100, 255);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  if (o.clignote && frameCount % 8 < 4) drawingContext.globalAlpha = 0.4;

  // ---- corps éclairé : on empile des traits de moins en moins larges, décalés vers la lumière.
  // Résultat : un volume cylindrique (ombre côté opposé, bande claire, reflet spéculaire).
  const LX = -0.55, LY = -0.8;
  const cl = [];
  for (let i = 0; i < n; i++) {
    const c = couleurCorps(i, n, o.skin, o.custom, modele);
    cl.push({
      c, noir: sombre(c, 0.3), ombre: sombre(c, 0.62),
      lit: color(hue(c), saturation(c) * 0.8, min(100, brightness(c) * 1.15)),
      rim: color((hue(c) + 20) % 360, saturation(c) * 0.5, min(100, brightness(c) * 1.3), 90)
    });
  }
  const trait = (i, col, w, k) => {
    stroke(col);
    strokeWeight(w);
    const dx = LX * larg(i) * k, dy = LY * larg(i) * k;
    line(segs[i].pos.x + dx, segs[i].pos.y + dy, segs[i - 1].pos.x + dx, segs[i - 1].pos.y + dy);
  };

  // ombre portée (le serpent « flotte » au-dessus du sol : l'ombre s'éloigne de la lumière)
  stroke(0, 0, 0, 55);
  for (let i = n - 1; i >= 1; i--) {
    strokeWeight(larg(i) + 5);
    const d = 6 + larg(i) * 0.22;
    line(segs[i].pos.x + d, segs[i].pos.y + d * 1.7, segs[i - 1].pos.x + d, segs[i - 1].pos.y + d * 1.7);
  }

  if (modele === 'Dragon Électrique') {
    drawingContext.shadowBlur = 24;
    drawingContext.shadowColor = 'rgba(0,229,255,0.9)';
  } else if (modele === 'Cristal') {
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = 'rgba(255,150,255,0.8)';
  }
  for (let i = n - 1; i >= 1; i--) trait(i, cl[i].noir, larg(i) + 3, 0);
  drawingContext.shadowBlur = 0;
  for (let i = n - 1; i >= 1; i--) trait(i, cl[i].ombre, larg(i), 0);
  for (let i = n - 1; i >= 1; i--) trait(i, cl[i].c, larg(i) * 0.8, 0.06);
  for (let i = n - 1; i >= 1; i--) trait(i, cl[i].lit, larg(i) * 0.5, 0.15);
  for (let i = n - 1; i >= 1; i--) trait(i, color(0, 0, 100, modele === 'Cristal' ? 150 : 105), larg(i) * 0.15, 0.27);
  for (let i = n - 1; i >= 1; i--) trait(i, cl[i].rim, larg(i) * 0.1, -0.42); // lumière de contour

  // écailles : petits croissants posés sur le dos
  if (modele !== 'Cyber Mécha' && modele !== 'Cristal') {
    noFill();
    for (let i = 2; i < n - 1; i++) {
      const p = segs[i].pos;
      const a = p5.Vector.sub(segs[i - 1].pos, segs[i + 1].pos).heading();
      const w = larg(i);
      push();
      translate(p.x, p.y);
      rotate(a);
      stroke(sombre(cl[i].c, 0.45));
      drawingContext.globalAlpha *= 0.6;
      strokeWeight(1.1);
      arc(w * 0.12, 0, w * 0.5, w * 0.72, -1.15, 1.15);
      arc(-w * 0.12, 0, w * 0.5, w * 0.72, -1.15, 1.15);
      pop();
      drawingContext.globalAlpha = (o.clignote && frameCount % 8 < 4) ? 0.4 : 1;
    }
  }

  // modèles spéciaux : joints lumineux du robot, facettes et éclats du cristal
  if (modele === 'Cyber Mécha') {
    for (let i = 1; i < n - 1; i++) {
      const p = segs[i].pos;
      const a = p5.Vector.sub(segs[i - 1].pos, segs[i + 1].pos).heading();
      const w = larg(i);
      push();
      translate(p.x, p.y);
      rotate(a);
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = '#00e5ff';
      stroke(185, 80, 100, 230);
      strokeWeight(2.2);
      line(0, -w * 0.5, 0, w * 0.5);
      drawingContext.shadowBlur = 0;
      noStroke();
      fill(0, 0, 100, 60);
      rect(-w * 0.35, -w * 0.4, w * 0.25, w * 0.2, 2);
      if (i % 4 === 0) { fill(frameCount % 40 < 20 ? 355 : 140, 90, 100); circle(w * 0.2, 0, w * 0.2); }
      pop();
    }
  } else if (modele === 'Cristal') {
    for (let i = 1; i < n - 1; i++) {
      const p = segs[i].pos;
      const a = p5.Vector.sub(segs[i - 1].pos, segs[i + 1].pos).heading();
      const w = larg(i);
      push();
      translate(p.x, p.y);
      rotate(a);
      noStroke();
      fill(0, 0, 100, 55);
      triangle(-w * 0.35, 0, w * 0.35, -w * 0.4, w * 0.35, 0);
      fill(300, 60, 100, 40);
      triangle(-w * 0.35, 0, w * 0.35, w * 0.4, w * 0.35, 0);
      if ((frameCount + i * 7) % 60 < 6) {
        stroke(0, 0, 100, 230);
        strokeWeight(1.6);
        line(-w * 0.45, 0, w * 0.45, 0);
        line(0, -w * 0.45, 0, w * 0.45);
      }
      pop();
    }
  }

  // capuchon du cobra
  if (modele === 'Cobra Royal' && n > 5) {
    const p = segs[2].pos;
    const a = p5.Vector.sub(segs[1].pos, segs[3].pos).heading();
    const w = larg(2);
    const c = couleurCorps(2, n, o.skin, o.custom, modele);
    push();
    translate(p.x, p.y);
    rotate(a);
    stroke(sombre(c, 0.35));
    strokeWeight(2);
    fill(c);
    ellipse(0, 0, w * 1.5, w * 3.1);
    noStroke();
    fill(0, 0, 100, 235);
    circle(w * 0.05, -w * 0.5, w * 0.6);
    circle(w * 0.05, w * 0.5, w * 0.6);
    fill(0, 0, 8);
    circle(w * 0.05, -w * 0.5, w * 0.32);
    circle(w * 0.05, w * 0.5, w * 0.32);
    stroke(0, 0, 8);
    strokeWeight(2);
    noFill();
    arc(-w * 0.2, 0, w * 0.5, w * 0.9, -HALF_PI, HALF_PI);
    pop();
  }

  // motifs sur le dos
  for (let i = 1; i < n - 1; i++) {
    const p = segs[i].pos;
    const a = p5.Vector.sub(segs[i - 1].pos, segs[i + 1].pos).heading();
    const w = larg(i);
    const c = couleurCorps(i, n, o.skin, o.custom, modele);
    push();
    translate(p.x, p.y);
    rotate(a);
    noStroke();
    if (modele === 'Python Géant') {
      if (i % 2 === 0) {
        fill(sombre(c, 0.45));
        ellipse(0, 0, w * 0.65, w * 0.88);
        fill(claire(c));
        ellipse(0, 0, w * 0.28, w * 0.4);
      }
    } else if (modele === 'Cobra Royal') {
      if (i % 3 === 0) {
        fill(0, 0, 95, 200);
        rectMode(CENTER);
        rect(0, 0, w * 0.22, w * 0.95, 3);
      }
    } else if (modele === 'Dragon Électrique') {
      if (i % 2 === 0) {
        fill(185, 70, 100);
        triangle(w * 0.25, -w * 0.45, -w * 0.35, -w * 0.45, -w * 0.2, -w * 1.0);
        triangle(w * 0.25, w * 0.45, -w * 0.35, w * 0.45, -w * 0.2, w * 1.0);
      }
      fill(185, 100, 100, 220);
      circle(0, 0, w * 0.28);
    } else if (modele === 'Crotale') {
      if (i % 2 === 0) {
        stroke(claire(c));
        strokeWeight(2);
        fill(sombre(c, 0.4));
        beginShape();
        vertex(-w * 0.5, 0); vertex(0, -w * 0.45); vertex(w * 0.5, 0); vertex(0, w * 0.45);
        endShape(CLOSE);
      }
    }
    pop();
  }

  // éclairs du dragon
  if (modele === 'Dragon Électrique' && frameCount % 3 === 0) {
    const i = floor(random(1, n));
    stroke(185, 40, 100, 230);
    strokeWeight(2);
    noFill();
    let x = segs[i].pos.x, y = segs[i].pos.y;
    beginShape();
    vertex(x, y);
    for (let k = 0; k < 4; k++) { x += random(-14, 14); y += random(-14, 14); vertex(x, y); }
    endShape();
  }

  // queue : sonnette du crotale / pointe du dragon
  const aq = p5.Vector.sub(segs[n - 1].pos, segs[n - 2].pos).heading();
  push();
  translate(segs[n - 1].pos.x, segs[n - 1].pos.y);
  rotate(aq);
  if (modele === 'Crotale') {
    for (let k = 0; k < 4; k++) {
      fill(40, 25, 92 - k * 5);
      stroke(30, 40, 40);
      strokeWeight(1.5);
      ellipse(6 + k * 7, sin(frameCount * 1.2 + k) * 1.5, (9 - k) * ech, (7 - k * 0.8) * ech);
    }
  } else if (modele === 'Dragon Électrique') {
    noStroke();
    fill(185, 80, 100);
    triangle(0, 0, 16 * ech, -8 * ech, 16 * ech, 8 * ech);
  }
  pop();

  // tête
  let d = p5.Vector.sub(segs[0].pos, segs[1].pos);
  const ang = d.magSq() > 0.25 ? d.heading() : (segs[0].vel ? segs[0].vel.heading() : 0);
  const hs = baseW;
  push();
  translate(segs[0].pos.x, segs[0].pos.y);
  rotate(ang);
  dessinerTete(modele, hs, couleurCorps(0, n, o.skin, o.custom, modele));
  pop();

  // bouclier
  if (o.bouclier) {
    noStroke();
    fill(190, 60, 100, 40);
    stroke(190, 60, 100, 140 + sin(frameCount * 0.2) * 60);
    strokeWeight(3);
    circle(segs[0].pos.x, segs[0].pos.y, hs * 3.2);
  }

  // couronne
  if (o.gagnant) {
    push();
    translate(segs[0].pos.x, segs[0].pos.y - hs * 1.8);
    fill(50, 100, 100);
    stroke(40, 100, 70);
    strokeWeight(1.5);
    beginShape();
    vertex(-12, 6); vertex(-14, -10); vertex(-6, -3); vertex(0, -15); vertex(6, -3); vertex(14, -10); vertex(12, 6);
    endShape(CLOSE);
    pop();
  }
  pop();
}
