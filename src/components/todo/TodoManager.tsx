import React, { useState } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { KanbanBoard } from './KanbanBoard';
import { TodoToolbar } from './TodoToolbar';
import { CheckSquare } from 'lucide-react';
import { TaskModal } from './TaskModal';
import { TagManager } from '../shared/TagManager';
import { Task } from '../../stores/todoStore';

export const TodoManager: React.FC = () => {
  const {
    tasks,
    getTaskStats,
    createTask
  } = useTodoStore();
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  
  const stats = getTaskStats();
  
  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  
  const handleCloseModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };
  
  const handleQuickCreate = (title: string) => {
    if (title.trim()) {
      createTask(title.trim());
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Barre d'outils */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TodoToolbar 
          onCreateTask={handleCreateTask}
          onQuickCreate={handleQuickCreate}
          onToggleTagManager={() => setShowTagManager(!showTagManager)}
          showTagManager={showTagManager}
          stats={stats}
        />
        
        {/* Gestionnaire de tags */}
        {showTagManager && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <TagManager type="tasks" />
          </div>
        )}
      </div>
      
      {/* Tableau Kanban */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4"><CheckSquare className="w-16 h-16 text-green-500" /></div>
              <h3 className="text-xl font-medium mb-2">Aucune tâche</h3>
              <p className="mb-4">Créez votre première tâche pour commencer</p>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Créer une tâche
              </button>
            </div>
          </div>
        ) : (
          <KanbanBoard onEditTask={handleEditTask} />
        )}
      </div>
      
      {/* Modal de création/édition de tâche */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};