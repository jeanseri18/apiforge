import React, { useState } from 'react';
import { NotesManager } from './notes/NotesManager';
import { TodoManager } from './todo/TodoManager';
import { useNotesStore } from '../stores/notesStore';
import { useTodoStore } from '../stores/todoStore';
import { FileText, CheckSquare, AlertTriangle } from 'lucide-react';

type TabType = 'notes' | 'tasks';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

export const ProjectManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  
  const notes = useNotesStore((state) => state.notes);
  const taskStats = useTodoStore((state) => state.getTaskStats());
  
  const tabs: Tab[] = [
    {
      id: 'notes',
      label: 'Notes',
      icon: <FileText className="w-4 h-4" />,
      component: NotesManager
    },
    {
      id: 'tasks',
      label: 'Tâches',
      icon: <CheckSquare className="w-4 h-4" />,
      component: TodoManager
    }
  ];
  
  const getTabBadge = (tabId: TabType) => {
    switch (tabId) {
      case 'notes':
        return notes.length > 0 ? notes.length : null;
      case 'tasks':
        return taskStats.total > 0 ? taskStats.total : null;
      default:
        return null;
    }
  };
  
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || NotesManager;
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header avec onglets */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Gestion de Projet
          </h1>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const badge = getTabBadge(tab.id);
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-4 py-2 rounded-lg font-medium transition-all duration-200
                    flex items-center space-x-2
                    ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  
                  {badge && (
                    <span className="
                      ml-2 px-2 py-0.5 text-xs font-semibold rounded-full
                      bg-blue-500 text-white
                    ">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Contenu de l'onglet actif */}
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>
      
      {/* Statistiques rapides */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            </span>
            
            <span className="flex items-center space-x-1">
              <CheckSquare className="w-4 h-4" />
              <span>{taskStats.total} tâche{taskStats.total !== 1 ? 's' : ''}</span>
            </span>
            
            {taskStats.overdue > 0 && (
              <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{taskStats.overdue} en retard</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>{taskStats.todo} à faire</span>
            </span>
            
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{taskStats.inprogress} en cours</span>
            </span>
            
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{taskStats.done} terminé{taskStats.done !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};