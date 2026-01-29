# Guide de Sécurité - Photographe Andalou

## 📋 Checklist de Sécurité

### Avant déploiement

- [ ] Regénérer `JWT_SECRET` en production
- [ ] Utiliser un mot de passe admin fort (32+ caractères aléatoires)
- [ ] Vérifier que `.env` n'est pas commité (`git ls-files | grep .env`)
- [ ] Lancer `npm audit` et corriger les vulnérabilités HIGH/CRITICAL
- [ ] Tester tous les endpoints avec les tests de sécurité
- [ ] Configurer HTTPS (Let's Encrypt sur Render.com)
- [ ] Définir `NODE_ENV=production`
- [ ] Configurer les CORS avec le domaine exact (pas `true`)

### Configuration Production

```bash
# .env.production (à créer sur le serveur, NE PAS COMMITER)
NODE_ENV=production
PORT=3000
BASE_URL=https://votre-domaine.com

# IMPORTANT: Générer des valeurs uniques
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ADMIN_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

DB_PATH=./data/database.sqlite
ADMIN_EMAIL=admin@votre-domaine.com
```

## 🔒 Mesures de Sécurité Implémentées

### Backend

| Mesure | Status | Fichier |
|--------|--------|---------|
| SQL Injection Prevention | ✅ | [server/routes/collections.js](server/routes/collections.js) - Requêtes préparées |
| XSS Prevention | ✅ | [server/index.js](server/index.js) - Helmet CSP |
| Rate Limiting | ✅ | [server/middleware/rateLimiter.js](server/middleware/rateLimiter.js) |
| Input Validation | ✅ | [server/middleware/validate.js](server/middleware/validate.js) |
| File Upload Security | ✅ | [server/middleware/upload.js](server/middleware/upload.js) - Magic bytes + MIME |
| Password Hashing | ✅ | bcrypt avec 12 rounds |
| JWT Expiration | ✅ | 4 heures |
| CORS | ✅ | Configurable par domaine |
| Helmet Headers | ✅ | CSP, X-Frame-Options, etc. |
| Timing Attack Prevention | ✅ | [server/routes/auth.js:19-22](server/routes/auth.js#L19-L22) |

### Frontend

| Mesure | Status | Notes |
|--------|--------|-------|
| Template Literals | ✅ | Pas de concaténation HTML |
| localStorage Prefix | ✅ | `photo_andalou_` pour éviter collisions |
| Token Storage | ⚠️ | localStorage (considérer httpOnly cookies) |
| CSP Compatible | ✅ | Pas de inline scripts dangereux |

## 🧪 Tests de Sécurité

### Tests Automatisés

```bash
# Lancer tous les tests de sécurité
npm run test tests/security/

# Tests spécifiques
npm run test tests/security/auth.test.js
npm run test tests/security/upload.test.js
npm run test tests/security/xss.test.js

# Audit des dépendances
npm audit
npm audit fix

# Analyse avec Snyk (gratuit pour projets open source)
npx snyk test
```

### Tests Manuels avec cURL

#### 1. Test Rate Limiting

```bash
# Tenter 10 connexions en 1 seconde (devrait bloquer après 5)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
wait
```

#### 2. Test JWT Invalidation

```bash
# Token invalide
curl http://localhost:3000/api/collections \
  -H "Authorization: Bearer INVALID_TOKEN"
# Attendu: 401 Unauthorized

# Sans token
curl http://localhost:3000/api/collections
# Attendu: 401 Unauthorized
```

#### 3. Test SQL Injection

```bash
# Tentative d'injection SQL dans login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR '\''1'\''='\''1","password":"test"}'
# Attendu: 400 Bad Request (validation) ou 401
```

#### 4. Test XSS

```bash
# Créer une collection avec payload XSS (nécessite auth)
curl -X POST http://localhost:3000/api/collections \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_es": "<script>alert(\"XSS\")</script>",
    "name_en": "Test",
    "name_fr": "Test"
  }'
# Vérifier que le script n'est pas exécuté dans le frontend
```

#### 5. Test Upload Malveillant

```bash
# Créer un faux fichier image (en réalité un script)
echo "<?php system(\$_GET['cmd']); ?>" > malicious.jpg

# Tenter l'upload
curl -X POST http://localhost:3000/api/images/collection-id/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@malicious.jpg"
# Attendu: 400 Bad Request (MIME validation échoue)
```

### Tests avec OWASP ZAP

```bash
# Installer OWASP ZAP
# https://www.zaproxy.org/download/

# Scanner l'application (mode GUI)
1. Ouvrir ZAP
2. Automated Scan > URL: http://localhost:3000
3. Attack > Active Scan
4. Analyser le rapport

# Scanner en ligne de commande
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r security-report.html
```

## 🚨 Signalement de Vulnérabilités

Si vous découvrez une faille de sécurité :

1. **NE PAS** créer d'issue publique GitHub
2. Envoyer un email à : security@votre-domaine.com
3. Inclure :
   - Description de la vulnérabilité
   - Étapes de reproduction
   - Impact potentiel
   - Votre nom (si vous souhaitez être crédité)

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🔄 Mises à jour de Sécurité

Vérifier les dépendances chaque semaine :

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour les patches de sécurité
npm update

# Audit complet
npm audit
```

## 📝 Changelog Sécurité

### 2024-01-29
- ✅ Ajout tests de sécurité automatisés
- ✅ Création workflow GitHub Actions
- ✅ Documentation complète
- ⚠️ Action requise: Regénérer JWT_SECRET et ADMIN_PASSWORD

---

**Dernière révision** : 2024-01-29
**Mainteneur** : Photographe Andalou Team
