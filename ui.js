// =====================================================
// INTERFACE : menu en 2 étapes, panneau des comportements, HUD, écrans de fin
// =====================================================

// UI
let uiContainer, etape1, etape2, ligneTexte;
let champTexte, selectSkin, selectModeleSerpent, colorPickerTexte, btnJouer;
let panneauComportements, panneauEntete, panneauListe;
let boutonsComportements = {};
let menuEtape = 1;
let modeChoisiMenu = 'ARCADE';
let niveauChoisiMenu = 1;
let divNiveaux, titreEtape2;
let cartesThemes = {};
let etape3, btnBoutique, btnAchat, divShopModeles, divShopSkins, labelShop, msgShop;
let apercu = null;                 // aperçu temporaire dans la boutique
let shopSel = { type: 'modeles', nom: null };

// =====================================================
// MENU EN 2 ÉTAPES : MODE → THÈME / NIVEAU / SERPENT
// =====================================================

function injecterStyles() {
  const s = document.createElement('style');
  s.textContent = `
    #menu-ui { --acc:#00ffcc; font-family:'Segoe UI',sans-serif; color:#ddd; }
    #menu-ui h1 { margin:0 0 4px 0; font-size:30px; letter-spacing:3px; color:var(--acc); text-shadow:0 0 14px var(--acc); }
    #menu-ui .sous { margin:0 0 18px 0; font-size:13px; color:#99a; }
    #menu-ui .grille { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    #menu-ui .grille4 { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; margin-bottom:14px; }
    #menu-ui .grille3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:8px; }
    #menu-ui .statut { min-height:34px; font-size:12px; color:#aab; text-align:left; margin-bottom:12px; line-height:1.4; }
    #menu-ui .carte { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); border-radius:14px;
      padding:14px; cursor:pointer; transition:.25s; text-align:left; }
    #menu-ui .carte:hover { transform:translateY(-3px); border-color:var(--acc); box-shadow:0 0 18px var(--acc); }
    #menu-ui .carte.sel { border-color:var(--acc); background:rgba(255,255,255,0.13); box-shadow:0 0 18px var(--acc); }
    #menu-ui .carte .ico { font-size:28px; }
    #menu-ui .carte .nom { font-weight:bold; font-size:15px; margin:4px 0 2px 0; color:#fff; }
    #menu-ui .carte .dsc { font-size:11.5px; color:#aab; line-height:1.3; }
    #menu-ui .petite { text-align:center; padding:10px 4px; }
    #menu-ui .petite .ico { font-size:24px; }
    #menu-ui .petite .nom { font-size:12px; margin:2px 0 0 0; }
    #menu-ui .lab { text-align:left; font-size:12px; letter-spacing:1.5px; color:var(--acc); margin:8px 0 6px 0; font-weight:bold; }
    #menu-ui .rang { display:flex; gap:8px; margin-bottom:14px; }
    #menu-ui .puce { flex:1; padding:9px 0; border-radius:10px; text-align:center; cursor:pointer; font-weight:bold;
      border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); transition:.2s; }
    #menu-ui .puce:hover { border-color:var(--acc); }
    #menu-ui .puce.sel { background:var(--acc); color:#000; border-color:var(--acc); }
    #menu-ui .puce.lock { opacity:0.35; cursor:not-allowed; }
    #menu-ui .retour { background:none; border:none; color:#99a; cursor:pointer; font-size:13px; float:left; padding:0; }
    #menu-ui .retour:hover { color:var(--acc); }

    /* ---------- menu : look plus soigné ---------- */
    #menu-ui h1 { background:linear-gradient(90deg,var(--acc),#fff 55%,var(--acc)); -webkit-background-clip:text; background-clip:text;
      color:transparent; text-shadow:none; filter:drop-shadow(0 0 12px var(--acc)); font-size:32px; }
    #menu-ui .tagline { margin:0 0 18px 0; font-size:12px; letter-spacing:3px; color:#8a90b0; text-transform:uppercase; }
    #menu-ui .carte { background:linear-gradient(160deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02)); backdrop-filter:blur(6px); }
    #menu-ui .carte:hover { transform:translateY(-4px) scale(1.02); }
    #menu-ui .carte .ico { filter:drop-shadow(0 0 8px var(--acc)); }
    #menu-ui::-webkit-scrollbar { width:8px; }
    #menu-ui::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:4px; }

    #menu-ui .btn-shop { margin-top:14px; width:100%; padding:12px; border-radius:14px; cursor:pointer; font-weight:700; font-size:14px;
      color:#ffd700; background:linear-gradient(160deg,rgba(255,215,0,0.16),rgba(255,215,0,0.04)); border:1px solid rgba(255,215,0,0.5); }
    #menu-ui .btn-shop:hover { box-shadow:0 0 16px rgba(255,215,0,0.5); }
    /* ---------- panneau STEERING ---------- */
    #steer { position:absolute; left:12px; bottom:12px; width:262px; box-sizing:border-box; z-index:5;
      font-family:'Segoe UI',sans-serif; color:#fff; --acc:#00ffcc;
      background:rgba(10,12,28,0.78); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.18);
      border-radius:16px; padding:8px; box-shadow:0 8px 30px rgba(0,0,0,0.45); opacity:0.72; transition:opacity .2s; }
    #steer:hover { opacity:1; }
    #steer .st-entete { display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none;
      font-size:12px; font-weight:700; letter-spacing:1.5px; padding:2px 4px; color:var(--acc); }
    #steer kbd { font:700 10px monospace; background:rgba(255,255,255,0.14); border-radius:4px; padding:1px 5px; color:#fff; }
    #steer .st-liste { flex-direction:column; gap:4px; margin-top:6px; max-height:calc(100vh - 150px); overflow-y:auto; padding-right:2px; }
    #steer .st-liste::-webkit-scrollbar { width:5px; }
    #steer .st-liste::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.25); border-radius:3px; }
    #steer .st-vitesse { display:flex; align-items:center; gap:8px; font-size:11px; padding:2px 4px 6px; color:#bbc; }
    #steer .st-vitesse input { flex:1; }
    #steer .st-vitesse b { width:20px; text-align:right; color:#fff; }
    #steer .st-ligne { --c:#fff; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
      border-left:3px solid var(--c); padding:3px 5px 4px; transition:.15s; }
    #steer .st-ligne.on { background:color-mix(in srgb,var(--c) 16%,transparent); border-color:color-mix(in srgb,var(--c) 50%,transparent); border-left-color:var(--c); }
    #steer .st-btn { display:flex; align-items:center; gap:7px; width:100%; background:none; border:none; color:#9aa;
      cursor:pointer; font-size:12px; font-weight:600; padding:1px 0; text-align:left; }
    #steer .st-ligne.on .st-btn { color:#fff; }
    #steer .st-btn .nom { flex:1; }
    #steer .st-btn .etat { font-size:10px; font-weight:800; padding:1px 7px; border-radius:9px; background:#3a3a4a; color:#aaa; }
    #steer .st-ligne.on .st-btn .etat { background:var(--c); color:#000; }
    #steer .st-poids { display:flex; align-items:center; gap:6px; margin-top:1px; }
    #steer .st-poids input { flex:1; height:12px; }
    #steer .st-poids b { width:30px; font-size:10px; color:#bbc; text-align:right; }
    #steer input[type=range] { accent-color:var(--acc); cursor:pointer; }
    #steer input[type=range]:disabled { opacity:0.3; cursor:not-allowed; }
    #steer .st-pied { display:flex; gap:6px; margin-top:4px; }
    #steer .st-pied button { flex:1; padding:6px 4px; font-size:11px; font-weight:700; border-radius:9px; cursor:pointer;
      border:1px solid rgba(255,255,255,0.25); background:rgba(255,255,255,0.08); color:#fff; }
    #steer .st-pied button:first-child { background:var(--acc); color:#000; border-color:var(--acc); }
    #steer .st-pied button:hover { filter:brightness(1.15); }
  `;
  document.head.appendChild(s);
}

