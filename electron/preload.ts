import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  
  // File operations
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  
  // Dialog operations
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title: string, content: string) => ipcRenderer.invoke('show-error-box', title, content),
  
  // External operations
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Menu events
  onMenuNewCollection: (callback: () => void) => {
    ipcRenderer.on('menu-new-collection', callback);
    return () => ipcRenderer.removeListener('menu-new-collection', callback);
  },
  
  onMenuImportCollection: (callback: (collection: any) => void) => {
    ipcRenderer.on('menu-import-collection', (_, collection) => callback(collection));
    return () => ipcRenderer.removeListener('menu-import-collection', callback);
  },
  
  onMenuSaveCollection: (callback: () => void) => {
    ipcRenderer.on('menu-save-collection', callback);
    return () => ipcRenderer.removeListener('menu-save-collection', callback);
  },
  
  onMenuExportCollection: (callback: () => void) => {
    ipcRenderer.on('menu-export-collection', callback);
    return () => ipcRenderer.removeListener('menu-export-collection', callback);
  },
  
  onAppBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('app-before-quit', callback);
    return () => ipcRenderer.removeListener('app-before-quit', callback);
  },
  
  // Environment detection
  isElectron: true,
  platform: process.platform,
  
  // Remove all listeners (cleanup)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-collection');
    ipcRenderer.removeAllListeners('menu-import-collection');
    ipcRenderer.removeAllListeners('menu-save-collection');
    ipcRenderer.removeAllListeners('menu-export-collection');
    ipcRenderer.removeAllListeners('app-before-quit');
  }
});

// Expose a limited API for security
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
});