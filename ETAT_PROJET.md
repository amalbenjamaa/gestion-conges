# 📊 État Actuel du Projet - Gestion des Congés

## ✅ CE QUI EXISTE DÉJÀ

### 🗄️ **Base de données (MySQL)**
- ✅ Schéma complet avec toutes les tables nécessaires :
  - `roles` (employe, manager, admin)
  - `utilisateurs` (avec solde_total, solde_consomme)
  - `types_conges` (Congé Payé, Maladie, RTT, etc.)
  - `demandes` (table centrale)
  - `pieces_jointes` (pour uploads)
  - `historique_soldes` (audit)
  - `audit_demandes` (log des actions)
  - `jours_feries` (pour calculs)
- ✅ Données initiales (seed) : rôles et types de congés

### 🔧 **Backend PHP**
- ✅ Structure de base avec `Database.php`, `Helpers.php`, `RequestController.php`
- ✅ API REST fonctionnelle :
  - `GET /api/requests` - Liste des demandes (avec filtres user_id, status)
  - `GET /api/requests/:id` - Détail d'une demande
  - `POST /api/requests` - Créer une demande
  - `PATCH /api/requests/:id/status` - Valider/Refuser une demande
  - `GET /api/stats` - Statistiques pour le dashboard
- ✅ Calcul automatique des jours entre dates
- ✅ Gestion des transactions (validation avec vérification de solde)
- ✅ Audit trail (enregistrement des actions)
- ✅ CORS configuré pour le frontend

### 🎨 **Frontend React**
- ✅ Structure complète avec React Router
- ✅ Composants de base :
  - `Layout.jsx` - Layout principal
  - `Sidebar.jsx` - Navigation latérale
  - `Header.jsx` - En-tête avec profil
  - `SuiviCollaborateurs.jsx` - Tableau de suivi
- ✅ Pages implémentées :
  - `Dashboard.jsx` - Tableau de bord avec KPI et graphiques
  - `NouvelleDemande.jsx` - Formulaire de création
  - `MesDemandes.jsx` - Historique utilisateur
  - `Validation.jsx` - Page manager pour valider/refuser
  - `Calendrier.jsx` - Structure de base (vide)
  - `Login.jsx` - Page de connexion
- ✅ Graphiques Chart.js :
  - Graphique en barres (évolution mensuelle)
  - Graphique en donut (répartition par type)
- ✅ Design Tailwind CSS professionnel
- ✅ Badges colorés pour les statuts
- ✅ Routes protégées (redirection si non connecté)

---

## ❌ CE QUI MANQUE POUR UN PROJET COMPLET

### 🔐 **1. Authentification Réelle**
**Problème actuel :** Login simulé (hardcodé userId=1)

**À implémenter :**
- [ ] Endpoint backend `/api/login` pour authentification
- [ ] Vérification du mot de passe (password_verify)
- [ ] Gestion des sessions ou JWT
- [ ] Récupération du rôle utilisateur depuis la DB
- [ ] Protection des routes selon le rôle (manager vs employé)

### 📅 **2. Calendrier d'Équipe (Fonctionnalité Bonus)**
**Problème actuel :** Page vide avec juste un placeholder

**À implémenter :**
- [ ] Installer `react-big-calendar` ou `react-calendar`
- [ ] Endpoint API pour récupérer les congés validés par période
- [ ] Affichage mensuel avec les absences
- [ ] Visualisation des chevauchements
- [ ] Filtres par équipe/département

### 📤 **3. Upload de Pièces Jointes**
**Problème actuel :** Champ absent du formulaire, pas de gestion de fichiers

**À implémenter :**
- [ ] Champ file input dans `NouvelleDemande.jsx`
- [ ] Endpoint backend `/api/upload` pour recevoir les fichiers
- [ ] Stockage des fichiers (dossier `backend/uploads/`)
- [ ] Enregistrement dans la table `pieces_jointes`
- [ ] Vérification du type de fichier et taille
- [ ] Affichage/téléchargement des pièces jointes dans les listes

### 📊 **4. Graphiques Séparés (Selon votre demande)**
**Problème actuel :** Graphiques intégrés dans le Dashboard

**À implémenter :**
- [ ] Nouvelle page `/statistiques` ou `/graphiques`
- [ ] Déplacer les graphiques vers cette nouvelle page
- [ ] Ajouter un lien dans la sidebar
- [ ] Améliorer les graphiques avec plus de détails

### 📄 **5. Export PDF/Excel (Fonctionnalité Bonus)**
**Problème actuel :** Bouton "Export" présent mais non fonctionnel

**À implémenter :**
- [ ] Bibliothèque PHP pour génération PDF (ex: TCPDF, FPDF)
- [ ] Bibliothèque PHP pour Excel (ex: PhpSpreadsheet)
- [ ] Endpoint `/api/export/pdf` et `/api/export/excel`
- [ ] Génération de rapports (liste des congés, statistiques)
- [ ] Bouton fonctionnel dans `SuiviCollaborateurs.jsx`

