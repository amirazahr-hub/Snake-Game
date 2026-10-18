// =====================================================
// DÉCORS ET DESSIN DES OBJETS (habillage graphique, pas de steering)
// Fonds animés par thème, nourriture, obstacles, prédateurs, particules.
// =====================================================

// =====================================================
// UTILITAIRES DE DESSIN
// =====================================================

function etoile(x, y, r1, r2, n) {
  beginShape();
  for (let i = 0; i < n * 2; i++) {
    const a = (PI * i) / n - HALF_PI;
    const r = i % 2 === 0 ? r2 : r1;
    vertex(x + cos(a) * r, y + sin(a) * r);
  }
  endShape(CLOSE);
}

function poly(forme, r) {
  beginShape();
  forme.forEach((f, i) => {
    const a = (TWO_PI * i) / forme.length;
    vertex(cos(a) * r * f, sin(a) * r * f);
  });
  endShape(CLOSE);
}

function barre(x, y, w, h, ratio, col) {
  push();
  noStroke();
  fill(255, 255, 255, 40);
  rect(x, y, w, h, h / 2);
  fill(col);
  rect(x, y, max(0, w * constrain(ratio, 0, 1)), h, h / 2);
  pop();
}

function burst(x, y, col, n = 14) {
  for (let i = 0; i < n; i++) {
    particules.push({ pos: createVector(x, y), vel: p5.Vector.random2D().mult(random(1, 5)), vie: 40, max: 40, col: col, txt: null });
  }
}

function texteFlottant(x, y, txt, col = [255, 255, 255]) {
  particules.push({ pos: createVector(x, y), vel: createVector(0, -1.2), vie: 50, max: 50, col: col, txt: txt });
}

function majParticules() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.pos.add(p.vel);
    p.vie--;
    if (!p.txt) p.vel.mult(0.94);
    const al = (255 * p.vie) / p.max;
    fill(p.col[0], p.col[1], p.col[2], al);
    if (p.txt) {
      textSize(18);
      textStyle(BOLD);
      text(p.txt, p.pos.x, p.pos.y);
    } else {
      circle(p.pos.x, p.pos.y, 6 * (p.vie / p.max) + 2);
    }
    if (p.vie <= 0) particules.splice(i, 1);
  }
  pop();
}

// =====================================================
// FONDS THÉMATIQUES
// =====================================================

function initialiserDecor() {
  decor = [];
  const n = themeCourant === 'Espace' ? 220 : 90;
  for (let i = 0; i < n; i++) {
    decor.push({ x: random(width), y: random(height), s: random(1, 4), v: random(0.2, 1.2), ph: random(TWO_PI) });
  }
}

