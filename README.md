# Photographe Andalou - Site Vitrine Immersif

![Tests](https://github.com/VOTRE_USERNAME/photographe-andalou/actions/workflows/test.yml/badge.svg)

Site web vitrine pour photographe basé en Andalousie (Cabo de Gata), créé avec une architecture moderne, performante et CMS-ready.

## 🎯 Caractéristiques

- **Architecture CMS-Ready** : Séparation stricte données/code, migration facile vers API backend
- **SPA moderne** : Single Page Application en HTML/CSS/JavaScript pur (pas de frameworks)
- **Multi-langue** : ES (espagnol), EN (anglais), FR (français)
- **Performance optimisée** : Lazy loading, responsive images, LQIP technique
- **Expérience immersive** : Scroll storytelling, transitions fluides, animations cinématographiques
- **Mobile-first** : Design responsive avec gestures tactiles

## 📁 Structure du Projet

```
photographe-andalou/
├── index.html                     # Point d'entrée unique (SPA)
├── assets/
│   ├── css/
│   │   ├── core/                  # Variables, reset, typography, utilities
│   │   ├── components/            # Styles des composants
│   │   ├── pages/                 # Styles par page
│   │   └── animations.css
│   ├── js/
│   │   ├── core/                  # app.js, router.js, state.js, i18n.js
│   │   ├── services/              # dataService.js, imageService.js, storageService.js
│   │   ├── components/            # Navigation, Hero, Gallery, Lightbox, etc.
│   │   ├── pages/                 # Contrôleurs de pages
│   │   └── utils/                 # Utilitaires (animations, swipe, domHelpers)
│   ├── images/                    # Photos organisées par collections
│   ├── fonts/                     # Polices web (WOFF2)
│   └── videos/                    # Vidéos hero (futur)
├── data/                          # Données JSON (CMS-ready)
│   ├── site.json
│   ├── collections.json
│   ├── pages.json
│   ├── navigation.json
│   ├── images.json
│   └── translations/
│       ├── es.json
│       ├── en.json
│       └── fr.json
└── README.md
```

## 🚀 Démarrage Rapide

### Prérequis

- Un serveur web local (pour servir les fichiers statiques)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

### Installation

1. Clonez ou téléchargez le projet

2. Servez les fichiers avec un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server -p 8000

# Avec PHP
php -S localhost:8000
```

3. Ouvrez votre navigateur sur `http://localhost:8000`

## 🏗️ Architecture

### Système de Routing (Hash-based)

```
Routes disponibles :
/ → Page d'accueil
/gallery → Galerie (toutes collections)
/gallery/:slug → Collection détaillée
/cabo-de-gata → Page storytelling Cabo de Gata
/about → À propos
/contact → Contact
```

### Gestion d'État Global

Le système de state management permet aux composants de s'abonner aux changements :

```javascript
import { state } from './assets/js/core/state.js';

// Récupérer une valeur
const lang = state.get('currentLanguage');

// Modifier une valeur (notifie les listeners)
state.set('currentLanguage', 'fr');

// S'abonner aux changements
const unsubscribe = state.subscribe('currentLanguage', (newLang, oldLang) => {
  console.log(`Language changed from ${oldLang} to ${newLang}`);
});
```

### Multi-langue (i18n)

```javascript
import { i18n } from './assets/js/core/i18n.js';

// Traduire une clé
const title = i18n.t('home.hero.title'); // "Luz Andaluza" en espagnol

// Avec variables
const greeting = i18n.t('common.hello', { name: 'John' }); // "Hola {{name}}"

// Changer de langue
await i18n.setLanguage('fr');
```

### Data Service (CMS-Ready)

Le dataService est prêt pour une migration vers API backend :

```javascript
import { dataService } from './assets/js/services/dataService.js';

// Aujourd'hui : charge depuis /data/*.json
const collections = await dataService.getCollections();

// Demain (avec CMS) : il suffira de changer baseUrl vers '/api'
dataService.setBaseUrl('/api');
// Aucun changement dans les composants !
```

## 📦 Collections de Photos

4 collections thématiques :

1. **Cabo de Gata** - Paysages volcánicos, désert et mer
2. **Portraits** - Visages et histoires de personnes
3. **Voyages** - Moments capturés autour du monde
4. **Reportages** - Histoires documentaires

Chaque collection supporte différents layouts :
- `grid` : Grille responsive classique
- `masonry` : Layout type Pinterest
- `horizontal-scroll` : Défilement horizontal avec snap
- `cinematic` : Séquence plein écran avec scroll-trigger

## 🎨 Design System

### Palette de Couleurs

Définie dans `assets/css/core/variables.css` :

```css
--color-bg-primary: #0a0a0a;          /* Noir profond */
--color-text-primary: #f5f5f5;        /* Blanc cassé */
--color-accent-primary: #d4a574;      /* Or doré andalou */
```

### Typographie

- **Headings** : Playfair Display (élégant, classique)
- **Body** : Inter (moderne, lisible)

### Espacements

Échelle cohérente :
```css
--spacing-xs: 0.5rem;   /* 8px */
--spacing-sm: 1rem;     /* 16px */
--spacing-md: 2rem;     /* 32px */
--spacing-lg: 4rem;     /* 64px */
--spacing-xl: 6rem;     /* 96px */
```

## 🔧 Développement

### Ajouter une nouvelle page

1. Créer le contrôleur de page dans `assets/js/pages/`
2. Enregistrer la route dans `assets/js/core/app.js`
3. Ajouter les données dans `data/pages.json`
4. Ajouter les traductions dans `data/translations/*.json`

### Ajouter une nouvelle collection

1. Ajouter la collection dans `data/collections.json`
2. Créer le dossier `assets/images/collections/nom-collection/`
3. Ajouter les métadonnées des images dans `data/images.json`
4. Ajouter les traductions des noms/descriptions

### Ajouter une nouvelle langue

1. Créer `data/translations/CODE.json` (ex: `it.json`)
2. Ajouter le code langue dans `data/site.json` → `availableLanguages`
3. Le système i18n le détectera automatiquement

## 🌐 Migration vers CMS

L'architecture est prête pour une migration facile :

### Backend

1. Créer une API REST ou GraphQL
2. Mêmes endpoints que les fichiers JSON actuels
3. Authentification JWT si besoin

### Frontend (changements minimaux)

```javascript
// Dans dataService.js
dataService.setBaseUrl('https://api.photographe-andalou.com');
dataService.setAuthToken('jwt_token_here');

// C'est tout ! Les composants ne changent pas.
```

## 📝 Tâches Suivantes

Voir le plan d'implémentation complet dans `/Users/alex/.claude/plans/quirky-shimmying-quokka.md`

**Prochaines étapes prioritaires :**

1. Créer les composants CSS manquants (navigation, hero, gallery, etc.)
2. Créer les composants JavaScript (Navigation, Hero, Gallery, Lightbox)
3. Implémenter les pages réelles (remplacer les placeholders)
4. Ajouter les vraies images (optimisées en 6 résolutions)
5. Implémenter les animations GSAP (scroll-triggered)
6. Optimiser les performances (Lighthouse > 90)
7. Tests cross-browser et mobile

## 🛠️ Stack Technique

- **HTML5** - Structure sémantique
- **CSS3** - Grid, Flexbox, Custom Properties, Animations
- **JavaScript ES6+** - Modules, Async/Await, Classes
- **GSAP** (CDN) - Animations cinématographiques
- **ScrollTrigger** (GSAP plugin) - Scroll-triggered animations

## 📄 Licence

© 2024 Photographe Andalou. Tous droits réservés.

## 📞 Contact

Pour plus d'informations : contact@photographe-andalou.com