function carte(parent, icone, titre, desc, onClick, petite = false) {
  const c = createDiv();
  c.addClass('carte');
  if (petite) c.addClass('petite');
  createDiv(icone).addClass('ico').parent(c);
  createDiv(titre).addClass('nom').parent(c);
  if (desc) createDiv(desc).addClass('dsc').parent(c);
  c.mousePressed(onClick);
  c.parent(parent);
  return c;
}

function creerLigneMenu(parent, labelTexte, elementDOM) {
  const ligne = createDiv();
  ligne.style('display', 'flex');
  ligne.style('justify-content', 'space-between');
  ligne.style('align-items', 'center');
  ligne.style('margin-bottom', '10px');
  ligne.style('font-size', '14px');
  ligne.parent(parent);
  createSpan(labelTexte).parent(ligne);
  elementDOM.style('padding', '6px');
  elementDOM.style('border-radius', '8px');
  elementDOM.style('border', '1px solid #555');
  elementDOM.style('background', '#111');
  elementDOM.style('color', '#fff');
  elementDOM.parent(ligne);
  return ligne;
}

function creerInterfaceMenu() {
  const vieux = document.getElementById('menu-ui');
  if (vieux) vieux.remove();

  uiContainer = createDiv();
  uiContainer.id('menu-ui');
  uiContainer.style('position', 'absolute');
  uiContainer.style('top', '50%');
  uiContainer.style('left', '50%');
  uiContainer.style('transform', 'translate(-50%, -50%)');
  uiContainer.style('text-align', 'center');
  uiContainer.style('background', 'rgba(12, 12, 28, 0.82)');
  uiContainer.style('backdrop-filter', 'blur(14px)');
  uiContainer.style('padding', '30px');
  uiContainer.style('border-radius', '22px');
  uiContainer.style('border', '2px solid var(--acc)');
  uiContainer.style('box-shadow', '0 0 45px rgba(0,255,204,0.25)');
  uiContainer.style('width', '560px');
  uiContainer.style('max-height', '92vh');
  uiContainer.style('overflow-y', 'auto');
  uiContainer.style('box-sizing', 'border-box');

  createElement('h1', 'SNAKE GAME 🐍').parent(uiContainer);

  // ----- étape 1 : mode -----
  etape1 = createDiv().parent(uiContainer);
  createP('Choisis ton mode de jeu').addClass('sous').parent(etape1);
  const grille = createDiv().addClass('grille').parent(etape1);
  Object.keys(MODES).forEach(k => {
    carte(grille, MODES[k].icone, MODES[k].nom, MODES[k].desc, () => {
      modeChoisiMenu = k;
      niveauChoisiMenu = 1;
      allerEtape2();
    });
  });

  btnBoutique = createButton('');
  btnBoutique.addClass('btn-shop');
  btnBoutique.parent(etape1);
  btnBoutique.mousePressed(allerEtape3);

  // ----- étape 2 : thème / niveau / serpent -----
  etape2 = createDiv().parent(uiContainer);
  const btnRetour = createButton('← Modes').addClass('retour').parent(etape2);
  btnRetour.mousePressed(afficherMenu);
  titreEtape2 = createP('').addClass('sous').parent(etape2);

  createDiv('THÈME').addClass('lab').parent(etape2);
  const gThemes = createDiv().addClass('grille4').parent(etape2);
  Object.keys(THEMES).forEach(k => {
    cartesThemes[k] = carte(gThemes, THEMES[k].icone, k, '', () => choisirTheme(k), true);
  });

  createDiv('NIVEAU').addClass('lab').parent(etape2);
  divNiveaux = createDiv().addClass('rang').parent(etape2);

  createDiv('CONTRÔLE').addClass('lab').parent(etape2);
  const gControle = createDiv().addClass('grille3').parent(etape2);
  [['souris', '🖱️', 'Souris'], ['doigts', '✋', 'Main & doigts'], ['voix', '🎤', 'Voix']].forEach(([k, ico, nom]) => {
    cartesControle[k] = carte(gControle, ico, nom, '', () => choisirControle(k), true);
  });
  ligneCamera = creerLigneMenu(etape2, 'Caméra :', selectCamera = createSelect());
  ligneCamera.style('display', 'none');
  selectCamera.style('max-width', '300px');
  selectCamera.changed(() => demarrerMain(selectCamera.value()));
  barreMic = createDiv('').parent(etape2);
  barreMic.elt.style.cssText = 'display:none;height:6px;border-radius:3px;background:rgba(255,255,255,0.15);margin:0 0 8px 0;overflow:hidden;';
  barreMicInner = createDiv('').parent(barreMic);
  barreMicInner.elt.style.cssText = 'height:100%;width:0%;background:var(--acc);';
  divStatut = createDiv('').addClass('statut').parent(etape2);

  createDiv('SERPENT').addClass('lab').parent(etape2);
  creerLigneMenu(etape2, 'Modèle :', selectModeleSerpent = createSelect());
  Object.keys(MODELES).forEach(m => selectModeleSerpent.option(m)); // filtré par majSelectsPossedes()
  creerLigneMenu(etape2, 'Skin :', selectSkin = createSelect());
  ['Naturel', 'Arc-en-ciel', 'Custom Couleur', 'Néon Cyber', 'Feu & Lave', 'Océan Profond'].forEach(s => selectSkin.option(s));
  ligneTexte = creerLigneMenu(etape2, 'Texte cible :', champTexte = createInput('SNAKE'));
  champTexte.style('width', '110px');
  creerLigneMenu(etape2, 'Couleur (texte / custom) :', colorPickerTexte = createColorPicker('#00ffcc'));
  colorPickerTexte.style('border', 'none').style('cursor', 'pointer').style('background', 'transparent');

  btnJouer = createButton('DÉCOLLAGE 🚀');
  btnJouer.style('background', 'linear-gradient(45deg, var(--acc), #0077ff)');
  btnJouer.style('color', '#000');
  btnJouer.style('border', 'none');
  btnJouer.style('padding', '14px 44px');
  btnJouer.style('font-size', '16px');
  btnJouer.style('font-weight', 'bold');
  btnJouer.style('border-radius', '30px');
  btnJouer.style('cursor', 'pointer');
  btnJouer.style('margin-top', '10px');
  btnJouer.style('box-shadow', '0 0 15px var(--acc)');
  btnJouer.parent(etape2);
  btnJouer.mousePressed(() => {
    userStartAudio();
    modeCourant = modeChoisiMenu;
    niveauCourant = niveauChoisiMenu;
    uiContainer.hide();
    lancerCompteARebours();
  });

  creerBoutique();
  majSelectsPossedes();
  choisirTheme(themeCourant);
  choisirControle('souris');
  afficherMenu();
}

