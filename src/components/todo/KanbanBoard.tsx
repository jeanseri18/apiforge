import React, { useState } from 'react';
import { useTodoStore, Task, TaskStatus } from '../../stores/todoStore';
import { TaskCard } from './TaskCard';
import { ClipboardList, RotateCcw, CheckCircle, Plus, X, Check, Download } from 'lucide-react';

interface KanbanBoardProps {
  onEditTask: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onEditTask }) => {
  const { getTaskColumns, moveTask, createTask } = useTodoStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showAddForm, setShowAddForm] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const columns = getTaskColumns();
  
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', (e.currentTarget as HTMLElement).outerHTML);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedTask(null);
    setDragOverColumn(null);
  };
  
  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    // Vérifier si on quitte vraiment la colonne
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    
    if (draggedTask && draggedTask.status !== columnId) {
      moveTask(draggedTask.id, columnId);
    }
    
    setDraggedTask(null);
    setDragOverColumn(null);
  };
  
  const getColumnIcon = (columnId: TaskStatus) => {
    switch (columnId) {
      case 'todo':
        return <ClipboardList className="w-5 h-5" />;
      case 'inprogress':
        return <RotateCcw className="w-5 h-5" />;
      case 'done':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <ClipboardList className="w-5 h-5" />;
    }
  };

  const handleAddTask = (columnId: TaskStatus) => {
    if (newTaskTitle.trim()) {
      const task = createTask(newTaskTitle.trim());
      if (columnId !== 'todo') {
        moveTask(task.id, columnId);
      }
      setNewTaskTitle('');
      setShowAddForm(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, columnId: TaskStatus) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask(columnId);
    } else if (e.key === 'Escape') {
      setShowAddForm(null);
      setNewTaskTitle('');
    }
  };
  
  return (
    <div className="min-h-full p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen">
        {columns.map((column) => {
          const isDragOver = dragOverColumn === column.id;
          const canDrop = draggedTask && draggedTask.status !== column.id;
          
          return (
            <div
              key={column.id}
              className={`
                flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm
                border-2 transition-all duration-200 min-h-96
                ${
                  isDragOver && canDrop
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }
              `}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* En-tête de colonne */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-600 dark:text-gray-400">{getColumnIcon(column.id)}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {column.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: column.color }}
                    >
                      {column.tasks.length}
                    </span>
                    <button
                      onClick={() => {
                        setShowAddForm(showAddForm === column.id ? null : column.id);
                        setNewTaskTitle('');
                      }}
                      className="
                        p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                        hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors
                      "
                      title="Ajouter une tâche"
                    >
                      {showAddForm === column.id ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Formulaire d'ajout de tâche */}
                {showAddForm === column.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, column.id)}
                        placeholder="Titre de la tâche..."
                        className="
                          flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                          rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                          placeholder-gray-500 dark:placeholder-gray-400
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        "
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddTask(column.id)}
                        disabled={!newTaskTitle.trim()}
                        className="
                          px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                          disabled:bg-gray-400 disabled:cursor-not-allowed
                          transition-colors text-sm font-medium flex items-center
                        "
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Appuyez sur Entrée pour ajouter, Échap pour annuler
                    </p>
                  </div>
                )}
              </div>
              
              {/* Liste des tâches */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 max-h-full">
                {column.tasks.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="flex justify-center mb-2 text-gray-400">
                      <div className="w-8 h-8">{getColumnIcon(column.id)}</div>
                    </div>
                    <p className="text-sm">
                      {column.id === 'todo' && 'Aucune tâche à faire'}
                      {column.id === 'inprogress' && 'Aucune tâche en cours'}
                      {column.id === 'done' && 'Aucune tâche terminée'}
                    </p>
                    {isDragOver && canDrop && (
                      <p className="text-blue-600 dark:text-blue-400 text-sm mt-2">
                        Déposez la tâche ici
                      </p>
                    )}
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => onEditTask(task)}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedTask?.id === task.id}
                    />
                  ))
                )}
                
                {/* Zone de drop pour colonnes vides */}
                {column.tasks.length === 0 && isDragOver && canDrop && (
                  <div className="
                    border-2 border-dashed border-blue-400 rounded-lg p-8
                    bg-blue-50 dark:bg-blue-900/20 text-center
                    text-blue-600 dark:text-blue-400
                  ">
                    <div className="flex justify-center mb-2">
                      <Download className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium">Déposez la tâche ici</p>
                  </div>
                )}
              </div>
              
              {/* Indicateur de drop actif */}
              {isDragOver && canDrop && column.tasks.length > 0 && (
                <div className="
                  mx-4 mb-4 p-2 border-2 border-dashed border-blue-400 rounded-lg
                  bg-blue-50 dark:bg-blue-900/20 text-center
                  text-blue-600 dark:text-blue-400 text-sm
                ">
                  Déposez la tâche ici
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};