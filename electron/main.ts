import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isWin = process.platform === 'win32';

console.log('🔧 Electron starting in', isDev ? 'development' : 'production', 'mode');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDev:', isDev);

let mainWindow: BrowserWindow | null = null;
let proxyServerProcess: ChildProcess | null = null;

function createWindow(): void {
  console.log('📱 Creating main window...');
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: false, // Désactiver la sécurité web pour permettre les requêtes CORS
      allowRunningInsecureContent: true // Permettre le contenu non sécurisé
    },
    titleBarStyle: isWin ? 'default' : 'hiddenInset',
    show: false,
    icon: join(__dirname, '../assets/icon.png')
  });

  // Load the app
  if (isDev) {
    console.log('🌐 Loading URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    // DevTools disponibles via le menu Affichage > Outils de développement
  } else {
    const indexPath = join(__dirname, '../dist/index.html');
    console.log('📁 Loading file:', indexPath);
    console.log('📁 File exists:', require('fs').existsSync(indexPath));
    mainWindow.loadFile(indexPath).catch(error => {
      console.error('❌ Failed to load file:', error);
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('✅ Page loaded successfully');
    mainWindow?.show();
  });

  // Add error handling for page load
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load page:', errorCode, errorDescription);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  const contents = mainWindow.webContents;
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (navigationEvent: Electron.Event, navigationUrl: string) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// Create application menu
function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouvelle Collection',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-collection');
          }
        },
        {
          label: 'Ouvrir Collection',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [
                { name: 'Collections APIForge', extensions: ['json'] },
                { name: 'Tous les fichiers', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              try {
                const content = await readFile(result.filePaths[0], 'utf-8');
                const collection = JSON.parse(content);
                mainWindow?.webContents.send('menu-import-collection', collection);
              } catch (error) {
                dialog.showErrorBox('Erreur', 'Impossible d\'ouvrir le fichier de collection.');
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Sauvegarder Collection',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-collection');
          }
        },
        {
          label: 'Exporter Collection',
          click: () => {
            mainWindow?.webContents.send('menu-export-collection');
          }
        },
        { type: 'separator' },
        {
          label: isWin ? 'Quitter' : 'Quitter APIForge',
          accelerator: isWin ? 'Alt+F4' : 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { 
          label: 'Tout sélectionner',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow?.webContents.selectAll();
          }
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Actualiser (force)' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { 
          label: 'Plein écran',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow?.isFullScreen();
            mainWindow?.setFullScreen(!isFullScreen);
          }
        }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { role: 'minimize', label: 'Réduire' },
        { role: 'close', label: 'Fermer' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos d\'APIForge',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'À propos d\'APIForge',
              message: 'APIForge',
              detail: 'Client API moderne et intuitif\nVersion 1.0.0\n\nDéveloppé avec Electron, React et TypeScript'
            });
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/apiforge/apiforge');
          }
        },
        {
          label: 'Signaler un problème',
          click: () => {
            shell.openExternal('https://github.com/apiforge/apiforge/issues');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'À propos d\'APIForge' },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Masquer APIForge' },
        { role: 'hideOthers', label: 'Masquer les autres' },
        { role: 'unhide', label: 'Tout afficher' },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter APIForge' }
      ]
    });

    // Window menu
    (template[4].submenu as Electron.MenuItemConstructorOptions[]).push(
      { type: 'separator' },
      { role: 'front', label: 'Tout ramener au premier plan' }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow!, options);
  return result;
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('file-exists', (_, filePath: string) => {
  return existsSync(filePath);
});

ipcMain.handle('show-message-box', async (_, options) => {
  const result = await dialog.showMessageBox(mainWindow!, options);
  return result;
});

ipcMain.handle('show-error-box', (_, title: string, content: string) => {
  dialog.showErrorBox(title, content);
});

ipcMain.handle('open-external', (_, url: string) => {
  shell.openExternal(url);
});

