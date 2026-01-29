# GitHub Actions Workflows

## Tests Workflow

### Déclenchement

Le workflow de tests se déclenche automatiquement :
- Sur `push` vers `main`, `master` ou `dev`
- Sur `pull request` vers ces branches

### Matrix Testing

Tests exécutés sur :
- Node.js 18.x
- Node.js 20.x

### Étapes

1. **Checkout** : Récupère le code
2. **Setup Node.js** : Installe Node.js avec cache npm
3. **Install** : `npm ci` (installation propre)
4. **Tests** : `npm test` (129 tests)
5. **Coverage** : `npm run test:coverage`
6. **Upload** : Rapport de couverture en artifacts (30 jours)
7. **PR Comment** : Poste le résumé de couverture sur les PR

### Badge Status

Ajoutez ce badge dans votre README :

```markdown
![Tests](https://github.com/VOTRE_USERNAME/photographe-andalou/actions/workflows/test.yml/badge.svg)
```

### Artifacts

Les rapports de couverture sont disponibles dans l'onglet "Actions" → Run → "Artifacts"

### Échec

Le workflow échoue si :
- Un test échoue
- La couverture < seuils configurés (80% lines/functions, 75% branches)

### Durée

~30-45 secondes par run (2 versions Node.js en parallèle)

### Consommation

- ~1 minute/push
- ~2000 minutes gratuites/mois
- = ~2000 push possibles/mois
