# 🚀 Quick Start - Intégrer ta Base de Données

Guide rapide pour intégrer ta propre base de données.

## ⚡ Étapes Rapides

### 1. Réinitialiser la base (supprimer tous les utilisateurs)

```bash
mysql -u root -p gestion_conges < backend/scripts/reset_database.sql
```

**Ou via phpMyAdmin/MySQL Workbench** : Ouvrir et exécuter le fichier `backend/scripts/reset_database.sql`

### 2. Vérifier l'état de la base

```bash
mysql -u root -p gestion_conges < backend/scripts/verifier_base.sql
```

### 3. Créer ton premier manager

```bash
php backend/scripts/create_user.php
```

Le script te demandera :
- Nom complet
- Email
- Mot de passe
- Rôle : `2` (pour manager)
- Quota annuel : `25` (ou autre)
- Jours consommés : `0`

### 4. Créer ton premier employé

```bash
php backend/scripts/create_user.php
```

Rôle : `1` (pour employé)

### 5. Démarrer l'application

**Terminal 1 - Backend** :
```bash
cd backend/public
php -S localhost:8000
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm run dev
```

### 6. Se connecter

Ouvre `http://localhost:5173` et connecte-toi avec l'email et mot de passe de ton manager ou employé.

## 📊 Structure Minimale Requise

Ta base de données doit avoir :

### Tables essentielles :
- ✅ `roles` : Avec au moins `'employe'` et `'manager'`
- ✅ `utilisateurs` : Tes utilisateurs avec `role_id`, `solde_total`, etc.
- ✅ `types_conges` : Types de congés disponibles
- ✅ `demandes` : Vide au départ

### Données minimales :

**Rôles** :
```sql
INSERT IGNORE INTO roles (id, nom) VALUES (1, 'employe'), (2, 'manager');
```

**Types de congés** :
```sql
INSERT IGNORE INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),
  (2, 'Maladie', 1, '#f97316'),
  (3, 'Sans Solde', 0, '#ef4444'),
  (4, 'RTT', 0, '#3b82f6'),
  (5, 'Événement Familial', 0, '#8b5cf6');
```

## 🔑 Créer un Utilisateur Manuellement (Alternative)

Si tu préfères créer un utilisateur directement en SQL :

### 1. Générer un hash de mot de passe

**Option A - En ligne** :
- Aller sur https://www.php.net/manual/fr/function.password-hash.php
- Ou utiliser un outil en ligne pour générer un hash

**Option B - Via PHP** :
```php
<?php
echo password_hash('ton_mot_de_passe', PASSWORD_DEFAULT);
?>
```

### 2. Insérer l'utilisateur

```sql
INSERT INTO utilisateurs (nom_complet, email, mot_de_passe, role_id, solde_total, solde_consomme) VALUES
  ('Ton Nom', 'email@example.com', '$2y$10$hash_genere', 2, 25, 0);
```

**Rôles** :
- `role_id = 1` → Employé
- `role_id = 2` → Manager

**Exemple de hash pour "password123"** :
```
$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

## ✅ Vérification Rapide

### Les données sont correctes si :

1. ✅ La requête suivante retourne tes utilisateurs :
```sql
SELECT u.id, u.nom_complet, u.email, r.nom as role 
FROM utilisateurs u 
JOIN roles r ON r.id = u.role_id;
```

2. ✅ Tu peux te connecter avec l'email/mot de passe

3. ✅ Le dashboard affiche les bonnes informations selon le rôle

## 🐛 Problèmes Courants

### "Identifiants invalides" à la connexion
- ✅ Vérifie que le mot de passe est bien hashé avec `password_hash()`
- ✅ Vérifie que l'email existe exactement dans la base (sensible à la casse pour l'email)

### "403 Forbidden" sur Validation
- ✅ Vérifie que le rôle est bien `'manager'` (en minuscules)
- ✅ Vérifie que `role_id = 2` dans la table `roles`

### Pas de données dans le dashboard
- ✅ Vérifie que le backend tourne sur `http://localhost:8000`
- ✅ Ouvre la console du navigateur (F12) pour voir les erreurs
- ✅ Vérifie que `backend/config.ini` a les bonnes infos de connexion

### Erreur CORS
- ✅ Vérifie que le frontend tourne sur `http://localhost:5173`
- ✅ Vérifie les CORS dans `backend/public/index.php`

## 📝 Checklist Avant de Commencer

- [ ] Base de données `gestion_conges` créée
- [ ] Structure complète importée depuis `backend/db.sql`
- [ ] Rôles `employe` et `manager` créés
- [ ] Types de congés créés
- [ ] Au moins 1 manager créé
- [ ] `backend/config.ini` configuré avec tes identifiants MySQL
- [ ] Backend démarré
- [ ] Frontend démarré

## 🎯 Test Rapide

1. Connecte-toi en manager
2. Crée un employé via "Gestion Profils"
3. Connecte-toi en employé
4. Crée une demande de congé
5. Reconnecte-toi en manager
6. Valide la demande
7. Vérifie qu'elle apparaît dans le calendrier

**C'est bon si tout ça fonctionne !** 🎉

## 📚 Documentation Complète

Pour plus de détails, voir `GUIDE_INTEGRATION_BASE_DONNEES.md`



