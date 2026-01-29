# 🔄 Explication : Réinitialisation de la Base de Données

## 📊 1. Réinitialiser les Compteurs AUTO_INCREMENT

### Qu'est-ce que AUTO_INCREMENT ?

Quand tu crées une table avec `id INT AUTO_INCREMENT PRIMARY KEY`, MySQL génère automatiquement un numéro unique pour chaque nouvel enregistrement.

**Exemple** :
```sql
INSERT INTO utilisateurs (nom_complet, email) VALUES ('Jean', 'jean@test.com');
-- MySQL attribue automatiquement id = 1

INSERT INTO utilisateurs (nom_complet, email) VALUES ('Marie', 'marie@test.com');
-- MySQL attribue automatiquement id = 2

INSERT INTO utilisateurs (nom_complet, email) VALUES ('Paul', 'paul@test.com');
-- MySQL attribue automatiquement id = 3
```

Si tu supprimes tous les utilisateurs avec `DELETE FROM utilisateurs`, les données sont supprimées **MAIS** le compteur AUTO_INCREMENT continue de 4, 5, 6...

**Exemple après DELETE** :
```sql
DELETE FROM utilisateurs;  -- Supprime tous les utilisateurs

-- Le compteur AUTO_INCREMENT reste à 4
INSERT INTO utilisateurs (nom_complet, email) VALUES ('Nouveau', 'nouveau@test.com');
-- Le nouvel utilisateur aura id = 4 (et non pas id = 1) !
```

### Solution : Réinitialiser le compteur

Pour remettre le compteur à 1, on utilise :

```sql
ALTER TABLE nom_table AUTO_INCREMENT = 1;
```

**Exemple complet** :
```sql
-- Supprimer tous les utilisateurs
DELETE FROM utilisateurs;

-- Remettre le compteur à 1
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;

-- Maintenant, le prochain utilisateur aura id = 1
INSERT INTO utilisateurs (nom_complet, email) VALUES ('Nouveau', 'nouveau@test.com');
-- Le nouvel utilisateur aura id = 1 ✅
```

### Pourquoi c'est important ?

1. **Propreté** : Les IDs commencent à 1 au lieu de 100, 200...
2. **Test** : Facilite les tests avec des IDs prévisibles
3. **Base propre** : C'est plus propre de recommencer à 1

### Dans notre script

```sql
-- Supprimer tous les utilisateurs
DELETE FROM utilisateurs;
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;  -- ← Remet le compteur à 1

-- Supprimer toutes les demandes
DELETE FROM demandes;
ALTER TABLE demandes AUTO_INCREMENT = 1;  -- ← Remet le compteur à 1

-- Et ainsi de suite pour chaque table
```

---

## 🎭 2. Remettre en Place les Rôles de Base

### Pourquoi supprimer et recréer les rôles ?

Les rôles sont essentiels au fonctionnement de l'application. Il faut s'assurer qu'ils existent avec les bons IDs.

### Processus étape par étape

#### Étape 1 : Supprimer tous les rôles existants

```sql
DELETE FROM roles;
ALTER TABLE roles AUTO_INCREMENT = 1;
```

**Important** : On désactive temporairement les contraintes de clés étrangères car `utilisateurs.role_id` référence `roles.id`.

```sql
SET FOREIGN_KEY_CHECKS = 0;  -- Désactive la vérification des clés étrangères
DELETE FROM roles;
SET FOREIGN_KEY_CHECKS = 1;  -- Réactive la vérification
```

#### Étape 2 : Recréer les rôles avec des IDs fixes

```sql
INSERT INTO roles (id, nom) VALUES
  (1, 'employe'),   -- ← ID fixe = 1
  (2, 'manager'); -- ← ID fixe = 2
```

**Pourquoi spécifier les IDs ?**
- Pour garantir que `employe` a toujours `id = 1`
- Pour garantir que `manager` a toujours `id = 2`
- C'est important car d'autres tables référencent ces IDs

### Structure de la table roles

