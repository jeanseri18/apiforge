import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, useTodoStore, priorityColors } from '../../stores/todoStore';
import { useNotesStore } from '../../stores/notesStore';
import { Circle, AlertCircle, AlertTriangle, Zap, X } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { createTask, updateTask, addTagToTask, removeTagFromTask } = useTodoStore();
  const { tags } = useNotesStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const isEditing = !!task;
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setSelectedTags(task.tags);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setSelectedTags([]);
    }
    setErrors({});
  }, [task]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) {
      newErrors.dueDate = 'La date d\'échéance ne peut pas être dans le passé';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined
    };
    
    if (isEditing && task) {
      updateTask(task.id, taskData);
      
      // Gérer les tags
      const tagsToAdd = selectedTags.filter(tagId => !task.tags.includes(tagId));
      const tagsToRemove = task.tags.filter(tagId => !selectedTags.includes(tagId));
      
      tagsToAdd.forEach(tagId => addTagToTask(task.id, tagId));
      tagsToRemove.forEach(tagId => removeTagFromTask(task.id, tagId));
    } else {
      const newTask = createTask(taskData.title, taskData.description, taskData.priority);
      if (taskData.dueDate) {
        updateTask(newTask.id, { dueDate: taskData.dueDate });
      }
      
      // Ajouter les tags
      selectedTags.forEach(tagId => addTagToTask(newTask.id, tagId));
    }
    
    onClose();
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
  
  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return <Circle className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'urgent':
        return <Zap className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <button
              onClick={onClose}
              className="
                absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700
                dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100
                dark:hover:bg-gray-700 rounded-lg transition-colors
              "
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors
                ${
                  errors.title 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }
              `}
              placeholder="Titre de la tâche..."
            />
            {errors.title && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="
                w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                placeholder-gray-500 dark:placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors resize-none
              "
              placeholder="Description de la tâche..."
            />
          </div>
          
          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priorité
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    p-2 rounded-lg border-2 transition-all duration-200
                    flex items-center space-x-2
                    ${
                      priority === p
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <span>{getPriorityIcon(p)}</span>
                  <span 
                    className="px-2 py-0.5 text-xs rounded-full text-white font-medium"
                    style={{ backgroundColor: priorityColors[p] }}
                  >
                    {getPriorityLabel(p)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date d'échéance
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`
                w-full px-3 py-2 border rounded-lg
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors
                ${
                  errors.dueDate 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                }
              `}
            />
            {errors.dueDate && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.dueDate}</p>
            )}
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`
                        px-3 py-1 text-sm rounded-full transition-all duration-200
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
          
          {/* Boutons d'action */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600
                text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700
                transition-colors
              "
            >
              Annuler
            </button>
            <button
              type="submit"
              className="
                flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                transition-colors font-medium
              "
            >
              {isEditing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};