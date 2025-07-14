import React, { useState } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { useTodoStore } from '../../stores/todoStore';
import { Tag } from 'lucide-react';

interface TagManagerProps {
  type: 'notes' | 'tasks';
}

const defaultColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F59E0B'
];

export const TagManager: React.FC<TagManagerProps> = ({ type }) => {
  const { tags, createTag, deleteTag, getNotesByTag } = useNotesStore();
  const { tasks } = useTodoStore();
  
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const getTagUsageCount = (tagId: string) => {
    if (type === 'notes') {
      return getNotesByTag(tagId).length;
    } else {
      return tasks.filter(task => task.tags.includes(tagId)).length;
    }
  };
  
  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName.trim()) return;
    
    // Vérifier si le tag existe déjà
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    
    if (existingTag) {
      alert('Un tag avec ce nom existe déjà');
      return;
    }
    
    createTag(newTagName.trim(), selectedColor);
    setNewTagName('');
    setShowColorPicker(false);
    
    // Sélectionner une nouvelle couleur aléatoire pour le prochain tag
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    setSelectedColor(randomColor);
  };
  
  const handleDeleteTag = (tagId: string) => {
    const usageCount = getTagUsageCount(tagId);
    const tag = tags.find(t => t.id === tagId);
    
    if (!tag) return;
    
    const confirmMessage = usageCount > 0 
      ? `Êtes-vous sûr de vouloir supprimer le tag "${tag.name}" ? Il est utilisé dans ${usageCount} ${type === 'notes' ? 'note(s)' : 'tâche(s)'}.`
      : `Êtes-vous sûr de vouloir supprimer le tag "${tag.name}" ?`;
    
    if (window.confirm(confirmMessage)) {
      deleteTag(tagId);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Gestionnaire de Tags
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Formulaire de création */}
      <form onSubmit={handleCreateTag} className="mb-4">
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Nom du nouveau tag..."
              className="
                w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors
              "
            />
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="
                w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600
                hover:border-gray-400 dark:hover:border-gray-500 transition-colors
              "
              style={{ backgroundColor: selectedColor }}
              title="Choisir une couleur"
            />
            
            {showColorPicker && (
              <div className="
                absolute top-12 right-0 z-10 p-2 bg-white dark:bg-gray-700
                border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg
                grid grid-cols-4 gap-1
              ">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPicker(false);
                    }}
                    className={`
                      w-6 h-6 rounded border-2 transition-all
                      ${
                        selectedColor === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!newTagName.trim()}
            className="
              px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
              disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors text-sm font-medium
            "
          >
            +
          </button>
        </div>
      </form>
      
      {/* Liste des tags existants */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {tags.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <div className="text-2xl mb-1"><Tag className="w-6 h-6 text-gray-400" /></div>
            <p className="text-sm">Aucun tag créé</p>
            <p className="text-xs mt-1">Créez votre premier tag ci-dessus</p>
          </div>
        ) : (
          tags.map((tag) => {
            const usageCount = getTagUsageCount(tag.id);
            
            return (
              <div
                key={tag.id}
                className="
                  flex items-center justify-between p-2 rounded-lg
                  bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600
                  transition-colors group
                "
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-gray-900 dark:text-white font-medium">
                    {tag.name}
                  </span>
                  
                  {usageCount > 0 && (
                    <span className="
                      px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600
                      text-gray-700 dark:text-gray-300 rounded-full
                    ">
                      {usageCount}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="
                    opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full
                    bg-red-500 text-white text-xs hover:bg-red-600
                    transition-all duration-200 flex items-center justify-center
                  "
                  title="Supprimer le tag"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {/* Statistiques */}
      {tags.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Tags utilisés:</span>
              <span>{tags.filter(tag => getTagUsageCount(tag.id) > 0).length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Tags inutilisés:</span>
              <span>{tags.filter(tag => getTagUsageCount(tag.id) === 0).length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};