# Guide d'Intégration de votre Base de Données

Ce guide explique comment intégrer votre propre base de données dans l'application de gestion des congés.

## 📋 Prérequis

1. **Base de données MySQL** créée
2. **Structure des tables** identique à celle définie dans `backend/db.sql`
3. **Utilisateurs avec rôles** (`employe` ou `manager`)

## 🔧 Étape 1 : Réinitialiser la Base de Données

Si tu veux supprimer tous les utilisateurs existants et recommencer :

```bash
mysql -u root -p gestion_conges < backend/scripts/reset_database.sql
```

Ou via phpMyAdmin/MySQL Workbench : exécuter le contenu de `backend/scripts/reset_database.sql`

## 📊 Étape 2 : Vérifier la Structure de la Base

Assure-toi que ta base de données a bien cette structure :

### Tables requises :

1. **`roles`** : Rôles des utilisateurs
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `nom` (VARCHAR(50), UNIQUE) - Valeurs possibles : `'employe'` ou `'manager'`
   - `cree_le` (TIMESTAMP)

2. **`utilisateurs`** : Utilisateurs de l'application
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `nom_complet` (VARCHAR(150), NOT NULL)
   - `email` (VARCHAR(200), UNIQUE, NOT NULL)
   - `mot_de_passe` (VARCHAR(255)) - Hash PHP `password_hash()`
   - `role_id` (INT, NOT NULL, FOREIGN KEY vers `roles.id`)
   - `avatar_url` (VARCHAR(512), NULL)
   - `solde_total` (INT, DEFAULT 0) - Quota annuel de jours de congés
   - `solde_consomme` (INT, DEFAULT 0) - Jours déjà consommés
   - `cree_le` (TIMESTAMP)

3. **`types_conges`** : Types de congés disponibles
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `nom` (VARCHAR(100), UNIQUE)
   - `piece_jointe_requise` (TINYINT(1), DEFAULT 0)
   - `couleur` (VARCHAR(7)) - Code couleur hex pour l'interface
   - `cree_le` (TIMESTAMP)

4. **`demandes`** : Demandes de congés
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `utilisateur_id` (INT, FOREIGN KEY vers `utilisateurs.id`)
   - `type_id` (INT, FOREIGN KEY vers `types_conges.id`)
   - `date_debut` (DATE)
   - `date_fin` (DATE)
   - `nb_jours` (INT) - Calculé automatiquement par le backend
   - `motif` (TEXT, NULL)
   - `statut` (ENUM ou VARCHAR) - Valeurs possibles : `'en_attente'`, `'validee'`, `'refusee'`, `'annulee'`
   - `date_demande` (TIMESTAMP)
   - `piece_jointe_id` (INT, NULL, FOREIGN KEY vers `pieces_jointes.id`)

5. **`pieces_jointes`** : Fichiers joints aux demandes
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `nom_fichier` (VARCHAR(255))
   - `chemin_fichier` (VARCHAR(1024))
   - `type_mime` (VARCHAR(100), NULL)
   - `taille` (INT, NULL)
   - `telecharge_par` (INT, NULL, FOREIGN KEY vers `utilisateurs.id`)
   - `telecharge_le` (TIMESTAMP)

6. **`audit_demandes`** : Historique des actions sur les demandes
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `demande_id` (INT, FOREIGN KEY vers `demandes.id`)
   - `action` (VARCHAR(50)) - Ex: `'creation'`, `'changement_statut'`
   - `fait_par` (INT, FOREIGN KEY vers `utilisateurs.id`)
   - `commentaire` (TEXT, NULL)
   - `cree_le` (TIMESTAMP)

7. **`historique_soldes`** : Historique des modifications de soldes
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `utilisateur_id` (INT, FOREIGN KEY vers `utilisateurs.id`)
   - `solde_avant` (INT)
   - `solde_apres` (INT)
   - `raison` (VARCHAR(255))
   - `cree_le` (TIMESTAMP)

8. **`jours_feries`** : Jours fériés
   - `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `date` (DATE, UNIQUE)
   - `nom` (VARCHAR(150))
   - `cree_le` (TIMESTAMP)

## 👥 Étape 3 : Créer les Rôles

Assure-toi d'avoir ces rôles dans la table `roles` :

```sql
INSERT IGNORE INTO roles (id, nom) VALUES
  (1, 'employe'),
  (2, 'manager');
```

## 📝 Étape 4 : Créer les Types de Congés

Les types de congés doivent exister :

```sql
INSERT IGNORE INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),
  (2, 'Maladie', 1, '#f97316'),
  (3, 'Sans Solde', 0, '#ef4444'),
  (4, 'RTT', 0, '#3b82f6'),
  (5, 'Événement Familial', 0, '#8b5cf6');
```

## 🔐 Étape 5 : Créer vos Utilisateurs

### Option A : Via le script PHP (recommandé)

```bash
php backend/scripts/create_user.php
```

Le script te demandera :
- Nom complet
- Email
- Mot de passe (sera hashé automatiquement)
- Rôle (1 = employe, 2 = manager)
- Solde total

### Option B : Manuellement dans MySQL

#### Créer un hash de mot de passe (PHP)

```php
<?php
echo password_hash('ton_mot_de_passe', PASSWORD_DEFAULT);
?>
```

#### Insérer l'utilisateur

```sql
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme) VALUES
  ('Nom Prénom', 'email@example.com', '$2y$10$hash_genere_par_php', 1, 25, 0);
