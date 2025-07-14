import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  FolderIcon,
  GlobeAltIcon,
  ClockIcon,
  CogIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  FolderIcon as FolderIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  ClockIcon as ClockIconSolid,
  CogIcon as CogIconSolid,
  CircleStackIcon as CircleStackIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';
import { useAppStore } from '../stores/appStore';
import { useCollectionStore } from '../stores/collectionStore';

const navigationItems = [
  {
    name: 'Tableau de bord',
    href: '/',
    icon: HomeIcon,
    iconActive: HomeIconSolid
  },
  {
    name: 'Collections',
    href: '/collections',
    icon: FolderIcon,
    iconActive: FolderIconSolid
  },
  {
    name: 'Environnements',
    href: '/environments',
    icon: GlobeAltIcon,
    iconActive: GlobeAltIconSolid
  },
  {
    name: 'Historique',
    href: '/history',
    icon: ClockIcon,
    iconActive: ClockIconSolid
  },
  {
    name: 'Base de données',
    href: '/database',
    icon: CircleStackIcon,
    iconActive: CircleStackIconSolid
  },
  {
    name: 'Gestionnaire de projet',
    href: '/project',
    icon: ClipboardDocumentListIcon,
    iconActive: ClipboardDocumentListIconSolid
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: CogIcon,
    iconActive: CogIconSolid
  }
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const { collections, createCollection } = useCollectionStore();
  const navigate = useNavigate();
  
  const handleCreateCollection = () => {
    const collection = createCollection('Nouvelle Collection');
    navigate(`/collections/${collection.id}`);
  };
  
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AF</span>
            </div>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">APIForge</h1>
              <p className="text-xs text-gray-500">Client API moderne</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
            title={sidebarCollapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                {React.createElement(
                  isActive ? item.iconActive : item.icon,
                  { className: 'h-5 w-5 flex-shrink-0' }
                )}
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Collections section */}
      {!sidebarCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Collections</h3>
            <button
              onClick={handleCreateCollection}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Nouvelle collection"
            >
              <PlusIcon className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {collections.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Aucune collection</p>
            ) : (
              collections.map((collection) => (
                <NavLink
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded text-xs transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <DocumentDuplicateIcon className="h-3 w-3 flex-shrink-0 mr-2" />
                  <span className="truncate">{collection.name}</span>
                  <span className="ml-auto text-gray-400">
                    {collection.requests.length}
                  </span>
                </NavLink>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed collections */}
      {sidebarCollapsed && collections.length > 0 && (
        <div className="border-t border-gray-200 p-2">
          <div className="space-y-1">
            {collections.slice(0, 3).map((collection) => (
              <NavLink
                key={collection.id}
                to={`/collections/${collection.id}`}
                className={({ isActive }) =>
                  `flex items-center justify-center p-2 rounded transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
                title={collection.name}
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </NavLink>
            ))}
            
            {collections.length > 3 && (
              <div className="flex items-center justify-center p-2 text-xs text-gray-500">
                +{collections.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        {!sidebarCollapsed ? (
          <div className="text-xs text-gray-500">
            <p>APIForge v1.0.0</p>
            <p>© 2024 APIForge Team</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full" title="En ligne" />
          </div>
        )}
      </div>
    </div>
  );
};