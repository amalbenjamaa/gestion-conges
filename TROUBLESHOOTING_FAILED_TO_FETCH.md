# 🔧 Résolution du problème "Failed to fetch"

## Symptôme
Le dashboard affiche une erreur rouge : "Erreur serveur - veuillez réessayer plus tard" ou "Failed to fetch"

## Causes possibles

### 1. ✅ Le backend n'est pas démarré
**Vérification :**
```bash
curl http://localhost:8000/api/collaborateurs
```

**Si erreur "Connection refused"**, le backend n'est pas démarré.

**Solution :**
```bash
cd backend/public
php -S localhost:8000
```

---

### 2. ✅ La base de données n'est pas accessible

**Vérification :**
```bash
# Vérifier si MySQL est démarré
sudo systemctl status mysql
# OU sur Windows/Mac
mysqladmin ping
```

**Si MySQL n'est pas démarré :**
```bash
# Linux
sudo systemctl start mysql

# Windows (dans PowerShell admin)
net start MySQL

# Mac
brew services start mysql
```

---

### 3. ✅ Les identifiants de connexion MySQL sont incorrects

**Vérification :**
Tester la connexion avec les identifiants du fichier `backend/config.ini` :

```bash
mysql -h 127.0.0.1 -u root -p gestion_conges
# Entrer le mot de passe (vide si DB_PASS = )
```

**Si erreur "Access denied" :**

**Option A - Modifier le mot de passe root MySQL :**
```bash
# Se connecter en tant que root système
sudo mysql

# Dans MySQL
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

**Option B - Créer un utilisateur dédié :**
```bash
sudo mysql

# Dans MySQL
CREATE USER 'gestion_conges'@'127.0.0.1' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON gestion_conges.* TO 'gestion_conges'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Puis modifier `backend/config.ini` :
```ini
[database]
DB_HOST = 127.0.0.1
DB_NAME = gestion_conges
DB_USER = gestion_conges
DB_PASS = votre_mot_de_passe
DB_PORT = 3306
```

---

### 4. ✅ La base de données n'existe pas

**Vérification :**
```bash
mysql -h 127.0.0.1 -u root -p -e "SHOW DATABASES LIKE 'gestion_conges';"
```

**Si la base n'existe pas :**
```bash
# Créer la base et importer la structure
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE gestion_conges CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -h 127.0.0.1 -u root -p gestion_conges < backend/db.sql
```

---

### 5. ✅ Les tables n'existent pas dans la base

**Vérification :**
```bash
mysql -h 127.0.0.1 -u root -p gestion_conges -e "SHOW TABLES;"
```

**Si aucune table ou tables manquantes :**
```bash
# Réinitialiser complètement la base
mysql -h 127.0.0.1 -u root -p gestion_conges < backend/scripts/reset_database.sql

# OU recréer depuis zéro
mysql -h 127.0.0.1 -u root -p -e "DROP DATABASE IF EXISTS gestion_conges; CREATE DATABASE gestion_conges CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -h 127.0.0.1 -u root -p gestion_conges < backend/db.sql
```

---

### 6. ✅ Les colonnes 'position' ou 'date_naissance' n'existent pas

**Vérification :**
```bash
mysql -h 127.0.0.1 -u root -p gestion_conges -e "DESCRIBE utilisateurs;"
```

**Si les colonnes manquent :**
```bash
# Ajouter la colonne position
mysql -h 127.0.0.1 -u root -p gestion_conges -e "ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL AFTER nom_complet;"

# Ajouter la colonne date_naissance
mysql -h 127.0.0.1 -u root -p gestion_conges -e "ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS date_naissance DATE NULL;"
```

**Note :** Si MySQL < 8.0.16, enlever `IF NOT EXISTS` :
```bash
mysql -h 127.0.0.1 -u root -p gestion_conges -e "ALTER TABLE utilisateurs ADD COLUMN position VARCHAR(100) NULL AFTER nom_complet;"
```

---

## 🧪 Test complet

Après avoir corrigé, tester :

```bash
# 1. Backend répond
curl http://localhost:8000/api/collaborateurs

# Devrait retourner du JSON (même vide : [])
# Si erreur 500, regarder les logs du serveur PHP
```

---

## 📋 Checklist de démarrage

1. ✅ MySQL est démarré
2. ✅ Base de données `gestion_conges` existe
3. ✅ Tables créées (utilisateurs, roles, demandes, etc.)
4. ✅ Colonnes `position` et `date_naissance` existent dans `utilisateurs`
5. ✅ Les identifiants dans `backend/config.ini` sont corrects
6. ✅ Backend démarré : `php -S localhost:8000` dans `backend/public/`
7. ✅ Frontend démarré : `npm run dev` dans `frontend/`
8. ✅ Au moins 1 utilisateur créé avec `php backend/scripts/create_user.php`

---

## 🐛 Debug avancé

**Voir les erreurs PHP en direct :**
```bash
cd backend/public
php -S localhost:8000
# Les erreurs s'affichent dans ce terminal
```

**Tester la connexion MySQL depuis PHP :**
```bash
cd backend/src
php -r "require 'Database.php'; try { Database::getPdo(); echo 'OK'; } catch (Exception \$e) { echo \$e->getMessage(); }"
```

**Vérifier les logs MySQL :**
```bash
# Linux
sudo tail -f /var/log/mysql/error.log

# Mac
tail -f /usr/local/var/mysql/*.err
```

---

## 🆘 Toujours pas résolu ?

Vérifier dans la console du navigateur (F12) le message d'erreur exact :
- `Failed to fetch` → Backend non accessible
- `HTTP 500` → Erreur PHP/MySQL (voir terminal backend)
- `HTTP 404` → Mauvaise URL d'API
- `CORS error` → Problème de configuration CORS (normalement déjà géré)

L'erreur affichée dans le dashboard vous indiquera maintenant le problème spécifique.
