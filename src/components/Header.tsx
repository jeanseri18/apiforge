import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/appStore';
import { useCollectionStore } from '../stores/collectionStore';
import { useEnvironmentStore } from '../stores/environmentStore';

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/':
      return 'Tableau de bord';
    case '/collections':
      return 'Collections';
    case '/environments':
      return 'Environnements';
    case '/history':
      return 'Historique';
    case '/settings':
      return 'Paramètres';
    default:
      if (pathname.startsWith('/collections/')) {
        return 'Collection';
      }
      return 'APIForge';
  }
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { toggleSidebar, isElectron } = useAppStore();
  const { collections, activeCollectionId, activeRequestId, searchTerm, setSearchTerm } = useCollectionStore();
  const { environments, activeEnvironmentId, setActiveEnvironment } = useEnvironmentStore();
  
  const [searchValue, setSearchValue] = useState(searchTerm);
  
  // Synchroniser searchValue avec searchTerm du store
  useEffect(() => {
    setSearchValue(searchTerm);
  }, [searchTerm]);
  
  const activeCollection = collections.find(c => c.id === activeCollectionId);
  const activeRequest = activeCollection?.requests.find(r => r.id === activeRequestId);
  
  const pageTitle = getPageTitle(location.pathname);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setSearchTerm(value);
  };
  
  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setActiveEnvironment(value || null);
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Basculer la sidebar"
          >
            <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">{pageTitle}</span>
            
            {activeCollection && (
              <>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <span className="text-gray-600 dark:text-gray-300">{activeCollection.name}</span>
              </>
            )}
            
            {activeRequest && (
              <>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <span className="text-gray-600 dark:text-gray-300">{activeRequest.name}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Rechercher dans les collections..."
              className="input w-full pl-10 pr-4 py-2"
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Environment selector */}
          <select 
            value={activeEnvironmentId || ''}
            onChange={handleEnvironmentChange}
            className="input text-sm px-3 py-1.5"
          >
            <option value="">Aucun environnement</option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
          
          {/* Notifications */}
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            title="Notifications"
          >
            <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Settings */}
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Paramètres"
          >
            <CogIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* User menu */}
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Profil utilisateur"
          >
            <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* App version (Electron only) */}
          {isElectron && (
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
              v1.0.0
            </div>
          )}
        </div>
      </div>
    </header>
  );
};