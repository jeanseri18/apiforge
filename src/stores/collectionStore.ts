import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Collection, HttpRequest, Variable, HttpMethod } from '../types/global';
import { v4 as uuidv4 } from 'uuid';

interface CollectionState {
  // État
  collections: Collection[];
  activeCollectionId: string | null;
  activeRequestId: string | null;
  searchTerm: string;
  
  // Actions pour les collections
  loadCollections: () => void;
  createCollection: (name: string, description?: string, parentId?: string, isFolder?: boolean) => Collection;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  duplicateCollection: (id: string) => Collection | null;
  setActiveCollection: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  
  // Actions pour les sous-collections
  createSubCollection: (parentId: string, name: string, description?: string, isFolder?: boolean) => Collection;
  moveCollection: (collectionId: string, newParentId?: string) => void;
  getCollectionHierarchy: () => Collection[];
  getSubCollections: (parentId: string) => Collection[];
  getRootCollections: () => Collection[];
  
  // Actions pour les requêtes
  createRequest: (collectionId: string, name: string) => HttpRequest;
  updateRequest: (collectionId: string, requestId: string, updates: Partial<HttpRequest>) => void;
  saveRequestResponse: (collectionId: string, requestId: string, response: HttpResponse) => void;
  deleteRequest: (collectionId: string, requestId: string) => void;
  duplicateRequest: (collectionId: string, requestId: string) => HttpRequest | null;
  setActiveRequest: (id: string | null) => void;
  
  // Actions pour les variables
  addVariable: (collectionId: string, variable: Omit<Variable, 'id'>) => void;
  updateVariable: (collectionId: string, variableId: string, updates: Partial<Variable>) => void;
  deleteVariable: (collectionId: string, variableId: string) => void;
  
  // Utilitaires
  getCollection: (id: string) => Collection | undefined;
  getRequest: (collectionId: string, requestId: string) => HttpRequest | undefined;
  getActiveCollection: () => Collection | undefined;
  getActiveRequest: () => HttpRequest | undefined;
  
  // Import/Export
  importCollection: (data: any) => Collection;
  exportCollection: (id: string) => any;
  
  // Reset
  reset: () => void;
}

const createDefaultRequest = (name: string): Omit<HttpRequest, 'id' | 'createdAt' | 'updatedAt'> => ({
  name,
  method: 'GET',
  url: '',
  headers: [],
  queryParams: [],
  body: {
    type: 'none',
    content: ''
  },
  auth: {
    type: 'none'
  },
  description: ''
});

const createDefaultCollection = (name: string, description?: string, parentId?: string, isFolder?: boolean): Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> => ({
  name,
  description: description || '',
  requests: [],
  variables: [],
  parentId,
  subCollections: [],
  isFolder: isFolder || false
});

