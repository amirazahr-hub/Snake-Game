# 🐍 Snake Game — Steering Behaviors

Jeu de serpent en **p5.js** dont **tous les objets sont des `Vehicle`** (classe de Craig Reynolds : position, vitesse, accélération, `maxSpeed`, `maxForce`).
Chaque objet est animé uniquement par des **steering behaviors** : chaque comportement *retourne une force* et on les additionne avec `applyForce()`.
Les comportements peuvent être **activés / désactivés en direct** grâce à des **boutons** (ou au clavier), **dosés avec un curseur de poids**, **visualisés par des flèches colorées** (mode Debug) et **présentés automatiquement par une démo guidée**.

---

## 1. Lancer le jeu

Le jeu doit être servi par un petit serveur local (chargement de la police, caméra et micro exigent `http://127.0.0.1` ou `https`) :

```bash
cd snake_projet
python3 -m http.server 8000
# puis ouvrir http://127.0.0.1:8000 dans Chrome ou Edge
```

Aucune installation : p5.js est fourni dans `libraries/`. Seule la reconnaissance de la main (MediaPipe) est chargée depuis un CDN, et uniquement si on choisit ce contrôle.

---

## 2. Architecture du code

| Fichier | Rôle |
|---|---|
| `vehicle.js` ⭐ | Classe `Vehicle` + **tous les steering behaviors** |
| `entites.js` ⭐ | Les objets du jeu, **tous `extends Vehicle`** : `Snake`, `Food`, `Obstacle`, `Predator`, `Boid`, `PowerUp`, `Anneau`, `Cible` |
| `sketch.js` ⭐ | État global, objet `comportements` (interrupteurs), `setup`/`draw`, pilotage du serpent |
| `jeu.js` | Modes de jeu, niveaux, power-ups, fin de partie |
| `controles.js` / `controles_ui.js` | Contrôle souris / main (MediaPipe) / voix (Web Speech) |
| `ui.js` | Menu, **panneau de boutons des comportements**, HUD, écrans de fin |
| `rendu3d.js` | Lumière, parallaxe, décors en profondeur par thème, vignettage |
| `decors.js`, `serpents.js`, `audio.js` | Dessin des objets, des 6 modèles de serpent, sons synthétisés (pas de steering) |

⭐ = fichiers où se trouve la matière « steering ».

### Le principe

```js
// Exemple (Obstacle) : on additionne des forces pondérées
if (comportements.poursuite && tete) this.applyForce(this.pursue(tete).mult(1.2));
else                                 this.applyForce(this.wander());
if (comportements.separation)        this.applyForce(this.separate(toutes, 90).mult(1.5));
if (comportements.limites)           this.applyForce(this.boundaries(70).mult(2));
this.update();   // acc -> vitesse -> position
```

Un comportement désactivé n'est simplement **plus appelé** : son effet disparaît aussitôt.

---

## 3. Les steering behaviors implémentés (`vehicle.js`)