### 🔔 **6. Notifications en Temps Réel (Fonctionnalité Bonus)**
**Problème actuel :** Pas de notifications

**À implémenter :**
- [ ] Installer `react-toastify` ou système de notifications custom
- [ ] Notifications lors de validation/refus
- [ ] Notifications pour nouvelles demandes (manager)
- [ ] Badge de notification dans le header

### 🧮 **7. Calcul Automatique des Jours Fériés**
**Problème actuel :** Calcul simple (date_fin - date_debut + 1)

**À implémenter :**
- [ ] Endpoint pour récupérer les jours fériés depuis la DB
- [ ] Fonction PHP pour exclure les jours fériés du calcul
- [ ] Exclure les weekends du calcul
- [ ] Afficher le calcul en temps réel dans le formulaire

### 👥 **8. Gestion des Rôles et Permissions**
**Problème actuel :** Pas de distinction manager/employé dans l'interface

**À implémenter :**
- [ ] Vérification du rôle utilisateur après login
- [ ] Masquer/Afficher des éléments selon le rôle
  - Page "Validation" visible uniquement pour managers
  - Boutons d'action conditionnels
- [ ] Middleware backend pour vérifier les permissions

### 🔍 **9. Fonctionnalités Manquantes dans les Pages Existantes**

#### **Dashboard :**
- [ ] Filtre de date global (période des statistiques)
- [ ] Graphique "Proportion Validé / Refusé" (anneau)
- [ ] Calcul réel des "Présents aujourd'hui" et "En congé"
- [ ] Bouton "Voir Historique" dans le tableau Suivi Collaborateurs

#### **Nouvelle Demande :**
- [ ] Upload de pièce jointe
- [ ] Validation côté client (dates cohérentes)
- [ ] Calcul automatique du nombre de jours (avec jours fériés)
- [ ] Toast de confirmation (au lieu d'alerte)

#### **Mes Demandes :**
- [ ] Filtres par statut et date
- [ ] Tri des colonnes
- [ ] Pagination si beaucoup de demandes
- [ ] Affichage des pièces jointes si présentes

#### **Validation :**
- [ ] Modal de confirmation (au lieu d'actions inline)
- [ ] Affichage de l'avatar et nom complet de l'employé
- [ ] Vérification du solde avant validation (affichage)
- [ ] Commentaire obligatoire pour refus

#### **Suivi Collaborateurs :**
- [ ] Recherche fonctionnelle
- [ ] Filtres (par statut, département)
- [ ] Export fonctionnel
- [ ] Calcul réel du statut (Présent/En congé/Maladie)
- [ ] Récupération des données depuis un endpoint dédié `/api/collaborateurs`

### 🗃️ **10. Endpoints API Manquants**

- [ ] `POST /api/login` - Authentification
- [ ] `GET /api/collaborateurs` - Liste complète avec soldes réels
- [ ] `GET /api/users/:id` - Détails d'un utilisateur
- [ ] `POST /api/upload` - Upload de fichier
- [ ] `GET /api/feries` - Liste des jours fériés
- [ ] `GET /api/calendar` - Données pour le calendrier (congés par période)
- [ ] `GET /api/export/pdf` - Export PDF
- [ ] `GET /api/export/excel` - Export Excel

### 🧪 **11. Tests et Qualité**
- [ ] Tests unitaires backend (PHPUnit)
- [ ] Tests d'intégration API
- [ ] Validation des données côté backend
- [ ] Gestion des erreurs complète
- [ ] Logs d'erreurs

### 🚀 **12. Déploiement et CI**
- [ ] Configuration pour production
- [ ] Variables d'environnement
- [ ] Scripts de déploiement
- [ ] CI/CD (optionnel)

---

## 🎯 PRIORITÉS RECOMMANDÉES

### **Priorité 1 - Essentiel pour MVP :**
1. ✅ Authentification réelle (`/api/login`)
2. ✅ Gestion des rôles (affichage conditionnel)
3. ✅ Calcul automatique des jours (exclure weekends/jours fériés)
4. ✅ Endpoint `/api/collaborateurs` pour données réelles

### **Priorité 2 - Amélioration UX :**
5. ✅ Upload de pièces jointes
6. ✅ Notifications toast
7. ✅ Modal de confirmation dans Validation
8. ✅ Filtres et recherche fonctionnels

### **Priorité 3 - Fonctionnalités Bonus :**
9. ✅ Calendrier d'équipe interactif
10. ✅ Export PDF/Excel
11. ✅ Graphiques sur page séparée
12. ✅ Notifications en temps réel

---

## 📝 NOTES IMPORTANTES

- Le `userId` est actuellement hardcodé à `1` dans plusieurs endroits
- Les graphiques utilisent `/api/stats` mais pourraient être améliorés
- Le tableau "Suivi Collaborateurs" calcule les soldes depuis les demandes, mais devrait utiliser les données réelles de la table `utilisateurs`
- La vue SQL `vue_demandes_par_mois` mentionnée n'est pas encore créée dans `db.sql`