export const useCollectionStore = create<CollectionState>()
  (persist(
    (set, get) => ({
      // État initial
      collections: [],
      activeCollectionId: null,
      activeRequestId: null,
      searchTerm: '',
      
      // Actions pour les collections
      loadCollections: () => {
        // Cette fonction peut être étendue pour charger depuis une API
        console.log('Collections chargées:', get().collections.length);
      },
      
      createCollection: (name, description, parentId, isFolder) => {
        const now = new Date();
        const collection: Collection = {
          id: uuidv4(),
          ...createDefaultCollection(name, description, parentId, isFolder),
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          collections: [...state.collections, collection],
          activeCollectionId: collection.id
        }));
        
        return collection;
      },
      
      updateCollection: (id, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === id
              ? { ...collection, ...updates, updatedAt: new Date() }
              : collection
          )
        }));
      },
      
      deleteCollection: (id) => {
        set((state) => {
          // Fonction récursive pour obtenir tous les IDs des collections à supprimer
          const getCollectionIdsToDelete = (collectionId: string): string[] => {
            const idsToDelete = [collectionId];
            const subCollections = state.collections.filter(c => c.parentId === collectionId);
            
            subCollections.forEach(subCollection => {
              idsToDelete.push(...getCollectionIdsToDelete(subCollection.id));
            });
            
            return idsToDelete;
          };
          
          const idsToDelete = getCollectionIdsToDelete(id);
          const newState = {
            collections: state.collections.filter((c) => !idsToDelete.includes(c.id))
          };
          
          // Si la collection active est supprimée, réinitialiser
          if (idsToDelete.includes(state.activeCollectionId || '')) {
            return {
              ...newState,
              activeCollectionId: null,
              activeRequestId: null
            };
          }
          
          return newState;
        });
      },
      
      duplicateCollection: (id) => {
        const collection = get().getCollection(id);
        if (!collection) return null;
        
        const now = new Date();
        const state = get();
        
        // Fonction récursive pour dupliquer une collection et ses sous-collections
        const duplicateCollectionRecursive = (originalCollection: Collection, newParentId?: string): Collection => {
          const duplicated: Collection = {
            ...originalCollection,
            id: uuidv4(),
            name: newParentId ? originalCollection.name : `${originalCollection.name} (Copie)`,
            parentId: newParentId,
            requests: originalCollection.requests.map((req) => ({
              ...req,
              id: uuidv4(),
              createdAt: now,
              updatedAt: now
            })),
            variables: originalCollection.variables.map((variable) => ({
              ...variable,
              id: uuidv4()
            })),
            subCollections: [],
            createdAt: now,
            updatedAt: now
          };
          
          return duplicated;
        };
        
        // Dupliquer la collection principale
        const duplicatedMain = duplicateCollectionRecursive(collection);
        const allDuplicated = [duplicatedMain];
        
        // Dupliquer récursivement toutes les sous-collections
        const duplicateSubCollections = (parentId: string, newParentId: string) => {
          const subCollections = state.collections.filter(c => c.parentId === parentId);
          
          subCollections.forEach(subCollection => {
            const duplicatedSub = duplicateCollectionRecursive(subCollection, newParentId);
            allDuplicated.push(duplicatedSub);
            
            // Dupliquer les sous-collections de cette sous-collection
            duplicateSubCollections(subCollection.id, duplicatedSub.id);
          });
        };
        
        duplicateSubCollections(collection.id, duplicatedMain.id);
        
        set((state) => ({
          collections: [...state.collections, ...allDuplicated]
        }));
        
        return duplicatedMain;
      },
      
      setActiveCollection: (id) => {
        set({ activeCollectionId: id, activeRequestId: null });
      },
      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },
      
      // Actions pour les sous-collections
      createSubCollection: (parentId, name, description, isFolder) => {
        const now = new Date();
        const subCollection: Collection = {
          id: uuidv4(),
          ...createDefaultCollection(name, description, parentId, isFolder),
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          collections: [...state.collections, subCollection],
          activeCollectionId: subCollection.id
        }));
        
        return subCollection;
      },
      
      moveCollection: (collectionId, newParentId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? { ...collection, parentId: newParentId, updatedAt: new Date() }
              : collection
          )
        }));
      },
      
      getCollectionHierarchy: () => {
        const collections = get().collections;
        const rootCollections = collections.filter(c => !c.parentId);
        
        const buildHierarchy = (parentId?: string): Collection[] => {
          return collections
            .filter(c => c.parentId === parentId)
            .map(collection => ({
              ...collection,
              subCollections: buildHierarchy(collection.id)
            }));
        };
        
        return rootCollections.map(collection => ({
          ...collection,
          subCollections: buildHierarchy(collection.id)
        }));
      },
      
      getSubCollections: (parentId) => {
        return get().collections.filter(c => c.parentId === parentId);
      },
      
      getRootCollections: () => {
        return get().collections.filter(c => !c.parentId);
      },
      
      // Actions pour les requêtes
      createRequest: (collectionId, name) => {
        const now = new Date();
        const request: HttpRequest = {
          id: uuidv4(),
          ...createDefaultRequest(name),
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  requests: [...collection.requests, request],
                  updatedAt: now
                }
              : collection
          ),
          activeRequestId: request.id
        }));
        
        return request;
      },
      
      updateRequest: (collectionId, requestId, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  requests: collection.requests.map((request) =>
                    request.id === requestId
                      ? { ...request, ...updates, updatedAt: new Date() }
                      : request
                  ),
                  updatedAt: new Date()
                }
              : collection
          )
        }));
      },
      
      saveRequestResponse: (collectionId, requestId, response) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  requests: collection.requests.map((request) =>
                    request.id === requestId
                      ? { ...request, lastResponse: response, updatedAt: new Date() }
                      : request
                  ),
                  updatedAt: new Date()
                }
              : collection
          )
        }));
      },
      
      deleteRequest: (collectionId, requestId) => {
        set((state) => {
          const newCollections = state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  requests: collection.requests.filter((r) => r.id !== requestId),
                  updatedAt: new Date()
                }
              : collection
          );
          
          return {
            collections: newCollections,
            activeRequestId: state.activeRequestId === requestId ? null : state.activeRequestId
          };
        });
      },
      
      duplicateRequest: (collectionId, requestId) => {
        const request = get().getRequest(collectionId, requestId);
        if (!request) return null;
        
        const now = new Date();
        const duplicated: HttpRequest = {
          ...request,
          id: uuidv4(),
          name: `${request.name} (Copie)`,
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  requests: [...collection.requests, duplicated],
                  updatedAt: now
                }
              : collection
          )
        }));
        
        return duplicated;
      },
      
      setActiveRequest: (id) => {
        set({ activeRequestId: id });
      },
      
      // Actions pour les variables
      addVariable: (collectionId, variable) => {
        const newVariable: Variable = {
          id: uuidv4(),
          ...variable
        };
        
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  variables: [...collection.variables, newVariable],
                  updatedAt: new Date()
                }
              : collection
          )
        }));
      },
      
      updateVariable: (collectionId, variableId, updates) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  variables: collection.variables.map((variable) =>
                    variable.id === variableId
                      ? { ...variable, ...updates }
                      : variable
                  ),
                  updatedAt: new Date()
                }
              : collection
          )
        }));
      },
      
      deleteVariable: (collectionId, variableId) => {
        set((state) => ({
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  variables: collection.variables.filter((v) => v.id !== variableId),
                  updatedAt: new Date()
                }
              : collection
          )
        }));
      },
      
      // Utilitaires
      getCollection: (id) => {
        return get().collections.find((c) => c.id === id);
      },
      
      getRequest: (collectionId, requestId) => {
        const collection = get().getCollection(collectionId);
        return collection?.requests.find((r) => r.id === requestId);
      },
      
      getActiveCollection: () => {
        const { activeCollectionId } = get();
        return activeCollectionId ? get().getCollection(activeCollectionId) : undefined;
      },
      
      getActiveRequest: () => {
        const { activeCollectionId, activeRequestId } = get();
        if (!activeCollectionId || !activeRequestId) return undefined;
        return get().getRequest(activeCollectionId, activeRequestId);
      },
      
      // Import/Export
      importCollection: (data) => {
        // Détection du format (Postman, Insomnia, etc.)
        let collectionName = 'Collection importée';
        let collectionDescription = '';
        let requests: HttpRequest[] = [];
        
        if (data.info && data.item) {
          // Format Postman v2.1
          collectionName = data.info.name || 'Collection Postman';
          collectionDescription = data.info.description || '';
          
          const convertPostmanItem = (item: any): HttpRequest[] => {
            const convertedRequests: HttpRequest[] = [];
            
            if (item.request) {
              // C'est une requête
              const now = new Date();
              // Conversion de l'URL et des paramètres de requête
              let requestUrl = '';
              let queryParams: any[] = [];
              
              if (typeof item.request.url === 'string') {
                requestUrl = item.request.url;
              } else if (item.request.url) {
                requestUrl = item.request.url.raw || '';
                queryParams = item.request.url.query || [];
              }
              
              // Conversion du corps de la requête
              let body: any = { type: 'none', content: '' };
              if (item.request.body) {
                const bodyMode = item.request.body.mode || 'none';
                let content = '';
                let contentType = '';
                
                switch (bodyMode) {
                  case 'raw':
                    content = item.request.body.raw || '';
                    contentType = item.request.body.options?.raw?.language || 'text';
                    break;
                  case 'urlencoded':
                    if (Array.isArray(item.request.body.urlencoded)) {
                      content = item.request.body.urlencoded
                        .filter((param: any) => !param.disabled)
                        .map((param: any) => `${param.key}=${param.value}`)
                        .join('&');
                    }
                    contentType = 'application/x-www-form-urlencoded';
                    break;
                  case 'formdata':
                    if (Array.isArray(item.request.body.formdata)) {
                      content = JSON.stringify(item.request.body.formdata.filter((param: any) => !param.disabled));
                    }
                    contentType = 'multipart/form-data';
                    break;
                  case 'binary':
                    content = item.request.body.binary || '';
                    contentType = 'application/octet-stream';
                    break;
                }
                
                body = {
                  type: bodyMode === 'raw' ? 'raw' : bodyMode === 'urlencoded' ? 'x-www-form-urlencoded' : bodyMode,
                  content,
                  contentType
                };
              }
              
              // Conversion de l'authentification
              let auth: any = { type: 'none' };
              if (item.request.auth) {
                const authType = item.request.auth.type;
                switch (authType) {
                  case 'basic':
                    auth = {
                      type: 'basic',
                      basic: {
                        username: item.request.auth.basic?.username || '',
                        password: item.request.auth.basic?.password || ''
                      }
                    };
                    break;
                  case 'bearer':
                    auth = {
                      type: 'bearer',
                      bearer: {
                        token: item.request.auth.bearer?.token || ''
                      }
                    };
                    break;
                  case 'apikey':
                    auth = {
                      type: 'api-key',
                      apiKey: {
                        key: item.request.auth.apikey?.key || '',
                        value: item.request.auth.apikey?.value || '',
                        addTo: item.request.auth.apikey?.in === 'query' ? 'query' : 'header'
                      }
                    };
                    break;
                  case 'oauth2':
                    auth = {
                      type: 'oauth2',
                      oauth2: {
                        accessToken: item.request.auth.oauth2?.accessToken || '',
                        refreshToken: item.request.auth.oauth2?.refreshToken || '',
                        clientId: item.request.auth.oauth2?.clientId || '',
                        clientSecret: item.request.auth.oauth2?.clientSecret || ''
                      }
                    };
                    break;
                }
              }
              
              const request: HttpRequest = {
                id: uuidv4(),
                name: item.name || 'Requête sans nom',
                method: (item.request.method || 'GET') as HttpMethod,
                url: requestUrl,
                headers: item.request.header?.map((h: any) => ({
                  id: uuidv4(),
                  key: h.key || '',
                  value: h.value || '',
                  enabled: !h.disabled
                })) || [],
                queryParams: queryParams.map((q: any) => ({
                  id: uuidv4(),
                  key: q.key || '',
                  value: q.value || '',
                  enabled: !q.disabled
                })),
                body,
                auth,
                description: item.request.description || '',
                createdAt: now,
                updatedAt: now
              };
              convertedRequests.push(request);
            } else if (item.item) {
              // C'est un dossier, traiter récursivement
              item.item.forEach((subItem: any) => {
                convertedRequests.push(...convertPostmanItem(subItem));
              });
            }
            
            return convertedRequests;
          };
          
          data.item.forEach((item: any) => {
            requests.push(...convertPostmanItem(item));
          });
        } else if (data.name || data.requests) {
          // Format APIForge ou autre
          collectionName = data.name || 'Collection importée';
          collectionDescription = data.description || '';
          requests = data.requests || [];
        }
        
        // Créer la collection
        const now = new Date();
        const collection: Collection = {
          id: uuidv4(),
          name: collectionName,
          description: collectionDescription,
          requests: requests,
          variables: [],
          createdAt: now,
          updatedAt: now
        };
        
        set((state) => ({
          collections: [...state.collections, collection],
          activeCollectionId: collection.id
        }));
        
        return collection;
      },
      
      exportCollection: (id) => {
        const collection = get().getCollection(id);
        if (!collection) return null;
        
        // Format d'export APIForge
        return {
          apiforge: {
            version: '1.0.0',
            collection: collection
          }
        };
      },
      
      reset: () => {
        set({
          collections: [],
          activeCollectionId: null,
          activeRequestId: null,
          searchTerm: ''
        });
      }
    }),
    {
      name: 'apiforge-collection-store'
    }
  )
);