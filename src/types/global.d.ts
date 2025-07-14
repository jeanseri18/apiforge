// Types globaux pour l'application APIForge

// Interface pour l'API Electron exposée via preload
interface ElectronAPI {
  // Informations de l'application
  getVersion: () => Promise<string>;
  
  // Opérations de fichiers
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  writeFile: (filePath: string, content: string) => Promise<{success: boolean; error?: string}>;
  readFile: (filePath: string) => Promise<{success: boolean; content?: string; error?: string}>;
  fileExists: (filePath: string) => Promise<boolean>;
  
  // Dialogues système
  showMessageBox: (options: any) => Promise<any>;
  showErrorBox: (title: string, content: string) => Promise<void>;
  
  // Opérations externes
  openExternal: (url: string) => Promise<void>;
  
  // Événements du menu
  onMenuNewCollection: (callback: () => void) => () => void;
  onMenuImportCollection: (callback: (collection: any) => void) => () => void;
  onMenuSaveCollection: (callback: () => void) => () => void;
  onMenuExportCollection: (callback: () => void) => () => void;
  onAppBeforeQuit: (callback: () => void) => () => void;
  
  // Nettoyage des listeners
  removeAllListeners: () => void;
  
  // Détection d'environnement
  isElectron: boolean;
  platform: string;
}

// Interface pour les utilitaires de développement Electron
interface ElectronDev {
  openDevTools: () => void;
}

// Étendre l'interface Window
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronDev?: ElectronDev;
  }
  
  // Types pour Vite HMR
  interface ImportMetaHot {
    accept(): void;
    accept(cb: (mod: any) => void): void;
    accept(dep: string, cb: (mod: any) => void): void;
    accept(deps: string[], cb: (mods: any[]) => void): void;
    dispose(cb: () => void): void;
    decline(): void;
    invalidate(): void;
    on(event: string, cb: (...args: any[]) => void): void;
  }
  
  interface ImportMeta {
    hot?: ImportMetaHot;
    env: Record<string, string>;
  }
}

// Types pour les méthodes HTTP
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Types pour l'authentification
export type AuthType = 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';

// Interface pour les headers HTTP
export interface HttpHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// Interface pour les paramètres de requête
export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// Interface pour l'authentification
export interface AuthConfig {
  type: AuthType;
  basic?: {
    username: string;
    password: string;
  };
  bearer?: {
    token: string;
  };
  apiKey?: {
    key: string;
    value: string;
    addTo: 'header' | 'query';
  };
  oauth2?: {
    accessToken: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
  };
}

// Interface pour une requête HTTP
export interface HttpRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: HttpHeader[];
  queryParams: QueryParam[];
  body?: {
    type: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary';
    content: string;
    contentType?: string;
  };
  auth: AuthConfig;
  description?: string;
  testScript?: string;
  lastResponse?: HttpResponse;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour une réponse HTTP
export interface HttpResponse {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  time: number;
  timestamp: Date;
}

// Interface pour une collection
export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: HttpRequest[];
  variables: Variable[];
  auth?: AuthConfig;
  parentId?: string;
  subCollections?: Collection[];
  isFolder?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les variables d'environnement
export interface Variable {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
  secret?: boolean;
}

// Interface pour un environnement
export interface Environment {
  id: string;
  name: string;
  description?: string;
  variables: Variable[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour l'historique
export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: {
    method: HttpMethod;
    url: string;
    name?: string;
    headers: Record<string, string>;
    body?: string;
  };
  response?: {
    status: number;
    duration: number;
    size: number;
    headers: Record<string, string>;
    data: string;
  };
  collectionName?: string;
}

// Interface pour les tests
export interface Test {
  id: string;
  name: string;
  script: string;
  enabled: boolean;
}

// Interface pour les assertions
export interface Assertion {
  id: string;
  type: 'status' | 'header' | 'body' | 'response-time';
  field?: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than';
  value: string;
  enabled: boolean;
}

// Déclaration globale des types
declare global {
  // Types pour les méthodes HTTP
  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  // Types pour l'authentification
  type AuthType = 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';

  // Interface pour les headers HTTP
  interface HttpHeader {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
  }

  // Interface pour les paramètres de requête
  interface QueryParam {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
  }

  // Interface pour l'authentification
  interface AuthConfig {
    type: AuthType;
    basic?: {
      username: string;
      password: string;
    };
    bearer?: {
      token: string;
    };
    apiKey?: {
      key: string;
      value: string;
      addTo: 'header' | 'query';
    };
    oauth2?: {
      accessToken: string;
      refreshToken?: string;
      clientId?: string;
      clientSecret?: string;
    };
  }

  // Interface pour une requête HTTP
  interface HttpRequest {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: HttpHeader[];
    queryParams: QueryParam[];
    body?: {
      type: 'none' | 'raw' | 'form-data' | 'x-www-form-urlencoded' | 'binary';
      content: string;
      contentType?: string;
    };
    auth: AuthConfig;
    description?: string;
    testScript?: string;
    lastResponse?: HttpResponse;
    createdAt: Date;
    updatedAt: Date;
  }

  // Interface pour une réponse HTTP
  interface HttpResponse {
    id: string;
    requestId: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    size: number;
    time: number;
    timestamp: Date;
  }

  // Interface pour une collection
  interface Collection {
    id: string;
    name: string;
    description?: string;
    requests: HttpRequest[];
    variables: Variable[];
    auth?: AuthConfig;
    parentId?: string; // ID de la collection parente (null pour les collections racines)
    subCollections?: Collection[]; // Sous-collections
    isFolder?: boolean; // Indique si c'est un dossier (sans requêtes) ou une collection normale
    createdAt: Date;
    updatedAt: Date;
  }

  // Interface pour les variables d'environnement
  interface Variable {
    id: string;
    key: string;
    value: string;
    description?: string;
    enabled?: boolean;
    secret?: boolean;
  }

  // Interface pour un environnement
  interface Environment {
    id: string;
    name: string;
    description?: string;
    variables: Variable[];
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  // Interface pour l'historique
  interface HistoryEntry {
    id: string;
    timestamp: number;
    request: {
      method: HttpMethod;
      url: string;
      name?: string;
      headers: Record<string, string>;
      body?: string;
    };
    response?: {
      status: number;
      duration: number;
      size: number;
      headers: Record<string, string>;
      data: string;
    };
    collectionName?: string;
  }

  // Interface pour les tests
  interface Test {
    id: string;
    name: string;
    script: string;
    enabled: boolean;
  }

  // Interface pour les assertions
  interface Assertion {
    id: string;
    type: 'status' | 'header' | 'body' | 'response-time';
    field?: string;
    operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than';
    value: string;
    enabled: boolean;
  }
}

export {};