```

**Important** : 
- `role_id = 1` → employé
- `role_id = 2` → manager
- `solde_total` = nombre de jours de congés alloués par an
- `solde_consomme` = jours déjà pris (généralement 0 au départ)

## 🔍 Étape 6 : Vérifier la Configuration

Vérifie que `backend/config.ini` contient les bonnes informations :

```ini
[database]
host = localhost
name = gestion_conges
user = root
pass = ton_mot_de_passe
port = 3306
```

## 🧪 Étape 7 : Tester l'Application

1. **Démarrer le backend** :
   ```bash
   cd backend/public
   php -S localhost:8000
   ```

2. **Démarrer le frontend** :
   ```bash
   cd frontend
   npm run dev
   ```

3. **Se connecter** :
   - Ouvrir `http://localhost:5173`
   - Utiliser l'email et le mot de passe d'un utilisateur créé

## 📊 Fonctionnalités par Rôle

### Pour un **EMPLOYÉ** (`role_id = 1`) :
- ✅ Dashboard → Mes Demandes
- ✅ Créer une nouvelle demande
- ✅ Voir le calendrier d'équipe
- ❌ Pas d'accès aux Statistiques
- ❌ Pas d'accès à la Validation
- ❌ Pas d'accès à la Gestion des Profils

### Pour un **MANAGER** (`role_id = 2`) :
- ✅ Dashboard → Liste des collaborateurs
- ✅ Voir les statistiques
- ✅ Valider/refuser les demandes
- ✅ Gérer les profils des employés
- ✅ Voir le calendrier d'équipe
- ❌ Pas d'accès à "Mes Demandes"

## 🔄 Comment ça fonctionne

### Flux de validation d'une demande :

1. **Employé crée une demande** → `POST /api/requests`
   - Statut initial : `'en_attente'`
   - Nombre de jours calculé automatiquement

2. **Manager valide** → `PATCH /api/requests/:id/status`
   - Statut changé à `'validee'`
   - `solde_consomme` de l'employé mis à jour automatiquement
   - La demande apparaît dans le calendrier
   - Les statistiques se mettent à jour

3. **Refus** → Statut changé à `'refusee'`
   - Le solde n'est pas modifié

### Calcul automatique des jours :

Le backend calcule automatiquement le nombre de jours entre `date_debut` et `date_fin` (inclusif) :
- Exemple : du 1er au 5 octobre = 5 jours

### Mise à jour des soldes :

- **Validation** : `solde_consomme += nb_jours`
- **Refus d'une demande validée** : `solde_consomme -= nb_jours`
- **Solde restant** : `solde_total - solde_consomme`

## 🐛 Vérifications de Base

### Si l'authentification ne fonctionne pas :

1. Vérifie que le mot de passe est bien hashé avec `password_hash()`
2. Vérifie que l'email existe dans la base
3. Vérifie les logs du backend (erreurs PHP)

### Si les données ne s'affichent pas :

1. Vérifie que le backend tourne sur `http://localhost:8000`
2. Vérifie les erreurs dans la console du navigateur (F12)
3. Vérifie les CORS dans `backend/public/index.php`

### Si les rôles ne fonctionnent pas :

1. Vérifie que les rôles dans la base sont exactement `'employe'` et `'manager'` (minuscules)
2. Vérifie que `role_id` correspond bien aux IDs dans la table `roles`

## 📝 Exemple Complet : Créer un Manager

```sql
-- 1. Générer le hash (via PHP ou en ligne : https://www.php.net/manual/fr/function.password-hash.php)
-- Exemple de hash pour "password123" : $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- 2. Insérer le manager
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme) VALUES
  ('Manager Test', 'manager@entreprise.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 25, 0);

-- 3. Vérifier
SELECT u.id, u.nom_complet, u.email, r.nom as role FROM utilisateurs u JOIN roles r ON r.id = u.role_id;
```

## ✅ Checklist d'Intégration

- [ ] Base de données créée avec la structure complète
- [ ] Rôles `employe` et `manager` créés
- [ ] Types de congés créés
- [ ] Au moins 1 utilisateur manager créé
- [ ] Au moins 1 utilisateur employé créé
- [ ] Configuration `backend/config.ini` correcte
- [ ] Backend démarré sur port 8000
- [ ] Frontend démarré sur port 5173
- [ ] Test de connexion réussi
- [ ] Test de création de demande réussi
- [ ] Test de validation de demande réussi

## 🔗 Fichiers Importants

- `backend/db.sql` : Structure complète de la base
- `backend/config.ini` : Configuration de connexion
- `backend/scripts/reset_database.sql` : Réinitialiser la base
- `backend/scripts/create_user.php` : Créer un utilisateur
- `backend/public/index.php` : Point d'entrée API
- `frontend/src/App.jsx` : Routing et authentification

## 💡 Prochaines Étapes

Une fois ta base intégrée :
1. Teste toutes les fonctionnalités
2. Crée quelques demandes de test
3. Valide/refuse des demandes pour voir les mises à jour automatiques
4. Explore la gestion des profils
5. Vérifie les statistiques

En cas de problème, vérifie les logs du backend et la console du navigateur !