| Comportement | Ce qu'il fait | Où on le voit dans le jeu |
|---|---|---|
| **seek** | Se dirige à pleine vitesse vers une cible (force = vitesse désirée − vitesse actuelle, limitée à `maxForce`). | Base de `pursue`, `wander`, `cohere` ; aimant sur la nourriture. |
| **flee** | Inverse de seek : s'éloigne d'un point. | Proies et boids qui fuient la tête du serpent. |
| **arrive** | Seek + **freinage progressif** dans un rayon (100 px) : la vitesse désirée décroît jusqu'à 0 à l'approche. | La tête suit la souris/main/voix ; chaque segment du corps suit le précédent à 12 px ; les points du texte et les anneaux reviennent à leur place ; l'IA vise la nourriture. |
| **pursue** | Seek sur la **position future prédite** de la cible (position + vitesse × temps estimé). | Obstacles « chasseurs » et prédateurs poursuivent la tête. |
| **evade** | Inverse de pursue : fuit la position future prédite. | L'IA du duel évite le joueur quand il est à moins de 150 px. |
| **wander** | Errance : un point glisse aléatoirement sur un cercle (rayon 30) placé 60 px devant le véhicule ; on fait seek dessus. | Obstacles, nourriture, boids, power-ups, serpent sans consigne. |
| **separate** | Chaque voisin trop proche génère une force de répulsion inversement proportionnelle à la distance. | Corps du serpent, nourritures, obstacles, prédateurs, boids. |
| **align** | Adopte la direction moyenne des voisins (rayon 70). | Banc de boids (flocking). |
| **cohere** | Seek vers le centre de gravité des voisins (rayon 100). | Banc de boids (flocking). |
| **avoid** | Évitement d'obstacles : trois points de détection devant le véhicule ; si l'un touche un obstacle, force latérale (3 × `maxForce`). | Le serpent du joueur esquive astéroïdes/rochers et prédateurs. |
| **leader following** | (classe `Escorte`) Des drones visent avec `arrive` un point **derrière et à côté** de la tête, s'écartent (`flee`) de la zone devant le chef et se séparent entre eux : formation en V. | Escorte du serpent (Arcade, Circuit, Duel). |
| **boundaries** | Murs invisibles : renvoie le véhicule vers l'intérieur près des bords (force 2 × `maxForce`). | Tous les objets mobiles. Désactivé → **wrap** (téléportation de l'autre côté). |

---

## 4. Panneau « ⚙ STEERING » : boutons, poids, debug, démo

Pendant la partie, un panneau en bas à gauche liste les comportements (infobulle au survol = explication). `H` l'ouvre / le ferme.

