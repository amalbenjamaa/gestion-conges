# Mise à jour : Employés réels dans MySQL

## ✅ Ce qui a été fait

### Backend

1. **Nouveaux endpoints API** :
   - `GET /api/collaborateurs` : Liste tous les employés avec leurs soldes calculés depuis MySQL
   - `GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD` : Récupère les événements de congés validés pour le calendrier
   - `GET /api/stats` : Statistiques réelles (total employés, présents, en congé, demandes en attente, répartition par type, évolution mensuelle)

2. **Améliorations** :
   - `listRequests()` : Joint maintenant avec `utilisateurs` et `types_conges` pour afficher les noms complets et types
   - `updateStatus()` : Vérification du rôle manager avant validation (403 si pas manager)
   - Support du paramètre `user_id` dans `listRequests()` pour filtrer les demandes d'un employé

3. **Rôles** :
   - Suppression complète du rôle "admin" du code
   - Seuls "manager" et "employe" sont utilisés

### Frontend

1. **Nouveau composant** :
   - `pages/EmployeDetails.jsx` : Page de détails d'un employé avec historique complet de ses congés
   - Route : `/employes/:id` (accessible uniquement aux managers)

2. **Composants modifiés** :
   - `SuiviCollaborateurs.jsx` : Utilise maintenant l'API `/api/collaborateurs` au lieu de données fictives
   - Bouton "Historique" sur chaque ligne qui redirige vers `/employes/:id`
   - `Calendrier.jsx` : Implémentation complète avec `react-big-calendar` et données réelles depuis l'API
   - `Statistiques.jsx` : Utilise les vraies statistiques depuis `/api/stats` avec cartes KPI
   - `MesDemandes.jsx` : Utilise le paramètre `user_id` dans l'API pour filtrer côté serveur
   - `NouvelleDemande.jsx` : Retrait de `utilisateur_id` du body (récupéré automatiquement depuis la session)

3. **Routes** :
   - Ajout de la route `/employes/:id` dans `App.jsx`
   - Toutes les références à "admin" ont été remplacées par "manager"

### Base de données

1. **Script SQL** :
   - `backend/scripts/seed_employes.sql` : Script pour insérer 10 employés de test avec :
     - Mots de passe hashés (mot de passe = "password123" pour tous)
     - Soldes de congés variés
     - Quelques demandes validées pour le calendrier
     - Quelques demandes en attente pour la page Validation

## 📋 Instructions d'utilisation

### 1. Importer les employés dans MySQL

```bash
# Depuis la racine du projet
mysql -u root -p gestion_conges < backend/scripts/seed_employes.sql
```

Ou via phpMyAdmin / MySQL Workbench : exécuter le contenu de `backend/scripts/seed_employes.sql`

### 2. Créer un compte manager

Utilise le script existant :
```bash
php backend/scripts/create_user.php
```

Ou manuellement dans MySQL :
```sql
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme)
VALUES (
  'Manager Test',
  'manager@entreprise.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
  2, -- role_id pour manager
  25,
  0
);
```

### 3. Tester l'application

1. **Compte employé** :
   - Email : `jean.dupont@entreprise.com` (ou n'importe quel employé du script)
   - Mot de passe : `password123`
   - Accès : Dashboard avec ses propres demandes, nouvelle demande, calendrier

2. **Compte manager** :
   - Email : `manager@entreprise.com` (ou celui créé)
   - Mot de passe : `password123`
   - Accès : Dashboard avec liste des employés, validation, statistiques, calendrier

## 🎯 Fonctionnalités

### Pour les employés
- ✅ Voir leurs propres demandes de congés
- ✅ Créer de nouvelles demandes
- ✅ Voir le calendrier d'équipe avec les congés validés
- ✅ Voir les statistiques globales

### Pour les managers
- ✅ Voir la liste complète des employés avec leurs soldes
- ✅ Cliquer sur "Historique" pour voir les détails d'un employé
- ✅ Valider/refuser les demandes en attente
- ✅ Voir les statistiques détaillées
- ✅ Voir le calendrier avec tous les congés validés

## 📝 Notes importantes

1. **Mots de passe** : Tous les employés du script ont le mot de passe `password123`
2. **Soldes** : Les soldes sont calculés automatiquement depuis `solde_total - solde_consomme` dans la base
3. **Statut "En congé"** : Calculé automatiquement si l'employé a une demande validée qui couvre la date du jour
4. **Calendrier** : Affiche uniquement les demandes avec statut `validee`
5. **Validation** : Seuls les managers peuvent valider/refuser (vérification backend + frontend)

## 🔧 Prochaines améliorations possibles

- Mise à jour automatique des soldes lors de validation d'une demande
- Export Excel de la liste des employés
- Filtres avancés sur le calendrier (par employé, par type)
- Notifications en temps réel pour les nouvelles demandes
- Graphiques plus détaillés dans les statistiques


