import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  EyeSlashIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useEnvironmentStore } from '../stores/environmentStore';
import { Variable, Environment } from '../types/global';
import { v4 as uuidv4 } from 'uuid';

interface VariableRowProps {
  variable: Variable;
  onUpdate: (variable: Variable) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const VariableRow: React.FC<VariableRowProps> = ({
  variable,
  onUpdate,
  onDelete,
  isEditing,
  onEdit,
  onSave,
  onCancel
}) => {
  const [editedVariable, setEditedVariable] = useState(variable);
  const [showValue, setShowValue] = useState(!variable.secret);
  
  useEffect(() => {
    setEditedVariable(variable);
  }, [variable]);

  const handleSave = () => {
    onUpdate(editedVariable);
    onSave();
  };
  
  const handleCancel = () => {
    setEditedVariable(variable);
    onCancel();
  };
  
  if (isEditing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-6 py-4">
          <input
            type="text"
            value={editedVariable.key}
            onChange={(e) => setEditedVariable({ ...editedVariable, key: e.target.value })}
            className="input w-full"
            placeholder="Nom de la variable"
            autoFocus
          />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <input
              type={editedVariable.secret ? 'password' : 'text'}
              value={editedVariable.value}
              onChange={(e) => setEditedVariable({ ...editedVariable, value: e.target.value })}
              className="input w-full"
              placeholder="Valeur"
            />
            {editedVariable.secret && (
              <button
                type="button"
                onClick={() => setShowValue(!showValue)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {showValue ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <input
            type="text"
            value={editedVariable.description || ''}
            onChange={(e) => setEditedVariable({ ...editedVariable, description: e.target.value })}
            className="input w-full"
            placeholder="Description (optionnelle)"
          />
        </td>
        <td className="px-6 py-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={editedVariable.secret}
              onChange={(e) => setEditedVariable({ ...editedVariable, secret: e.target.checked })}
              className="rounded mr-2"
            />
            <span className="text-sm text-gray-600">Secret</span>
          </label>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-700 rounded"
              title="Sauvegarder"
              disabled={!editedVariable.key || !editedVariable.value}
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:text-gray-700 rounded"
              title="Annuler"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">
        {variable.key}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">
            {variable.secret && !showValue ? '••••••••' : variable.value}
          </span>
          {variable.secret && (
            <button
              onClick={() => setShowValue(!showValue)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {showValue ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-gray-500">
        {variable.description || '-'}
      </td>
      <td className="px-6 py-4">
        {variable.secret && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Secret
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-700 rounded"
            title="Modifier"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(variable.id)}
            className="p-1 text-red-600 hover:text-red-700 rounded"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface EnvironmentCardProps {
  environment: Environment;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
  environment,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 cursor-pointer transition-all
        ${isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-lg
            ${isActive ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <GlobeAltIcon className={`
              h-6 w-6
              ${isActive ? 'text-blue-600' : 'text-gray-600'}
            `} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {environment.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {environment.variables.length} variable{environment.variables.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <PencilIcon className="h-4 w-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <PencilIcon className="h-4 w-4 mr-3" />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-3" />
                Dupliquer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-3" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isActive && (
         <div className="mt-4 pt-4 border-t border-blue-200">
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
             Environnement actif
           </span>
         </div>
       )}
    </div>
  );
};

export const Environments: React.FC = () => {
  const {
    environments,
    activeEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    duplicateEnvironment,
    setActiveEnvironment,
    addVariable,
    updateVariable,
    deleteVariable,
    getEnvironment,
  } = useEnvironmentStore();
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState<Omit<Variable, 'id'>>({
    key: '',
    value: '',
    description: '',
    secret: false
  });
  const [showNewVariableValue, setShowNewVariableValue] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('create') === 'true') {
      setShowCreateForm(true);
      window.history.replaceState({}, '', '/environments');
    }
  }, []);

  const selectedEnv = selectedEnvironment ? getEnvironment(selectedEnvironment) : null;

  const handleCreateEnvironment = () => {
    if (newEnvironmentName.trim()) {
      createEnvironment(newEnvironmentName.trim());
      setNewEnvironmentName('');
      setShowCreateForm(false);
    }
  };

  const handleAddVariable = () => {
    if (!newVariable.key || !newVariable.value) return;
    
    if (selectedEnvironment) {
      addVariable(selectedEnvironment, newVariable);
      setIsAddingVariable(false);
      setNewVariable({
        key: '',
        value: '',
        description: '',
        secret: false
      });
      setShowNewVariableValue(false);
    }
  };

  const handleUpdateVariable = (updatedVariable: Variable) => {
    if (selectedEnvironment && updatedVariable.id) {
      updateVariable(selectedEnvironment, updatedVariable.id, updatedVariable);
    }
  };

  const handleDeleteVariable = (variableId: string) => {
    if (selectedEnvironment) {
      deleteVariable(selectedEnvironment, variableId);
    }
  };

  const handleSelectEnvironment = (envId: string) => {
    setActiveEnvironment(envId);
    setSelectedEnvironment(envId);
    setEditingVariableId(null);
    setIsAddingVariable(false);
  };

  const handleEditEnvironment = (envId: string) => {
    const environment = getEnvironment(envId);
    if (environment) {
      setEditingEnvironment(environment);
      setShowEditForm(true);
    }
  };

  const handleSaveEditEnvironment = () => {
    if (editingEnvironment) {
      updateEnvironment(editingEnvironment.id, {
        name: editingEnvironment.name,
        description: editingEnvironment.description
      });
      setShowEditForm(false);
      setEditingEnvironment(null);
    }
  };

  const handleCancelEditEnvironment = () => {
    setShowEditForm(false);
    setEditingEnvironment(null);
  };

  const handleDeleteEnvironment = (envId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet environnement ?')) {
      deleteEnvironment(envId);
      if (selectedEnvironment === envId) {
        setSelectedEnvironment(null);
      }
    }
  };

  const handleDuplicateEnvironment = (envId: string) => {
    duplicateEnvironment(envId);
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Environnements</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos variables d'environnement pour différents contextes
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary border p-3 hover:bg-blue-800"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nouvel environnement
            </button>
          </div>
        </div>
        
        {showCreateForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Créer un nouvel environnement
            </h3>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newEnvironmentName}
                onChange={(e) => setNewEnvironmentName(e.target.value)}
                placeholder="Nom de l'environnement"
                className="input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateEnvironment()}
                autoFocus
              />
              <button
                onClick={handleCreateEnvironment}
                className="btn btn-primary px-3 py-2"
                disabled={!newEnvironmentName.trim()}
              >
                Créer
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEnvironmentName('');
                }}
                className="btn btn-ghost px-3 py-2"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              environment={environment}
              isActive={activeEnvironmentId === environment.id}
              onSelect={() => handleSelectEnvironment(environment.id)}
              onEdit={() => handleEditEnvironment(environment.id)}
              onDelete={() => handleDeleteEnvironment(environment.id)}
              onDuplicate={() => handleDuplicateEnvironment(environment.id)}
            />
          ))}
        </div>
        
        {selectedEnv && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Variables - {selectedEnv.name}
                </h3>
                <button
                  onClick={() => setIsAddingVariable(true)}
                  className="btn btn-primary btn-sm "
                  disabled={isAddingVariable}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ajouter une variable
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isAddingVariable && (
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={newVariable.key}
                          onChange={(e) => setNewVariable({...newVariable, key: e.target.value})}
                          className="input w-full"
                          placeholder="Nom*"
                          autoFocus
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type={newVariable.secret && !showNewVariableValue ? 'password' : 'text'}
                            value={newVariable.value}
                            onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                            className="input w-full"
                            placeholder="Valeur*"
                          />
                          {newVariable.secret && (
                            <button
                              type="button"
                              onClick={() => setShowNewVariableValue(!showNewVariableValue)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {showNewVariableValue ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={newVariable.description || ''}
                          onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                          className="input w-full"
                          placeholder="Description"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newVariable.secret}
                            onChange={(e) => setNewVariable({...newVariable, secret: e.target.checked})}
                            className="rounded mr-2"
                          />
                          <span className="text-sm text-gray-600">Secret</span>
                        </label>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleAddVariable}
                            className="p-1 text-green-600 hover:text-green-700 rounded"
                            disabled={!newVariable.key || !newVariable.value}
                            title="Enregistrer"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingVariable(false);
                              setNewVariable({
                                key: '',
                                value: '',
                                description: '',
                                secret: false
                              });
                            }}
                            className="p-1 text-gray-600 hover:text-gray-700 rounded"
                            title="Annuler"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {selectedEnv.variables.map((variable) => (
                    <VariableRow
                      key={variable.id}
                      variable={variable}
                      onUpdate={handleUpdateVariable}
                      onDelete={handleDeleteVariable}
                      isEditing={editingVariableId === variable.id}
                      onEdit={() => setEditingVariableId(variable.id)}
                      onSave={() => setEditingVariableId(null)}
                      onCancel={() => setEditingVariableId(null)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showEditForm && editingEnvironment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modifier l'environnement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={editingEnvironment.name}
                  onChange={(e) => setEditingEnvironment({
                    ...editingEnvironment,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'environnement"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnel)
                </label>
                <textarea
                  value={editingEnvironment.description || ''}
                  onChange={(e) => setEditingEnvironment({
                    ...editingEnvironment,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description de l'environnement"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEditEnvironment}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEditEnvironment}
                disabled={!editingEnvironment.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};