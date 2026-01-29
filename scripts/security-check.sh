#!/bin/bash

# Script de vérification de sécurité
# Usage: ./scripts/security-check.sh

set -e

echo "🔒 Audit de Sécurité - Photographe Andalou"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Vérifier que .env n'est pas commité
echo "1. Vérification .env non commité..."
if git ls-files | grep -q "^\.env$"; then
    echo -e "${RED}❌ ERREUR: .env est commité dans Git!${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ .env n'est pas commité${NC}"
fi
echo ""

# 2. Vérifier que .env existe localement
echo "2. Vérification présence .env local..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  WARNING: .env n'existe pas (copier depuis .env.example)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ .env existe${NC}"

    # Vérifier JWT_SECRET
    if grep -q "JWT_SECRET=$" .env; then
        echo -e "${RED}❌ ERREUR: JWT_SECRET est vide!${NC}"
        ((ERRORS++))
    elif grep -q "JWT_SECRET=your-secret-key-here" .env; then
        echo -e "${YELLOW}⚠️  WARNING: JWT_SECRET utilise la valeur par défaut${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ JWT_SECRET est défini${NC}"
    fi

    # Vérifier ADMIN_PASSWORD
    if grep -q "ADMIN_PASSWORD=$" .env; then
        echo -e "${RED}❌ ERREUR: ADMIN_PASSWORD est vide!${NC}"
        ((ERRORS++))
    elif grep -E -q "ADMIN_PASSWORD=(admin|password|123456)" .env; then
        echo -e "${RED}❌ ERREUR: ADMIN_PASSWORD est trop faible!${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ ADMIN_PASSWORD est défini${NC}"
    fi
fi
echo ""

# 3. Vérifier les secrets dans le code
echo "3. Recherche de secrets dans le code..."
SECRETS_FOUND=0
if git grep -E "(api[_-]?key|password|secret).*=.*['\"].*['\"]" -- '*.js' '*.json' ':!node_modules' ':!tests' ':!package-lock.json' 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Potentiels secrets trouvés (vérifier manuellement)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Aucun secret évident trouvé${NC}"
fi
echo ""

# 4. NPM Audit
echo "4. Vérification vulnérabilités NPM..."
if npm audit --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Aucune vulnérabilité HIGH/CRITICAL${NC}"
else
    echo -e "${YELLOW}⚠️  Vulnérabilités détectées (lancer 'npm audit' pour détails)${NC}"
    ((WARNINGS++))
fi
echo ""

# 5. Vérifier les dépendances obsolètes
echo "5. Vérification dépendances obsolètes..."
OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
if [ "$OUTDATED" = "{}" ]; then
    echo -e "${GREEN}✅ Toutes les dépendances sont à jour${NC}"
else
    echo -e "${YELLOW}⚠️  Dépendances obsolètes détectées (lancer 'npm outdated')${NC}"
    ((WARNINGS++))
fi
echo ""

# 6. Vérifier les fichiers sensibles
echo "6. Vérification fichiers sensibles..."
SENSITIVE_FILES=0
for file in "*.pem" "*.key" "*.p12" "id_rsa" "id_dsa"; do
    if find . -name "$file" -not -path "*/node_modules/*" | grep -q .; then
        echo -e "${RED}❌ Fichiers sensibles trouvés: $file${NC}"
        ((ERRORS++))
        ((SENSITIVE_FILES++))
    fi
done
if [ $SENSITIVE_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun fichier sensible trouvé${NC}"
fi
echo ""

# 7. Vérifier les permissions fichiers
echo "7. Vérification permissions fichiers..."
if [ -f .env ]; then
    PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" != "600" ]; then
        echo -e "${YELLOW}⚠️  .env permissions: $PERMS (recommandé: 600)${NC}"
        echo "   Corriger avec: chmod 600 .env"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ Permissions .env correctes${NC}"
    fi
fi
echo ""

# 8. Vérifier console.log en production
echo "8. Vérification console.log dans le code..."
CONSOLE_COUNT=$(git grep -c "console\." -- 'assets/js/**/*.js' ':!tests' | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -gt 50 ]; then
    echo -e "${YELLOW}⚠️  $CONSOLE_COUNT fichiers avec console.log (nettoyer pour production)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Nombre acceptable de console.log${NC}"
fi
echo ""

# 9. Vérifier configuration CORS
echo "9. Vérification configuration CORS..."
if grep -q "origin.*true" server/index.js; then
    echo -e "${YELLOW}⚠️  CORS 'origin: true' détecté (OK dev, changer en prod)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ CORS configuré avec domaine spécifique${NC}"
fi
echo ""

# 10. Vérifier NODE_ENV
echo "10. Vérification NODE_ENV..."
if [ -f .env ]; then
    if grep -q "NODE_ENV=production" .env; then
        echo -e "${GREEN}✅ NODE_ENV=production${NC}"
        # Vérifications supplémentaires pour production
        if grep -q "isDev.*true" server/config.js; then
            echo -e "${YELLOW}⚠️  Mode debug activé en production${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠️  NODE_ENV=development (normal en dev)${NC}"
    fi
fi
echo ""

# Résumé
echo "=========================================="
echo "Résumé de l'Audit"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCÈS: Aucun problème détecté!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - Vérifier et corriger${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) et $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "Actions recommandées:"
    echo "  1. Corriger les erreurs critiques ci-dessus"
    echo "  2. Lancer: npm audit fix"
    echo "  3. Regénérer JWT_SECRET et ADMIN_PASSWORD:"
    echo "     node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    exit 1
fi