function dessinerFond() {
  const th = THEMES[themeCourant];
  const ctx = drawingContext;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  th.fond.forEach((c, i) => g.addColorStop(i / (th.fond.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  majCamera();
  dessinerProfondeur(th);

  push();
  noStroke();
  const t = frameCount;

  if (themeCourant === 'Espace') {
    const ng = (cx, cy, r, col) => {
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, col);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    };
    ng(width * 0.2, height * 0.3, 380, 'rgba(120,60,200,0.22)');
    ng(width * 0.8, height * 0.7, 420, 'rgba(0,150,200,0.18)');
    ng(width * 0.55, height * 0.12, 300, 'rgba(220,60,150,0.12)');
    decor.forEach(e => {
      fill(200, 210, 255, 160 + sin(t * 0.05 + e.ph) * 80);
      circle(e.x, e.y, e.s);
      e.y += e.v * 0.6;
      if (e.y > height) e.y = 0;
    });
  } else if (themeCourant === 'Jungle') {
    for (let k = 0; k < 5; k++) {
      const x = (k * width) / 4 + sin(t * 0.01 + k) * 60;
      fill(255, 250, 170, 14);
      quad(x, 0, x + 80, 0, x + 300, height, x + 90, height);
    }
    decor.forEach(e => {
      push();
      translate(e.x, e.y);
      rotate(t * 0.02 + e.ph);
      fill(70, 170, 80, 150);
      ellipse(0, 0, e.s * 5, e.s * 2.5);
      pop();
      e.y += e.v;
      e.x += sin(t * 0.02 + e.ph) * 0.8;
      if (e.y > height + 10) { e.y = -10; e.x = random(width); }
    });
    noFill();
    for (let x = 0; x < width + 90; x += 90) {
      const k = x / 90;
      const len = 60 + abs(sin(k * 7.1)) * 140;
      const sw = sin(t * 0.02 + k) * 15;
      stroke(25, 100, 45, 200);
      strokeWeight(3);
      bezier(x, 0, x + sw, len * 0.4, x - sw, len * 0.7, x + sw * 0.5, len);
      noStroke();
      fill(40, 140, 60, 220);
      ellipse(x + sw * 0.5, len, 14, 8);
      noFill();
    }
  } else if (themeCourant === 'Océan') {
    for (let k = 0; k < 5; k++) {
      const x = (k * width) / 4 + sin(t * 0.008 + k) * 70;
      fill(190, 235, 255, 15);
      quad(x, 0, x + 80, 0, x + 300, height, x + 90, height);
    }
    noFill();
    for (let k = 0; k < 3; k++) {
      stroke(255, 255, 255, 18);
      strokeWeight(2);
      beginShape();
      for (let x = 0; x <= width; x += 20) vertex(x, height * (0.25 + k * 0.25) + sin(x * 0.01 + t * 0.02 + k) * 22);
      endShape();
    }
    decor.forEach(e => {
      noFill();
      stroke(255, 255, 255, 90);
      strokeWeight(1.2);
      circle(e.x, e.y, e.s * 3);
      e.y -= e.v * 1.2;
      e.x += sin(t * 0.03 + e.ph) * 0.4;
      if (e.y < -10) { e.y = height + 10; e.x = random(width); }
    });
    for (let x = 20; x < width; x += 70) {
      stroke(20, 120, 80, 200);
      strokeWeight(5);
      noFill();
      beginShape();
      for (let y = height; y > height - 90 - abs(sin(x)) * 60; y -= 10) vertex(x + sin(t * 0.03 + y * 0.05 + x) * 8, y);
      endShape();
    }
    noStroke();
    fill(210, 190, 130, 70);
    rect(0, height - 14, width, 14);
  } else if (themeCourant === 'Volcan') {
    decor.forEach(e => {
      fill(255, 120 + random(60), 30, 120 + sin(t * 0.2 + e.ph) * 80);
      circle(e.x, e.y, e.s * 1.6);
      e.y -= e.v * 1.5;
      e.x += sin(t * 0.04 + e.ph) * 0.6;
      if (e.y < -10) { e.y = height + 10; e.x = random(width); }
    });
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(255,90,0,0.9)';
    fill(255, 90, 0);
    beginShape();
    vertex(0, height);
    for (let x = 0; x <= width; x += 20) vertex(x, height - 24 + sin(x * 0.02 + t * 0.04) * 8);
    vertex(width, height);
    endShape(CLOSE);
    ctx.shadowBlur = 0;
  }
  pop();
}

// =====================================================
// DESSIN DES OBJETS THÉMATIQUES
// =====================================================

function dessinerNourriture(n) {
  push();
  translate(n.pos.x, n.pos.y + sin(frameCount * 0.1 + n.pos.x) * 3);
  noStroke();
  ombreSol(2, 18, 28, 9, 0.4);
  const a = n.type === 'a';
  halo(0, 0, 34, { Espace: [80, 220, 255], Jungle: [255, 220, 120], 'Océan': [180, 220, 255], Volcan: [255, 140, 40], 'Néon': [255, 60, 220] }[themeCourant], 0.35);
  switch (themeCourant) {
    case 'Espace':
      rotate(frameCount * 0.03);
      if (a) {
        fill(80, 240, 255);
        stroke(255, 255, 255, 200);
        strokeWeight(1.5);
        quad(0, -15, 10, 0, 0, 15, -10, 0);
        noStroke();
        fill(255, 255, 255, 150);
        triangle(0, -15, 10, 0, 0, 0);
      } else {
        fill(255, 215, 60);
        stroke(255, 245, 170);
        strokeWeight(1.5);
        etoile(0, 0, 6, 15, 5);
      }
      break;
    case 'Jungle':
      if (a) {
        bille(0, 0, 12, [225, 40, 50]);
        stroke(70, 50, 20);
        strokeWeight(2.5);
        line(0, -12, 3, -18);
        noStroke();
        fill(90, 200, 70);
        ellipse(8, -16, 10, 5);
      } else {
        noFill();
        strokeCap(ROUND);
        stroke(255, 220, 40);
        strokeWeight(9);
        arc(0, -6, 30, 24, 0.3, PI - 0.3);
        stroke(110, 80, 20);
        strokeWeight(3);
        point(-13, 0);
        point(13, 0);
      }
      break;
    case 'Océan':
      if (a) {
        fill(255, 170, 185);
        arc(0, 8, 34, 26, PI, TWO_PI);
        stroke(220, 120, 140);
        strokeWeight(1);
        for (let k = -2; k <= 2; k++) line(0, 8, k * 7, -3);
        noStroke();
        bille(0, 0, 9, [235, 235, 250], { rim: [150, 210, 255] });
      } else {
        fill(255, 140, 60);
        stroke(255, 200, 120);
        strokeWeight(1.5);
        etoile(0, 0, 6, 16, 5);
      }
      break;
    case 'Volcan':
      if (a) {
        fill(255, 50, 30);
        stroke(255, 190, 110);
        strokeWeight(1.5);
        beginShape();
        vertex(0, -15); vertex(11, -5); vertex(8, 11); vertex(-8, 11); vertex(-11, -5);
        endShape(CLOSE);
        noStroke();
        fill(255, 255, 255, 120);
        triangle(0, -15, 11, -5, 0, 0);
      } else {
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = 'rgba(255,140,0,1)';
        fill(255, 160, 20);
        circle(0, 0, 22);
        fill(255, 240, 120);
        circle(0, 0, 9);
        drawingContext.shadowBlur = 0;
      }
      break;
    case 'Néon':
      rotate(frameCount * 0.025);
      drawingContext.shadowBlur = 18;
      drawingContext.shadowColor = a ? '#00f0ff' : '#ffe45e';
      noFill();
      stroke(a ? color(0, 240, 255) : color(255, 228, 94));
      strokeWeight(2.5);
      if (a) {
        rectMode(CENTER);
        rect(0, 0, 20, 20, 2);
        rotate(0.5);
        rect(0, 0, 11, 11, 1);
      } else {
        etoile(0, 0, 7, 15, 4);
      }
      drawingContext.shadowBlur = 0;
      break;
  }
  pop();
}

function dessinerObstacle(o) {
  const r = o.taille / 2;
  push();
  translate(o.pos.x, o.pos.y);
  ombreSol(6, r * 0.95, r * 2.3, r * 0.8, 0.32);
  rotate(o.rot);
  switch (themeCourant) {
    case 'Espace':
      polyEclaire(o.forme, r, [128, 120, 135], o.rot, 'rgba(50,45,60,0.9)');
      noStroke();
      [[-0.3, -0.2, 0.5], [0.3, 0.25, 0.35], [0.05, -0.5, 0.22]].forEach(([x, y, k]) => {
        fill(60, 55, 70, 170);
        circle(x * r, y * r, r * k);
        fill(190, 185, 200, 120);
        arc(x * r, y * r, r * k * 0.9, r * k * 0.9, PI * 0.9, PI * 1.9);
      });
      break;
    case 'Jungle':
      polyEclaire(o.forme, r, [92, 100, 84], o.rot, 'rgba(30,40,25,0.9)');
      noStroke();
      fill(70, 160, 55, 235);
      ellipse(-r * 0.1, -r * 0.45, r * 1.2, r * 0.5);
      fill(120, 210, 90, 180);
      ellipse(-r * 0.2, -r * 0.52, r * 0.7, r * 0.2);
      fill(70, 160, 55, 230);
      ellipse(r * 0.4, -r * 0.1, r * 0.5, r * 0.3);
      break;
    case 'Océan':
      stroke(90, 35, 130);
      strokeWeight(3);
      for (let k = 0; k < 18; k++) {
        const a = (TWO_PI * k) / 18;
        line(cos(a) * r * 0.5, sin(a) * r * 0.5, cos(a) * r * 1.25, sin(a) * r * 1.25);
      }
      noStroke();
      rotate(-o.rot);
      bille(0, 0, r * 0.78, [130, 55, 175], { rim: [255, 120, 220] });
      break;
    case 'Volcan':
      halo(0, 0, r * 2.2, [255, 90, 0], 0.4);
      polyEclaire(o.forme, r, [70, 40, 32], o.rot, 'rgba(255,110,20,0.95)');
      drawingContext.shadowBlur = 14;
      drawingContext.shadowColor = 'rgba(255,90,0,0.9)';
      stroke(255, 170, 40);
      strokeWeight(2);
      line(-r * 0.5, -r * 0.2, 0, r * 0.1);
      line(0, r * 0.1, r * 0.4, -r * 0.3);
      line(0, r * 0.1, r * 0.1, r * 0.6);
      drawingContext.shadowBlur = 0;
      break;
    case 'Néon':
      halo(0, 0, r * 2, [255, 40, 160], 0.35);
      fill(18, 4, 40, 235);
      drawingContext.shadowBlur = 18;
      drawingContext.shadowColor = '#ff2bd6';
      stroke(255, 60, 220);
      strokeWeight(2.5);
      poly(o.forme, r);
      drawingContext.shadowBlur = 0;
      stroke(0, 240, 255, 200);
      strokeWeight(1.5);
      noFill();
      poly(o.forme, r * 0.55);
      for (let k = 0; k < o.forme.length; k += 2) {
        const a = (TWO_PI * k) / o.forme.length;
        line(cos(a) * r * 0.55 * o.forme[k], sin(a) * r * 0.55 * o.forme[k], cos(a) * r * o.forme[k], sin(a) * r * o.forme[k]);
      }
      break;
  }
  pop();
}

function dessinerPredateur(p) {
  const r = p.taille / 2;
  push();
  translate(p.pos.x, p.pos.y);
  const a = p.vel.heading();
  switch (themeCourant) {
    case 'Espace':
      noStroke();
      fill(0, 0, 0, 70);
      ellipse(4, r * 0.9, r * 2.2, r * 0.5);
      fill(150, 160, 190);
      stroke(80);
      strokeWeight(2);
      ellipse(0, 0, r * 2.4, r * 0.9);
      noStroke();
      fill(120, 220, 255, 200);
      arc(0, -r * 0.1, r * 1.1, r * 1.1, PI, TWO_PI);
      for (let k = -2; k <= 2; k++) {
        fill(frameCount % 20 < 10 ? 255 : 120, 60, 60);
        circle(k * r * 0.5, r * 0.15, 6);
      }
      break;
    case 'Jungle':
      rotate(a);
      noStroke();
      fill(25, 30, 15);
      circle(0, 0, r * 2);
      fill(255, 200, 0);
      ellipse(r * 0.4, -r * 0.4, r * 0.55, r * 0.3);
      ellipse(r * 0.4, r * 0.4, r * 0.55, r * 0.3);
      fill(0);
      ellipse(r * 0.45, -r * 0.4, r * 0.12, r * 0.28);
      ellipse(r * 0.45, r * 0.4, r * 0.12, r * 0.28);
      fill(255);
      triangle(r * 0.95, -r * 0.2, r * 0.75, -r * 0.1, r * 0.95, -r * 0.0);
      triangle(r * 0.95, r * 0.2, r * 0.75, r * 0.1, r * 0.95, r * 0.0);
      break;
    case 'Océan':
      rotate(a);
      noStroke();
      fill(110, 135, 160);
      ellipse(0, 0, r * 2.8, r * 1.2);
      triangle(-r * 1.2, 0, -r * 1.9, -r * 0.7, -r * 1.9, r * 0.7);
      fill(90, 110, 135);
      triangle(0, -r * 0.5, -r * 0.5, -r * 1.1, -r * 0.7, -r * 0.4);
      triangle(0, r * 0.5, -r * 0.5, r * 1.1, -r * 0.7, r * 0.4);
      fill(255);
      circle(r * 0.8, -r * 0.3, 6);
      fill(0);
      circle(r * 0.85, -r * 0.3, 3);
      break;
    case 'Volcan':
      noStroke();
      drawingContext.shadowBlur = 25;
      drawingContext.shadowColor = 'rgba(255,60,0,1)';
      fill(255, 80, 0);
      etoile(0, 0, r * 0.75, r * 1.25, 8);
      drawingContext.shadowBlur = 0;
      fill(255, 200, 0);
      circle(0, 0, r * 1.2);
      rotate(a);
      fill(0);
      ellipse(r * 0.25, -r * 0.2, r * 0.3, r * 0.15);
      ellipse(r * 0.25, r * 0.2, r * 0.3, r * 0.15);
      break;
    case 'Néon':
      rotate(a);
      halo(0, 0, r * 2.4, [255, 30, 90], 0.4);
      drawingContext.shadowBlur = 22;
      drawingContext.shadowColor = '#ff1e5a';
      fill(25, 0, 15);
      stroke(255, 40, 110);
      strokeWeight(3);
      triangle(r * 1.3, 0, -r * 0.9, -r * 0.95, -r * 0.5, 0);
      triangle(r * 1.3, 0, -r * 0.9, r * 0.95, -r * 0.5, 0);
      drawingContext.shadowBlur = 0;
      noStroke();
      fill(255, 230, 240);
      circle(r * 0.35, 0, r * 0.35);
      break;
  }
  pop();
}