function afficherMenu() {
  arreterDemo();
  gameState = 'MENU';
  menuEtape = 1;
  apercu = null;
  uiContainer.show();
  etape1.show();
  etape2.hide();
  if (etape3) etape3.hide();
  if (btnBoutique) btnBoutique.html(`🛒 Boutique des serpents &nbsp;·&nbsp; ${pieces()} 🪙`);
  if (panneauComportements) panneauComportements.hide();
}

function allerEtape2() {
  menuEtape = 2;
  apercu = null;
  if (etape3) etape3.hide();
  etape1.hide();
  etape2.show();
  titreEtape2.html(`${MODES[modeChoisiMenu].icone} ${MODES[modeChoisiMenu].nom} — personnalise ta partie`);
  ligneTexte.style('display', modeChoisiMenu === 'TEXTE' ? 'flex' : 'none');
  rafraichirNiveaux();
}

// ---------- boutique : acheter et équiper modèles et skins avec les pièces gagnées ----------

function majSelectsPossedes() {
  [['modeles', selectModeleSerpent], ['skins', selectSkin]].forEach(([type, sel]) => {
    const courant = sel.value();
    sel.elt.innerHTML = '';
    Object.keys(CATALOGUE[type]).filter(n => possede(type, n)).forEach(n => sel.option(n));
    if (possede(type, courant)) sel.selected(courant);
  });
}

