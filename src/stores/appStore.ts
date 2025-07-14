import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // État de l'application
  isInitialized: boolean;
  isElectron: boolean;
  appVersion: string;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  
  // Interface utilisateur
  activeTab: string;
  splitPaneSize: number;
  
  // Préférences
  preferences: {
    autoSave: boolean;
    requestTimeout: number;
    followRedirects: boolean;
    validateSSL: boolean;
    showResponseTime: boolean;
    showResponseSize: boolean;
    defaultContentType: string;
    historyLimit: number;
    maxRedirects: number;
    sendCookies: boolean;
    sendUserAgent: boolean;
    userAgent?: string;
    editorTheme?: string;
    editorFontSize?: number;
    editorWordWrap?: boolean;
    editorLineNumbers?: boolean;
    showNotifications?: boolean;
    notifyOnRequestComplete?: boolean;
    notifyOnError?: boolean;
  };
  
  // Actions
  initializeApp: () => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setSplitPaneSize: (size: number) => void;
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
  reset: () => void;
}

const defaultPreferences: AppState['preferences'] = {
  autoSave: true,
  requestTimeout: 30000,
  followRedirects: true,
  validateSSL: true,
  showResponseTime: true,
  showResponseSize: true,
  defaultContentType: 'application/json',
  historyLimit: 100,
  maxRedirects: 5,
  sendCookies: true,
  sendUserAgent: true,
  userAgent: 'APIForge/1.0',
  editorTheme: 'light',
  editorFontSize: 14,
  editorWordWrap: false,
  editorLineNumbers: true,
  showNotifications: true,
  notifyOnRequestComplete: true,
  notifyOnError: true
};

export const useAppStore = create<AppState>()
  (persist(
    (set) => ({
      // État initial
      isInitialized: false,
      isElectron: false,
      appVersion: '1.0.0',
      theme: 'system',
      sidebarCollapsed: false,
      activeTab: 'request',
      splitPaneSize: 50,
      preferences: defaultPreferences,
      
      // Actions
      initializeApp: async () => {
        const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
        let appVersion = '1.0.0';
        
        if (isElectron && window.electronAPI) {
          try {
            appVersion = await window.electronAPI.getVersion();
          } catch (error) {
            console.warn('Impossible de récupérer la version de l\'application:', error);
          }
        }
        
        set({
          isInitialized: true,
          isElectron,
          appVersion
        });
        
        console.log(`🚀 APIForge v${appVersion} initialisé (${isElectron ? 'Electron' : 'Web'})`);
      },
      
      setTheme: (theme) => {
        console.log('Setting theme to:', theme);
        set({ theme });
        
        // Appliquer le thème au document
        const root = document.documentElement;
        if (theme === 'dark') {
          console.log('Applying dark theme');
          root.classList.add('dark');
        } else if (theme === 'light') {
          console.log('Applying light theme');
          root.classList.remove('dark');
        } else {
          // Système
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          console.log('Applying system theme, prefers dark:', prefersDark);
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },
      
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
      
      setSplitPaneSize: (size) => {
        set({ splitPaneSize: Math.max(20, Math.min(80, size)) });
      },
      
      updatePreferences: (newPreferences) => {
        console.log('Store: Updating preferences with:', newPreferences);
        set((state) => {
          const updatedPreferences = { ...state.preferences, ...newPreferences };
          console.log('Store: Updated preferences:', updatedPreferences);
          return {
            preferences: updatedPreferences
          };
        });
      },
      
      reset: () => {
        set({
          theme: 'system',
          sidebarCollapsed: false,
          activeTab: 'request',
          splitPaneSize: 50,
          preferences: defaultPreferences
        });
      }
    }),
    {
      name: 'apiforge-app-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        splitPaneSize: state.splitPaneSize,
        preferences: state.preferences
      })
    }
  )
);