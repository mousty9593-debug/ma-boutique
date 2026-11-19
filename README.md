# 🛍️ Ma Boutique — site e-commerce complet

Site de vente en ligne **sans aucune dépendance** (seulement Node.js).

## Ce que contient le site
**Pour les clients** : Accueil (diaporama des images produits + bandeau de produits qui défile), Produits (recherche, catégories, fiche détail avec photos qui défilent), Panier, Commande, Services, À propos, Inscription, Contact (profil + téléphones + email + message).
**Commande** : le client valide son panier → la commande est **enregistrée** puis **WhatsApp s'ouvre vers le 98537713** avec le récapitulatif prêt à envoyer.
**Pour vous (/admin)** : tableau de bord, produits (ajout/modification/suppression, plusieurs photos, stock, catégorie, masquer), commandes (changer le statut, écrire au client sur WhatsApp), inscriptions, messages, réglages (nom, numéros, email, textes).

## Lancer sur votre ordinateur
1. Installer Node.js (version 18 ou plus) : https://nodejs.org
2. Dans le dossier du site :
   - Windows (PowerShell) : `$env:ADMIN_PASSWORD="VotreMotDePasse"; node server.js`
   - Mac / Linux : `ADMIN_PASSWORD=VotreMotDePasse node server.js`
3. Site : http://localhost:3000 — Admin : http://localhost:3000/admin

## Mettre en ligne (hébergement)
Il faut un hébergeur qui exécute **Node.js** (Render, Railway, Fly.io, un VPS…).
- Commande de démarrage : `node server.js`
- Variable d'environnement obligatoire : `ADMIN_PASSWORD` (votre mot de passe admin)
- **Important** : conservez les dossiers `data/` (commandes, produits) et `uploads/` (photos) sur un **disque persistant**, sinon ils sont effacés à chaque redémarrage.
- Mettez un nom de domaine avec HTTPS (fourni par la plupart des hébergeurs).

## Sauvegarde
Copiez régulièrement le dossier `data/` et le dossier `uploads/`.

## Premiers pas
Connectez-vous sur `/admin`, supprimez les 3 produits d'exemple, ajoutez vos produits avec leurs photos, puis vérifiez vos numéros dans « Réglages ».

## Limite à connaître
Le message WhatsApp part depuis le téléphone du client (lien wa.me), ce qui est gratuit et fiable. Un envoi 100 % automatique sans action du client demanderait l'API WhatsApp Business (payante).
