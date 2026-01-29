# Actions de Sécurité Urgentes

## ⚡ À Faire IMMÉDIATEMENT

### 1. Regénérer les Secrets (5 min)

```bash
# Générer un nouveau JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer un nouveau ADMIN_PASSWORD
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Mettre à jour `.env` avec ces nouvelles valeurs**

### 2. Sécuriser le fichier .env (30 sec)

```bash
chmod 600 .env
```

### 3. Corriger les vulnérabilités NPM (2 min)

```bash
npm audit fix --force
# OU manuellement :
npm install bcrypt@latest
npm install @vitest/coverage-v8@latest @vitest/ui@latest
```

---

## 🔧 Avant Déploiement Production

### 1. Configuration .env production

Créer sur le serveur (NE PAS COMMITER) :

```bash
NODE_ENV=production
PORT=3000
BASE_URL=https://photographe-andalou.com

# Utiliser les secrets régénérés ci-dessus
JWT_SECRET=<votre-nouveau-secret-64-bytes>
ADMIN_PASSWORD=<votre-nouveau-password-32-bytes>

DB_PATH=./data/database.sqlite
ADMIN_EMAIL=admin@photographe-andalou.com
```

### 2. Modifier CORS pour production

Éditer [server/index.js:30](server/index.js#L30) :

```js
// AVANT (dev)
app.use(cors({
  origin: config.isDev ? true : config.baseUrl,
  // ...
}));

// APRÈS (prod)
app.use(cors({
  origin: process.env.BASE_URL || 'https://photographe-andalou.com',
  // ...
}));
```

### 3. Retirer console.log en production (optionnel)

Installer un logger :

```bash
npm install winston
```

Créer `server/utils/logger.js` :

```js
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

Remplacer `console.log` par `logger.info()`, `console.error` par `logger.error()`.

---

## 🧪 Tests de Sécurité

### Lancer tous les tests

```bash
# Tests de sécurité
npm run test tests/security/

# Vérification automatique
./scripts/security-check.sh

# CI/CD (GitHub Actions)
# Automatiquement lancé à chaque push
```

### Tests manuels rapides

```bash
# 1. Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'; done

# 2. Test JWT invalide
curl http://localhost:3000/api/collections \
  -H "Authorization: Bearer INVALID"
```

---

## 📊 Monitoring Continue

### Hebdomadaire

```bash
npm audit
npm outdated
./scripts/security-check.sh
```

### Mensuel

- Vérifier les mises à jour de sécurité : [npm security advisories](https://github.com/advisories)
- Revoir les logs d'erreur
- Tester les endpoints avec OWASP ZAP

---

## 🚀 Déploiement Render.com

### Variables d'environnement à configurer

Dans Render Dashboard > Environment :

```
NODE_ENV=production
PORT=3000
BASE_URL=https://votre-app.onrender.com
JWT_SECRET=<généré-crypto-random>
ADMIN_PASSWORD=<généré-crypto-random>
DB_PATH=./data/database.sqlite
ADMIN_EMAIL=admin@photographe-andalou.com
```

### Build Command

```bash
npm install && npm run setup
```

### Start Command

```bash
npm start
```

---

## ✅ Checklist Finale

Avant de déployer en production :

- [ ] `.env` non commité (vérifier avec `git ls-files | grep .env`)
- [ ] JWT_SECRET régénéré et fort (64 bytes hex)
- [ ] ADMIN_PASSWORD régénéré et fort (32+ bytes)
- [ ] Permissions `.env` à 600
- [ ] `npm audit` sans vulnérabilités HIGH/CRITICAL
- [ ] CORS configuré avec domaine exact
- [ ] NODE_ENV=production dans .env production
- [ ] HTTPS activé (Let's Encrypt sur Render)
- [ ] Tests de sécurité passent (`npm run test tests/security/`)
- [ ] Script de vérification OK (`./scripts/security-check.sh`)
- [ ] Backup de la DB SQLite configuré

---

**Temps estimé total** : 30 minutes

**Priorité** : CRITIQUE avant mise en production