```sql
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,  -- ← Auto-incrémenté, mais on spécifie les valeurs
  nom VARCHAR(50) NOT NULL UNIQUE,    -- ← 'employe' ou 'manager'
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vérification

Après l'insertion, tu peux vérifier :

```sql
SELECT * FROM roles;
```

**Résultat attendu** :
```
+----+----------+---------------------+
| id | nom      | cree_le             |
+----+----------+---------------------+
|  1 | employe  | 2024-10-XX XX:XX:XX |
|  2 | manager  | 2024-10-XX XX:XX:XX |
+----+----------+---------------------+
```

---

## 📝 3. Remettre en Place les Types de Congés de Base

### Types de congés nécessaires

L'application a besoin de 5 types de congés de base :
1. **Congé Payé** (id = 1) - Vert `#10b981`
2. **Maladie** (id = 2) - Orange `#f97316` (pièce jointe requise)
3. **Sans Solde** (id = 3) - Rouge `#ef4444`
4. **RTT** (id = 4) - Bleu `#3b82f6`
5. **Événement Familial** (id = 5) - Violet `#8b5cf6`

### Processus

#### Utilisation de INSERT IGNORE

```sql
INSERT IGNORE INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),
  (2, 'Maladie', 1, '#f97316'),
  (3, 'Sans Solde', 0, '#ef4444'),
  (4, 'RTT', 0, '#3b82f6'),
  (5, 'Événement Familial', 0, '#8b5cf6');
```

