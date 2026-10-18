// =====================================================
// ENTITÉS DU JEU : toutes héritent de Vehicle
// Chaque classe choisit ses comportements dans sa méthode comportement().
// =====================================================

// Le power-up « ralenti » réduit la vitesse des obstacles et des prédateurs
function facteurTemps() {
  return effets.ralenti > millis() ? 0.35 : 1;
}

// Segment de serpent (le rendu réaliste est fait par dessinerSerpentReel)
class Snake extends Vehicle {
  constructor(x, y) { super(x, y); }
  showPoint(i, total, diametre, skin, custom, modele) {
    push();
    colorMode(HSB, 360, 100, 100, 255);
    noStroke();
    fill(couleurCorps(i, total, skin, custom, modele));
    circle(this.pos.x, this.pos.y, diametre);
    pop();
  }
}

class Food extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.type = random() > 0.5 ? 'a' : 'b';
    this.maxSpeed = 2.2;
    this.maxForce = 0.15;
    this.vel = p5.Vector.random2D().mult(1);
  }
  comportement(tetes, toutes) {
    let fuit = false;
    const aimante = effets.aimant > millis() && tetes[0];
    if (comportements.wander) this.applyForce(this.wander().mult(0.8 * poids.wander));
    if (aimante) {
      if (p5.Vector.dist(this.pos, tetes[0].pos) < 450) this.applyForce(this.seek(tetes[0].pos).mult(2));
    } else if (comportements.fuite) {
      for (const t of tetes) {
        if (!t) continue;
        if (p5.Vector.dist(this.pos, t.pos) < 140) { this.applyForce(this.flee(t.pos).mult(3 * poids.fuite)); fuit = true; }
      }
    }
    if (comportements.separation) this.applyForce(this.separate(toutes, 45).mult(1.2 * poids.separation));
    if (comportements.limites) this.applyForce(this.boundaries(50).mult(1.5 * poids.limites));
    this.maxSpeed = aimante ? 8 : (fuit ? 6.5 : 2.2);
    this.maxForce = (fuit || aimante) ? 0.6 : 0.15;
    if (!comportements.wander && !fuit && !aimante) this.vel.mult(0.96);
    this.update();
    if (!comportements.limites) this.wrapEdges();
  }
}

class Obstacle extends Vehicle {
  constructor(x, y, vitesse) {
    super(x, y);
    this.taille = random(40, 54);
    this.baseSpeed = vitesse;
    this.maxSpeed = vitesse;
    this.maxForce = 0.12;
    this.vel = p5.Vector.random2D().mult(vitesse * 0.7);
    this.rot = random(TWO_PI);
    this.vrot = random(-0.02, 0.02);
    this.forme = [];
    for (let i = 0; i < 10; i++) this.forme.push(random(0.78, 1.1));
  }
  comportement(tete, toutes) {
    this.maxSpeed = this.baseSpeed * facteurTemps();
    if (comportements.poursuite && tete) this.applyForce(this.pursue(tete).mult(1.2 * poids.poursuite));
    else this.applyForce(this.wander().mult(poids.wander));
    if (comportements.separation) this.applyForce(this.separate(toutes, 90).mult(1.5 * poids.separation));
    if (comportements.limites) this.applyForce(this.boundaries(70).mult(2 * poids.limites));
    this.update();
    this.vel.limit(this.maxSpeed);
    this.rot += this.vrot;
    if (!comportements.limites) this.wrapEdges();
  }
}

// Prédateur : chasse le serpent (pursue) avec un thème visuel
class Predator extends Vehicle {
  constructor(x, y, vitesse) {
    super(x, y);
    this.taille = 54;
    this.baseSpeed = vitesse;
    this.maxSpeed = vitesse;
    this.maxForce = 0.1;
    this.vel = p5.Vector.random2D();
  }
  comportement(tete, tous) {
    this.maxSpeed = this.baseSpeed * facteurTemps();
    if (tete && comportements.predateurs) this.applyForce(this.pursue(tete).mult(1.0 * poids.predateurs));
    else this.applyForce(this.wander().mult(0.8 * poids.wander));
    if (comportements.separation) this.applyForce(this.separate(tous, 120).mult(1.5 * poids.separation));
    if (comportements.limites) this.applyForce(this.boundaries(50).mult(1.5 * poids.limites));
    this.update();
    this.vel.limit(this.maxSpeed);
    if (!comportements.limites) this.wrapEdges();
  }
}