Chaque ligne contient :
- un **bouton ON / OFF** (clic ou touche) : un comportement désactivé n'est simplement plus appelé ;
- un **curseur de poids ×0 à ×3** : multiplie la force du comportement (×1 = réglage d'origine). Permet de montrer en direct l'effet de l'intensité (ex. Flee ×3 = proies paniquées, Avoid ×0.3 = évitement mou) ;
- une **couleur** propre, réutilisée par le mode Debug.

En haut : curseur **Vitesse** du serpent. En bas : **▶ Démo guidée** (touche `P`) et **↺ Réinitialiser**.

| Touche | Bouton | Défaut | Quand on l'ACTIVE | Quand on le DÉSACTIVE |
|---|---|---|---|---|
| `1` | **Arrive (contrôle)** | ON | La tête du serpent rejoint la cible (souris / paume / direction vocale) avec `arrive` : elle ralentit en approchant du pointeur. | Plus de guidage : le serpent ralentit et s'arrête (ou erre si Wander est ON). |
| `2` | **Wander** | OFF | Serpent, nourriture, anneaux, cibles et IA ajoutent de l'errance : mouvements organiques, imprévisibles. | Nourriture et cibles s'immobilisent ; obstacles / prédateurs / boids gardent leur errance de base. |
| `3` | **Séparation** | ON | Les corps ne se superposent plus : segments, nourritures, obstacles, prédateurs, boids, drones se repoussent. | Les objets se chevauchent et s'empilent. |
| `4` | **Avoid / Evade** | ON | Le serpent **contourne** astéroïdes et prédateurs (Arcade, Circuit) ; l'IA du Duel **fuit** le joueur (`evade`). | Le serpent fonce dessus et perd des vies ; l'IA ignore le joueur. |
| `5` | **Flee (proies)** | OFF | La nourriture **fuit** la tête (< 140 px, vitesse ×3) ; les points du texte fuient à < 100 px ; les boids s'enfuient. | Les proies restent passives. |
| `6` | **Pursue (obstacles)** | OFF | Les obstacles deviennent des **chasseurs** : ils prédisent ta trajectoire. | Les obstacles errent au hasard. |
| `7` | **Pursue (prédateurs)** | ON | Les prédateurs te **traquent** en anticipant ta position future. | Les prédateurs errent, inoffensifs. |
| `8` | **Flocking (banc)** | ON | Les boids forment des bancs : séparation + alignement + cohésion. | Chaque boid erre seul. |
| `9` | **Boundaries** | ON | Murs invisibles : tous les objets restent à l'écran. | Les objets traversent un bord et réapparaissent de l'autre côté (wrap). |
| `0` | **Leader following** | ON | 4 drones suivent la tête en formation. | Les drones disparaissent. |
| `B` | **Debug** | OFF | Voir ci-dessous. | Affichage normal. |

### Mode Debug (`B`)
- **Une flèche colorée par force** appliquée à la tête du serpent (cyan = arrive, rouge = avoid, bleu = boundaries, jaune = wander…) avec une **légende** en bas de l'écran : on voit la somme de forces se construire.
- Vecteurs vitesse, cercles de sécurité autour des obstacles, cercle + point de `wander`, capteurs d'`avoid`, ligne de poursuite des prédateurs.

### Démo guidée (`P`)
Séquence automatique de 14 étapes (≈ 1 min) : active / désactive un comportement à la fois avec une **légende à l'écran** et une barre de progression, puis rétablit tes réglages. Idéale pour présenter au professeur : Debug → Avoid OFF/ON → Pursue → Flee → Wander → Flocking OFF/ON → Leader following OFF/ON → Boundaries OFF/ON → Séparation OFF.

Un petit message (toast) confirme chaque bascule en haut de l'écran.

## 5. Qui utilise quels comportements (tous des `Vehicle`)

| Objet (classe) | Rôle | Comportements combinés (poids) |
|---|---|---|
| **Tête du serpent** (`Vehicle` *leader*) | Guidée par le joueur | `arrive` vers la cible · `wander` (×0.6, ou en autonomie si aucune consigne) · `avoid` (×2) · `boundaries` (×1.5) |
| **Drone d'escorte** (`Escorte`) | Suiveurs du serpent | `arrive` vers un point derrière / à côté du chef · `flee` de la zone devant lui · `separate` (×1.5) |
| **Corps du serpent** (`Snake`) | Segments en chaîne | Segment 0 : `arrive` vers la tête ; segment *i* : `arrive` vers le segment *i-1* (espacement 12 px) · `separate` (×0.8) |
| **Nourriture** (`Food`) | Proie à manger | `wander` (×0.8) · `flee` (×3) · `seek` si aimant (×2) · `separate` (×1.2) · `boundaries` (×1.5) |
| **Obstacle** (`Obstacle`) | Astéroïde / rocher / oursin / roche de lave | `pursue` (×1.2) ou `wander` · `separate` (×1.5) · `boundaries` (×2) |
| **Prédateur** (`Predator`) | Chasseur | `pursue` ou `wander` · `separate` (×1.5) · `boundaries` (×1.5) |
| **Boid** (`Boid`) | Banc de créatures d'ambiance (poissons, lucioles…) | `separate` (×1.6) + `align` + `cohere` (×0.8) · `wander` (×0.5) · `flee` (×3) devant le serpent · `boundaries` |
| **Power-up** (`PowerUp`) | Bonus flottants | `wander` · `boundaries` (×2) |
| **Anneau** (`Anneau`) | Porte du mode Circuit | `arrive` vers sa position d'origine · `wander` (×0.5) |
| **Point du texte** (`Cible`) | Pixel du mot (mode Texte) | `arrive` vers sa place · `wander` (×0.4) · `seek` si aimant (×2.5) · `flee` (×4) |
| **Serpent IA** (Duel) | Adversaire | `arrive` vers la nourriture la plus proche · `evade` (×2) du joueur · `wander` (×0.5) · `boundaries` · corps comme le joueur |

**Détails de comportement dynamique** : la nourriture accélère quand elle fuit (vitesse max 6.5) ou est attirée ; les boids s'affolent devant le serpent (vitesse 3 → 5.5) ; les obstacles et prédateurs sont ralentis (×0.35) par le power-up Ralenti.

---

## 6. Modes de jeu

Le menu se fait en deux étapes : **mode**, puis **thème / niveau / contrôle / serpent**. Chaque mode a **5 niveaux** à débloquer (progression sauvegardée dans le navigateur).

| Mode | Objectif | Steering mis en jeu |
|---|---|---|
| 🔤 **Texte / Grille** | Attraper tous les points d'un mot que tu écris (défaut « SNAKE ») avant la fin du temps (38 − 4×niveau s, min 14 s). Chaque point = +10 et le serpent grandit. | Points = `arrive` + `wander` + `flee` ; bien visible avec le bouton 5. |
| 🚀 **Arcade** | Manger N nourritures (4 + 3×niveau) en évitant obstacles et prédateurs, 3 vies. Les boids se mangent pour +5. Nourriture = +30. | `avoid`, `pursue`, `wander`, `flee`, `separate`, flocking. Prédateurs dès le niveau 3. |
| 🏁 **Circuit** | Franchir dans l'ordre 4 + niveau anneaux (le dernier est l'arrivée 🏁, +100 chacun) avant la fin du temps (80 − 6×niveau s). | `arrive` (anneaux), `avoid`, `pursue`. Une flèche dorée guide vers l'anneau suivant. |
| 👑 **Duel** | Contre une IA pendant 30 s : le meilleur score gagne la couronne. Vitesse de l'IA qui augmente avec le niveau. | `arrive` + `evade` + `wander` côté IA ; la nourriture peut fuir les deux serpents. |

