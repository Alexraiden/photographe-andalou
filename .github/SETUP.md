# Configuration GitHub Actions

## 1. Push vers GitHub

```bash
git add .
git commit -m "Add CI/CD with GitHub Actions"
git push origin dev
```

## 2. Activer GitHub Actions

Les Actions sont activées par défaut sur les nouveaux repositories. Si besoin :

1. Allez sur `github.com/VOTRE_USERNAME/photographe-andalou`
2. Onglet **Settings**
3. **Actions** → **General**
4. Cochez **Allow all actions and reusable workflows**

## 3. Vérifier le Workflow

1. Onglet **Actions**
2. Vous devriez voir le workflow "Tests" en cours
3. Cliquez dessus pour voir les logs en temps réel

## 4. Badge Status

1. Onglet **Actions** → clic sur "Tests"
2. Bouton **"..."** → **Create status badge**
3. Copiez le markdown
4. Remplacez dans [README.md](../README.md) :

```markdown
![Tests](https://github.com/VOTRE_USERNAME/photographe-andalou/actions/workflows/test.yml/badge.svg)
```

Par votre badge personnalisé.

## 5. Permissions (PR Comments)

Pour que le bot puisse commenter les PR avec le rapport de couverture :

1. **Settings** → **Actions** → **General**
2. **Workflow permissions**
3. Sélectionnez **Read and write permissions**
4. Cochez **Allow GitHub Actions to create and approve pull requests**

## Résultat

✅ Tests automatiques sur chaque push/PR
✅ Matrix testing (Node 18 + 20)
✅ Rapport de couverture
✅ Badge de status
✅ Commentaire auto sur PR

## Désactiver (si besoin)

Pour désactiver temporairement :

```bash
# Renommer le fichier
mv .github/workflows/test.yml .github/workflows/test.yml.disabled
```

Ou dans l'UI GitHub : **Actions** → **Tests** → **"..."** → **Disable workflow**
