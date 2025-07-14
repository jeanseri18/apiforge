import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Collections } from './pages/Collections';
import { Environments } from './pages/Environments';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { DatabaseBrowser } from './pages/DatabaseBrowser';
import { ProjectManager } from './components/ProjectManager';
import { useAppStore } from './stores/appStore';
import { useCollectionStore } from './stores/collectionStore';

function App() {
  const { initializeApp } = useAppStore();
  const { loadCollections } = useCollectionStore();

  useEffect(() => {
    // Initialiser l'application
    initializeApp();
    loadCollections();

    // Écouter les événements Electron si disponible
    if (window.electronAPI) {
      // Nouvelle collection depuis le menu
      window.electronAPI.onMenuNewCollection(() => {
        console.log('Menu: Nouvelle collection');
        // Logique pour créer une nouvelle collection
      });

      // Import de collection depuis le menu
      window.electronAPI.onMenuImportCollection((filePath: string) => {
        console.log('Menu: Importer collection depuis', filePath);
        // Logique pour importer une collection
      });

      // Nettoyage des listeners au démontage
      return () => {
        window.electronAPI?.removeAllListeners();
      };
    }
  }, [initializeApp, loadCollections]);

  return (
    <div className="bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="collections" element={<Collections />} />
          <Route path="collections/:id" element={<Collections />} />
          <Route path="environments" element={<Environments />} />
          <Route path="history" element={<History />} />
          <Route path="database" element={<DatabaseBrowser />} />
          <Route path="project" element={<ProjectManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;