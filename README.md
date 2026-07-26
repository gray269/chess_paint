# Chess Paint

Version actuelle : **0.4.0**

**Chess Paint** transforme une partie d’échecs au format PGN en peinture procédurale.

- Stockfish analyse chaque position directement dans le navigateur.
- Les coups sont classés : brillant, meilleur, excellent, bon, imprécision, erreur ou gaffe.
- Un niveau indicatif est calculé pour chaque joueur.
- Les échecs, captures, roques, promotions et sacrifices potentiels influencent la peinture.
- Aucune IA générative ne produit l’image : le dessin vient uniquement d’un algorithme Canvas.
- Le PGN et les résultats ne sont envoyés vers aucun serveur.
- L’application peut être installée sur Android ou iPhone comme une PWA.

> L’estimation Elo et les catégories de coups sont expérimentales. Elles ne reproduisent pas exactement Chess.com ou Lichess.

## Mise en ligne sur GitHub

### 1. Créer le dépôt

1. Sur GitHub, crée un nouveau dépôt, par exemple `chess-paint`.
2. Décompresse le fichier ZIP de ce projet.
3. Envoie **tout le contenu du dossier** dans le dépôt, y compris le dossier `.github`.
4. Vérifie que la branche principale s’appelle `main`.

Tu peux aussi utiliser GitHub Desktop :

```bash
git init
git add .
git commit -m "Première version de Chess Paint"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/chess-paint.git
git push -u origin main
```

### 2. Activer GitHub Pages

1. Ouvre ton dépôt GitHub.
2. Va dans **Settings → Pages**.
3. Dans **Build and deployment**, choisis **GitHub Actions** comme source.
4. Ouvre ensuite l’onglet **Actions** du dépôt.
5. Le workflow **Déployer Chess Paint** construit et publie automatiquement l’application.

L’adresse sera de la forme :

```text
https://TON-COMPTE.github.io/chess-paint/
```

Le nom du dépôt est détecté automatiquement : tu n’as pas besoin de modifier `vite.config.js`.

## Installation sur téléphone

### Android avec Chrome

1. Ouvre l’adresse GitHub Pages.
2. Appuie sur le bouton **Installer l’application** lorsqu’il apparaît.
3. Sinon, ouvre le menu ⋮ de Chrome puis **Ajouter à l’écran d’accueil** ou **Installer l’application**.

### iPhone avec Safari

1. Ouvre l’adresse dans Safari.
2. Appuie sur l’icône **Partager**.
3. Choisis **Sur l’écran d’accueil**.

Après une première ouverture complète, le moteur et l’interface sont mis en cache pour une utilisation hors ligne.

## Utilisation

1. Colle directement une partie PGN dans la grande zone, utilise le bouton **Coller le PGN**, ou ouvre un fichier `.pgn`. Les retours à la ligne et espaces multiples du texte des coups sont automatiquement normalisés. La zone ne coupe plus visuellement les lignes : elle défile horizontalement.
2. Vérifie que le cadre vert indique **PGN reconnu — prêt à analyser**. Le bouton d’analyse reste désactivé tant que le texte n’est pas reconnu.
3. Choisis la profondeur :
   - 8 : rapide sur téléphone ;
   - 10 : bon compromis ;
   - 12 : plus précis, mais plus long.
4. Appuie sur le bouton **Analyser cette partie**. Coller le texte ne lance pas automatiquement Stockfish.
5. Suis la progression affichée position par position.
6. Exporte l’œuvre avec **Exporter en PNG**.

La même partie, avec les mêmes paramètres, produit la même peinture.

## Lancer le projet sur un ordinateur

Prérequis : Node.js 20.19 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvre l’adresse locale indiquée par Vite.

Pour vérifier que le collage PGN fonctionne puis tester la version de production :

```bash
npm run test:pgn
npm run build
npm run preview
```

Pendant la construction, le script `scripts/copy-stockfish.mjs` copie automatiquement la version légère et mono-thread de Stockfish dans l’application. Ces fichiers ne sont donc pas stockés directement dans ce dépôt.

## Organisation du projet

```text
chess-paint/
├── .github/workflows/deploy.yml  # déploiement GitHub Pages
├── public/                       # icônes et ressources statiques
├── scripts/copy-stockfish.mjs    # copie du moteur depuis npm
├── src/
│   ├── chess-analysis.js         # analyse et classification des coups
│   ├── painting.js               # génération procédurale Canvas
│   ├── stockfish-engine.js       # communication UCI avec Stockfish
│   ├── main.js                   # interface et événements
│   └── style.css                 # design mobile
├── tests/pgn-validation.mjs       # test du collage d’une partie sans fichier
├── index.html
├── package.json
└── vite.config.js
```

## Logique artistique actuelle

- Les cases de départ et d’arrivée deviennent les coordonnées des traits.
- Les Blancs et les Noirs utilisent deux familles de couleurs différentes.
- Un bon coup produit une ligne régulière et lumineuse.
- Une imprécision augmente le tremblement du trait.
- Une erreur casse la trajectoire.
- Une gaffe produit une rupture et des éclaboussures.
- L’estimation de niveau modifie la précision globale du geste.
- Les captures produisent des anneaux.
- Les échecs produisent des rayons.
- Le mat produit une explosion finale.
- Les promotions produisent une étoile.

Les seuils sont volontairement faciles à modifier dans `src/chess-analysis.js`.

## Vie privée

L’application est un site statique. Il n’y a :

- aucun compte utilisateur ;
- aucune base de données ;
- aucun système d’analyse d’audience ;
- aucun enregistrement automatique des PGN ;
- aucun envoi de la partie à une API externe.

L’hébergeur reçoit naturellement la requête nécessaire au téléchargement initial des fichiers du site. Ensuite, l’analyse Stockfish et la création de l’image sont réalisées localement sur l’appareil.

## Licences

Le projet est distribué sous **GNU GPL v3**.

- Stockfish / Stockfish.js : GPL v3.
- chess.js : BSD-2-Clause.
- Vite et vite-plugin-pwa : MIT.

Le fichier de licence de Stockfish est copié dans l’application lors de la construction.


## Si l’application installée affiche encore l’ancienne version

La PWA peut conserver une ancienne interface hors ligne. Vérifie le badge de version à côté du titre : il doit afficher **0.4**. Si ce n’est pas le cas, ferme complètement l’application, recharge la page GitHub Pages dans Chrome, puis rouvre l’application. En dernier recours, retire l’ancienne icône de l’écran d’accueil et réinstalle le site.


## Diagnostic des boutons

La version 0.6 contient une interface de secours intégrée directement dans `index.html`. Même si le module principal ne charge pas, les boutons **Effacer**, **Charger l’exemple** et **Coller le PGN** doivent réagir. Un message visible indique alors que GitHub Pages sert probablement les sources brutes. Dans **Settings → Pages**, la source doit être **GitHub Actions**, jamais **Deploy from a branch**.
