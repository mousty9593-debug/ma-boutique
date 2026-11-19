# Mettre Ma Boutique en ligne (Render)

Pourquoi un hébergeur payant ? Le site enregistre vos produits, photos et commandes dans des fichiers.
Sur l'offre gratuite de Render, le disque est effacé à chaque redémarrage et le site s'endort après 15 min.
Il faut donc l'offre « Starter » (environ 7 $/mois) + un disque persistant de 1 Go (environ 0,25 $/mois).
Vérifiez les prix actuels sur https://render.com/pricing

## 1. Mettre les fichiers sur GitHub
1. Créez un compte gratuit sur https://github.com
2. « New repository » → nom : `ma-boutique` → « Create repository »
3. Cliquez « uploading an existing file » et glissez tout le CONTENU du dossier `shop`
   (server.js, package.json, render.yaml, le dossier public…). Ne glissez PAS les dossiers `data` et `uploads`.
4. « Commit changes »

## 2. Créer le service sur Render
1. Compte sur https://render.com (connexion avec GitHub)
2. « New + » → « Blueprint » → choisissez le dépôt `ma-boutique` → Render lit `render.yaml`
3. Saisissez votre mot de passe admin dans `ADMIN_PASSWORD` → « Apply »
4. Attendez « Live ». Votre adresse : https://ma-boutique-xxxx.onrender.com

## 3. Vérifier
- Le site : l'adresse Render
- L'admin : l'adresse + /admin
- Ajoutez un produit avec photo, redémarrez le service (Manual Deploy) : il doit rester.

## 4. Nom de domaine (facultatif)
Render → Settings → Custom Domains. Le HTTPS est automatique.

## Sauvegarde
Render → Disks → faites des snapshots, ou téléchargez régulièrement `data/db.json` via le shell Render.

---
# Version GRATUITE (pour tester / montrer le site)
Render gratuit : le site s'endort après 15 min sans visite (30 à 60 s pour se réveiller) et les fichiers sont effacés
au redémarrage (produits, photos, commandes). Utilisez-le pour essayer, pas pour vendre.
1. GitHub : même étape 1 que ci-dessus.
2. Render → « New + » → « Web Service » (et NON Blueprint) → choisissez le dépôt.
3. Runtime : Node · Build Command : `echo ok` · Start Command : `node server.js` · Instance Type : **Free**
4. Environment : ajoutez `ADMIN_PASSWORD` = votre mot de passe. N'ajoutez PAS de disque, ni DATA_DIR.
5. « Create Web Service » → attendez « Live ».
Avant de quitter, téléchargez la sauvegarde (Admin → Réglages → Sauvegarde). Pour passer au payant,
créez le service Starter + disque, puis restaurez ce fichier au même endroit.
