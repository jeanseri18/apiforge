import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Vérifier si on est dans Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

if (isElectron) {
  console.log('🚀 APIForge running in Electron mode');
} else {
  console.log('🌐 APIForge running in web mode');
}

// Utiliser HashRouter pour Electron (compatible avec file://) et BrowserRouter pour le web
const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
);

// Hot Module Replacement pour le développement
if (import.meta.hot) {
  import.meta.hot.accept();
}