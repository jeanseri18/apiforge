import React, { useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { Plus, Search, Filter, Tag } from 'lucide-react';

interface NotesToolbarProps {
  onCreateNote: () => void;
  onToggleTagManager: () => void;
  showTagManager: boolean;
}

export const NotesToolbar: React.FC<NotesToolbarProps> = ({
  onCreateNote,
  onToggleTagManager,
  showTagManager
}) => {
  const {
    searchTerm,
    selectedTags,
    tags,
    setSearchTerm,
    toggleTagFilter,
    clearTagFilters,
    getFilteredNotes
  } = useNotesStore();
  
  const filteredNotes = getFilteredNotes();
  const hasActiveFilters = searchTerm || selectedTags.length > 0;
  
  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };
  
  const clearAllFilters = () => {
    setSearchTerm('');
    clearTagFilters();
  };
  
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Boutons d'action */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notes
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleTagManager}
            className={`
              p-2 rounded-lg transition-colors text-sm
              ${
                showTagManager
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
            title="Gérer les tags"
          >
            <Tag className="w-4 h-4" />
          </button>
          
          <button
            onClick={onCreateNote}
            className="
              px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
              transition-colors text-sm font-medium
            "
            title="Créer une nouvelle note"
          >
            + Note
          </button>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher dans les notes..."
          className="
            w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600
            rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-colors
          "
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            "
          >
            ×
          </button>
        )}
      </div>
      
      {/* Filtres par tags */}
      {tags.length > 0 && (
        <div className="mb-3">
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
      
      {/* Résultats et actions de filtrage */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' trouvée(s)'}
        </span>
        
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
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