**Fin de partie** : le serpent explose puis ses segments se réorganisent avec `arrive` pour écrire « GAME OVER », « WINNER » ou « CHAMPION » (vrai effet steering !). Boutons : Niveau suivant / Rejouer / Menu.

### Power-ups (ramassés avec la tête)

| Icône | Effet | Durée |
|---|---|---|
| 🧲 Aimant | La nourriture et les points du texte sont attirés vers la tête (`seek`) | 9 s |
| 🛡️ Bouclier | Absorbe le prochain choc | jusqu'au choc |
| ❄️ Ralenti | Obstacles et prédateurs à 35 % de leur vitesse | 6 s |
| ⚡ Turbo | Vitesse du serpent portée de 12 à 18 | 5 s |

---

## 7. Contrôles du serpent

| Contrôle | Fonctionnement |
|---|---|
| 🖱️ **Souris** | Le serpent suit le curseur (`arrive`). |
| ✋ **Main & doigts** (webcam, MediaPipe Hands) | La paume guide le serpent · 🤏 pincer pouce + index = **turbo** · ✊ poing = **frein** · pincer sur un bouton d'écran de fin = clic. Si la main sort de l'image, le serpent avance seul (wander). |
| 🎤 **Voix** (Chrome / Edge) | « haut », « bas », « gauche », « droite » (deux mots = diagonale), « stop », « centre », « turbo », « lent » ; sur l'écran de fin : « rejouer », « suivant », « menu ». Secours : flèches ou Z Q S D. |

Dans tous les cas le serpent n'est jamais bloqué : seule la façon de produire la cible change.

### Raccourcis clavier en jeu
`1`–`9`, `0`, `B` : basculer un comportement · `P` : démo guidée · `H` : ouvrir/fermer le panneau · `Échap` : retour au menu.

---

## 8. Rendu visuel « pseudo-3D » et personnalisation

