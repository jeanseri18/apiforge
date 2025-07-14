import React, { useState } from 'react';
import {
  CogIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BellIcon,
  UserIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/appStore';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
          <div className="space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
          ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
  description?: string;
}

const Select: React.FC<SelectProps> = ({ value, onChange, options, label, description }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</label>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  type?: 'text' | 'number' | 'email';
  placeholder?: string;
  unit?: string;
}

const Input: React.FC<InputProps> = ({ value, onChange, label, description, type = 'text', placeholder, unit }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</label>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}
      <div className="flex">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input ${unit ? 'rounded-r-none' : ''} flex-1`}
        />
        {unit && (
          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const {
    theme,
    preferences,
    setTheme,
    updatePreferences
  } = useAppStore();
  
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    console.log('Changing preference:', key, 'to:', value);
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    setHasChanges(true);
    console.log('New preferences:', newPreferences);
  };
  
  const handleSave = () => {
    console.log('Saving preferences:', localPreferences);
    updatePreferences(localPreferences);
    setHasChanges(false);
    console.log('Preferences saved successfully');
  };
  
  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };
  
  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">
            Configurez APIForge selon vos préférences
          </p>
        </div>
        
        {/* Save bar */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Vous avez des modifications non sauvegardées
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="btn btn-ghost btn-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary btn-sm"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Appearance */}
          <SettingsSection
            title="Apparence"
            description="Personnalisez l'apparence de l'interface"
            icon={<PaintBrushIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`
                  p-4 rounded-lg border-2 transition-colors
                  ${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <SunIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm font-medium">Clair</p>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`
                  p-4 rounded-lg border-2 transition-colors
                  ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <MoonIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium">Sombre</p>
              </button>
              
              <button
                onClick={() => setTheme('system')}
                className={`
                  p-4 rounded-lg border-2 transition-colors
                  ${theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <ComputerDesktopIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm font-medium">Système</p>
              </button>
            </div>
          </SettingsSection>
          
          {/* General */}
          <SettingsSection
            title="Général"
            description="Paramètres généraux de l'application"
            icon={<CogIcon className="h-6 w-6 text-blue-600" />}
          >
            <Toggle
              enabled={localPreferences.autoSave}
              onChange={(value) => handlePreferenceChange('autoSave', value)}
              label="Sauvegarde automatique"
              description="Sauvegarde automatiquement vos modifications"
            />
            
            <Select
              value={localPreferences.defaultContentType}
              onChange={(value) => handlePreferenceChange('defaultContentType', value)}
              label="Type de contenu par défaut"
              description="Type de contenu utilisé par défaut pour les nouvelles requêtes"
              options={[
                { value: 'application/json', label: 'JSON' },
                { value: 'application/xml', label: 'XML' },
                { value: 'text/plain', label: 'Texte brut' },
                { value: 'application/x-www-form-urlencoded', label: 'Form URL Encoded' }
              ]}
            />
            
            <Input
              value={localPreferences.historyLimit}
              onChange={(value) => handlePreferenceChange('historyLimit', parseInt(value) || 100)}
              label="Limite de l'historique"
              description="Nombre maximum d'entrées dans l'historique"
              type="number"
              placeholder="100"
            />
          </SettingsSection>
          
          {/* Network */}
          <SettingsSection
            title="Réseau"
            description="Configuration des requêtes réseau"
            icon={<GlobeAltIcon className="h-6 w-6 text-blue-600" />}
          >
            <Input
              value={localPreferences.requestTimeout}
              onChange={(value) => handlePreferenceChange('requestTimeout', parseInt(value) || 30000)}
              label="Timeout des requêtes"
              description="Délai d'expiration pour les requêtes HTTP"
              type="number"
              unit="ms"
            />
            
            <Input
              value={localPreferences.maxRedirects}
              onChange={(value) => handlePreferenceChange('maxRedirects', parseInt(value) || 5)}
              label="Redirections maximales"
              description="Nombre maximum de redirections à suivre"
              type="number"
            />
            
            <Toggle
              enabled={localPreferences.followRedirects}
              onChange={(value) => handlePreferenceChange('followRedirects', value)}
              label="Suivre les redirections"
              description="Suit automatiquement les redirections HTTP"
            />
            
            <Toggle
              enabled={localPreferences.validateSSL}
              onChange={(value) => handlePreferenceChange('validateSSL', value)}
              label="Validation SSL"
              description="Valide les certificats SSL/TLS"
            />
          </SettingsSection>
          
          {/* Security */}
          <SettingsSection
            title="Sécurité"
            description="Paramètres de sécurité et de confidentialité"
            icon={<ShieldCheckIcon className="h-6 w-6 text-blue-600" />}
          >
            <Toggle
              enabled={localPreferences.sendCookies}
              onChange={(value) => handlePreferenceChange('sendCookies', value)}
              label="Envoyer les cookies"
              description="Inclut les cookies dans les requêtes"
            />
            
            <Toggle
              enabled={localPreferences.sendUserAgent}
              onChange={(value) => handlePreferenceChange('sendUserAgent', value)}
              label="Envoyer User-Agent"
              description="Inclut l'en-tête User-Agent dans les requêtes"
            />
            
            <Input
              value={localPreferences.userAgent || ''}
              onChange={(value) => handlePreferenceChange('userAgent', value)}
              label="User-Agent personnalisé"
              description="User-Agent à utiliser pour les requêtes (optionnel)"
              placeholder="APIForge/1.0"
            />
          </SettingsSection>
          
          {/* Editor */}
          <SettingsSection
            title="Éditeur"
            description="Configuration de l'éditeur de code"
            icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />}
          >
            <Select
              value={localPreferences.editorTheme || 'light'}
              onChange={(value) => handlePreferenceChange('editorTheme', value)}
              label="Thème de l'éditeur"
              options={[
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
                { value: 'auto', label: 'Automatique' }
              ]}
            />
            
            <Input
              value={localPreferences.editorFontSize || 14}
              onChange={(value) => handlePreferenceChange('editorFontSize', parseInt(value) || 14)}
              label="Taille de police"
              type="number"
              unit="px"
            />
            
            <Toggle
              enabled={localPreferences.editorWordWrap || false}
              onChange={(value) => handlePreferenceChange('editorWordWrap', value)}
              label="Retour à la ligne automatique"
              description="Active le retour à la ligne dans l'éditeur"
            />
            
            <Toggle
              enabled={localPreferences.editorLineNumbers || true}
              onChange={(value) => handlePreferenceChange('editorLineNumbers', value)}
              label="Numéros de ligne"
              description="Affiche les numéros de ligne dans l'éditeur"
            />
          </SettingsSection>
          
          {/* Notifications */}
          <SettingsSection
            title="Notifications"
            description="Gérez vos préférences de notification"
            icon={<BellIcon className="h-6 w-6 text-blue-600" />}
          >
            <Toggle
              enabled={localPreferences.showNotifications || true}
              onChange={(value) => handlePreferenceChange('showNotifications', value)}
              label="Notifications système"
              description="Affiche les notifications système"
            />
            
            <Toggle
              enabled={localPreferences.notifyOnRequestComplete || true}
              onChange={(value) => handlePreferenceChange('notifyOnRequestComplete', value)}
              label="Notification de fin de requête"
              description="Notifie quand une requête se termine"
            />
            
            <Toggle
              enabled={localPreferences.notifyOnError || true}
              onChange={(value) => handlePreferenceChange('notifyOnError', value)}
              label="Notification d'erreur"
              description="Notifie en cas d'erreur de requête"
            />
          </SettingsSection>
          
          {/* About */}
          <SettingsSection
            title="À propos"
            description="Informations sur l'application"
            icon={<UserIcon className="h-6 w-6 text-blue-600" />}
          >
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Version:</span>
                  <span className="ml-2 text-gray-600">1.0.0</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Build:</span>
                  <span className="ml-2 text-gray-600">2024.01.15</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Electron:</span>
                  <span className="ml-2 text-gray-600">28.0.0</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Node.js:</span>
                  <span className="ml-2 text-gray-600">20.9.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="btn btn-ghost btn-sm">
                Vérifier les mises à jour
              </button>
              <button className="btn btn-ghost btn-sm">
                Voir les notes de version
              </button>
              <button className="btn btn-ghost btn-sm">
                Signaler un problème
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};