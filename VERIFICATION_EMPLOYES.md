# Vérification des Employés dans le Dashboard

## Problème signalé

L'utilisateur mentionne que "motaz" et "rachida" ne s'affichent pas dans le dashboard, alors qu'ils devraient apparaître.

## Causes possibles

1. **Rôle incorrect** : Les utilisateurs doivent avoir `role_id = 1` (employé) pour apparaître dans le dashboard manager
2. **Pas de mot de passe** : Les utilisateurs doivent avoir un `mot_de_passe` défini
3. **Nom de rôle incorrect** : Le rôle doit être nommé exactement `'employe'` (pas 'employé' avec accent)

## Vérification dans MySQL

Exécutez cette requête pour vérifier tous les utilisateurs :

```sql
USE gestion_conges;

SELECT 
    u.id,
    u.nom_complet,
    u.email,
    u.role_id,
    r.nom as role_nom,
    CASE WHEN u.mot_de_passe IS NULL THEN 'Sans mot de passe' ELSE 'Avec mot de passe' END as has_password
FROM utilisateurs u
LEFT JOIN roles r ON r.id = u.role_id
ORDER BY u.nom_complet;
```

## Correction si nécessaire

Si "motaz" ou "rachida" ont le mauvais rôle :

```sql
-- Vérifier leur rôle actuel
SELECT u.id, u.nom_complet, u.email, r.nom as role_nom
FROM utilisateurs u
JOIN roles r ON r.id = u.role_id
WHERE u.nom_complet LIKE '%motaz%' OR u.nom_complet LIKE '%rachida%'
   OR u.email LIKE '%motaz%' OR u.email LIKE '%rachida%';

-- Si leur role_id n'est pas 1, corriger :
UPDATE utilisateurs 
SET role_id = 1 
WHERE (nom_complet LIKE '%motaz%' OR nom_complet LIKE '%rachida%'
   OR email LIKE '%motaz%' OR email LIKE '%rachida%')
AND role_id != 1;
```

## Vérifier que tous les employés s'affichent

La requête API `/api/collaborateurs` récupère tous les utilisateurs avec :
- `role_id` correspondant au rôle nommé `'employe'`
- Tous les champs requis (nom, email, etc.)

Si un employé ne s'affiche pas, vérifiez :
1. Son `role_id` est bien `1`
2. Le rôle avec `id = 1` s'appelle bien `'employe'` (sans accent)
3. Il a un `nom_complet` défini

## Test rapide

Pour voir tous les employés qui devraient apparaître :

```sql
SELECT u.id, u.nom_complet, u.email, r.nom as role_nom
FROM utilisateurs u
JOIN roles r ON r.id = u.role_id
WHERE r.nom = 'employe'
ORDER BY u.nom_complet;
```

Cette requête est exactement celle utilisée par l'API `/api/collaborateurs`.