// Créature d'ambiance : flocking + fuite devant le serpent
class Boid extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 3;
    this.maxForce = 0.12;
    this.vel = p5.Vector.random2D().mult(2);
    this.teinte = random(-15, 15);
  }
  comportement(tous, tetes) {
    if (comportements.flocking) {
      this.applyForce(this.separate(tous, 26).mult(1.6 * poids.flocking));
      this.applyForce(this.align(tous, 70).mult(poids.flocking));
      this.applyForce(this.cohere(tous, 100).mult(0.8 * poids.flocking));
    }
    this.applyForce(this.wander().mult(0.5 * poids.wander));
    let peur = false;
    for (const t of tetes) {
      if (t && p5.Vector.dist(this.pos, t.pos) < 110) { this.applyForce(this.flee(t.pos).mult(3 * poids.fuite)); peur = true; }
    }
    this.maxSpeed = peur ? 5.5 : 3;
    this.applyForce(this.boundaries(30).mult(1.5 * poids.limites));
    this.update();
    this.wrapEdges();
  }
  dessiner() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    noStroke();
    switch (themeCourant) {
      case 'Océan':
        fill(90 + this.teinte * 3, 200, 255);
        ellipse(0, 0, 14, 7);
        triangle(-6, 0, -13, -5, -13, 5);
        fill(255);
        circle(3, -1, 2);
        break;
      case 'Jungle':
        drawingContext.shadowBlur = 14;
        drawingContext.shadowColor = 'rgba(220,255,80,1)';
        fill(230, 255, 120);
        circle(0, 0, 5 + sin(frameCount * 0.2 + this.teinte) * 1.5);
        break;
      case 'Volcan':
        drawingContext.shadowBlur = 12;
        drawingContext.shadowColor = 'rgba(255,120,0,1)';
        fill(255, 150, 30);
        circle(0, 0, 5);
        fill(255, 230, 100, 150);
        circle(-4, 0, 3);
        break;
      default:
        stroke(180, 220, 255, 170);
        strokeWeight(2);
        line(0, 0, -14, 0);
        noStroke();
        fill(255);
        circle(0, 0, 5);
    }
    drawingContext.shadowBlur = 0;
    pop();
  }
}

class PowerUp extends Vehicle {
  constructor(x, y, type) {
    super(x, y);
    this.type = type;
    this.vie = 700;
    this.maxSpeed = 1.2;
    this.maxForce = 0.05;
    this.vel = p5.Vector.random2D();
  }
  comportement() {
    this.vie--;
    this.applyForce(this.wander().mult(poids.wander));
    this.applyForce(this.boundaries(80).mult(2 * poids.limites));
    this.update();
  }
  dessiner() {
    if (this.vie < 150 && frameCount % 10 < 5) return;
    const c = { aimant: [255, 90, 200], bouclier: [90, 200, 255], ralenti: [160, 225, 255], turbo: [255, 230, 70] }[this.type];
    const ico = { aimant: '🧲', bouclier: '🛡️', ralenti: '❄️', turbo: '⚡' }[this.type];
    push();
    translate(this.pos.x, this.pos.y);
    noFill();
    stroke(c[0], c[1], c[2], 220);
    strokeWeight(3);
    circle(0, 0, 38 + sin(frameCount * 0.15) * 4);
    noStroke();
    fill(c[0], c[1], c[2], 60);
    circle(0, 0, 34);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(ico, 0, 1);
    pop();
  }
}