Le jeu est dessiné en 2D (canvas) mais avec les techniques de la 3D (`rendu3d.js`) :
- **Lumière unique** (en haut à gauche) : sphères et rochers éclairés avec dégradés, terminateur d'ombre, reflet spéculaire et lumière de contour ; ombres portées douces au sol.
- **Profondeur et parallaxe** : le décor est découpé en plans (planètes lointaines, collines, canopée, coraux…) qui bougent à des vitesses différentes quand le serpent se déplace, comme une caméra.
- **Halos additifs, brume, vignettage** pour l'ambiance.
- **Serpents volumétriques** : chaque segment est dessiné en 6 couches (ombre, contour, corps sombre, corps, bande éclairée, reflet) décalées vers la lumière, plus écailles, lumière de contour et ombre portée qui flotte au-dessus du sol.

**5 thèmes** (décor, obstacles, proies et prédateurs propres) :
| Thème | Ambiance |
|---|---|
| 🌌 Espace | Planète à anneaux, lune en orbite, étoile filante, nébuleuses |
| 🌴 Jungle | Rais de lumière, 3 plans de canopée dans la brume, lucioles |
| 🌊 Océan | Caustiques de surface, baleine lointaine, récifs en profondeur, coraux lumineux |
| 🌋 Volcan | Ciel de cendres, crêtes avec coulées de lave, fumée, braises |
| 🕹️ Néon | Soleil rétro à bandes, montagnes fil de fer, **grille en perspective** |

**6 modèles de serpent** : Python Géant, Cobra Royal, Dragon Électrique, Crotale, **Cyber Mécha** (robot : plaques, joints néon qui pulsent, visière rouge) et **Cristal** (verre facetté, éclats scintillants).

**6 skins** : Naturel, Arc-en-ciel, Custom Couleur, Néon Cyber, Feu & Lave, Océan Profond. Texte cible et couleur configurables.

---

## 9. Pièces, collection et boutique 🛒

- À la fin de chaque partie tu gagnes des **pièces 🪙** : `score ÷ 8` (max 150) + un **bonus de victoire** (20 + 10 × niveau, ou 5 si tu perds).
- Dans le menu, la **Boutique des serpents** permet d'acheter avec ces pièces de nouveaux **modèles** et **skins**, de les prévisualiser en animation, puis de les **équiper**.
- Au départ tu possèdes : Python Géant, Crotale, skins Naturel et Custom Couleur.

| Modèles | Prix | Skins | Prix |
|---|---|---|---|
| Cobra Royal | 150 🪙 | Arc-en-ciel | 120 🪙 |
| Dragon Électrique | 400 🪙 | Feu & Lave | 200 🪙 |
| Cyber Mécha | 600 🪙 | Océan Profond | 200 🪙 |
| Cristal | 900 🪙 | Néon Cyber | 250 🪙 |

La collection est sauvegardée dans le navigateur (`localStorage`). Seuls les serpents possédés apparaissent dans les listes du menu.

**Fluidité** : le serpent est plafonné à 34 segments (en mode Texte, il grandit d'un segment tous les 4 points) et sa tête réagit plus vite au curseur (force et vitesse de rattrapage augmentées) pour limiter le décalage.

---

## 10. Scénario de démonstration conseillé (pour la présentation)

1. Lancer **Arcade, thème Espace**, appuyer sur **`P`** : la démo guidée présente tous les comportements toute seule, avec légende.
2. Ou en manuel : **`B`** (Debug) pour montrer les forces colorées, puis désactiver **Avoid (4)** : le serpent percute les astéroïdes.
3. **Pursue (6)** : les astéroïdes te chassent. **Flee (5)** : les cristaux fuient.
4. Jouer avec les **curseurs de poids** (ex. Flee ×3, Avoid ×0.2) pour montrer l'effet de l'intensité.
5. **Flocking (8)** OFF/ON, **Leader following (0)** OFF/ON, **Boundaries (9)** OFF/ON.
6. Mode **Texte** : un mot formé de véhicules qui reviennent à leur place (`arrive`) ; **Flee (5)** les fait s'enfuir.
7. Perdre volontairement : « GAME OVER » est écrit par les segments du serpent (`arrive`).