**Pourquoi `INSERT IGNORE` ?**
- Si le type existe déjà → **IGNORE** (ne fait rien, pas d'erreur)
- Si le type n'existe pas → **INSERT** (crée le type)

**Alternative sans IGNORE** :
```sql
-- Si tu veux forcer la mise à jour même si ça existe
INSERT INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),
  ...
ON DUPLICATE KEY UPDATE 
  nom = VALUES(nom),
  piece_jointe_requise = VALUES(piece_jointe_requise),
  couleur = VALUES(couleur);
```

### Structure de la table types_conges

```sql
CREATE TABLE types_conges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,  -- ← Unique : un seul "Congé Payé"
  piece_jointe_requise TINYINT(1) NOT NULL DEFAULT 0,  -- ← 0 ou 1 (boolean)
  couleur VARCHAR(7) DEFAULT '#3b82f6',  -- ← Code couleur hex pour l'interface
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Explication des champs

- **`nom`** : Nom du type (affiché dans l'interface)
- **`piece_jointe_requise`** : 
  - `0` = Pas de pièce jointe nécessaire
  - `1` = Pièce jointe obligatoire (ex: arrêt maladie)
- **`couleur`** : Code couleur hexadécimal pour l'affichage dans le calendrier/interface
- **`id`** : ID fixe pour référence dans `demandes.type_id`

### Vérification

```sql
SELECT * FROM types_conges ORDER BY id;
```

**Résultat attendu** :
```
+----+----------------------+------------------------+---------+---------------------+
| id | nom                 | piece_jointe_requise    | couleur | cree_le             |
+----+----------------------+------------------------+---------+---------------------+
|  1 | Congé Payé           | 0                      | #10b981 | 2024-10-XX XX:XX:XX |
|  2 | Maladie              | 1                      | #f97316 | 2024-10-XX XX:XX:XX |
|  3 | Sans Solde           | 0                      | #ef4444 | 2024-10-XX XX:XX:XX |
|  4 | RTT                  | 0                      | #3b82f6 | 2024-10-XX XX:XX:XX |
|  5 | Événement Familial   | 0                      | #8b5cf6 | 2024-10-XX XX:XX:XX |
+----+----------------------+------------------------+---------+---------------------+
```

---

## 🔧 Script Complet Expliqué

Voici le script `reset_database.sql` ligne par ligne :

```sql
USE gestion_conges;

-- ==========================================
-- ÉTAPE 1 : Désactiver les contraintes
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;
-- ⚠️ Important : Permet de supprimer des données même si d'autres tables y font référence

-- ==========================================
-- ÉTAPE 2 : Supprimer les données
-- ==========================================
DELETE FROM demandes;              -- Supprime toutes les demandes
ALTER TABLE demandes AUTO_INCREMENT = 1;  -- Remet le compteur à 1

DELETE FROM utilisateurs;          -- Supprime tous les utilisateurs
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;  -- Remet le compteur à 1

DELETE FROM historique_soldes;     -- Supprime l'historique
ALTER TABLE historique_soldes AUTO_INCREMENT = 1;

DELETE FROM pieces_jointes;        -- Supprime les fichiers joints
ALTER TABLE pieces_jointes AUTO_INCREMENT = 1;

-- ==========================================
-- ÉTAPE 3 : Réactiver les contraintes
-- ==========================================
SET FOREIGN_KEY_CHECKS = 1;
-- ✅ Réactive la vérification des clés étrangères

-- ==========================================
-- ÉTAPE 4 : Recréer les rôles
-- ==========================================
DELETE FROM roles;
ALTER TABLE roles AUTO_INCREMENT = 1;
-- Supprime tous les rôles et remet le compteur à 1

INSERT INTO roles (id, nom) VALUES
  (1, 'employe'),   -- Crée le rôle employé avec ID = 1
  (2, 'manager');   -- Crée le rôle manager avec ID = 2
-- ✅ Les rôles sont maintenant prêts

-- ==========================================
-- ÉTAPE 5 : Recréer les types de congés
-- ==========================================
INSERT IGNORE INTO types_conges (id, nom, piece_jointe_requise, couleur) VALUES
  (1, 'Congé Payé', 0, '#10b981'),
  (2, 'Maladie', 1, '#f97316'),
  (3, 'Sans Solde', 0, '#ef4444'),
  (4, 'RTT', 0, '#3b82f6'),
  (5, 'Événement Familial', 0, '#8b5cf6');
-- ✅ Les types de congés sont maintenant prêts

-- ==========================================
-- ÉTAPE 6 : Vérification
-- ==========================================
SELECT 'Base de données réinitialisée avec succès!' as message;
SELECT 'Rôles disponibles:' as info;
SELECT * FROM roles;
SELECT 'Types de congés disponibles:' as info;
SELECT * FROM types_conges;
-- ✅ Affiche un résumé pour confirmer que tout est OK
```

---

## 🎯 Résumé en Points Clés

### AUTO_INCREMENT
- **Problème** : `DELETE` supprime les données mais pas le compteur
- **Solution** : `ALTER TABLE nom_table AUTO_INCREMENT = 1;`
- **Résultat** : Les nouveaux enregistrements commencent à ID = 1

### Rôles
- **Action** : `DELETE` puis `INSERT` avec IDs fixes
- **IDs fixes** : `1 = employe`, `2 = manager`
- **Important** : Les autres tables référencent ces IDs

### Types de Congés
- **Action** : `INSERT IGNORE` pour éviter les doublons
- **5 types** : Congé Payé, Maladie, Sans Solde, RTT, Événement Familial
- **IDs fixes** : 1 à 5 pour correspondre au frontend

---

## 🧪 Test du Script

Pour tester si le script fonctionne :

```bash
# Exécuter le script
mysql -u root -p gestion_conges < backend/scripts/reset_database.sql

# Vérifier les rôles
mysql -u root -p gestion_conges -e "SELECT * FROM roles;"

# Vérifier les types
mysql -u root -p gestion_conges -e "SELECT * FROM types_conges;"

# Vérifier que les utilisateurs sont supprimés
mysql -u root -p gestion_conges -e "SELECT COUNT(*) as nb_utilisateurs FROM utilisateurs;"
-- Résultat attendu : 0
```

---

## 💡 Astuces

### Réinitialiser une seule table

```sql
-- Pour une seule table (ex: utilisateurs)
DELETE FROM utilisateurs;
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;
```

### Réinitialiser sans supprimer les rôles/types

Si tu veux juste supprimer les utilisateurs et demandes mais garder les rôles/types :

```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM demandes;
DELETE FROM utilisateurs;
ALTER TABLE demandes AUTO_INCREMENT = 1;
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;
-- Les rôles et types restent intacts
```

### Vérifier le prochain AUTO_INCREMENT

```sql
SHOW TABLE STATUS LIKE 'utilisateurs';
-- Regarde la colonne "Auto_increment" pour voir le prochain ID
```

---

Voilà ! Tu comprends maintenant comment fonctionnent ces opérations. 🎉