function creerBoutique() {
  etape3 = createDiv().parent(uiContainer);
  createButton('← Modes').addClass('retour').parent(etape3).mousePressed(afficherMenu);
  labelShop = createP('').addClass('sous').parent(etape3);
  createDiv('SERPENTS').addClass('lab').parent(etape3);
  divShopModeles = createDiv().addClass('grille3').parent(etape3);
  createDiv('SKINS').addClass('lab').parent(etape3);
  divShopSkins = createDiv().addClass('grille3').parent(etape3);
  msgShop = createDiv('').addClass('statut').parent(etape3);
  btnAchat = createButton('').addClass('btn-shop').parent(etape3);
  btnAchat.mousePressed(actionBoutique);
}

function allerEtape3() {
  menuEtape = 3;
  etape1.hide();
  etape2.hide();
  etape3.show();
  shopSel = { type: 'modeles', nom: selectModeleSerpent.value() };
  apercu = null;
  rafraichirBoutique();
}

function equipe(type, nom) {
  return (type === 'modeles' ? selectModeleSerpent.value() : selectSkin.value()) === nom;
}

function rafraichirBoutique() {
  labelShop.html(`🪙 ${pieces()} pièces — gagne-en en jouant, puis débloque de nouveaux serpents`);
  [['modeles', divShopModeles], ['skins', divShopSkins]].forEach(([type, conteneur]) => {
    conteneur.html('');
    Object.keys(CATALOGUE[type]).forEach(nom => {
      const prix = CATALOGUE[type][nom];
      const a = possede(type, nom);
      const statut = equipe(type, nom) ? '✔ Équipé' : a ? 'Possédé' : `🪙 ${prix}`;
      const c = carte(conteneur, ICONES_BOUTIQUE[nom], nom, statut, () => {
        shopSel = { type, nom };
        msgShop.html('');
        apercu = type === 'modeles' ? { modele: nom, skin: selectSkin.value() } : { modele: selectModeleSerpent.value(), skin: nom };
        rafraichirBoutique();
      }, true);
      if (!a) c.style('opacity', '0.7');
      if (shopSel.type === type && shopSel.nom === nom) c.addClass('sel');
    });
  });
  const { type, nom } = shopSel;
  if (!nom) { btnAchat.html('Choisis un serpent'); return; }
  if (equipe(type, nom)) btnAchat.html('✔ Équipé');
  else if (possede(type, nom)) btnAchat.html('ÉQUIPER');
  else btnAchat.html(`ACHETER · 🪙 ${CATALOGUE[type][nom]}`);
}

function actionBoutique() {
  const { type, nom } = shopSel;
  if (!nom || equipe(type, nom)) return;
  if (!possede(type, nom)) {
    if (!acheter(type, nom)) {
      msgShop.html(`Il te manque ${CATALOGUE[type][nom] - pieces()} 🪙 : joue pour en gagner !`);
      return;
    }
    majSelectsPossedes();
    msgShop.html(`🎉 ${nom} débloqué !`);
  } else {
    msgShop.html(`${nom} équipé.`);
  }
  (type === 'modeles' ? selectModeleSerpent : selectSkin).selected(nom);
  apercu = null;
  rafraichirBoutique();
}

function choisirTheme(k) {
  themeCourant = k;
  initialiserDecor();
  for (const t in cartesThemes) {
    if (t === k) cartesThemes[t].addClass('sel'); else cartesThemes[t].removeClass('sel');
  }
  uiContainer.elt.style.setProperty('--acc', THEMES[k].accent);
  uiContainer.style('box-shadow', `0 0 45px ${THEMES[k].accent}55`);
  if (panneauComportements) rafraichirBoutons();
}

function rafraichirNiveaux() {
  divNiveaux.html('');
  const debloque = progression(modeChoisiMenu);
  for (let n = 1; n <= NB_NIVEAUX; n++) {
    const verrou = n > debloque;
    const p = createDiv(verrou ? `🔒 ${n}` : `Niv ${n}`).addClass('puce').parent(divNiveaux);
    if (verrou) p.addClass('lock');
    if (n === niveauChoisiMenu) p.addClass('sel');
    p.mousePressed(() => {
      if (verrou) return;
      niveauChoisiMenu = n;
      rafraichirNiveaux();
    });
  }
}

