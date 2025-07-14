import React from 'react';
import { Task, TaskPriority, priorityColors, useTodoStore } from '../../stores/todoStore';
import { useNotesStore } from '../../stores/notesStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Circle, AlertCircle, AlertTriangle, Zap, Trash2, Edit, AlertTriangle as WarningIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging
}) => {
  const { deleteTask } = useTodoStore();
  const { tags: allTags } = useNotesStore();
  
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
  
  const getTagById = (tagId: string) => {
    return allTags.find(tag => tag.id === tagId);
  };
  
  const isOverdue = task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && task.status !== 'done' && 
    new Date(task.dueDate) > new Date() && 
    new Date(task.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000); // Dans les 24h
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      deleteTask(task.id);
    }
  };
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={`
        p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600
        cursor-pointer transition-all duration-200 group relative
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500
        ${
          isDragging 
            ? 'opacity-50 transform rotate-2 scale-105 shadow-lg' 
            : 'hover:transform hover:-translate-y-1'
        }
        ${
          isOverdue 
            ? 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20'
            : isDueSoon
            ? 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : ''
        }
      `}
    >
      {/* Bouton de suppression */}
      <button
        onClick={handleDelete}
        className="
          absolute top-2 right-2 opacity-0 group-hover:opacity-100
          w-5 h-5 rounded-full bg-red-500 text-white text-xs
          hover:bg-red-600 transition-all duration-200
          flex items-center justify-center
        "
        title="Supprimer la tâche"
      >
        ×
      </button>
      
      {/* Titre de la tâche */}
      <h4 className="font-medium text-gray-900 dark:text-white mb-2 pr-6">
        {task.title}
      </h4>
      
      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tagId) => {
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
      
      {/* Métadonnées */}
      <div className="flex items-center justify-between text-xs">
        {/* Priorité */}
        <div className="flex items-center space-x-1">
          <span>{getPriorityIcon(task.priority)}</span>
          <span 
            className="px-2 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: priorityColors[task.priority] }}
          >
            {getPriorityLabel(task.priority)}
          </span>
        </div>
        
        {/* Date d'échéance */}
        {task.dueDate && (
          <div className={`flex items-center space-x-1 ${
            isOverdue 
              ? 'text-red-600 dark:text-red-400 font-medium'
              : isDueSoon
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            <span>📅</span>
            <span>
              {isOverdue && '⚠️ '}
              {formatDistanceToNow(new Date(task.dueDate), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          </div>
        )}
      </div>
      
      {/* Date de création */}
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Créée {formatDistanceToNow(new Date(task.createdAt), { 
              addSuffix: true, 
              locale: fr 
            })}
          </span>
          
          {task.completedAt && (
            <span className="text-green-600 dark:text-green-400">
              ✅ Terminée {formatDistanceToNow(new Date(task.completedAt), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          )}
        </div>
      </div>
      
      {/* Indicateur de drag */}
      <div className="absolute top-1/2 left-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <div className="flex flex-col space-y-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};