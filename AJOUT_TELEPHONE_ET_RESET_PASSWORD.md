# Ajout du Numéro de Téléphone et Récupération de Mot de Passe

Ce document explique les nouvelles fonctionnalités ajoutées au système de gestion des congés : gestion du numéro de téléphone et récupération sécurisée du mot de passe avec vérification par code.

## 🎯 Objectifs

1. Ajouter un champ `numero_telephone` pour chaque utilisateur
2. Implémenter une récupération de mot de passe sécurisée en 3 étapes :
   - Génération d'un code de vérification à 6 chiffres
   - Vérification du numéro de téléphone + code
   - Réinitialisation du mot de passe

## 📦 Installation

### 1. Migration de la base de données

Exécutez le script SQL pour ajouter les tables et colonnes nécessaires :

```bash
mysql -u root -p gestion_conges < backend/scripts/add_phone_number.sql
```

Ce script :
- Ajoute la colonne `numero_telephone` à la table `utilisateurs`
- Crée la table `password_reset_codes` pour stocker les codes de vérification

### 2. Vérification

Pour vérifier que la migration s'est bien passée :

```sql
USE gestion_conges;

-- Vérifier la colonne numero_telephone
DESCRIBE utilisateurs;

-- Vérifier la table password_reset_codes
DESCRIBE password_reset_codes;
```

## 🔐 Flux de Récupération de Mot de Passe

### Étape 1 : Demande de réinitialisation

**Endpoint :** `POST /api/password-reset/request`

**Request :**
```json
{
  "email": "user@exemple.com"
}
```

**Response (succès) :**
```json
{
  "success": true,
  "message": "Code envoyé",
  "phone_hint": "***1234"
}
```

**Comportement :**
- Vérifie que l'email existe
- Génère un code aléatoire à 6 chiffres
- Stocke le code avec expiration de 15 minutes
- Retourne un indice masqué du numéro de téléphone
- Rate limiting : max 5 demandes par heure par email

### Étape 2 : Vérification du téléphone et du code

**Endpoint :** `POST /api/password-reset/verify-phone`

**Request :**
```json
{
  "email": "user@exemple.com",
  "phone": "0612345678",
  "code": "123456"
}
```

**Response (succès) :**
```json
{
  "success": true,
  "reset_token": "a1b2c3d4e5f6..."
}
```

**Comportement :**
- Vérifie que le numéro de téléphone correspond à l'email
- Vérifie que le code est correct et non expiré
- Génère un token de réinitialisation unique
- Marque le code comme utilisé

### Étape 3 : Réinitialisation du mot de passe

**Endpoint :** `POST /api/password-reset/reset`

**Request :**
```json
{
  "reset_token": "a1b2c3d4e5f6...",
  "new_password": "nouveauMotDePasse123"
}
```

**Response (succès) :**
```json
{
  "success": true,
  "message": "Mot de passe modifié"
}
```

**Comportement :**
- Vérifie que le token est valide
- Hash le nouveau mot de passe avec `password_hash()`
- Met à jour le mot de passe dans la base
- Supprime tous les codes de réinitialisation pour cet email

## 🔧 Backend

### Fichiers modifiés/créés

#### `backend/src/UserController.php`
- Ajout de la gestion du champ `numero_telephone` lors de la création d'utilisateur
- Le champ accepte `telephone` ou `numero_telephone` pour compatibilité

#### `backend/src/PasswordResetController.php` (nouveau)
Contrôleur dédié à la récupération de mot de passe avec :
- `requestReset()` : Génère le code et retourne l'indice du téléphone
- `verifyPhone()` : Vérifie téléphone + code, retourne un token
- `resetPassword()` : Réinitialise le mot de passe avec le token
- `cleanExpiredCodes()` : Nettoie les codes expirés (peut être appelé périodiquement)

#### `backend/public/index.php`
Ajout des routes :
- `POST /api/password-reset/request`
- `POST /api/password-reset/verify-phone`
- `POST /api/password-reset/reset`

### Base de données

#### Table `utilisateurs`
```sql
ALTER TABLE utilisateurs 
ADD COLUMN numero_telephone VARCHAR(20) NULL;
```

#### Table `password_reset_codes`
```sql
CREATE TABLE password_reset_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  code VARCHAR(6) NOT NULL,
  reset_token VARCHAR(64) NULL,
  expire_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (email),
  INDEX (code),
  INDEX (reset_token)
);
```

## 🎨 Frontend

### Fichiers modifiés

#### `frontend/src/pages/AjouterUtilisateur.jsx`
- Le formulaire contient déjà un champ `telephone`
- Le champ est envoyé au backend lors de la création

#### `frontend/src/pages/MotDePasseOublie.jsx`
Interface en 3 étapes :

**Étape 1 :** Saisie de l'email
- Input : Email
- Bouton : "Envoyer le code"
- Affiche un indice du téléphone masqué

**Étape 2 :** Vérification
- Input : Numéro de téléphone complet
- Input : Code à 6 chiffres
- Bouton : "Vérifier"
- Validation : téléphone + code

**Étape 3 :** Nouveau mot de passe
- Input : Nouveau mot de passe (min 6 caractères)
- Input : Confirmation du mot de passe
- Bouton : "Réinitialiser"
- Redirection vers `/login` après succès