// Aperçu animé du serpent choisi (menu étape 2 et boutique) : occupe l'espace libre à droite du menu
function dessinerApercuMenu() {
  if (menuEtape !== 2 && menuEtape !== 3) return;
  const libre = (width - 560) / 2 - 20;
  if (libre < 170) return;
  const k = min(1.5, libre / 230);
  const cx = width / 2 + 280 + (width - 560) / 4;
  const cy = height / 2 - 20;
  const R = 120 * k / 1.5 * 1.0, n = 24, esp = 20 * k / 1.5;
  const th = frameCount * 0.02;
  const segs = [];
  for (let i = 0; i < n; i++) {
    const an = th - (i * esp) / R;
    segs.push({ pos: createVector(cx + cos(an) * R, cy + sin(an) * R * 0.8 + sin(an * 5) * 10 * k / 1.5) });
  }
  const modele = apercu ? apercu.modele : selectModeleSerpent.value();
  const skin = apercu ? apercu.skin : selectSkin.value();
  dessinerSerpentReel(segs, { skin, custom: colorPickerTexte.value(), modele, gagnant: false, bouclier: false, clignote: false, echelle: k });
  push();
  textAlign(CENTER, TOP);
  textFont('sans-serif');
  fill(THEMES[themeCourant].accent);
  textSize(20);
  textStyle(BOLD);
  text(modele, cx, cy + R + 60);
  fill(200);
  textSize(14);
  textStyle(NORMAL);
  text(MODELES[modele], cx - libre / 2 + 10, cy + R + 92, libre - 20);
  pop();
}

// =====================================================
// PANNEAU « STEERING » : boutons ON/OFF + curseur de poids par comportement
// =====================================================

function creerPanneauComportements() {
  panneauComportements = createDiv();
  panneauComportements.id('steer');

  panneauEntete = createDiv('');
  panneauEntete.addClass('st-entete');
  panneauEntete.parent(panneauComportements);
  panneauEntete.mousePressed(basculerPanneau);

  panneauListe = createDiv('');
  panneauListe.addClass('st-liste');
  panneauListe.parent(panneauComportements);

  // vitesse du serpent
  const rv = document.createElement('div');
  rv.className = 'st-vitesse';
  rv.innerHTML = '<span>🐍 Vitesse</span><input type="range" min="6" max="20" step="1" value="' + vitesseBase + '"><b></b>';
  const sv = rv.querySelector('input');
  const bv = rv.querySelector('b');
  bv.textContent = vitesseBase;
  sv.addEventListener('input', () => { vitesseBase = parseInt(sv.value); bv.textContent = vitesseBase; });
  sv.addEventListener('change', () => sv.blur());
  panneauListe.elt.appendChild(rv);

  defsComportements.forEach(([cle, label, desc, couleur, touche, aPoids]) => {
    const ligne = document.createElement('div');
    ligne.className = 'st-ligne';
    ligne.style.setProperty('--c', couleur);
    ligne.title = desc;
    const btn = document.createElement('button');
    btn.className = 'st-btn';
    btn.addEventListener('click', () => basculerComportement(cle));
    ligne.appendChild(btn);
    let curseur = null, valeur = null;
    if (aPoids) {
      const w = document.createElement('div');
      w.className = 'st-poids';
      curseur = document.createElement('input');
      curseur.type = 'range';
      curseur.min = 0; curseur.max = 3; curseur.step = 0.1; curseur.value = poids[cle];
      valeur = document.createElement('b');
      valeur.textContent = '×' + poids[cle].toFixed(1);
      curseur.addEventListener('input', () => {
        poids[cle] = parseFloat(curseur.value);
        valeur.textContent = '×' + poids[cle].toFixed(1);
      });
      curseur.addEventListener('change', () => curseur.blur());
      curseur.title = 'Poids de la force (×1 = réglage d\'origine)';
      w.appendChild(curseur);
      w.appendChild(valeur);
      ligne.appendChild(w);
    }
    panneauListe.elt.appendChild(ligne);
    boutonsComportements[cle] = { bouton: btn, ligne, curseur, valeur, label, touche, couleur };
  });

  const pied = document.createElement('div');
  pied.className = 'st-pied';
  const bDemo = document.createElement('button');
  bDemo.id = 'st-demo';
  bDemo.addEventListener('click', basculerDemo);
  const bReset = document.createElement('button');
  bReset.textContent = '↺ Réinitialiser';
  bReset.addEventListener('click', reinitialiserComportements);
  pied.appendChild(bDemo);
  pied.appendChild(bReset);
  panneauListe.elt.appendChild(pied);

  rafraichirBoutons();
  basculerPanneau(true); // ouvert par défaut : les boutons sont visibles dès le début
  panneauComportements.hide();
}

// Ouvre / ferme la liste des comportements (clic sur le titre ou touche H)
function basculerPanneau(ouvrir) {
  const ouvert = typeof ouvrir === 'boolean' ? ouvrir : panneauListe.elt.style.display === 'none';
  panneauListe.elt.style.display = ouvert ? 'flex' : 'none';
  panneauEntete.html(`<span>${ouvert ? '▾' : '▸'} ⚙ STEERING</span><kbd>H</kbd>`);
}

