# Ajout de la Position et Création d'Utilisateurs

## Résumé des modifications

Cette mise à jour ajoute :
1. **Champ "position"** dans la base de données pour tous les utilisateurs
2. **Bouton "Ajouter un Utilisateur"** dans le dashboard manager
3. **Page de création d'utilisateurs** (employés ou managers)
4. **Affichage de la position** partout dans l'application

## Étapes de mise à jour

### 1. Ajouter la colonne "position" dans MySQL

Exécutez le script SQL suivant dans votre base de données :

```sql
USE gestion_conges;

ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL AFTER nom_complet;
```

**Ou utilisez le script fourni :**
```bash
mysql -u root -p gestion_conges < backend/scripts/add_position_field.sql
```

### 2. Fichiers modifiés

#### Backend

- **`backend/src/RequestController.php`** : Ajout de `u.position` dans `listCollaborateurs()`
- **`backend/src/UserController.php`** :
  - Ajout de `position` dans `getEmploye()`
  - Ajout de `position` dans `updateEmploye()`
  - Nouvelle méthode `createUser()` pour créer des utilisateurs
- **`backend/src/AuthController.php`** : Ajout de `position` dans `me()`
- **`backend/public/index.php`** : Ajout de la route `POST /api/users`

#### Frontend

- **`frontend/src/pages/AjouterUtilisateur.jsx`** : Nouvelle page pour créer des utilisateurs
- **`frontend/src/pages/Dashboard.jsx`** : Ajout du bouton "Ajouter un Utilisateur"
- **`frontend/src/pages/EmployeDetails.jsx`** : Affichage de la position
- **`frontend/src/pages/GestionProfils.jsx`** : Ajout du champ position dans le formulaire
- **`frontend/src/pages/Profil.jsx`** : Affichage de la position
- **`frontend/src/components/Header.jsx`** : Affichage de la position dans le header
- **`frontend/src/components/SuiviCollaborateurs.jsx`** : Affichage de la position dans la liste
- **`frontend/src/App.jsx`** : Ajout de la route `/ajouter-utilisateur`

## Utilisation

### Pour un Manager

1. **Créer un nouvel utilisateur** :
   - Aller sur le Dashboard
   - Cliquer sur "Ajouter un Utilisateur"
   - Remplir le formulaire :
     - Nom complet (obligatoire)
     - Email (obligatoire, unique)
     - Mot de passe (obligatoire, min 6 caractères)
     - Rôle : Employé ou Manager
     - Position/Poste (optionnel, ex: "Développeur", "Manager RH")
     - Quota annuel (défaut: 25 jours)
   - Cliquer sur "Créer l'utilisateur"

2. **Modifier la position d'un employé** :
   - Aller dans "Gestion Profils"
   - Sélectionner un employé
   - Modifier le champ "Position / Poste"
   - Sauvegarder

### Affichage de la position

La position s'affiche maintenant :
- Dans le **Header** (sous le titre "Espace Manager" ou "Espace Employé")
- Dans la **liste des collaborateurs** (dashboard manager)
- Dans les **détails d'un employé**
- Dans la **page Profil** de l'utilisateur
- Dans la **liste de gestion des profils**

## API Endpoints

### POST /api/users

Créer un nouvel utilisateur (réservé aux managers).

**Body JSON :**
```json
{
  "nom_complet": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "motdepasse123",
  "role_id": 1,
  "position": "Développeur Full Stack",
  "solde_total": 25,
  "solde_consomme": 0
}
```

**Réponses :**
- `201 Created` : Utilisateur créé avec succès
- `403 Forbidden` : L'utilisateur n'est pas manager
- `409 Conflict` : L'email existe déjà
- `422 Unprocessable Entity` : Données invalides

## Notes

- Seuls les **managers** peuvent créer des utilisateurs
- La position est **optionnelle** mais recommandée
- La position peut être modifiée via "Gestion Profils"
- Le champ position est limité à 100 caractères dans la base de données



