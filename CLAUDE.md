# CLAUDE.md - Guide pour Claude Code

## Vue d'ensemble du projet

Site portfolio SPA (Single Page Application) pour un photographe basé à Cabo de Gata, Andalousie. Construit en vanilla HTML5, CSS3 et JavaScript ES6+ sans framework.

## Stack technique

- **HTML5** : Markup sémantique
- **CSS3** : Grid, Flexbox, Custom Properties, animations
- **JavaScript ES6+** : Modules, Classes, Async/Await
- **GSAP 3.12.5** (CDN) : Animations et ScrollTrigger
- **Aucun bundler** : Fichiers statiques servis directement

## Structure du projet

```
├── index.html              # Point d'entrée unique (SPA)
├── assets/
│   ├── css/
│   │   ├── core/           # Reset, variables, typography, utilities
│   │   ├── components/     # Navigation, hero, gallery, lightbox, cards, footer
│   │   └── pages/          # Styles spécifiques par page
│   ├── js/
│   │   ├── core/           # app.js, router.js, state.js, i18n.js
│   │   └── services/       # dataService.js, storageService.js
│   └── images/collections/ # Images par collection
└── data/
    ├── site.json           # Configuration globale
    ├── collections.json    # Métadonnées des collections
    ├── images.json         # Métadonnées des images
    └── translations/       # es.json, en.json, fr.json
```

## Conventions de code

### CSS
- Classes BEM : `.component__element--modifier`
- Variables CSS dans `variables.css` (248 custom properties)
- Mobile-first responsive design
- Support `prefers-reduced-motion`

### JavaScript
- Modules ES6 (`import`/`export`)
- Singletons pour les services : `app`, `router`, `state`, `i18n`, `dataService`, `storageService`
- Contrôleurs de page avec méthodes `init()` et `destroy()`

### Internationalisation (i18n)
- Langue par défaut : espagnol (`es`)
- Fallback : anglais (`en`)
- Notation à points : `i18n.t('home.hero.title')`
- Stockage dans localStorage avec préfixe `photo_andalou_`

### Routing
- Hash-based : `#/`, `#/gallery`, `#/gallery/:slug`, `#/about`, `#/contact`
- Routes dynamiques avec paramètres

## Commandes de développement

```bash
# Serveur local Python
python -m http.server 8000

# Serveur local Node.js
npx serve

# Serveur local PHP
php -S localhost:8000
```

## Points d'attention

- **Pas de build** : Les fichiers sont servis tels quels
- **CMS-ready** : Les données JSON peuvent être remplacées par des endpoints API
- **Debug mode** : Activé automatiquement sur localhost (expose services sur `window.__*__`)
- **Images** : Utiliser lazy loading et LQIP (Low Quality Image Placeholder)

## Fichiers clés à connaître

| Fichier | Rôle |
|---------|------|
| `assets/js/core/app.js` | Bootstrap principal, définition des routes |
| `assets/js/core/router.js` | Routeur SPA hash-based |
| `assets/js/core/state.js` | Gestion d'état (observer pattern) |
| `assets/js/core/i18n.js` | Système multilingue |
| `assets/css/core/variables.css` | Design tokens |
| `data/collections.json` | Configuration des galeries |

## Layouts de galerie disponibles

- `cinematic` : Plein écran avec scroll storytelling
- `grid` : Grille responsive classique
- `masonry` : Disposition en maçonnerie
- `horizontal-scroll` : Défilement horizontal

# Claude Instructions (Token Optimized)

## General Behavior
- Be concise.
- No unnecessary explanations.
- Prefer code patches over full rewrites.
- Never repeat unchanged code.
- Output only what is required to solve the task.

## Code Changes
- Modify only the minimal necessary scope.
- Use diff-style output when possible.
- Do not refactor unless explicitly asked.
- Ask before making large architectural changes.

## Communication
- Default to short answers.
- No emojis, no filler text.
- If the request is ambiguous, ask a short clarifying question.

## Context Management
- Ignore previous unrelated context.
- Focus only on files and snippets provided.
- Do not assume project structure unless shown.

## Output Rules
- Prefer functions or snippets instead of full files.
- If returning code, return only modified sections.