function basculerComportement(cle) {
  comportements[cle] = !comportements[cle];
  const d = defsComportements.find(c => c[0] === cle);
  afficherToast(`${d[1]} : ${comportements[cle] ? 'ON' : 'OFF'}`, d[3]);
  rafraichirBoutons();
}

function reinitialiserComportements() {
  Object.assign(comportements, {
    souris: true, wander: false, separation: true, evitement: true, fuite: false,
    poursuite: false, predateurs: true, flocking: true, limites: true, escorte: true, debug: false
  });
  for (const k in poids) poids[k] = 1;
  rafraichirBoutons();
  afficherToast('Réglages d\'origine rétablis', '#ffffff');
}

function rafraichirBoutons() {
  const acc = THEMES[themeCourant].accent;
  if (panneauComportements) panneauComportements.elt.style.setProperty('--acc', acc);
  for (const cle in boutonsComportements) {
    const b = boutonsComportements[cle];
    const actif = comportements[cle];
    b.bouton.innerHTML = `<kbd>${b.touche.toUpperCase()}</kbd><span class="nom">${b.label}</span><span class="etat">${actif ? 'ON' : 'OFF'}</span>`;
    b.ligne.classList.toggle('on', actif);
    if (b.curseur) {
      b.curseur.value = poids[cle];
      b.valeur.textContent = '×' + poids[cle].toFixed(1);
      b.curseur.disabled = !actif;
    }
  }
  const bd = document.getElementById('st-demo');
  if (bd) bd.textContent = demo.actif ? '■ Arrêter la démo [P]' : '▶ Démo guidée [P]';
}

// =====================================================
// DÉMO GUIDÉE : active / désactive les comportements un par un avec une légende
// =====================================================

const ETAPES_DEMO = [
  { titre: 'DEBUG : chaque force du serpent est dessinée (une couleur par comportement)', set: { debug: true }, duree: 5000 },
  { titre: 'AVOID OFF : le serpent fonce dans les obstacles', set: { evitement: false }, duree: 4500 },
  { titre: 'AVOID ON : il les contourne (3 capteurs devant lui)', set: { evitement: true }, duree: 4500 },
  { titre: 'PURSUE : les obstacles prédisent ta trajectoire et te chassent', set: { poursuite: true }, duree: 5000 },
  { titre: 'FLEE : les proies fuient la tête, il faut les coincer', set: { poursuite: false, fuite: true }, duree: 5000 },
  { titre: 'WANDER : errance, mouvement organique et imprévisible', set: { fuite: false, wander: true }, duree: 5000 },
  { titre: 'FLOCKING OFF : les petites créatures se dispersent', set: { wander: false, flocking: false }, duree: 4500 },
  { titre: 'FLOCKING ON : séparation + alignement + cohésion = bancs', set: { flocking: true }, duree: 4500 },
  { titre: 'LEADER FOLLOWING OFF : plus d\'escorte', set: { escorte: false }, duree: 3500 },
  { titre: 'LEADER FOLLOWING ON : les drones suivent en formation', set: { escorte: true }, duree: 4500 },
  { titre: 'BOUNDARIES OFF : les objets traversent les bords (wrap)', set: { limites: false }, duree: 5000 },
  { titre: 'BOUNDARIES ON : murs invisibles', set: { limites: true }, duree: 4000 },
  { titre: 'SÉPARATION OFF : les objets se superposent', set: { separation: false }, duree: 4500 },
  { titre: 'Fin de la démo : réglages rétablis', set: {}, duree: 2500 }
];
let demo = { actif: false, etape: 0, t0: 0, sauve: null };

function basculerDemo() {
  if (demo.actif) arreterDemo(); else demarrerDemo();
}

function demarrerDemo() {
  demo.sauve = Object.assign({}, comportements);
  demo.actif = true;
  demo.etape = -1;
  demo.t0 = millis() - 1e9; // force le passage à l'étape 0
  rafraichirBoutons();
}

function arreterDemo() {
  if (demo.actif && demo.sauve) {
    Object.assign(comportements, demo.sauve);
  }
  demo.actif = false;
  rafraichirBoutons();
}

function majDemo() {
  if (!demo.actif) return;
  const now = millis();
  const courante = ETAPES_DEMO[demo.etape];
  if (!courante || now - demo.t0 > courante.duree) {
    demo.etape++;
    if (demo.etape >= ETAPES_DEMO.length) { arreterDemo(); return; }
    Object.assign(comportements, ETAPES_DEMO[demo.etape].set);
    demo.t0 = now;
    rafraichirBoutons();
  }
  const e = ETAPES_DEMO[demo.etape];
  const th = THEMES[themeCourant];
  push();
  textFont('sans-serif');
  textStyle(BOLD);
  textSize(16);
  const w = min(width - 40, textWidth(e.titre) + 60);
  const x = width / 2 - w / 2, y = height - 86;
  noStroke();
  fill(8, 10, 24, 220);
  rect(x, y, w, 52, 16);
  noFill();
  stroke(th.accent);
  strokeWeight(1.5);
  rect(x, y, w, 52, 16);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  text(e.titre, width / 2, y + 22);
  barre(x + 20, y + 40, w - 40, 4, (now - demo.t0) / e.duree, th.accent);
  fill(th.accent);
  textSize(11);
  textAlign(LEFT, CENTER);
  text(`DÉMO ${demo.etape + 1}/${ETAPES_DEMO.length}`, x + 18, y + 12);
  pop();
}

