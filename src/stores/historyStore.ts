import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HistoryEntry, HttpRequest, HttpResponse } from '../types/global';

interface HistoryState {
  entries: HistoryEntry[];
  maxEntries: number;
  
  // Actions
  addEntry: (request: HttpRequest, response: HttpResponse, collectionName?: string) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getEntry: (id: string) => HistoryEntry | undefined;
  getEntriesByCollection: (collectionName: string) => HistoryEntry[];
  getEntriesByMethod: (method: string) => HistoryEntry[];
  getEntriesByStatus: (statusRange: 'success' | 'error' | 'all') => HistoryEntry[];
  searchEntries: (query: string) => HistoryEntry[];
  getFilteredEntries: (filters: {
    search?: string;
    method?: string;
    status?: 'success' | 'error' | 'all';
  }) => HistoryEntry[];
  setMaxEntries: (max: number) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      maxEntries: 100,
      
      addEntry: (request, response, collectionName) => {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          request: {
            method: request.method,
            url: request.url,
            name: request.name,
            headers: request.headers.reduce((acc, header) => {
              if (header.enabled && header.key) {
                acc[header.key] = header.value;
              }
              return acc;
            }, {} as Record<string, string>),
            body: request.body?.content
          },
          response: {
            status: response.status,
            duration: response.time,
            size: response.size,
            headers: response.headers,
            data: response.body
          },
          collectionName
        };
        
        set((state) => {
          const newEntries = [entry, ...state.entries];
          // Limiter le nombre d'entrées
          if (newEntries.length > state.maxEntries) {
            newEntries.splice(state.maxEntries);
          }
          return { entries: newEntries };
        });
      },
      
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter(entry => entry.id !== id)
        }));
      },
      
      clearHistory: () => {
        set({ entries: [] });
      },
      
      getEntry: (id) => {
        return get().entries.find(entry => entry.id === id);
      },
      
      getEntriesByCollection: (collectionName) => {
        return get().entries.filter(entry => entry.collectionName === collectionName);
      },
      
      getEntriesByMethod: (method) => {
        return get().entries.filter(entry => entry.request.method === method);
      },
      
      getEntriesByStatus: (statusRange) => {
        const entries = get().entries;
        switch (statusRange) {
          case 'success':
            return entries.filter(entry => 
              entry.response?.status && 
              entry.response.status >= 200 && 
              entry.response.status < 300
            );
          case 'error':
            return entries.filter(entry => 
              entry.response?.status && 
              entry.response.status >= 400
            );
          default:
            return entries;
        }
      },
      
      searchEntries: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().entries.filter(entry => 
          entry.request.name?.toLowerCase().includes(lowerQuery) ||
          entry.request.url.toLowerCase().includes(lowerQuery) ||
          entry.collectionName?.toLowerCase().includes(lowerQuery)
        );
      },
      
      getFilteredEntries: (filters) => {
        let filteredEntries = get().entries;
        
        // Filtrer par recherche
        if (filters.search) {
          filteredEntries = get().searchEntries(filters.search);
        }
        
        // Filtrer par méthode
        if (filters.method) {
          filteredEntries = filteredEntries.filter(entry => 
            entry.request.method === filters.method
          );
        }
        
        // Filtrer par statut
        if (filters.status && filters.status !== 'all') {
          filteredEntries = filteredEntries.filter(entry => {
            if (!entry.response?.status) return false;
            
            if (filters.status === 'success') {
              return entry.response.status >= 200 && entry.response.status < 300;
            } else if (filters.status === 'error') {
              return entry.response.status >= 400;
            }
            return true;
          });
        }
        
        return filteredEntries;
      },
      
      setMaxEntries: (max) => {
        set((state) => {
          const newEntries = state.entries.slice(0, max);
          return { maxEntries: max, entries: newEntries };
        });
      }
    }),
    {
      name: 'history-storage',
      version: 1
    }
  )
);