// Porte du circuit (numérotée, dernière = arrivée)
class Anneau extends Vehicle {
  constructor(x, y, index) {
    super(x, y);
    this.home = createVector(x, y);
    this.index = index;
    this.rayon = 38;
    this.passe = false;
    this.maxSpeed = 1.5;
    this.maxForce = 0.1;
  }
  comportement() {
    this.applyForce(this.arrive(this.home, 0));
    if (comportements.wander) this.applyForce(this.wander().mult(0.5 * poids.wander));
    this.update();
  }
  dessiner(estSuivant) {
    const derniere = this.index === anneaux.length - 1;
    push();
    translate(this.pos.x, this.pos.y);
    textAlign(CENTER, CENTER);
    if (this.passe) {
      noFill();
      stroke(0, 255, 120, 90);
      strokeWeight(3);
      circle(0, 0, this.rayon * 2);
      noStroke();
      fill(0, 255, 120, 180);
      textSize(18);
      text('✔', 0, 0);
    } else {
      const pulse = estSuivant ? sin(frameCount * 0.15) * 5 : 0;
      noFill();
      stroke(estSuivant ? '#ffd700' : 'rgba(255,255,255,0.4)');
      strokeWeight(estSuivant ? 5 : 3);
      if (estSuivant) {
        drawingContext.shadowBlur = 22;
        drawingContext.shadowColor = '#ffd700';
      }
      circle(0, 0, this.rayon * 2 + pulse);
      drawingContext.shadowBlur = 0;
      if (estSuivant) {
        stroke(255, 215, 0, 70);
        circle(0, 0, this.rayon * 2 + 22 + pulse);
      }
      noStroke();
      fill(255);
      textSize(18);
      textStyle(BOLD);
      text(derniere ? '🏁' : (this.index + 1), 0, 1);
    }
    pop();
  }
}

// Point du texte : retourne à sa place (arrive), peut fuir ou errer
class Cible extends Vehicle {
  constructor(homeX, homeY) {
    super(random(width), random(height));
    this.home = createVector(homeX, homeY);
    this.actif = true;
    this.maxSpeed = 8;
    this.maxForce = 0.7;
  }
  comportement(tete) {
    this.applyForce(this.arrive(this.home, 0));
    if (comportements.wander) this.applyForce(this.wander().mult(0.4 * poids.wander));
    if (effets.aimant > millis() && tete) {
      this.applyForce(this.seek(tete.pos).mult(2.5));
    } else if (comportements.fuite && tete && p5.Vector.dist(this.pos, tete.pos) < 100) {
      this.applyForce(this.flee(tete.pos).mult(4 * poids.fuite));
    }
    this.update();
  }
}

// Drone d'escorte : LEADER FOLLOWING.
// Il vise (arrive) un point placé derrière la tête, décalé sur le côté selon son rang ;
// il s'écarte (flee) de la zone devant le chef pour ne pas lui barrer la route ;
// et se sépare (separate) de ses voisins pour garder la formation.
class Escorte extends Vehicle {
  constructor(x, y, index) {
    super(x, y);
    this.index = index;
    this.maxSpeed = 9;
    this.maxForce = 0.9;
    this.rayonFreinage = 60;
    this.dir = createVector(1, 0);
  }
  comportement(chef, tous) {
    if (chef.vel.mag() > 0.5) this.dir.lerp(chef.vel.copy().normalize(), 0.08);
    const derriere = p5.Vector.sub(chef.pos, this.dir.copy().setMag(95 + 28 * floor(this.index / 2)));
    const cote = this.dir.copy().rotate(HALF_PI).setMag((this.index % 2 ? 1 : -1) * (40 + 18 * floor(this.index / 2)));
    const point = p5.Vector.add(derriere, cote);
    this.applyForce(this.arrive(point, 0).mult(poids.escorte));
    // zone devant le chef : on l'évite
    const devant = p5.Vector.add(chef.pos, this.dir.copy().setMag(60));
    if (p5.Vector.dist(this.pos, devant) < 55) this.applyForce(this.flee(devant).mult(2 * poids.escorte));
    if (comportements.separation) this.applyForce(this.separate(tous, 34).mult(1.5 * poids.separation));
    this.update();
  }
  dessiner() {
    const th = THEMES[themeCourant];
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.mag() > 0.2 ? this.vel.heading() : this.dir.heading());
    drawingContext.shadowBlur = 14;
    drawingContext.shadowColor = th.accent;
    fill(th.accent);
    stroke(255, 255, 255, 200);
    strokeWeight(1.5);
    triangle(9, 0, -7, -6, -7, 6);
    noStroke();
    fill(255, 255, 255, 220);
    circle(0, 0, 3.5);
    drawingContext.shadowBlur = 0;
    pop();
  }
}