// =====================================================
// TOAST : petit message qui s'efface quand on bascule un comportement
// =====================================================

let toast = { txt: '', col: '#fff', t: -9999 };
function afficherToast(txt, col) { toast = { txt, col, t: millis() }; }

function dessinerToast() {
  const age = millis() - toast.t;
  if (age > 1800 || gameState === 'MENU') return;
  const a = age > 1300 ? map(age, 1300, 1800, 255, 0) : 255;
  push();
  textFont('sans-serif');
  textStyle(BOLD);
  textSize(16);
  const w = textWidth(toast.txt) + 40;
  const x = width / 2 - w / 2, y = 80;
  drawingContext.globalAlpha = a / 255;
  noStroke();
  fill(8, 10, 24, 230);
  rect(x, y, w, 36, 18);
  fill(toast.col);
  circle(x + 18, y + 18, 9);
  fill(255);
  textAlign(CENTER, CENTER);
  text(toast.txt, width / 2 + 8, y + 19);
  pop();
}

// =====================================================
// HUD / ÉCRANS / DEBUG
// =====================================================

function dessinerHUD() {
  const th = THEMES[themeCourant];
  const m = MODES[modeCourant];
  push();
  textFont('sans-serif');
  noStroke();
  fill(0, 0, 0, 120);
  rect(10, 10, width - 20, 56, 14);
  noFill();
  stroke(th.accent);
  strokeWeight(1);
  rect(10, 10, width - 20, 56, 14);
  noStroke();

  textAlign(LEFT, CENTER);
  fill(th.accent);
  textSize(16);
  textStyle(BOLD);
  text(`${m.icone} ${m.nom.toUpperCase()} · NIV ${niveauCourant} ${th.icone}`, 28, 34);

  textAlign(CENTER, CENTER);
  fill(255);
  textSize(17);
  let ratio = 0;
  switch (modeCourant) {
    case 'TEXTE': {
      const faits = cibles.filter(c => !c.actif).length;
      text(`⏱ ${tempsRestant}s   ·   ${faits}/${cibles.length} points`, width / 2, 32);
      ratio = cibles.length ? faits / cibles.length : 0;
      break;
    }
    case 'ARCADE':
      text(`🎯 ${nourrituresMangees}/${paramsNiv.objectif} ${th.proie.toLowerCase()}   ·   ⏱ ${tempsEcoule}s`, width / 2, 32);
      ratio = nourrituresMangees / paramsNiv.objectif;
      break;
    case 'CIRCUIT':
      text(`🏁 Anneau ${min(anneauSuivant + 1, anneaux.length)}/${anneaux.length}   ·   ⏱ ${tempsRestant}s`, width / 2, 32);
      ratio = anneauSuivant / anneaux.length;
      break;
    case 'DUEL':
      text(`${score}  ⚔  ${scoreJ2}   ·   ⏱ ${tempsRestant}s`, width / 2, 32);
      ratio = tempsRestant / paramsNiv.temps;
      break;
  }
  barre(width / 2 - 160, 50, 320, 6, ratio, th.accent);

  // score + vies
  textAlign(RIGHT, CENTER);
  textSize(17);
  fill(255);
  if (modeCourant !== 'DUEL') {
    const s = `${score} pts`;
    text(s, width - 175, 34);
    if (modeCourant === 'ARCADE' || modeCourant === 'CIRCUIT') {
      fill(255, 70, 90);
      text('♥'.repeat(max(vies, 0)), width - 175 - textWidth(s) - 18, 34);
    }
  }

  // bouton menu
  fill(255, 255, 255, 25);
  rect(width - 150, 20, 130, 36, 10);
  fill(th.accent);
  textAlign(CENTER, CENTER);
  textSize(13);
  text('MENU', width - 85, 38);

  // power-ups actifs
  const now = millis();
  const actifs = [];
  if (effets.aimant > now) actifs.push(['🧲', (effets.aimant - now) / 9000]);
  if (effets.ralenti > now) actifs.push(['❄️', (effets.ralenti - now) / 6000]);
  if (effets.turbo > now) actifs.push(['⚡', (effets.turbo - now) / 5000]);
  if (effets.bouclier) actifs.push(['🛡️', 1]);
  actifs.forEach((a, i) => {
    textAlign(LEFT, CENTER);
    textSize(20);
    fill(255);
    text(a[0], 24, 92 + i * 28);
    barre(54, 88 + i * 28, 90, 8, a[1], th.accent);
  });
  pop();
}

function listeBoutonsFin() {
  const l = [];
  if (victoire && niveauCourant < NB_NIVEAUX) l.push({ txt: 'NIVEAU SUIVANT ▶', act: 'next' });
  l.push({ txt: 'REJOUER', act: 'again' });
  l.push({ txt: 'MENU', act: 'menu' });
  const w = 280, h = 48, g = 14;
  const y0 = height * 0.62;
  return l.map((b, i) => ({ ...b, x: width / 2 - w / 2, y: y0 + i * (h + g), w, h }));
}

