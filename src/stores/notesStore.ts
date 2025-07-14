import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

interface NotesState {
  notes: Note[];
  tags: Tag[];
  activeNoteId: string | null;
  searchTerm: string;
  selectedTags: string[];
  
  // Actions pour les notes
  createNote: (title: string, content?: string) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  
  // Actions pour les tags
  createTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;
  addTagToNote: (noteId: string, tagId: string) => void;
  removeTagFromNote: (noteId: string, tagId: string) => void;
  
  // Filtres et recherche
  setSearchTerm: (term: string) => void;
  toggleTagFilter: (tagId: string) => void;
  clearTagFilters: () => void;
  
  // Getters
  getFilteredNotes: () => Note[];
  getActiveNote: () => Note | null;
  getNotesByTag: (tagId: string) => Note[];
}

const defaultColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const useNotesStore = create<NotesState>()(persist((set, get) => ({
  notes: [],
  tags: [],
  activeNoteId: null,
  searchTerm: '',
  selectedTags: [],
  
  createNote: (title, content = '') => {
    const note: Note = {
      id: uuidv4(),
      title,
      content,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set((state) => ({
      notes: [note, ...state.notes],
      activeNoteId: note.id
    }));
    
    return note;
  },
  
  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      )
    }));
  },
  
  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      activeNoteId: state.activeNoteId === id ? null : state.activeNoteId
    }));
  },
  
  setActiveNote: (id) => {
    set({ activeNoteId: id });
  },
  
  createTag: (name, color) => {
    const tag: Tag = {
      id: uuidv4(),
      name,
      color: color || defaultColors[Math.floor(Math.random() * defaultColors.length)],
      createdAt: new Date()
    };
    
    set((state) => ({
      tags: [...state.tags, tag]
    }));
    
    return tag;
  },
  
  // Actions pour associer des tags aux tâches
  addTagToTask: (taskId: string, tagId: string) => {
    // Cette méthode sera utilisée par le TodoStore
    // On ne fait rien ici car les tags des tâches sont gérés dans todoStore
  },
  
  removeTagFromTask: (taskId: string, tagId: string) => {
    // Cette méthode sera utilisée par le TodoStore
    // On ne fait rien ici car les tags des tâches sont gérés dans todoStore
  },
  
  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      notes: state.notes.map((note) => ({
        ...note,
        tags: note.tags.filter((tagId) => tagId !== id)
      })),
      selectedTags: state.selectedTags.filter((tagId) => tagId !== id)
    }));
  },
  
  addTagToNote: (noteId, tagId) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId && !note.tags.includes(tagId)
          ? { ...note, tags: [...note.tags, tagId], updatedAt: new Date() }
          : note
      )
    }));
  },
  
  removeTagFromNote: (noteId, tagId) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? { ...note, tags: note.tags.filter((id) => id !== tagId), updatedAt: new Date() }
          : note
      )
    }));
  },
  
  setSearchTerm: (term) => {
    set({ searchTerm: term });
  },
  
  toggleTagFilter: (tagId) => {
    set((state) => ({
      selectedTags: state.selectedTags.includes(tagId)
        ? state.selectedTags.filter((id) => id !== tagId)
        : [...state.selectedTags, tagId]
    }));
  },
  
  clearTagFilters: () => {
    set({ selectedTags: [] });
  },
  
  getFilteredNotes: () => {
    const { notes, searchTerm, selectedTags } = get();
    
    return notes.filter((note) => {
      // Filtre par terme de recherche
      const matchesSearch = !searchTerm || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par tags sélectionnés
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tagId) => note.tags.includes(tagId));
      
      return matchesSearch && matchesTags;
    });
  },
  
  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((note) => note.id === activeNoteId) || null;
  },
  
  getNotesByTag: (tagId) => {
    const { notes } = get();
    return notes.filter((note) => note.tags.includes(tagId));
  }
}), {
  name: 'notes-storage',
  partialize: (state) => ({
    notes: state.notes,
    tags: state.tags
  })
}));