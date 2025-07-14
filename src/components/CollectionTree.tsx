import React, { useState } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Collection } from '../types/global';
import { useCollectionStore } from '../stores/collectionStore';

interface CollectionTreeProps {
  collections: Collection[];
  activeCollectionId: string | null;
  editingCollection: string | null;
  setEditingCollection: (id: string | null) => void;
  onDeleteCollection: (id: string) => void;
  onCreateRequest: () => void;
  onCreateSubCollection: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
}

interface CollectionNodeProps {
  collection: Collection;
  level: number;
  activeCollectionId: string | null;
  editingCollection: string | null;
  setEditingCollection: (id: string | null) => void;
  onDeleteCollection: (id: string) => void;
  onCreateRequest: () => void;
  onCreateSubCollection: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
  subCollections: Collection[];
}

const CollectionNode: React.FC<CollectionNodeProps> = ({
  collection,
  level,
  activeCollectionId,
  editingCollection,
  setEditingCollection,
  onDeleteCollection,
  onCreateRequest,
  onCreateSubCollection,
  onCreateFolder,
  subCollections
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { setActiveCollection, updateCollection, collections } = useCollectionStore();
  
  const hasSubCollections = subCollections.length > 0;
  const isActive = activeCollectionId === collection.id;
  const isFolder = collection.isFolder;
  
  // Calculate total requests count including subcollections
  const getTotalRequestsCount = (coll: Collection): number => {
    let count = coll.requests.length;
    const subColls = collections.filter(c => c.parentId === coll.id);
    subColls.forEach(subColl => {
      count += getTotalRequestsCount(subColl);
    });
    return count;
  };
  
  const requestsCount = getTotalRequestsCount(collection);
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const handleClick = () => {
    setActiveCollection(collection.id);
  };
  
  return (
    <div className="select-none">
      {/* Collection/Folder header */}
      <div
        className={`
          flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group
          ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Expand/Collapse button */}
          {hasSubCollections && (
            <button
              onClick={handleToggleExpand}
              className="p-0.5 rounded hover:bg-gray-200 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500" />
              )}
            </button>
          )}
          
          {/* Icon */}
          <div className="flex-shrink-0">
            {isFolder ? (
              hasSubCollections && isExpanded ? (
                <FolderOpenIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <FolderIcon className="h-4 w-4 text-gray-600" />
              )
            ) : (
              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
            )}
          </div>
          
          {/* Name */}
          <div className="flex-1 min-w-0">
            {editingCollection === collection.id ? (
              <input
                type="text"
                defaultValue={collection.name}
                className="input text-sm font-medium w-full"
                autoFocus
                onBlur={(e) => {
                  updateCollection(collection.id, { name: e.target.value });
                  setEditingCollection(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCollection(collection.id, { name: e.currentTarget.value });
                    setEditingCollection(null);
                  }
                  if (e.key === 'Escape') {
                    setEditingCollection(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {collection.name}
                  </p>
                  {!isFolder && (
                    <p className="text-xs text-gray-500">
                      {collection.requests.length} requête{collection.requests.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                {requestsCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {requestsCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add button for active collection */}
          {isActive && !isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateRequest();
              }}
              className="p-1 rounded hover:bg-gray-200"
              title="Ajouter une requête"
            >
              <PlusIcon className="h-3 w-3 text-gray-500" />
            </button>
          )}
          
          {/* Menu button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-gray-200"
            >
              <svg className="h-3 w-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                {!isFolder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCollection(collection.id);
                      onCreateRequest();
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nouvelle requête
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSubCollection(collection.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Nouvelle collection
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder(collection.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FolderIcon className="h-4 w-4 mr-2" />
                  Nouveau dossier
                </button>
                <hr className="my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCollection(collection.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Renommer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(collection.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Sub-collections */}
      {hasSubCollections && isExpanded && (
        <div className="mt-1">
          {subCollections.map((subCollection) => (
            <CollectionTreeNode
              key={subCollection.id}
              collection={subCollection}
              level={level + 1}
              activeCollectionId={activeCollectionId}
              editingCollection={editingCollection}
              setEditingCollection={setEditingCollection}
              onDeleteCollection={onDeleteCollection}
              onCreateRequest={onCreateRequest}
              onCreateSubCollection={onCreateSubCollection}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollectionTreeNode: React.FC<{
  collection: Collection;
  level: number;
  activeCollectionId: string | null;
  editingCollection: string | null;
  setEditingCollection: (id: string | null) => void;
  onDeleteCollection: (id: string) => void;
  onCreateRequest: () => void;
  onCreateSubCollection: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
}> = (props) => {
  const { getSubCollections } = useCollectionStore();
  const subCollections = getSubCollections(props.collection.id);
  
  return (
    <CollectionNode
      {...props}
      subCollections={subCollections}
    />
  );
};

export const CollectionTree: React.FC<CollectionTreeProps> = ({
  collections,
  activeCollectionId,
  editingCollection,
  setEditingCollection,
  onDeleteCollection,
  onCreateRequest,
  onCreateSubCollection,
  onCreateFolder
}) => {
  const { getSubCollections } = useCollectionStore();
  // Utiliser les collections filtrées passées en props au lieu de getRootCollections()
  const rootCollections = collections.filter(c => !c.parentId);
  
  return (
    <div className="space-y-1">
      {rootCollections.map((collection) => {
        const subCollections = getSubCollections(collection.id);
        return (
          <CollectionNode
            key={collection.id}
            collection={collection}
            level={0}
            activeCollectionId={activeCollectionId}
            editingCollection={editingCollection}
            setEditingCollection={setEditingCollection}
            onDeleteCollection={onDeleteCollection}
            onCreateRequest={onCreateRequest}
            onCreateSubCollection={onCreateSubCollection}
            onCreateFolder={onCreateFolder}
            subCollections={subCollections}
          />
        );
      })}
    </div>
  );
};