# Déploiement sur Render.com

## Étapes de déploiement

1. **Créer un compte gratuit** sur [render.com](https://render.com)

2. **Nouveau Web Service** :
   - Cliquer sur "New +" → "Web Service"
   - Connecter votre compte GitHub
   - Sélectionner le repository `photographe-andalou`
   - Branche : `main`

3. **Configuration automatique** :
   Le fichier `render.yaml` configure automatiquement :
   - Build Command : `npm install && npm run setup`
   - Start Command : `npm start`
   - Environment : Node
   - Variables d'environnement

4. **Cliquer sur "Create Web Service"**

## URL de production

Render vous donnera une URL publique :
```
https://photographe-andalou.onrender.com
```

## Accès admin

Une fois déployé, accédez à l'interface admin :
```
https://votre-url.onrender.com/#/admin/login
```

Identifiants par défaut (à changer après connexion) :
- Email : `admin@photographe.com`
- Mot de passe : `admin123`

## Limitations du plan gratuit

- **Spin-down** : Le serveur s'endort après 15 minutes d'inactivité
- **Premier chargement lent** : ~30 secondes de réveil
- **Base SQLite réinitialisée** : À chaque redémarrage, les données sont perdues

## Pour persistence des données (Optionnel - $1/mois)

1. Dans le dashboard Render → "Disks"
2. "Add Disk" :
   - Name : `database`
   - Mount Path : `/app/data`
   - Size : 1 GB

3. Le serveur utilisera automatiquement ce disque pour stocker `database.sqlite`

## Variables d'environnement (auto-configurées)

Le fichier `render.yaml` définit :
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET` (généré automatiquement)
- `JWT_EXPIRES_IN=7d`
- `UPLOAD_MAX_SIZE=10485760`

## Redéploiement automatique

Chaque push sur la branche `main` déclenche un redéploiement automatique.

## Support

Logs disponibles dans le dashboard Render : "Logs" → "Deploy" et "Server"
