import React, { useState, useEffect } from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { NotesList } from './NotesList';
import { MarkdownEditor } from './MarkdownEditor';
import { NotesToolbar } from './NotesToolbar';
import { TagManager } from '../shared/TagManager';
import { FileText } from 'lucide-react';

export const NotesManager: React.FC = () => {
  const {
    notes,
    tags,
    activeNoteId,
    searchTerm,
    selectedTags,
    createNote,
    setActiveNote,
    getActiveNote,
    getFilteredNotes
  } = useNotesStore();
  
  const [showTagManager, setShowTagManager] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  
  const activeNote = getActiveNote();
  const filteredNotes = getFilteredNotes();
  
  // Créer une première note si aucune n'existe
  useEffect(() => {
    if (notes.length === 0) {
      createNote('Bienvenue', '# Bienvenue dans votre gestionnaire de notes\n\nCommencez à écrire vos notes en Markdown !\n\n## Fonctionnalités\n\n- **Éditeur Markdown** avec aperçu en temps réel\n- **Tags** pour organiser vos notes\n- **Recherche** dans le contenu\n- **Sauvegarde automatique**\n\n> Astuce : Utilisez la barre latérale pour naviguer entre vos notes.');
    }
  }, [notes.length, createNote]);
  
  const handleCreateNote = () => {
    const note = createNote('Nouvelle note', '# Nouvelle note\n\nContenu de votre note...');
    setActiveNote(note.id);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= 250 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Barre latérale des notes */}
      <div 
        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Toolbar */}
        <NotesToolbar 
          onCreateNote={handleCreateNote}
          onToggleTagManager={() => setShowTagManager(!showTagManager)}
          showTagManager={showTagManager}
        />
        
        {/* Liste des notes */}
        <div className="flex-1 overflow-y-auto">
          <NotesList 
            notes={filteredNotes}
            activeNoteId={activeNoteId}
            onSelectNote={setActiveNote}
            searchTerm={searchTerm}
            selectedTags={selectedTags}
          />
        </div>
        
        {/* Gestionnaire de tags */}
        {showTagManager && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <TagManager type="notes" />
          </div>
        )}
      </div>
      
      {/* Séparateur redimensionnable */}
      <div 
        className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleMouseDown}
      />
      
      {/* Éditeur principal */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <MarkdownEditor note={activeNote} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4"><FileText className="w-16 h-16 text-blue-500" /></div>
              <h3 className="text-xl font-medium mb-2">Aucune note sélectionnée</h3>
              <p className="mb-4">Sélectionnez une note dans la barre latérale ou créez-en une nouvelle</p>
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};