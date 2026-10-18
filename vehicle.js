// =====================================================
// VEHICLE : base de TOUS les objets du jeu + TOUS les steering behaviors
// -----------------------------------------------------
// Chaque comportement RETOURNE une force (vecteur) ; on les combine avec
// applyForce(), par exemple :  v.applyForce(v.seek(cible).mult(2));
// Les boutons du panneau (touches 1 à 9) activent / désactivent certains
// comportements (voir l'objet `comportements` dans sketch.js).
// =====================================================

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.r = 16;
    this.rayonFreinage = 100;         // arrive : distance à partir de laquelle on freine
    this.wanderTheta = -Math.PI / 2;  // wander : angle courant du point sur le cercle
  }

  // ---------- mécanique : force -> accélération -> vitesse -> position ----------

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  // dessin simple (triangle) : utile pour tester un Vehicle seul
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    if (this.vel.mag() > 0.2) rotate(this.vel.heading());
    fill(255);
    stroke(0);
    strokeWeight(2);
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
  }

  // ---------- STEERING BEHAVIORS (chacun retourne une force) ----------

  arrive(cible, d = 0) {
    const cibleVec = cible.pos ? cible.pos : cible;
    const versCible = p5.Vector.sub(cibleVec, this.pos);
    const distance = versCible.mag();
    const rayonFreinage = this.rayonFreinage;
    let vitesseDesiree;
    if (distance < rayonFreinage) {
      vitesseDesiree = map(distance, d, rayonFreinage, 0, this.maxSpeed, true);
    } else {
      vitesseDesiree = this.maxSpeed;
    }
    versCible.setMag(vitesseDesiree);
    const steer = p5.Vector.sub(versCible, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  seek(cible) {
    const cibleVec = cible.pos ? cible.pos : cible;
    const desire = p5.Vector.sub(cibleVec, this.pos);
    desire.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(desire, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  flee(cible) {
    return this.seek(cible).mult(-1);
  }

  pursue(autre) {
    const distance = p5.Vector.dist(this.pos, autre.pos);
    const prediction = autre.vel.copy().mult(min(distance / max(this.maxSpeed, 0.1), 20));
    return this.seek(p5.Vector.add(autre.pos, prediction));
  }

  evade(autre) {
    return this.pursue(autre).mult(-1);
  }

  wander() {
    this.wanderTheta += random(-0.35, 0.35); // le point sur le cercle bouge un peu à chaque image
    let devant = this.vel.copy();
    if (devant.mag() < 0.1) devant = p5.Vector.random2D();
    devant.setMag(60);
    const centre = p5.Vector.add(this.pos, devant);
    const decalage = p5.Vector.fromAngle(this.wanderTheta + devant.heading()).mult(30);
    const pointCible = p5.Vector.add(centre, decalage);
    if (comportements.debug && this.debugWander) {
      push();
      noFill();
      stroke(255, 255, 0, 120);
      circle(centre.x, centre.y, 60);
      line(this.pos.x, this.pos.y, centre.x, centre.y);
      fill(255, 255, 0);
      circle(pointCible.x, pointCible.y, 6);
      pop();
    }
    return this.seek(pointCible);
  }

  separate(autres, distanceMin = 30) {
    const somme = createVector(0, 0);
    let compte = 0;
    for (const o of autres) {
      if (o === this) continue;
      const d = p5.Vector.dist(this.pos, o.pos);
      if (d > 0 && d < distanceMin) {
        const diff = p5.Vector.sub(this.pos, o.pos);
        diff.normalize().div(d);
        somme.add(diff);
        compte++;
      }
    }
    if (compte === 0) return createVector(0, 0);
    somme.div(compte).setMag(this.maxSpeed);
    const steer = p5.Vector.sub(somme, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // ALIGNMENT (flocking)
  align(autres, distanceVoisin = 70) {
    const somme = createVector(0, 0);
    let compte = 0;
    for (const o of autres) {
      if (o === this) continue;
      if (p5.Vector.dist(this.pos, o.pos) < distanceVoisin) { somme.add(o.vel); compte++; }
    }
    if (compte === 0) return createVector(0, 0);
    somme.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(somme, this.vel);
    steer.limit(this.maxForce);
    return steer;
  }

  // COHESION (flocking)
  cohere(autres, distanceVoisin = 100) {
    const centre = createVector(0, 0);
    let compte = 0;
    for (const o of autres) {
      if (o === this) continue;
      if (p5.Vector.dist(this.pos, o.pos) < distanceVoisin) { centre.add(o.pos); compte++; }
    }
    if (compte === 0) return createVector(0, 0);
    centre.div(compte);
    return this.seek(centre);
  }

  avoid(liste, longueurVue = 90) {
    const dir = this.vel.mag() > 0.1 ? this.vel.copy().normalize() : createVector(1, 0);
    const a1 = p5.Vector.add(this.pos, p5.Vector.mult(dir, longueurVue));
    const a2 = p5.Vector.add(this.pos, p5.Vector.mult(dir, longueurVue * 0.5));
    let danger = null;
    let pire = Infinity;
    for (const o of liste) {
      const rayon = o.taille / 2 + 28;
      const d0 = p5.Vector.dist(this.pos, o.pos);
      const d1 = p5.Vector.dist(a1, o.pos);
      const d2 = p5.Vector.dist(a2, o.pos);
      if (min(d0, d1, d2) < rayon && d0 < pire) { danger = o; pire = d0; }
    }
    if (comportements.debug && this.debugWander) {
      push();
      stroke(255, 120, 0, 150);
      line(this.pos.x, this.pos.y, a1.x, a1.y);
      noFill();
      circle(a1.x, a1.y, 8);
      circle(a2.x, a2.y, 8);
      pop();
    }
    if (!danger) return createVector(0, 0);
    const desire = p5.Vector.sub(a1, danger.pos);
    desire.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(desire, this.vel);
    steer.limit(this.maxForce * 3);
    return steer;
  }

  boundaries(marge = 60) {
    const desire = this.vel.copy();
    let touche = false;
    if (this.pos.x < marge) { desire.x = this.maxSpeed; touche = true; }
    else if (this.pos.x > width - marge) { desire.x = -this.maxSpeed; touche = true; }
    if (this.pos.y < marge + 40) { desire.y = this.maxSpeed; touche = true; }
    else if (this.pos.y > height - marge) { desire.y = -this.maxSpeed; touche = true; }
    if (!touche) return createVector(0, 0);
    desire.setMag(this.maxSpeed);
    const steer = p5.Vector.sub(desire, this.vel);
    steer.limit(this.maxForce * 2);
    return steer;
  }

  wrapEdges() {
    const m = 20;
    if (this.pos.x < -m) this.pos.x = width + m;
    if (this.pos.x > width + m) this.pos.x = -m;
    if (this.pos.y < -m) this.pos.y = height + m;
    if (this.pos.y > height + m) this.pos.y = -m;
  }

}
