# Vinga! — Le catalan, poc a poc 🧡

Application mobile pour apprendre le **catalan depuis le français**. Objectif : comprendre et tenir
les conversations du quotidien — au restaurant, au marché, compter, demander son chemin.

| Onboarding | La ruta | Découverte | Conversa | Fin de leçon |
| --- | --- | --- | --- | --- |
| ![Onboarding](docs/onboarding.png) | ![Accueil](docs/home.png) | ![Découverte](docs/discover.png) | ![Dialogue](docs/dialogue.png) | ![Fin de leçon](docs/complete.png) |

## Le concept : la progression devient une œuvre

Pas de barre de progression ni de flamme culpabilisante : chaque leçon terminée pose des
**tessel·les sur une mosaïque trencadís 3D** (hommage à Gaudí) que l'on reconstruit en apprenant.
La sphère, rendue en WebGL, se remplit tuile par tuile — on peut la faire tourner du doigt.

## L'expérience

- **La ruta** — un chemin sinueux à travers 5 modules : `Hola!` (saluer), `Els nombres` (compter),
  `Al restaurant`, `Al mercat` (les courses), `Pel carrer` (le chemin). 20 leçons, ~120 mots.
- **5 types d'exercices** — découverte (carte-arche), QCM dans les deux sens, écoute (synthèse
  vocale catalane), paires, construction de phrases. Les erreurs sont recyclées en fin de leçon,
  sans système de vies punitif.
- **Converses** — chaque module se termine par un dialogue simulé (serveur, marchande, passant) :
  le PNJ parle (audio + traduction), on répond en choisissant de vraies répliques. C'est
  l'entraînement direct de l'objectif : tenir une conversation.
- **Repàs** — répétition espacée légère : les mots appris reviennent à échéance (10 min → 1 j → ×2,5).
- **Phonétique pour francophones** — chaque mot est accompagné d'une prononciation lisible
  (`Gràcies` → « GRA-si-euss »), la syllabe accentuée en capitales.
- **Gamification douce** — XP, objectif quotidien, série de jours (ratxa), jalons (fites),
  anecdotes culturelles « Ho sabies? » en fin de leçon.

## Design

- **Direction artistique méditerranéenne** : crème chaude, terracotta, jaune soleil, bleu mer,
  olive, rose bougainvillier ; arches, céramique, grain de papier.
- **Typographie** : Fraunces (serif expressive, axes SOFT/WONK) pour le catalan et les titres,
  Outfit pour l'interface.
- **Motion** : ressorts framer-motion partout (boutons 3D-press, listes en cascade, transitions
  d'écrans), confettis de tesselles en canvas, bulles de dialogue animées.
- **3D** : sphère trencadís react-three-fiber (chargée en différé), éclat par éclat.
- **Sons** : petits effets synthétisés en Web Audio (aucun asset), haptique sur mobile,
  synthèse vocale `ca-ES` avec repli espagnol et phonétique toujours visible.
- Respect de `prefers-reduced-motion`, cibles tactiles ≥ 44 px, contrastes AA.

## Lancer

```bash
cd vinga
npm install
npm run dev        # http://localhost:5173
```

Build de production : `npm run build` puis `npm run preview`.

C'est une **PWA installable** : ouverte sur un téléphone, « Ajouter à l'écran d'accueil » l'installe
en plein écran (manifeste + icônes fournis). Le même code peut être empaqueté en app iOS/Android
native via Capacitor.

## Vérification

`node scripts/shots.mjs` pilote l'app dans un Chromium headless (390×844) : il déroule
l'onboarding, joue une leçon complète en résolvant réellement chaque exercice, mène un dialogue,
et capture chaque écran. Sert à la fois de test de fumée et de générateur de captures.

## Structure

```
src/
  data/        contenu pédagogique (modules, mots, dialogues) + générateur d'exercices
  lib/         synthèse vocale, sons/haptique, répétition espacée
  components/  icônes, emblèmes-céramique, sphère 3D, confettis, barre d'onglets
  screens/     onboarding, ruta, leçon (5 exercices + dialogues), repàs, profil
  store.ts     progression persistée (XP, ratxa, SRS, leçons) — zustand
```

## Pistes suivantes

- Enregistrements audio natifs (voix catalane réelle) et reconnaissance vocale pour la prononciation
- Nouvelles œuvres à reconstruire (le drac de Gaudí…) après la sphère
- Modules A2 : le temps, la famille, la plage ; notifications de rappel ; builds Capacitor
