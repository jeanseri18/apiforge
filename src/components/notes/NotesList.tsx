import React from 'react';
import { useNotesStore } from '../../stores/notesStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, FileText } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchTerm: string;
  selectedTags: string[];
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  searchTerm,
  selectedTags
}) => {
  const { tags, deleteNote } = useNotesStore();
  
  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };
  
  const getPreviewText = (content: string) => {
    // Supprimer les marqueurs Markdown et garder seulement le texte
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Titres
      .replace(/\*\*(.*?)\*\*/g, '$1') // Gras
      .replace(/\*(.*?)\*/g, '$1') // Italique
      .replace(/`(.*?)`/g, '$1') // Code inline
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Liens
      .replace(/^>\s+/gm, '') // Citations
      .replace(/^[-*+]\s+/gm, '') // Listes
      .replace(/\n+/g, ' ') // Nouvelles lignes
      .trim();
    
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };
  
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };
  
  const handleDeleteNote = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      deleteNote(noteId);
    }
  };
  
  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        {searchTerm || selectedTags.length > 0 ? (
          <div>
            <div className="text-4xl mb-2"><Search className="w-10 h-10 text-gray-400" /></div>
            <p>Aucune note trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2"><FileText className="w-10 h-10 text-gray-400" /></div>
            <p>Aucune note</p>
            <p className="text-sm mt-1">Créez votre première note</p>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {notes.map((note) => {
        const isActive = note.id === activeNoteId;
        const previewText = getPreviewText(note.content);
        
        return (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`
              p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer
              transition-all duration-200 group relative
              ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            {/* Bouton de suppression */}
            <button
              onClick={(e) => handleDeleteNote(e, note.id)}
              className="
                absolute top-2 right-2 opacity-0 group-hover:opacity-100
                w-6 h-6 rounded-full bg-red-500 text-white text-xs
                hover:bg-red-600 transition-all duration-200
                flex items-center justify-center
              "
              title="Supprimer la note"
            >
              ×
            </button>
            
            {/* Titre de la note */}
            <h3 className={`
              font-medium text-sm mb-1 pr-8
              ${
                isActive
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white'
              }
            `}>
              {highlightText(note.title, searchTerm)}
            </h3>
            
            {/* Aperçu du contenu */}
            {previewText && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {highlightText(previewText, searchTerm)}
              </p>
            )}
            
            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map((tagId) => {
                  const tag = getTagById(tagId);
                  if (!tag) return null;
                  
                  return (
                    <span
                      key={tagId}
                      className="px-2 py-0.5 text-xs rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Date de modification */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Modifiée {formatDistanceToNow(new Date(note.updatedAt), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
              
              {note.createdAt !== note.updatedAt && (
                <span className="text-blue-500">•</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};