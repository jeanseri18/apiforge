import React, { useState, useEffect, useRef } from 'react';
import { Note, useNotesStore } from '../../stores/notesStore';
import { MarkdownPreview } from './MarkdownPreview';
import { Bold, Italic, List, Link, Image, Eye, EyeOff, Save } from 'lucide-react';

interface MarkdownEditorProps {
  note: Note;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ note }) => {
  const { updateNote, tags, addTagToNote, removeTagFromNote } = useNotesStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Synchroniser avec la note active
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id, note.title, note.content]);
  
  // Sauvegarde automatique
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        updateNote(note.id, { title, content });
      }
    }, 1000); // Sauvegarde après 1 seconde d'inactivité
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, note.id, note.title, note.content, updateNote]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insérer une tabulation
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      
      // Repositionner le curseur
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    
    // Raccourcis clavier
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          updateNote(note.id, { title, content });
          break;
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdown('[', '](url)');
          break;
      }
    }
  };
  
  const insertMarkdown = (before: string, after: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    setContent(newContent);
    
    // Repositionner le curseur
    setTimeout(() => {
      const newPosition = start + before.length + selectedText.length;
      textarea.selectionStart = textarea.selectionEnd = newPosition;
      textarea.focus();
    }, 0);
  };
  
  const insertHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertMarkdown(prefix, '');
  };
  
  const insertList = (ordered: boolean = false) => {
    const prefix = ordered ? '1. ' : '- ';
    insertMarkdown(prefix, '');
  };
  
  const toggleTag = (tagId: string) => {
    if (note.tags.includes(tagId)) {
      removeTagFromNote(note.id, tagId);
    } else {
      addTagToNote(note.id, tagId);
    }
  };
  
  const getTagById = (tagId: string) => {
    return tags.find(tag => tag.id === tagId);
  };
  
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Barre d'outils */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        {/* Titre */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="
            w-full text-xl font-bold bg-transparent border-none outline-none
            text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
            mb-3
          "
          placeholder="Titre de la note..."
        />
        
        {/* Tags de la note */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tags:</span>
          {note.tags.map((tagId) => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            
            return (
              <span
                key={tagId}
                className="px-2 py-1 text-xs rounded-full text-white cursor-pointer hover:opacity-80"
                style={{ backgroundColor: tag.color }}
                onClick={() => toggleTag(tagId)}
                title="Cliquer pour retirer"
              >
                {tag.name} ×
              </span>
            );
          })}
          
          <button
            onClick={() => setShowTagSelector(!showTagSelector)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            + Ajouter tag
          </button>
        </div>
        
        {/* Sélecteur de tags */}
        {showTagSelector && (
          <div className="mb-3 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex flex-wrap gap-1">
              {tags.filter(tag => !note.tags.includes(tag.id)).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    toggleTag(tag.id);
                    setShowTagSelector(false);
                  }}
                  className="px-2 py-1 text-xs rounded-full text-white hover:opacity-80"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Barre d'outils Markdown */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
            <button
              onClick={() => insertHeading(1)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Titre 1"
            >
              H1
            </button>
            <button
              onClick={() => insertHeading(2)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Titre 2"
            >
              H2
            </button>
            <button
              onClick={() => insertHeading(3)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Titre 3"
            >
              H3
            </button>
          </div>
          
          <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
            <button
              onClick={() => insertMarkdown('**', '**')}
              className="p-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Gras (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => insertMarkdown('*', '*')}
              className="p-1 text-sm italic hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Italique (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => insertMarkdown('`', '`')}
              className="p-1 text-sm font-mono hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Code"
            >
              &lt;/&gt;
            </button>
          </div>
          
          <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
            <button
              onClick={() => insertList(false)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Liste à puces"
            >
              •
            </button>
            <button
              onClick={() => insertList(true)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Liste numérotée"
            >
              1.
            </button>
            <button
              onClick={() => insertMarkdown('[', '](url)')}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Lien (Ctrl+K)"
            >
              🔗
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-1 text-sm rounded ${
                showPreview 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Aperçu"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Plein écran"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Zone d'édition */}
      <div className="flex-1 flex overflow-hidden">
        {/* Éditeur */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              flex-1 p-4 resize-none border-none outline-none
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              font-mono text-sm leading-relaxed
            "
            placeholder="Écrivez votre note en Markdown..."
          />
        </div>
        
        {/* Aperçu */}
        {showPreview && (
          <>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <div className="w-1/2 overflow-y-auto">
              <MarkdownPreview content={content} />
            </div>
          </>
        )}
      </div>
      
      {/* Barre de statut */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            {content.length} caractères • {content.split('\n').length} lignes
          </span>
          <span>
            Sauvegarde automatique activée
          </span>
        </div>
      </div>
    </div>
  );
};