// Check and install server dependencies
function checkServerDependencies(serverPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const nodeModulesPath = join(serverPath, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      console.log('✅ Server dependencies already installed');
      resolve(true);
      return;
    }

    console.log('📦 Installing server dependencies...');
    const isWin = process.platform === 'win32';
    const installProcess = spawn(isWin ? 'npm.cmd' : 'npm', ['install'], {
      cwd: serverPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin
    });

    installProcess.stdout?.on('data', (data) => {
      console.log('📦 NPM Install:', data.toString().trim());
    });

    installProcess.stderr?.on('data', (data) => {
      console.error('❌ NPM Install Error:', data.toString().trim());
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Server dependencies installed successfully');
        resolve(true);
      } else {
        console.error('❌ Failed to install server dependencies');
        resolve(false);
      }
    });

    installProcess.on('error', (error) => {
      console.error('❌ Error installing dependencies:', error);
      resolve(false);
    });
  });
}

// Start database proxy server
async function startProxyServer(): Promise<void> {
  // Try different paths for the server directory
  let serverPath: string;
  
  if (isDev) {
    serverPath = join(__dirname, '../server');
  } else {
    // In packaged app, try multiple possible locations
    const possiblePaths = [
      join(process.resourcesPath, 'app', 'server'),
      join(process.resourcesPath, 'server'),
      join(__dirname, '../server'),
      join(__dirname, '../../server'),
      join(process.cwd(), 'server')
    ];
    
    serverPath = possiblePaths.find(path => existsSync(path)) || possiblePaths[0];
  }
  
  const isWin = process.platform === 'win32';
  
  console.log('🚀 Starting database proxy server...');
  console.log('📁 Server path:', serverPath);
  console.log('📁 isDev:', isDev);
  console.log('📁 __dirname:', __dirname);
  console.log('📁 process.resourcesPath:', process.resourcesPath);
  console.log('📁 process.cwd():', process.cwd());
  
  // Check if server directory exists
  if (!existsSync(serverPath)) {
    console.error('❌ Server directory not found:', serverPath);
    return;
  }

  // Check if port 3001 is already in use
  try {
    const net = require('net');
    const server = net.createServer();
    
    const portAvailable = await new Promise((resolve, reject) => {
      server.listen(3001, () => {
        server.close(() => resolve(true));
      });
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log('✅ Port 3001 already in use - server already running, skipping startup');
          resolve(false);
        } else {
          reject(err);
        }
      });
    });
    
    if (!portAvailable) {
      console.log('🔄 Database proxy server already running on port 3001');
      return; // Exit early if server is already running
    }
  } catch (error) {
    console.log('⚠️ Port check failed, proceeding anyway:', error);
  }

  // Check and install dependencies if needed
  const depsInstalled = await checkServerDependencies(serverPath);
  if (!depsInstalled) {
    console.error('❌ Cannot start server without dependencies');
    return;
  }
  
  try {
    const command = isWin ? 'npm.cmd' : 'npm';
    proxyServerProcess = spawn(command, ['start'], {
      cwd: serverPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    proxyServerProcess.stdout?.on('data', (data) => {
      console.log('📡 Proxy Server:', data.toString().trim());
    });

    proxyServerProcess.stderr?.on('data', (data) => {
      console.error('❌ Proxy Server Error:', data.toString().trim());
    });

    proxyServerProcess.on('close', (code) => {
      console.log(`📡 Proxy server process exited with code ${code}`);
      proxyServerProcess = null;
    });

    proxyServerProcess.on('error', (error) => {
      console.error('❌ Failed to start proxy server:', error);
      proxyServerProcess = null;
    });

    console.log('✅ Database proxy server started successfully');
  } catch (error) {
    console.error('❌ Error starting proxy server:', error);
  }
}

// Stop database proxy server
function stopProxyServer(): void {
  if (proxyServerProcess) {
    console.log('🛑 Stopping database proxy server...');
    proxyServerProcess.kill();
    proxyServerProcess = null;
  }
}

// App event handlers
app.whenReady().then(async () => {
  // Start the proxy server first
  await startProxyServer();
  
  // Wait a bit for the server to start, then create the window
  setTimeout(() => {
    createWindow();
    createMenu();
  }, 3000); // Increased timeout to allow for dependency installation

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopProxyServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  // Stop the proxy server before quitting
  stopProxyServer();
  // Save any pending data before quitting
  mainWindow?.webContents.send('app-before-quit');
});

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});