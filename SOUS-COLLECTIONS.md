# Fonctionnalités des Sous-Collections

Cette mise à jour ajoute le support des sous-collections et dossiers pour une meilleure organisation des projets.

## Nouvelles Fonctionnalités

### 1. Sous-Collections
- **Création** : Clic droit sur une collection → "Nouvelle collection"
- **Organisation hiérarchique** : Les collections peuvent contenir d'autres collections
- **Navigation** : Arborescence pliable/dépliable avec indicateurs visuels
- **Héritage** : Les sous-collections héritent du contexte de leur parent

### 2. Dossiers
- **Création** : Clic droit sur une collection → "Nouveau dossier"
- **Organisation** : Dossiers pour grouper les collections sans contenir de requêtes
- **Icônes distinctives** : Dossiers avec icône de dossier, collections avec icône de document

### 3. Interface Utilisateur
- **Menu contextuel** : Clic droit pour accéder aux actions (créer, renommer, supprimer)
- **Menu déroulant "Nouveau"** : Choix entre collection et dossier
- **Arborescence visuelle** : Indentation et icônes pour la hiérarchie
- **Expansion/Réduction** : Contrôles pour masquer/afficher les sous-éléments

### 4. Gestion des Données
- **Suppression récursive** : Supprimer une collection supprime toutes ses sous-collections
- **Duplication complète** : Dupliquer une collection duplique toute sa hiérarchie
- **Déplacement** : Possibilité de déplacer des collections entre parents

## Structure des Données

### Collection étendue
```typescript
interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: HttpRequest[];
  variables: Variable[];
  auth?: AuthConfig;
  parentId?: string;        // Nouveau : ID du parent
  subCollections?: Collection[]; // Nouveau : Sous-collections
  isFolder?: boolean;       // Nouveau : Indique si c'est un dossier
  createdAt: Date;
  updatedAt: Date;
}
```

## Nouvelles Fonctions du Store

### Actions pour les sous-collections
- `createSubCollection(parentId, name, description?, isFolder?)` : Créer une sous-collection
- `moveCollection(collectionId, newParentId?)` : Déplacer une collection
- `getCollectionHierarchy()` : Obtenir la hiérarchie complète
- `getSubCollections(parentId)` : Obtenir les sous-collections d'un parent
- `getRootCollections()` : Obtenir les collections racines

### Fonctions utilitaires
- `getCollectionIdsToDelete(collectionId)` : Obtenir tous les IDs à supprimer récursivement
- `duplicateCollectionRecursive(collection, newParentId?)` : Dupliquer avec hiérarchie
- `buildHierarchy(parentId?)` : Construire l'arborescence

## Composants

### CollectionTree
Nouveau composant pour l'affichage hiérarchique :
- **CollectionNode** : Nœud individuel de l'arbre
- **CollectionTreeNode** : Wrapper avec gestion des sous-collections
- **CollectionTree** : Composant principal de l'arbre

### Fonctionnalités du composant
- Expansion/réduction des nœuds
- Menu contextuel par nœud
- Glisser-déposer (à implémenter)
- Indicateurs visuels de hiérarchie

## Utilisation

### Créer une sous-collection
1. Clic droit sur une collection existante
2. Sélectionner "Nouvelle collection"
3. La nouvelle collection sera créée comme enfant

### Créer un dossier
1. Clic droit sur une collection existante
2. Sélectionner "Nouveau dossier"
3. Le dossier sera créé comme enfant (sans requêtes)

### Organiser les collections
1. Utiliser les contrôles d'expansion pour naviguer
2. Glisser-déposer pour réorganiser (fonctionnalité future)
3. Menu contextuel pour les actions rapides

## Améliorations Futures

- **Glisser-déposer** : Réorganisation par drag & drop
- **Recherche hiérarchique** : Recherche dans toute l'arborescence
- **Templates de dossiers** : Modèles prédéfinis d'organisation
- **Import/Export hiérarchique** : Préservation de la structure lors des échanges
- **Permissions par niveau** : Contrôle d'accès hiérarchique