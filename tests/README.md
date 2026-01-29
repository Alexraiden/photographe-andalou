# Tests - Portfolio Photographe Andalou

Suite de tests complète avec **Vitest** pour prévenir les régressions.

## Structure

```
tests/
├── setup.js                        # Configuration globale
├── helpers/
│   ├── db.js                       # Helper base de données test
│   ├── mocks.js                    # Mocks réutilisables
│   └── testApp.js                  # App Express pour tests
├── unit/
│   ├── core/                       # Tests modules frontend core
│   ├── services/                   # Tests services frontend
│   └── server/                     # Tests modules backend
│       ├── authService.test.js
│       ├── slugify.test.js
│       └── middleware/
└── integration/
    └── api/                        # Tests API endpoints
        ├── auth.test.js
        └── collections.test.js
```

## Commandes

```bash
# Exécuter tous les tests
npm test

# Mode watch (redémarre automatiquement)
npm run test:watch

# Interface web interactive
npm run test:ui

# Rapport de couverture
npm run test:coverage

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration
```

## Couverture

### Modules testés

#### Frontend (logique métier)
- **router.js** : Routing SPA hash-based (19 tests)
- **i18n.js** : Système multilingue (28 tests)
- **state.js** : Gestion d'état globale (18 tests)
- **storageService.js** : Abstraction localStorage (20 tests)

#### Backend
- **authService.js** : Hash bcrypt + JWT (11 tests, 100% coverage)
- **slugify.js** : Génération slugs (12 tests, 100% coverage)
- **Middleware auth** : Vérification JWT (5 tests, 90% coverage)
- **Routes API** : Auth + Collections (15 tests, 90%+ coverage)

### Résultats

```
✓ 129 tests passent
✓ 10 fichiers de test
✓ ~8 secondes d'exécution
```

**Couverture backend** :
- authService.js : **100%**
- slugify.js : **100%**
- auth middleware : **90%**
- auth routes : **94%**

## Détails des Tests

### Tests Unitaires

#### Router ([router.test.js](unit/core/router.test.js))
- Enregistrement routes statiques/dynamiques
- Matching routes avec paramètres (`:slug`)
- Navigation hooks (before/after)
- Gestion 404

#### i18n ([i18n.test.js](unit/core/i18n.test.js))
- Détection langue (explicit > localStorage > browser > default)
- Chargement traductions JSON
- Traduction avec dot notation (`home.hero.title`)
- Interpolation variables (`{{name}}`)
- Fallback langue indisponible

#### State ([state.test.js](unit/core/state.test.js))
- Get/set état
- Système d'abonnement (observer pattern)
- Notification listeners
- Gestion erreurs callbacks
- Reset état

#### StorageService ([storageService.test.js](unit/services/storageService.test.js))
- CRUD avec préfixe
- Fallback mémoire si localStorage indisponible
- Clear sélectif (uniquement clés préfixées)
- Sérialisation JSON automatique

#### AuthService ([authService.test.js](unit/server/authService.test.js))
- Hash bcrypt sécurisé (salt différent à chaque fois)
- Vérification password
- Génération JWT avec payload
- Vérification token (signature, expiration)

#### Slugify ([slugify.test.js](unit/server/slugify.test.js))
- Suppression accents
- Minuscules
- Remplacement caractères spéciaux par `-`
- Suppression tirets début/fin

#### Middleware Auth ([auth.test.js](unit/server/middleware/auth.test.js))
- Rejet sans header `Authorization`
- Rejet si pas `Bearer {token}`
- Rejet token invalide/expiré
- Succès token valide

### Tests d'Intégration

#### API Auth ([auth.test.js](integration/api/auth.test.js))
- `POST /api/auth/login` : Connexion avec credentials
- `GET /api/auth/verify` : Vérification token
- Validation format email
- Validation longueur password (8-128 chars)
- Messages erreur appropriés

#### API Collections ([collections.test.js](integration/api/collections.test.js))
- `GET /api/collections` : Liste collections (auth requise)
- `GET /api/collections/:id` : Collection par ID
- `POST /api/collections` : Création collection
- Validation slug (lowercase, alphanumeric, hyphens)
- 401 sans authentification

## Configuration

### [vitest.config.js](/vitest.config.js)
- Environment : **jsdom** (pour tests frontend)
- Coverage provider : **v8**
- Seuils : 80% lines/functions, 75% branches
- Exclusions : node_modules, migrations, seeds

### [tests/setup.js](setup.js)
- Mock `localStorage` avec fallback mémoire
- Mock `fetch` global
- Mock `window.location`
- Reset automatique après chaque test

## Helpers

### Database ([helpers/db.js](helpers/db.js))
```javascript
import { createTestDb, seedTestDb, cleanTestDb } from './helpers/db.js';

const db = createTestDb();        // Base SQLite en mémoire
seedTestDb(db);                   // Données de test
cleanTestDb(db);                  // Nettoyage
```

### Mocks ([helpers/mocks.js](helpers/mocks.js))
```javascript
import { mockFetch, mockTranslations, createMockPageController } from './helpers/mocks.js';

mockFetch({ data: 'test' });      // Mock fetch avec données
mockFetchError(new Error());       // Mock fetch avec erreur
const Controller = createMockPageController(); // Mock page SPA
```

### Test App ([helpers/testApp.js](helpers/testApp.js))
```javascript
import { createTestApp } from './helpers/testApp.js';
import request from 'supertest';

const app = createTestApp();
const response = await request(app).get('/api/collections');
```

## Ajouter un Test

### Test unitaire

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MonModule', () => {
  beforeEach(() => {
    // Setup
  });

  it('devrait faire quelque chose', () => {
    expect(result).toBe(expected);
  });
});
```

### Test d'intégration API

```javascript
import request from 'supertest';
import { createTestApp } from '../../helpers/testApp.js';

const app = createTestApp();

it('devrait retourner 200', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(response.body).toHaveProperty('data');
});
```

## CI/CD

Pour intégrer dans CI/CD (GitHub Actions, etc.) :

```yaml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage
```

Les seuils de couverture configurés feront échouer le build si non atteints.