function dessinerEcranFin(titre, couleur, ligneScore) {
  const th = THEMES[themeCourant];
  push();
  textFont('sans-serif');
  textAlign(CENTER, CENTER);
  if (titre) {
    fill(couleur);
    textSize(38);
    textStyle(BOLD);
    text(titre, width / 2, height * 0.3);
  }
  fill(couleur);
  textSize(24);
  text(ligneScore, width / 2, height * 0.47);
  if (victoire) {
    fill(255, 215, 0);
    textSize(17);
    text(niveauCourant < NB_NIVEAUX ? `🔓 Niveau ${niveauCourant + 1} débloqué !` : '🏆 Tous les niveaux terminés !', width / 2, height * 0.54);
  }
  fill(255, 215, 0);
  textSize(17);
  text(`+${gainPieces} 🪙   ·   total ${pieces()} 🪙`, width / 2, height * 0.585);
  listeBoutonsFin().forEach(b => {
    const pt = pointeur();
    const survol = pt.x > b.x && pt.x < b.x + b.w && pt.y > b.y && pt.y < b.y + b.h;
    fill(survol ? th.accent : color(20, 20, 40, 235));
    stroke(th.accent);
    strokeWeight(2);
    rect(b.x, b.y, b.w, b.h, 12);
    noStroke();
    fill(survol ? 0 : th.accent);
    textSize(18);
    textStyle(BOLD);
    text(b.txt, b.x + b.w / 2, b.y + b.h / 2);
  });
  pop();
}

function fleche(x, y, dx, dy, col, ep = 3) {
  const l = Math.hypot(dx, dy);
  if (l < 2) return;
  push();
  stroke(col);
  strokeWeight(ep);
  line(x, y, x + dx, y + dy);
  translate(x + dx, y + dy);
  rotate(atan2(dy, dx));
  fill(col);
  noStroke();
  triangle(0, 0, -9, -5, -9, 5);
  pop();
}

function dessinerDebug() {
  push();
  noFill();
  strokeWeight(1.5);
  // vitesse du chef (vert) et de la tête (bleu)
  stroke(0, 255, 0, 200);
  line(leader.pos.x, leader.pos.y, leader.pos.x + leader.vel.x * 8, leader.pos.y + leader.vel.y * 8);
  circle(leader.pos.x, leader.pos.y, 10);
  if (vehicles[0]) {
    const t = vehicles[0];
    stroke(0, 200, 255, 200);
    line(t.pos.x, t.pos.y, t.pos.x + t.vel.x * 5, t.pos.y + t.vel.y * 5);
    if (comportements.fuite) circle(t.pos.x, t.pos.y, 280);
  }
  // une flèche colorée par force appliquée au chef
  const cols = {};
  defsComportements.forEach(d => { cols[d[0]] = d[3]; });
  const utilisees = {};
  if (leader.forces) {
    leader.forces.forEach(({ cle, f }) => {
      fleche(leader.pos.x, leader.pos.y, f.x * 70, f.y * 70, cols[cle]);
      utilisees[cle] = true;
    });
  }
  if (gameState === 'DUEL') {
    stroke(255, 150, 0, 200);
    line(leaderJ2.pos.x, leaderJ2.pos.y, leaderJ2.pos.x + leaderJ2.vel.x * 8, leaderJ2.pos.y + leaderJ2.vel.y * 8);
    if (comportements.evitement) circle(leaderJ2.pos.x, leaderJ2.pos.y, 300);
  }
  obstacles.forEach(o => {
    stroke(255, 80, 80, 180);
    circle(o.pos.x, o.pos.y, o.taille + 56);
    line(o.pos.x, o.pos.y, o.pos.x + o.vel.x * 15, o.pos.y + o.vel.y * 15);
  });
  predateurs.forEach(p => {
    stroke(255, 0, 120, 200);
    line(p.pos.x, p.pos.y, p.pos.x + p.vel.x * 15, p.pos.y + p.vel.y * 15);
    if (vehicles[0]) {
      stroke(255, 0, 120, 60);
      line(p.pos.x, p.pos.y, vehicles[0].pos.x, vehicles[0].pos.y);
    }
  });
  // légende des forces
  const noms = Object.keys(utilisees);
  if (noms.length) {
    textFont('sans-serif');
    textSize(12);
    textStyle(BOLD);
    noStroke();
    const lw = noms.reduce((s, k) => s + textWidth(defsComportements.find(d => d[0] === k)[1]) + 34, 20);
    let x = width / 2 - lw / 2;
    const y = height - 24;
    fill(8, 10, 24, 200);
    rect(x, y - 14, lw, 28, 14);
    x += 14;
    textAlign(LEFT, CENTER);
    noms.forEach(k => {
      const nom = defsComportements.find(d => d[0] === k)[1];
      fill(cols[k]);
      circle(x + 5, y, 10);
      fill(255);
      text(nom, x + 16, y + 1);
      x += textWidth(nom) + 34;
    });
  }
  pop();
}