#### `frontend/src/components/Login.jsx`
- Ajout d'un lien "Mot de passe oublié ?" sous le formulaire de connexion

#### `frontend/src/App.jsx`
- La route `/mot-de-passe-oublie` existe déjà

## 🔒 Sécurité

### Mesures implémentées

1. **Masquage du téléphone :** Seuls les 4 derniers chiffres sont affichés (ex: `***1234`)
2. **Expiration des codes :** 15 minutes
3. **Codes à usage unique :** Marqués comme utilisés après vérification
4. **Tokens sécurisés :** Générés avec `random_bytes(32)` et `bin2hex()`
5. **Rate limiting :** Maximum 5 demandes par email par heure
6. **Vérification stricte :** Email + téléphone + code doivent tous correspondre
7. **Hash des mots de passe :** Utilisation de `password_hash()` avec `PASSWORD_DEFAULT`
8. **Nettoyage automatique :** Les codes expirés peuvent être supprimés

### Points d'attention

- Les codes de vérification sont stockés en clair dans la base (par conception, car ils doivent être comparés)
- Il est recommandé de nettoyer périodiquement les codes expirés
- En production, considérer l'envoi du code par SMS avec un service tiers

## 📝 Exemples d'utilisation

### Création d'un utilisateur avec téléphone

**Frontend (AjouterUtilisateur.jsx) :**
```javascript
const dataToSend = {
  nom_complet: "Jean Dupont",
  email: "jean@exemple.com",
  password: "motdepasse123",
  telephone: "0612345678",
  role_id: 1
};

fetch('http://localhost:8000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dataToSend)
});
```

### Test du flux complet

1. **Créer un utilisateur avec téléphone :**
   ```sql
   INSERT INTO utilisateurs (nom_complet, email, numero_telephone, mot_de_passe, role_id)
   VALUES ('Test User', 'test@exemple.com', '0612345678', 
           '$2y$10$...', 1);
   ```

2. **Demander un code :**
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/request \
     -H "Content-Type: application/json" \
     -d '{"email":"test@exemple.com"}'
   ```

3. **Vérifier le code dans la base :**
   ```sql
   SELECT * FROM password_reset_codes 
   WHERE email = 'test@exemple.com' 
   ORDER BY created_at DESC LIMIT 1;
   ```

4. **Vérifier téléphone + code :**
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/verify-phone \
     -H "Content-Type: application/json" \
     -d '{"email":"test@exemple.com","phone":"0612345678","code":"123456"}'
   ```

5. **Réinitialiser le mot de passe :**
   ```bash
   curl -X POST http://localhost:8000/api/password-reset/reset \
     -H "Content-Type: application/json" \
     -d '{"reset_token":"abc...","new_password":"nouveaupass123"}'
   ```

## 🧪 Tests

### Checklist de validation

- [x] ✅ Créer un utilisateur avec numéro de téléphone
- [x] ✅ Vérifier que le numéro est enregistré dans la DB
- [x] ✅ Demander un code de réinitialisation
- [x] ✅ Vérifier que le code est généré et stocké
- [x] ✅ Tester avec un mauvais numéro de téléphone (doit être rejeté)
- [x] ✅ Tester avec un mauvais code (doit être rejeté)
- [x] ✅ Tester avec un code expiré (doit être rejeté)
- [x] ✅ Vérifier le rate limiting (6ème tentative doit être rejetée)
- [x] ✅ Compléter le flux et réinitialiser le mot de passe
- [x] ✅ Se connecter avec le nouveau mot de passe

### Scénarios de test

**Test 1 : Flux complet réussi**
1. Aller sur `/mot-de-passe-oublie`
2. Entrer un email valide
3. Noter l'indice du téléphone affiché
4. Récupérer le code depuis la base de données
5. Entrer le téléphone et le code
6. Créer un nouveau mot de passe
7. Se connecter avec le nouveau mot de passe

**Test 2 : Code expiré**
1. Demander un code
2. Attendre 16 minutes
3. Tenter de vérifier le code
4. Vérifier que l'erreur "Code expiré" s'affiche

**Test 3 : Rate limiting**
1. Faire 5 demandes de code pour le même email
2. La 6ème demande doit être rejetée avec erreur 429

**Test 4 : Mauvais téléphone**
1. Demander un code
2. Entrer un numéro de téléphone différent
3. Vérifier que l'erreur "Numéro de téléphone incorrect" s'affiche

## 🚀 Améliorations futures

1. **Envoi SMS :** Intégrer un service SMS (Twilio, AWS SNS) pour envoyer le code
2. **Email de notification :** Envoyer un email lors de la réinitialisation
3. **Historique :** Logger les tentatives de réinitialisation
4. **2FA :** Utiliser ce système comme base pour l'authentification à deux facteurs
5. **Validation téléphone :** Ajouter validation du format du numéro côté client
6. **Timer visuel :** Afficher un compte à rebours de 15 minutes
7. **Resend code :** Bouton pour renvoyer un nouveau code

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs du backend : `error_log()`
- Vérifier la console du navigateur pour les erreurs frontend
- Consulter la base de données pour déboguer les codes

## 📚 Références

- [PHP password_hash() documentation](https://www.php.net/manual/en/function.password-hash.php)
- [PHP random_bytes() documentation](https://www.php.net/manual/en/function.random-bytes.php)
- [React useState Hook](https://react.dev/reference/react/useState)
