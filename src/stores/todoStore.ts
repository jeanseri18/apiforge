import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

interface TodoState {
  tasks: Task[];
  searchTerm: string;
  selectedTags: string[];
  selectedPriorities: TaskPriority[];
  
  // Actions pour les tâches
  createTask: (title: string, description?: string, priority?: TaskPriority) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  
  // Actions pour les tags
  addTagToTask: (taskId: string, tagId: string) => void;
  removeTagFromTask: (taskId: string, tagId: string) => void;
  
  // Filtres et recherche
  setSearchTerm: (term: string) => void;
  toggleTagFilter: (tagId: string) => void;
  togglePriorityFilter: (priority: TaskPriority) => void;
  clearFilters: () => void;
  
  // Getters
  getTasksByStatus: (status: TaskStatus) => Task[];
  getFilteredTasks: () => Task[];
  getTaskColumns: () => TaskColumn[];
  getTaskStats: () => {
    total: number;
    todo: number;
    inprogress: number;
    done: number;
    overdue: number;
  };
}

const priorityColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626'
};

const statusConfig = {
  todo: { title: 'À faire', color: '#6B7280' },
  inprogress: { title: 'En cours', color: '#3B82F6' },
  done: { title: 'Terminé', color: '#10B981' }
};

export const useTodoStore = create<TodoState>()(persist((set, get) => ({
  tasks: [],
  searchTerm: '',
  selectedTags: [],
  selectedPriorities: [],
  
  createTask: (title, description = '', priority = 'medium') => {
    const task: Task = {
      id: uuidv4(),
      title,
      description,
      status: 'todo',
      priority,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set((state) => ({
      tasks: [task, ...state.tasks]
    }));
    
    return task;
  },
  
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, ...updates, updatedAt: new Date() };
          
          // Si le statut change vers 'done', ajouter la date de completion
          if (updates.status === 'done' && task.status !== 'done') {
            updatedTask.completedAt = new Date();
          }
          // Si le statut change depuis 'done', supprimer la date de completion
          else if (updates.status && updates.status !== 'done' && task.status === 'done') {
            delete updatedTask.completedAt;
          }
          
          return updatedTask;
        }
        return task;
      })
    }));
  },
  
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    }));
  },
  
  moveTask: (taskId, newStatus) => {
    get().updateTask(taskId, { status: newStatus });
  },
  
  addTagToTask: (taskId, tagId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId && !task.tags.includes(tagId)
          ? { ...task, tags: [...task.tags, tagId], updatedAt: new Date() }
          : task
      )
    }));
  },
  
  removeTagFromTask: (taskId, tagId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? { ...task, tags: task.tags.filter((id) => id !== tagId), updatedAt: new Date() }
          : task
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
  
  togglePriorityFilter: (priority) => {
    set((state) => ({
      selectedPriorities: state.selectedPriorities.includes(priority)
        ? state.selectedPriorities.filter((p) => p !== priority)
        : [...state.selectedPriorities, priority]
    }));
  },
  
  clearFilters: () => {
    set({ selectedTags: [], selectedPriorities: [], searchTerm: '' });
  },
  
  getTasksByStatus: (status) => {
    const filteredTasks = get().getFilteredTasks();
    return filteredTasks.filter((task) => task.status === status);
  },
  
  getFilteredTasks: () => {
    const { tasks, searchTerm, selectedTags, selectedPriorities } = get();
    
    return tasks.filter((task) => {
      // Filtre par terme de recherche
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtre par tags sélectionnés
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tagId) => task.tags.includes(tagId));
      
      // Filtre par priorités sélectionnées
      const matchesPriorities = selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority);
      
      return matchesSearch && matchesTags && matchesPriorities;
    });
  },
  
  getTaskColumns: () => {
    const statuses: TaskStatus[] = ['todo', 'inprogress', 'done'];
    
    return statuses.map((status) => ({
      id: status,
      title: statusConfig[status].title,
      color: statusConfig[status].color,
      tasks: get().getTasksByStatus(status)
    }));
  },
  
  getTaskStats: () => {
    const { tasks } = get();
    const now = new Date();
    
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      inprogress: tasks.filter((task) => task.status === 'inprogress').length,
      done: tasks.filter((task) => task.status === 'done').length,
      overdue: tasks.filter((task) => 
        task.dueDate && 
        task.status !== 'done' && 
        new Date(task.dueDate) < now
      ).length
    };
  }
}), {
  name: 'todo-storage',
  partialize: (state) => ({
    tasks: state.tasks
  })
}));

export { priorityColors, statusConfig };