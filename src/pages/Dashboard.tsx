import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderIcon,
  ClockIcon,
  GlobeAltIcon,
  ChartBarIcon,
  PlusIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useCollectionStore } from '../stores/collectionStore';
import { useAppStore } from '../stores/appStore';

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: string;
}> = ({ title, description, icon: Icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-lg border-2 border-dashed ${color} hover:bg-opacity-5 transition-all duration-200 text-left w-full group`}
  >
    <div className="flex items-start space-x-4">
      <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('hover:bg-opacity-5', '')} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('border-', 'text-').replace('hover:bg-opacity-5', '')}`} />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 group-hover:text-gray-700">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { collections, createCollection, importCollection } = useCollectionStore();
  const { isElectron } = useAppStore();
  
  const totalRequests = collections.reduce((acc, collection) => acc + collection.requests.length, 0);
  const totalCollections = collections.length;
  
  const handleCreateCollection = () => {
    createCollection('Ma Nouvelle Collection', 'Description de la collection');
  };
  
  const handleImportCollection = async () => {
    try {
      // Utiliser l'API File System Access si disponible (navigateurs modernes)
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Collection files',
            accept: { 
              'application/json': ['.json'],
              'text/json': ['.json']
            }
          }]
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        try {
          const collectionData = JSON.parse(content);
          // Utiliser la fonction d'import du store qui gère Postman et autres formats
          const importedCollection = importCollection(collectionData);
          
          // Afficher un message de succès
          alert(`Collection "${importedCollection.name}" importée avec succès! ${importedCollection.requests.length} requête(s) trouvée(s).`);
        } catch (parseError) {
          alert('Erreur: Le fichier JSON n\'est pas valide ou le format n\'est pas supporté.');
        }
      } else {
        // Fallback pour les navigateurs plus anciens
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const content = await file.text();
            try {
              const collectionData = JSON.parse(content);
              // Utiliser la fonction d'import du store qui gère Postman et autres formats
              const importedCollection = importCollection(collectionData);
              
              // Afficher un message de succès
              alert(`Collection "${importedCollection.name}" importée avec succès! ${importedCollection.requests.length} requête(s) trouvée(s).`);
            } catch (parseError) {
              alert('Erreur: Le fichier JSON n\'est pas valide ou le format n\'est pas supporté.');
            }
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du fichier.');
    }
  };
  
  const handleCreateEnvironment = () => {
    // Rediriger vers la page des environnements avec un paramètre pour créer un nouvel environnement
    window.location.href = '/environments?create=true';
  };
  
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue dans APIForge
          </h1>
          <p className="text-gray-600">
            Client moderne pour tester, documenter et automatiser vos APIs REST, GraphQL et WebSockets.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Collections"
            value={totalCollections}
            icon={FolderIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Requêtes"
            value={totalRequests}
            icon={RocketLaunchIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Environnements"
            value={0}
            icon={GlobeAltIcon}
            color="bg-purple-500"
          />
          <StatCard
            title="Historique"
            value={0}
            icon={ClockIcon}
            color="bg-orange-500"
          />
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              title="Nouvelle Collection"
              description="Créer une nouvelle collection pour organiser vos requêtes API"
              icon={PlusIcon}
              onClick={handleCreateCollection}
              color="border-blue-300 hover:bg-blue-500"
            />
            <QuickActionCard
              title="Importer Collection"
              description="Importer une collection depuis Postman, Insomnia ou un fichier JSON"
              icon={FolderIcon}
              onClick={handleImportCollection}
              color="border-green-300 hover:bg-green-500"
            />
            <QuickActionCard
              title="Nouvel Environnement"
              description="Créer un environnement pour gérer vos variables et configurations"
              icon={GlobeAltIcon}
              onClick={handleCreateEnvironment}
              color="border-purple-300 hover:bg-purple-500"
            />
          </div>
        </div>
        
        {/* Recent Collections */}
        {collections.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Collections récentes</h2>
              <Link
                to="/collections"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir toutes →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.slice(0, 6).map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FolderIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{collection.name}</h3>
                        <p className="text-sm text-gray-500">
                          {collection.requests.length} requête{collection.requests.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Modifiée {new Date(collection.updatedAt).toLocaleDateString()}</span>
                    <span>{collection.variables.length} variable{collection.variables.length !== 1 ? 's' : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Getting Started */}
        {collections.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <RocketLaunchIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Commencez votre premier test d'API
              </h3>
              <p className="text-gray-600 mb-6">
                Créez votre première collection pour organiser et tester vos APIs REST, GraphQL et WebSockets.
              </p>
              <button
                onClick={handleCreateCollection}
                className="btn btn-primary btn-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer ma première collection
              </button>
            </div>
          </div>
        )}
        
        {/* Platform info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Vous utilisez APIForge en mode {isElectron ? 'Desktop (Electron)' : 'Web'}.
            {!isElectron && (
              <span className="ml-1">
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Télécharger l'application desktop
                </a>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};