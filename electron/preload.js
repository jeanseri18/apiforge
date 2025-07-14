const { contextBridge, ipcRenderer } = require('electron');

// Exposer des APIs sécurisées au processus renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Informations de l'application
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialogues système
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Événements du menu
  onMenuNewCollection: (callback) => {
    ipcRenderer.on('menu-new-collection', callback);
  },
  onMenuImportCollection: (callback) => {
    ipcRenderer.on('menu-import-collection', callback);
  },
  
  // Nettoyage des listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Vérifier si on est dans Electron
  isElectron: true,
  
  // Platform info
  platform: process.platform
});

// Exposer des utilitaires pour le développement
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => ipcRenderer.send('open-dev-tools')
  });
}