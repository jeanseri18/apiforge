import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Environment, Variable } from '../types/global';
import { v4 as uuidv4 } from 'uuid';

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  
  // Actions
  createEnvironment: (name: string, description?: string) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  deleteEnvironment: (id: string) => void;
  duplicateEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;
  
  // Variables
  addVariable: (environmentId: string, variable: Omit<Variable, 'id'>) => void;
  updateVariable: (environmentId: string, variableId: string, updates: Partial<Variable>) => void;
  deleteVariable: (environmentId: string, variableId: string) => void;
  
  // Getters
  getActiveEnvironment: () => Environment | null;
  getEnvironment: (id: string) => Environment | undefined;
  getVariables: (environmentId: string) => Variable[];
  getVariableValue: (environmentId: string, key: string) => string | undefined;
  getAllVariables: () => Record<string, string>;
  
  // Utils
  exportEnvironment: (id: string) => string;
  importEnvironment: (data: string) => void;
  reset: () => void;
}

const createDefaultEnvironment = (name: string, description?: string): Environment => ({
  id: uuidv4(),
  name,
  description: description || '',
  variables: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,
      
      createEnvironment: (name, description) => {
        const environment = createDefaultEnvironment(name, description);
        set((state) => ({
          environments: [...state.environments, environment],
          activeEnvironmentId: environment.id
        }));
      },
      
      updateEnvironment: (id, updates) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === id
              ? { ...env, ...updates, updatedAt: new Date() }
              : env
          )
        }));
      },
      
      deleteEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.filter((env) => env.id !== id),
          activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId
        }));
      },
      
      duplicateEnvironment: (id) => {
        const environment = get().getEnvironment(id);
        if (environment) {
          const duplicated = {
            ...environment,
            id: uuidv4(),
            name: `${environment.name} (Copie)`,
            variables: environment.variables.map(variable => ({
              ...variable,
              id: uuidv4()
            })),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set((state) => ({
            environments: [...state.environments, duplicated]
          }));
        }
      },
      
      setActiveEnvironment: (id) => {
        set({ activeEnvironmentId: id });
      },
      
      addVariable: (environmentId, variable) => {
        const newVariable: Variable = {
          id: uuidv4(),
          ...variable
        };
        
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === environmentId
              ? {
                  ...env,
                  variables: [...env.variables, newVariable],
                  updatedAt: new Date()
                }
              : env
          )
        }));
      },
      
      updateVariable: (environmentId, variableId, updates) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === environmentId
              ? {
                  ...env,
                  variables: env.variables.map((variable) =>
                    variable.id === variableId
                      ? { ...variable, ...updates }
                      : variable
                  ),
                  updatedAt: new Date()
                }
              : env
          )
        }));
      },
      
      deleteVariable: (environmentId, variableId) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === environmentId
              ? {
                  ...env,
                  variables: env.variables.filter((variable) => variable.id !== variableId),
                  updatedAt: new Date()
                }
              : env
          )
        }));
      },
      
      getActiveEnvironment: () => {
        const state = get();
        return state.environments.find((env) => env.id === state.activeEnvironmentId) || null;
      },
      
      getEnvironment: (id) => {
        return get().environments.find((env) => env.id === id);
      },
      
      getVariables: (environmentId) => {
        const environment = get().getEnvironment(environmentId);
        return environment?.variables || [];
      },
      
      getVariableValue: (environmentId, key) => {
        const variables = get().getVariables(environmentId);
        const variable = variables.find((v) => v.key === key);
        return variable?.value;
      },
      
      getAllVariables: () => {
        const activeEnv = get().getActiveEnvironment();
        if (!activeEnv) return {};
        
        return activeEnv.variables.reduce((acc, variable) => {
          acc[variable.key] = variable.value;
          return acc;
        }, {} as Record<string, string>);
      },
      
      exportEnvironment: (id) => {
        const environment = get().getEnvironment(id);
        if (!environment) throw new Error('Environment not found');
        
        const exportData = {
          name: environment.name,
          description: environment.description,
          variables: environment.variables.map(({ id, ...variable }) => variable)
        };
        
        return JSON.stringify(exportData, null, 2);
      },
      
      importEnvironment: (data) => {
        try {
          const parsed = JSON.parse(data);
          const environment: Environment = {
            id: uuidv4(),
            name: parsed.name || 'Imported Environment',
            description: parsed.description || '',
            variables: (parsed.variables || []).map((variable: any) => ({
              id: uuidv4(),
              key: variable.key || '',
              value: variable.value || '',
              description: variable.description || '',
              secret: variable.secret || false
            })),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set((state) => ({
            environments: [...state.environments, environment]
          }));
        } catch (error) {
          throw new Error('Invalid environment data format');
        }
      },
      
      reset: () => {
        set({
          environments: [],
          activeEnvironmentId: null
        });
      }
    }),
    {
      name: 'environment-storage',
      version: 1
    }
  )
);