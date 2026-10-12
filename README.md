HEAD

# inventory-management-app

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-6qptqmcg)

<div align="center">

# 📦 Inventory Management App

**Application web de gestion de stock avec traçabilité des mouvements, alertes de rupture et rapports mensuels.**

[![Démo en ligne](https://img.shields.io/badge/D%C3%A9mo-en%20ligne-f59e0b?style=for-the-badge&logo=vercel&logoColor=white)](https://inventory-management-app-kappa-ten.vercel.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_Postgres-3ECF8E?logo=supabase&logoColor=white)

</div>

<!--
📸 SCREENSHOT n°1 — BANNIÈRE / APERÇU PRINCIPAL (le plus important)
Quelle capture : la page « Dashboard » complète (après connexion), avec des données réelles :
cartes de statistiques en haut, alertes de stock, graphique et derniers mouvements visibles.
Format : 1600×900 px environ (16:9), navigateur en plein écran, sans barre d'onglets ni favoris.
Fichier : docs/screenshots/01-dashboard.png
-->
<p align="center">
  <img src="docs/screenshots/01-dashboard.png" alt="Aperçu du tableau de bord" width="900" />
</p>

---

## 🌐 Démo en ligne

👉 **[inventory-management-app-kappa-ten.vercel.app](https://inventory-management-app-kappa-ten.vercel.app)**

Le formulaire de connexion est pré-rempli avec un compte de démonstration :

| Email              | Mot de passe    |
| ------------------ | --------------- |
| `demo@example.com` | `Epicerie2026!` |

> Les données de la démo sont fictives (cas d'usage : une épicerie fine). Vous pouvez tout tester : ajouter des produits, enregistrer des entrées/sorties, exporter des fichiers CSV.

---

## 🎯 Pourquoi ce projet ?

Beaucoup de petits commerces, artisans ou PME gèrent encore leur stock sur Excel ou sur papier : erreurs de saisie, ruptures découvertes trop tard, aucun historique fiable.

Cette application répond à ces problèmes avec une interface simple et rapide :

- **Savoir à tout moment** ce qu'il y a en stock et combien il vaut.
- **Être prévenu** avant la rupture grâce aux seuils d'alerte par produit.
- **Tout tracer** : chaque variation de stock passe par un mouvement daté et motivé.
- **Suivre l'activité** grâce à un rapport mensuel exportable.

---

## ✨ Fonctionnalités

### 🔐 Authentification

- Connexion administrateur sécurisée via **Supabase Auth**
- Session persistante avec renouvellement automatique du jeton
- Pages protégées : toute route privée redirige vers la connexion si l'utilisateur n'est pas authentifié

### 📊 Tableau de bord

- 4 indicateurs clés : **produits référencés**, **valeur totale du stock**, **produits en alerte**, **mouvements récents**
- **Alertes de stock** en temps réel avec distinction visuelle entre _Faible_ (sous le seuil) et _Rupture_ (stock à 0)
- **Graphique des entrées/sorties** filtrable par produit
- Aperçu des **derniers mouvements**

### 🛍️ Gestion des produits

- Création, modification et suppression via des fenêtres modales
- **Recherche** par nom, **filtre par catégorie** et filtre **« stock faible uniquement »**
- Badges de statut : `OK` / `Faible` / `Rupture`
- **Export CSV** de la liste des produits
- Validation des formulaires (prix et seuil positifs, champs obligatoires)
- Protection de l'historique : un produit ayant des mouvements ne peut pas être supprimé
- La quantité en stock n'est **pas modifiable à la main** : elle évolue uniquement via les mouvements, pour garantir la traçabilité

### 🔄 Mouvements de stock

- Formulaire rapide d'**entrée** ou de **sortie** (produit, quantité, motif)
- **Historique complet** avec filtres par produit et par période (date de début / date de fin)
- Compteur de résultats et réinitialisation des filtres en un clic

### 📈 Rapports mensuels

- Synthèse automatique : total des entrées et sorties (en quantité et en valeur €), nombre de mouvements
- Graphique **entrées / sorties par jour**
- **Top 5 des produits** les plus mouvementés
- **Export CSV** du rapport

### 🎨 Expérience utilisateur

- Interface **responsive** (ordinateur, tablette, mobile)
- Notifications (toasts) de succès et d'erreur
- Indicateurs de chargement et états vides explicites

---

## 🖼️ Aperçu de l'application

<!--
📸 SCREENSHOT n°2 — PAGE DE CONNEXION
Quelle capture : la page /login avec le fond sombre et la carte blanche « Connexion administrateur ».
Montre le compte de démonstration en bas de la carte.
Fichier : docs/screenshots/02-login.png
-->

### Connexion

<p align="center">
  <img src="docs/screenshots/02-login.png" alt="Page de connexion" width="800" />
</p>

<!--
📸 SCREENSHOT n°3 — TABLEAU DE BORD (zoom sur les alertes)
Quelle capture : la page « Dashboard » avec au moins 2-3 produits en alerte (un « Rupture » en rouge
et un « Faible » en orange) pour montrer la valeur métier. Si vous avez déjà utilisé le n°1,
recadrez ici sur la zone « Alertes de stock » + graphique.
Astuce : modifiez un seuil d'alerte ou faites une sortie de stock pour provoquer des alertes.
Fichier : docs/screenshots/03-alertes-stock.png
-->

### Alertes de stock & graphique d'évolution

<p align="center">
  <img src="docs/screenshots/03-alertes-stock.png" alt="Alertes de stock et graphique" width="800" />
</p>

<!--
📸 SCREENSHOT n°4 — LISTE DES PRODUITS
Quelle capture : la page /produits avec une dizaine de produits, les badges OK / Faible / Rupture visibles,
et la barre d'outils (recherche, filtre catégorie, case « Stock faible », boutons Export CSV et Ajouter).
Fichier : docs/screenshots/04-produits.png
-->

### Gestion des produits

<p align="center">
  <img src="docs/screenshots/04-produits.png" alt="Liste des produits" width="800" />
</p>

<!--
📸 SCREENSHOT n°5 — FORMULAIRE PRODUIT (modale)
Quelle capture : la fenêtre modale « Modifier le produit » ouverte au-dessus de la liste
(on doit voir le message expliquant que la quantité évolue via les mouvements).
Fichier : docs/screenshots/05-produit-modale.png
-->

### Création / modification d'un produit

<p align="center">
  <img src="docs/screenshots/05-produit-modale.png" alt="Modale d'édition d'un produit" width="600" />
</p>

<!--
📸 SCREENSHOT n°6 — MOUVEMENTS DE STOCK
Quelle capture : la page /mouvements avec le formulaire « Enregistrer un mouvement » en haut,
le bloc de filtres, et un historique d'au moins 8 lignes (mélange d'entrées vertes et de sorties orange).
Fichier : docs/screenshots/06-mouvements.png
-->

### Mouvements & historique filtrable

<p align="center">
  <img src="docs/screenshots/06-mouvements.png" alt="Page des mouvements de stock" width="800" />
</p>

<!--
📸 SCREENSHOT n°7 — RAPPORT MENSUEL
Quelle capture : la page /rapports en entier : titre du mois, 4 cartes de statistiques,
graphique « Entrées / Sorties par jour » et « Top 5 produits mouvementés ».
Assurez-vous que le graphique contient des données (sinon il affiche « Aucune donnée pour ce mois »).
Fichier : docs/screenshots/07-rapports.png
-->

### Rapport mensuel

<p align="center">
  <img src="docs/screenshots/07-rapports.png" alt="Rapport mensuel" width="800" />
</p>

<!--
📸 SCREENSHOT n°8 (OPTIONNEL MAIS RECOMMANDÉ) — VERSION MOBILE
Quelle capture : le Dashboard (ou la page Produits) en vue mobile (DevTools du navigateur > mode appareil,
par exemple iPhone 14, ~390×844). Idéalement, 2 captures côte à côte (Dashboard + Produits).
Cela rassure les clients sur le côté responsive.
Fichier : docs/screenshots/08-mobile.png
-->

### Version mobile

<p align="center">
  <img src="docs/screenshots/08-mobile.png" alt="Affichage mobile" width="350" />
</p>

---

## 🧰 Stack technique

| Domaine             | Technologies                             |
| ------------------- | ---------------------------------------- |
| **Front-end**       | React 18, TypeScript, Vite               |
| **Routing**         | React Router 7                           |
| **UI / Style**      | Tailwind CSS, Lucide React (icônes)      |
| **Graphiques**      | Recharts                                 |
| **Back-end / BaaS** | Supabase (PostgreSQL, Auth)              |
| **Qualité**         | ESLint, vérification de types TypeScript |
| **Déploiement**     | Vercel                                   |

---

## 🗄️ Modèle de données

```
categories                 produits                       mouvements
├─ id                      ├─ id                          ├─ id
├─ nom                     ├─ nom                         ├─ produit_id  → produits.id
└─ created_at              ├─ categorie_id → categories   ├─ type        ('entree' | 'sortie')
                           ├─ prix                        ├─ quantite
                           ├─ quantite_actuelle           ├─ date
                           ├─ seuil_alerte                ├─ motif
                           └─ created_at                  └─ utilisateur_id
```

Le schéma SQL est versionné dans [`supabase/migrations`](supabase/migrations).

---

## 🚀 Installation en local

### Prérequis

- [Node.js](https://nodejs.org/) 18 ou supérieur
- Un projet [Supabase](https://supabase.com/) (gratuit)

### 1. Cloner le dépôt

```bash
git clone https://github.com/Rayane-Merzougui/inventory-management-app.git
cd inventory-management-app
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
```

Ces valeurs se trouvent dans votre tableau de bord Supabase : **Project Settings → API**.

### 4. Initialiser la base de données

Appliquez les migrations du dossier `supabase/migrations`, soit avec la [CLI Supabase](https://supabase.com/docs/guides/cli) :

```bash
supabase link --project-ref <votre-project-ref>
supabase db push
```

soit en copiant le contenu des fichiers SQL dans le **SQL Editor** de Supabase.

Créez ensuite un utilisateur dans **Authentication → Users** pour pouvoir vous connecter.

### 5. Lancer l'application

```bash
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

---

## 📜 Scripts disponibles

| Commande            | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Lance le serveur de développement   |
| `npm run build`     | Génère la version de production     |
| `npm run preview`   | Prévisualise le build de production |
| `npm run lint`      | Analyse le code avec ESLint         |
| `npm run typecheck` | Vérifie les types TypeScript        |

---

## 📁 Structure du projet

```
inventory-management-app/
├── src/
│   ├── components/      # Composants réutilisables (Modal, Toast, PrivateRoute…)
│   ├── context/         # Contexte d'authentification
│   ├── lib/             # Client Supabase, types et accès aux données
│   ├── pages/           # Login, Dashboard, Produits, Mouvements, Rapports
│   ├── App.tsx          # Routes de l'application
│   └── main.tsx         # Point d'entrée
├── supabase/
│   └── migrations/      # Schéma de la base de données
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## ☁️ Déploiement

L'application est déployée sur **Vercel**. Pour déployer votre propre instance :

1. Importez le dépôt dans Vercel
2. Ajoutez les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3. Lancez le déploiement (commande de build : `npm run build`, dossier de sortie : `dist`)

---

## 🗺️ Pistes d'évolution

Ce projet est une base solide, facilement adaptable à vos besoins :

- [ ] Gestion multi-utilisateurs avec rôles et permissions
- [ ] Gestion des fournisseurs et des commandes d'achat
- [ ] Notifications d'alerte par email
- [ ] Scan de codes-barres
- [ ] Multi-entrepôts / multi-boutiques
- [ ] Export PDF des rapports

---

## 💼 Besoin d'une application sur mesure ?

Ce projet fait partie de mon portfolio. Je suis **développeur freelance** et je conçois des applications web adaptées à votre activité : gestion de stock, tableaux de bord, outils internes, back-offices…

<!--
✏️ À PERSONNALISER : remplacez les liens ci-dessous par vos vrais contacts
(email professionnel, LinkedIn, portfolio, profil Malt / Upwork / Fiverr…).
-->

- 👤 **Rayane Merzougui**
- 📧 Email : `votre.email@exemple.com`
- 🔗 LinkedIn : [linkedin.com/in/votre-profil](https://linkedin.com/in/votre-profil)
- 🌍 Portfolio : [votre-site.com](https://votre-site.com)

---

## 📄 Licence

<!-- À adapter : MIT si vous acceptez la réutilisation, ou « Tous droits réservés » pour un projet vitrine. -->

Ce projet est présenté à titre de démonstration. Contactez-moi pour toute réutilisation ou adaptation commerciale.
