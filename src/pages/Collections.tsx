import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  PlayIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpTrayIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useCollectionStore } from '../stores/collectionStore';
import { HttpMethod, HttpRequest, HttpResponse, QueryParam, HttpHeader, AuthConfig, AuthType } from '../types/global';
import { httpService } from '../services/httpService';
import { useHistoryStore } from '../stores/historyStore';
import { useEnvironmentStore } from '../stores/environmentStore';
import { CollectionTree } from '../components/CollectionTree';
import ResizablePanel from '../components/ResizablePanel';

const MethodBadge: React.FC<{ method: HttpMethod }> = ({ method }) => {
  const getMethodClass = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'POST':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'PUT':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'DELETE':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PATCH':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getMethodClass(method)}`}>
      {method}
    </span>
  );
};

const RequestItem: React.FC<{
  request: HttpRequest;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  editingRequest: string | null;
  setEditingRequest: (id: string | null) => void;
  updateRequest: (collectionId: string, requestId: string, updates: Partial<HttpRequest>) => void;
  collectionId: string;
}> = ({ request, isActive, onClick, onEdit, onDelete, onDuplicate, editingRequest, setEditingRequest, updateRequest, collectionId }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div
      className={`
        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm
        ${isActive ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-gray-50'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <MethodBadge method={request.method} />
        <div className="flex-1 min-w-0">
          {editingRequest === request.id ? (
            <input
              type="text"
              defaultValue={request.name}
              className="input text-sm font-medium w-full"
              autoFocus
              onBlur={(e) => {
                updateRequest(collectionId, request.id, { name: e.target.value });
                setEditingRequest(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateRequest(collectionId, request.id, { name: e.currentTarget.value });
                  setEditingRequest(null);
                }
                if (e.key === 'Escape') {
                  setEditingRequest(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-medium text-gray-900 truncate">
              {request.name}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate flex-1">
              {request.url || 'Aucune URL définie'}
            </p>
            <span className="text-xs text-gray-400 ml-2">
              {new Date(request.updatedAt).toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setShowMenu(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <PencilIcon className="h-4 w-4 mr-3" />
              Modifier
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
                setShowMenu(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-3" />
              Dupliquer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-3" />
              Supprimer
            </button>
          </div>
        )}
      </div>
      

    </div>
  );
};

const RequestEditor: React.FC<{ request: HttpRequest | null }> = ({ request }) => {
  const [activeTab, setActiveTab] = useState('params');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [method, setMethod] = useState<HttpMethod>(request?.method || 'GET');
  const [url, setUrl] = useState(request?.url || '');
  const [name, setName] = useState(request?.name || '');
  
  // États pour les données de la requête
  const [queryParams, setQueryParams] = useState<QueryParam[]>(request?.queryParams || []);
  const [headers, setHeaders] = useState<HttpHeader[]>(request?.headers || []);
  const [bodyType, setBodyType] = useState(request?.body?.type || 'none');
  const [bodyContent, setBodyContent] = useState(request?.body?.content || '');
  const [authType, setAuthType] = useState<AuthType>(request?.auth?.type || 'none');
  const [authConfig, setAuthConfig] = useState<AuthConfig>(request?.auth || { type: 'none' });
  const [testScript, setTestScript] = useState('');
  
  const { addEntry } = useHistoryStore();
  const { getActiveEnvironment } = useEnvironmentStore();
  const { updateRequest, saveRequestResponse, getActiveCollection } = useCollectionStore();
  
  // Synchroniser les états locaux avec la prop request quand elle change
  useEffect(() => {
    if (request) {
      setMethod(request.method);
      setUrl(request.url);
      setName(request.name);
      setQueryParams(request.queryParams || []);
      setHeaders(request.headers || []);
      setBodyType(request.body?.type || 'none');
      setBodyContent(request.body?.content || '');
      setAuthType(request.auth?.type || 'none');
      setAuthConfig(request.auth || { type: 'none' });
      setTestScript(request.testScript || '');
      // Charger la réponse persistée si elle existe
      setResponse(request.lastResponse || null);
    } else {
      // Réinitialiser tous les états si aucune requête n'est sélectionnée
      setMethod('GET');
      setUrl('');
      setName('');
      setQueryParams([]);
      setHeaders([]);
      setBodyType('none');
      setBodyContent('');
      setAuthType('none');
      setAuthConfig({ type: 'none' });
      setTestScript('');
      setResponse(null);
    }
  }, [request]);
  
  // Fonctions utilitaires pour les paramètres
  const addQueryParam = () => {
    const newParam: QueryParam = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    setQueryParams([...queryParams, newParam]);
  };
  
  const updateQueryParam = (id: string, field: keyof QueryParam, value: any) => {
    setQueryParams(queryParams.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ));
  };
  
  const removeQueryParam = (id: string) => {
    setQueryParams(queryParams.filter(param => param.id !== id));
  };
  
  // Fonctions utilitaires pour les en-têtes
  const addHeader = () => {
    const newHeader: HttpHeader = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    setHeaders([...headers, newHeader]);
  };
  
  const updateHeader = (id: string, field: keyof HttpHeader, value: any) => {
    setHeaders(headers.map(header => 
      header.id === id ? { ...header, [field]: value } : header
    ));
  };
  
  const removeHeader = (id: string) => {
    setHeaders(headers.filter(header => header.id !== id));
  };
  
  // Sauvegarder les modifications
  const saveRequest = () => {
    if (request) {
      const updatedRequest: Partial<HttpRequest> = {
        method,
        url,
        name,
        queryParams,
        headers,
        body: bodyType === 'none' ? undefined : {
          type: bodyType as any,
          content: bodyContent
        },
        auth: authConfig,
        testScript,
        updatedAt: new Date()
      };
      
      // Trouver la collection qui contient cette requête
      const collections = useCollectionStore.getState().collections;
      const collection = collections.find(c => c.requests.some(r => r.id === request.id));
      if (collection) {
        updateRequest(collection.id, request.id, updatedRequest);
      }
    }
  };
  
  // Sauvegarder automatiquement les modifications
  useEffect(() => {
    if (request) {
      const timeoutId = setTimeout(saveRequest, 1000); // Debounce de 1 seconde
      return () => clearTimeout(timeoutId);
    }
  }, [method, url, name, queryParams, headers, bodyType, bodyContent, authConfig, testScript]);
  
  const handleSendRequest = async () => {
    if (!url.trim()) {
      alert('Veuillez entrer une URL');
      return;
    }
    
    setIsLoading(true);
    try {
      const activeEnv = getActiveEnvironment();
      const envVariables = activeEnv?.variables.reduce((acc, variable) => {
        acc[variable.key] = variable.value;
        return acc;
      }, {} as Record<string, string>) || {};
      
      // Créer un objet de requête avec les valeurs actuelles
      const currentRequest: HttpRequest = {
        id: request?.id || 'temp',
        name: name || 'Requête sans nom',
        method: method,
        url: url,
        headers: headers,
        queryParams: queryParams,
        body: bodyType === 'none' ? undefined : {
          type: bodyType as any,
          content: bodyContent
        },
        auth: authConfig,
        createdAt: request?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      const httpResponse = await httpService.executeRequest(currentRequest, envVariables);
      setResponse(httpResponse);
      
      // Ajouter à l'historique
      addEntry(currentRequest, httpResponse, 'Collection');
      
      // Sauvegarder la réponse dans la requête pour la persistance
       if (request) {
         const activeCollection = getActiveCollection();
         if (activeCollection) {
           saveRequestResponse(activeCollection.id, request.id, httpResponse);
         }
       }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la requête:', error);
      setResponse({
        status: 0,
        statusText: 'Erreur de réseau',
        data: { error: error instanceof Error ? error.message : 'Erreur inconnue' },
        headers: {},
        responseTime: 0,
        size: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const tabs = [
    { id: 'params', label: 'Paramètres' },
    { id: 'headers', label: 'En-têtes' },
    { id: 'body', label: 'Corps' },
    { id: 'auth', label: 'Authentification' },
    { id: 'tests', label: 'Tests' }
  ];
  
  return (
    <div className="flex-1 bg-white border-l border-gray-200 overflow-y-auto">
      {/* Request header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <select 
            className="text-sm font-mono font-medium border border-gray-300 rounded px-3 py-1"
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <input
            type="text"
            placeholder="Entrez l'URL de votre requête..."
            className="flex-1 input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            className="btn btn-primary"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Nom de la requête"
          className="input w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6 overflow-y-auto">
        {activeTab === 'params' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Paramètres de requête</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
                <div className="col-span-5">Clé</div>
                <div className="col-span-5">Valeur</div>
                <div className="col-span-2">Actions</div>
              </div>
              {queryParams.map((param) => (
                <div key={param.id} className="grid grid-cols-12 gap-3">
                  <input 
                    className="col-span-5 input" 
                    placeholder="Clé" 
                    value={param.key}
                    onChange={(e) => updateQueryParam(param.id, 'key', e.target.value)}
                  />
                  <input 
                    className="col-span-5 input" 
                    placeholder="Valeur" 
                    value={param.value}
                    onChange={(e) => updateQueryParam(param.id, 'value', e.target.value)}
                  />
                  <div className="col-span-2 flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={param.enabled}
                      onChange={(e) => updateQueryParam(param.id, 'enabled', e.target.checked)}
                    />
                    <button 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeQueryParam(param.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addQueryParam}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un paramètre
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'headers' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">En-têtes HTTP</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
                <div className="col-span-5">Nom</div>
                <div className="col-span-5">Valeur</div>
                <div className="col-span-2">Actions</div>
              </div>
              {headers.map((header) => (
                <div key={header.id} className="grid grid-cols-12 gap-3">
                  <input 
                    className="col-span-5 input" 
                    placeholder="Content-Type" 
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                  />
                  <input 
                    className="col-span-5 input" 
                    placeholder="application/json" 
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  />
                  <div className="col-span-2 flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={header.enabled}
                      onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                    />
                    <button 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => removeHeader(header.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addHeader}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un en-tête
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'body' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Corps de la requête</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="bodyType" 
                    value="none" 
                    className="mr-2" 
                    checked={bodyType === 'none'}
                    onChange={(e) => setBodyType(e.target.value as any)}
                  />
                  Aucun
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="bodyType" 
                    value="raw" 
                    className="mr-2" 
                    checked={bodyType === 'raw'}
                    onChange={(e) => setBodyType(e.target.value as any)}
                  />
                  Raw
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="bodyType" 
                    value="form-data" 
                    className="mr-2" 
                    checked={bodyType === 'form-data'}
                    onChange={(e) => setBodyType(e.target.value as any)}
                  />
                  Form Data
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="bodyType" 
                    value="x-www-form-urlencoded" 
                    className="mr-2" 
                    checked={bodyType === 'x-www-form-urlencoded'}
                    onChange={(e) => setBodyType(e.target.value as any)}
                  />
                  URL Encoded
                </label>
              </div>
              {bodyType !== 'none' && (
                <textarea
                  className="textarea w-full h-64 font-mono text-sm"
                  placeholder={bodyType === 'raw' ? `{\n  "key": "value"\n}` : 'key1=value1&key2=value2'}
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'auth' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Authentification</h3>
            <div className="space-y-4">
              <select 
                className="input w-full"
                value={authType}
                onChange={(e) => {
                  const newType = e.target.value as AuthType;
                  setAuthType(newType);
                  setAuthConfig({ type: newType } as AuthConfig);
                }}
              >
                <option value="none">Aucune authentification</option>
                <option value="basic">Basic Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="api-key">API Key</option>
              </select>
              
              {authType === 'basic' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    className="input w-full"
                    value={authConfig.basic?.username || ''}
                    onChange={(e) => setAuthConfig({
                      ...authConfig,
                      basic: { ...authConfig.basic, username: e.target.value, password: authConfig.basic?.password || '' }
                    } as AuthConfig)}
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    className="input w-full"
                    value={authConfig.basic?.password || ''}
                    onChange={(e) => setAuthConfig({
                      ...authConfig,
                      basic: { ...authConfig.basic, password: e.target.value, username: authConfig.basic?.username || '' }
                    } as AuthConfig)}
                  />
                </div>
              )}
              
              {authType === 'bearer' && (
                <input
                  type="text"
                  placeholder="Token Bearer"
                  className="input w-full"
                  value={authConfig.bearer?.token || ''}
                  onChange={(e) => setAuthConfig({
                    ...authConfig,
                    bearer: { token: e.target.value }
                  } as AuthConfig)}
                />
              )}
              
              {authType === 'api-key' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom de la clé"
                    className="input w-full"
                    value={authConfig.apiKey?.key || ''}
                    onChange={(e) => setAuthConfig({
                      ...authConfig,
                      apiKey: { 
                        ...authConfig.apiKey, 
                        key: e.target.value, 
                        value: authConfig.apiKey?.value || '',
                        addTo: authConfig.apiKey?.addTo || 'header'
                      }
                    } as AuthConfig)}
                  />
                  <input
                    type="text"
                    placeholder="Valeur de la clé"
                    className="input w-full"
                    value={authConfig.apiKey?.value || ''}
                    onChange={(e) => setAuthConfig({
                      ...authConfig,
                      apiKey: { 
                        ...authConfig.apiKey, 
                        value: e.target.value, 
                        key: authConfig.apiKey?.key || '',
                        addTo: authConfig.apiKey?.addTo || 'header'
                      }
                    } as AuthConfig)}
                  />
                  <select 
                    className="input w-full"
                    value={authConfig.apiKey?.addTo || 'header'}
                    onChange={(e) => setAuthConfig({
                      ...authConfig,
                      apiKey: { 
                        ...authConfig.apiKey, 
                        addTo: e.target.value as 'header' | 'query',
                        key: authConfig.apiKey?.key || '',
                        value: authConfig.apiKey?.value || ''
                      }
                    } as AuthConfig)}
                  >
                    <option value="header">Ajouter à l'en-tête</option>
                    <option value="query">Ajouter aux paramètres</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'tests' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scripts de test</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>Écrivez des scripts JavaScript pour tester automatiquement vos réponses.</p>
                <p className="mt-1">Variables disponibles : <code className="bg-gray-100 px-1 rounded">response</code>, <code className="bg-gray-100 px-1 rounded">status</code>, <code className="bg-gray-100 px-1 rounded">headers</code>, <code className="bg-gray-100 px-1 rounded">body</code></p>
              </div>
              <textarea
                className="textarea w-full h-64 font-mono text-sm"
                placeholder="// Exemple de test\nif (response.status === 200) {\n  console.log('✅ Statut OK');\n} else {\n  console.error('❌ Erreur:', response.status);\n}\n\n// Vérifier le contenu JSON\ntry {\n  const data = JSON.parse(response.body);\n  if (data.success) {\n    console.log('✅ Réponse valide');\n  }\n} catch (e) {\n  console.error('❌ JSON invalide');\n}"
                value={testScript}
                onChange={(e) => setTestScript(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Response section */}
      {response && (
        <div className="border-t border-gray-200">
          <div className="p-6 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Réponse</h3>
            
            {/* Response status */}
            <div className="flex items-center space-x-4 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                response.status >= 200 && response.status < 300 
                  ? 'bg-green-100 text-green-800'
                  : response.status >= 400
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-sm text-gray-500">
                Temps: {response.time}ms
              </span>
              <span className="text-sm text-gray-500">
                Taille: {response.size} bytes
              </span>
            </div>
            
            {/* Response headers */}
            {Object.keys(response.headers).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">En-têtes de réponse</h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="text-blue-600 mr-2">{key}:</span>
                      <span className="text-gray-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Informations d'authentification */}
            {authType !== 'none' && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-blue-700 mb-2">🔐 Authentification utilisée</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Type:</span>
                      <span className="capitalize">{authType}</span>
                    </div>
                    {authType === 'bearer' && authConfig.bearer?.token && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">Token:</span>
                        <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                          {authConfig.bearer.token.substring(0, 20)}...
                        </span>
                      </div>
                    )}
                    {authType === 'basic' && authConfig.basic?.username && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">Utilisateur:</span>
                        <span>{authConfig.basic.username}</span>
                      </div>
                    )}
                    {authType === 'api-key' && authConfig.apiKey?.key && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-medium">Clé:</span>
                        <span>{authConfig.apiKey.key}</span>
                        <span className="text-xs">({authConfig.apiKey.addTo})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic de la réponse */}
            {(() => {
              const diagnostics = httpService.diagnoseResponse(response);
              if (diagnostics.length > 0) {
                return (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-amber-700 mb-2">⚠️ Diagnostic de la réponse</h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <ul className="text-sm text-amber-800 space-y-1">
                        {diagnostics.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Response body */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Corps de la réponse</h4>
              <div className="json-response-container">
                <pre className="json-response max-h-96">
                  {(() => {
                    // Vérifier si le corps de la réponse existe et n'est pas vide
                    if (!response.body || response.body.trim() === '') {
                      return 'Aucune donnée dans la réponse (corps vide)';
                    }
                    
                    try {
                      // Essayer de parser le JSON pour un affichage formaté
                      const parsed = JSON.parse(response.body);
                      
                      // Vérifier si l'objet JSON est vide
                      if (typeof parsed === 'object' && parsed !== null) {
                        if (Array.isArray(parsed) && parsed.length === 0) {
                          return 'Réponse JSON: tableau vide []';
                        }
                        if (Object.keys(parsed).length === 0) {
                          return 'Réponse JSON: objet vide {}';
                        }
                      }
                      
                      return JSON.stringify(parsed, null, 2);
                    } catch {
                      // Si ce n'est pas du JSON valide, afficher tel quel
                      return response.body;
                    }
                  })()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
   );
 };

export const Collections: React.FC = () => {
  const { id } = useParams();
  const {
    collections,
    activeCollectionId,
    activeRequestId,
    searchTerm,
    createCollection,
    createRequest,
    setActiveCollection,
    setActiveRequest,
    getActiveCollection,
    getActiveRequest,
    deleteCollection,
    deleteRequest,
    duplicateRequest,
    updateCollection,
    updateRequest,
    importCollection,
    createSubCollection,
    getRootCollections,
    setSearchTerm
  } = useCollectionStore();
  
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'collection' | 'request', id: string, collectionId?: string} | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const activeCollection = activeCollectionId ? collections.find(c => c.id === activeCollectionId) : undefined;
  const activeRequest = getActiveRequest();
  

  
  // Filter collections based on search term
  const filteredCollections = collections.filter(collection => 
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter requests based on search term
  const filteredRequests = activeCollection && !activeCollection.isFolder 
    ? activeCollection.requests.filter(request => 
        request.name.toLowerCase().includes(requestSearchTerm.toLowerCase())
      )
    : activeCollection?.requests || [];
  
  React.useEffect(() => {
    if (id && id !== activeCollectionId) {
      setActiveCollection(id);
    }
  }, [id, activeCollectionId, setActiveCollection]);
  
  // Define handleCreateRequest before using it in useEffect
  const handleCreateRequest = useCallback(() => {
    if (activeCollection) {
      createRequest(activeCollection.id, 'Nouvelle Requête');
    }
  }, [activeCollection, createRequest]);
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New request
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        if (activeCollection && !activeCollection.isFolder) {
          handleCreateRequest();
        }
      }
      
      // Ctrl/Cmd + Shift + N: New collection
      if ((e.ctrlKey || e.metaKey) && e.key === 'N' && e.shiftKey) {
        e.preventDefault();
        setShowCreateMenu(true);
      }
      
      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Escape: Clear search or close menus
       if (e.key === 'Escape') {
         if (searchTerm) {
        setSearchTerm('');
      } else if (requestSearchTerm) {
        setRequestSearchTerm('');
      } else if (showShortcuts) {
           setShowShortcuts(false);
         } else {
           setShowCreateMenu(false);
         }
       }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeCollection, searchTerm, requestSearchTerm, handleCreateRequest]);
  
  const handleCreateCollection = () => {
    createCollection('Nouvelle Collection');
  };
  
  const handleCreateSubCollection = (parentId: string) => {
    createSubCollection(parentId, 'Nouvelle Sous-Collection');
  };
  
  const handleCreateFolder = (parentId: string) => {
    createSubCollection(parentId, 'Nouveau Dossier', '', true);
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
  
  return (
    <div className="h-full flex">
      {/* Collections sidebar */}
      <ResizablePanel 
        defaultWidth={320}
        minWidth={250}
        maxWidth={500}
        resizable="right"
        storageKey="collections-panel-width"
        className="bg-gray-50 border-r border-gray-200 flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          {/* Title row */}
          <div className="flex items-center space-x-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
            <div className="relative">
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Raccourcis clavier"
              >
                <QuestionMarkCircleIcon className="h-4 w-4" />
              </button>
              {showShortcuts && (
                <div className="absolute top-6 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64 animate-fade-in">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Raccourcis clavier</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Nouvelle requête</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+N</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Nouvelle collection</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Shift+N</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Rechercher</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+F</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Fermer/Effacer</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Échap</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Buttons row */}
          <div className="flex space-x-2 mb-3">
            <button
              onClick={handleImportCollection}
              className="btn btn-ghost btn-sm"
              title="Importer une collection"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              Importer
            </button>
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="btn btn-primary btn-sm flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Nouveau
                <ChevronDownIcon className="h-3 w-3 ml-1" />
              </button>
              
              {showCreateMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      handleCreateCollection();
                      setShowCreateMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Nouvelle collection
                  </button>
                  <button
                    onClick={() => {
                      createCollection('Nouveau Dossier', '', undefined, true);
                      setShowCreateMenu(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FolderIcon className="h-4 w-4 mr-2" />
                    Nouveau dossier
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Search bar row */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher collections... (Ctrl+F)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
        
        {/* Collections list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-full">
          {getRootCollections().length === 0 ? (
            <div className="text-center py-8 animate-fade-in">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Aucune collection</p>
              <button
                onClick={handleCreateCollection}
                className="btn btn-ghost btn-sm mt-2"
              >
                Créer une collection
              </button>
            </div>
          ) : searchTerm && filteredCollections.length === 0 ? (
            <div className="text-center py-8 animate-fade-in">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Aucune collection trouvée pour "{searchTerm}"</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <CollectionTree
                collections={searchTerm ? filteredCollections : collections}
                activeCollectionId={activeCollectionId}
                editingCollection={editingCollection}
                setEditingCollection={setEditingCollection}
                onDeleteCollection={(id) => setDeleteConfirm({type: 'collection', id})}
                onCreateRequest={handleCreateRequest}
                onCreateSubCollection={handleCreateSubCollection}
                onCreateFolder={handleCreateFolder}
              />
            </div>
          )}
        </div>
      </ResizablePanel>
      
      {/* Requests sidebar */}
      <ResizablePanel 
        defaultWidth={320}
        minWidth={250}
        maxWidth={500}
        resizable="right"
        storageKey="requests-panel-width"
        className="bg-white border-r border-gray-200 flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeCollection ? activeCollection.name : 'Requêtes'}
            </h2>
            {activeCollection && !activeCollection.isFolder && (
              <button
                onClick={handleCreateRequest}
                className="btn btn-primary btn-sm flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Nouvelle
              </button>
            )}
          </div>
          
          {/* Search bar for requests */}
          {activeCollection && !activeCollection.isFolder && activeCollection.requests.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                 type="text"
                 placeholder="Rechercher requêtes... (Ctrl+F)"
                 value={requestSearchTerm}
                 onChange={(e) => setRequestSearchTerm(e.target.value)}
                 className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
               />
              {requestSearchTerm && (
                <button
                  onClick={() => setRequestSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Requests list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-full">
          {!activeCollection ? (
            <div className="text-center py-8 animate-fade-in">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Sélectionnez une collection</p>
              <p className="text-gray-400 text-xs mt-2">
                Choisissez une collection pour voir ses requêtes
              </p>
            </div>
          ) : activeCollection.isFolder ? (
            <div className="text-center py-8 animate-fade-in">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Dossier sélectionné</p>
              <p className="text-gray-400 text-xs mt-2">
                Les dossiers ne contiennent pas de requêtes directement
              </p>
            </div>
          ) : filteredRequests.length === 0 && requestSearchTerm ? (
            <div className="text-center py-8 animate-fade-in">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Aucune requête trouvée pour "{requestSearchTerm}"</p>
            </div>
          ) : activeCollection.requests.length === 0 ? (
            <div className="text-center py-8 animate-fade-in">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Aucune requête</p>
              <button
                onClick={handleCreateRequest}
                className="btn btn-ghost btn-sm mt-2"
              >
                Créer une requête
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              {filteredRequests.map((request) => (
                <RequestItem
                  key={request.id}
                  request={request}
                  isActive={activeRequestId === request.id}
                  onClick={() => setActiveRequest(request.id)}
                  onEdit={() => setEditingRequest(request.id)}
                  onDelete={() => setDeleteConfirm({type: 'request', id: request.id, collectionId: activeCollection.id})}
                  onDuplicate={() => duplicateRequest(activeCollection.id, request.id)}
                  editingRequest={editingRequest}
                  setEditingRequest={setEditingRequest}
                  updateRequest={updateRequest}
                  collectionId={activeCollection.id}
                />
              ))}
            </div>
          )}
        </div>
      </ResizablePanel>
      
      {/* Main content - Request Editor */}
      {activeRequest ? (
        <RequestEditor request={activeRequest} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sélectionnez une requête
            </h3>
            <p className="text-gray-500 mb-6">
              Choisissez une requête dans la liste pour commencer à l'éditer.
            </p>
            {activeCollection && !activeCollection.isFolder && (
              <button
                onClick={handleCreateRequest}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer une nouvelle requête
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette {deleteConfirm.type === 'collection' ? 'collection' : 'requête'} ?
              {deleteConfirm.type === 'collection' && ' Toutes les requêtes et sous-collections qu\'elle contient seront également supprimées.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-ghost"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'collection') {
                    deleteCollection(deleteConfirm.id);
                  } else {
                    deleteRequest(deleteConfirm.collectionId!, deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }}
                className="btn btn-danger"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};