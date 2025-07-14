import React, { useState } from 'react';
import { useTodoStore, TaskPriority, priorityColors } from '../../stores/todoStore';
import { useNotesStore } from '../../stores/notesStore';
import { Plus, Filter, Search, Tag } from 'lucide-react';

interface TodoToolbarProps {
  onCreateTask: () => void;
  onQuickCreate: (title: string) => void;
  onToggleTagManager: () => void;
  showTagManager: boolean;
  stats: {
    total: number;
    todo: number;
    inprogress: number;
    done: number;
    overdue: number;
  };
}

export const TodoToolbar: React.FC<TodoToolbarProps> = ({
  onCreateTask,
  onQuickCreate,
  onToggleTagManager,
  showTagManager,
  stats
}) => {
  const {
    searchTerm,
    selectedTags,
    selectedPriorities,
    setSearchTerm,
    toggleTagFilter,
    togglePriorityFilter,
    clearFilters,
    getFilteredTasks
  } = useTodoStore();
  
  const { tags } = useNotesStore();

  
  const filteredTasks = getFilteredTasks();
  const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedPriorities.length > 0;
  
  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };
  
  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'urgent':
        return 'Urgente';
      default:
        return 'Normale';
    }
  };
  

  
  return (
    <div className="p-4">
      {/* Barre d'outils compacte */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gestionnaire de Tâches</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>{stats.todo} à faire</span>
            </span>
            <span className="flex items-center space-x-1">
               <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
               <span>{stats.inProgress} en cours</span>
             </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>{stats.done} terminées</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="
                w-64 pl-8 pr-8 py-2 border border-gray-300 dark:border-gray-600
                rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200 text-sm
              "
            />
            <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
              <Search className="w-4 h-4" />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="
                  absolute right-2.5 top-1/2 transform -translate-y-1/2
                  text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                "
              >
                ×
              </button>
            )}
          </div>
          
          <button
            onClick={onToggleTagManager}
            className="
              px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
              transition-all duration-200 text-sm font-medium
            "
          >
            <Tag className="w-4 h-4 mr-1" /> Tags
          </button>
          
          <button
            onClick={onCreateTask}
            className="
              px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
              transition-all duration-200 text-sm font-medium
            "
          >
            ➕ Nouvelle Tâche
          </button>
        </div>
      </div>
      

      
      {/* Filtres */}
      <div className="space-y-3">
        {/* Filtres par priorité */}
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Filtrer par priorité:
          </div>
          
          <div className="flex flex-wrap gap-1">
            {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((priority) => {
              const isSelected = selectedPriorities.includes(priority);
              
              return (
                <button
                  key={priority}
                  onClick={() => togglePriorityFilter(priority)}
                  className={`
                    px-2 py-1 text-xs rounded-full transition-all duration-200
                    ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? priorityColors[priority] : undefined
                  }}
                >
                  {getPriorityLabel(priority)}
                  {isSelected && ' ×'}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Filtres par tags */}
        {tags.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Filtrer par tags:
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`
                      px-2 py-1 text-xs rounded-full transition-all duration-200
                      ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                    style={{
                      backgroundColor: isSelected ? tag.color : undefined
                    }}
                  >
                    {tag.name}
                    {isSelected && ' ×'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Résultats et actions de filtrage */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-4">
        <span>
          {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' trouvée(s)'}
        </span>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="
              text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300
              transition-colors
            "
          >
            Effacer les filtres
          </button>
        )}
      </div>
    </div>
  );
};