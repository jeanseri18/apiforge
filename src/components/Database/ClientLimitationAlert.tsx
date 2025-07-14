import React from 'react';
import { AlertTriangle, Server, Info } from 'lucide-react';

interface ClientLimitationAlertProps {
  show: boolean;
  onDismiss: () => void;
}

export const ClientLimitationAlert: React.FC<ClientLimitationAlertProps> = ({ show, onDismiss }) => {
  if (!show) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Limitations des connexions côté client
          </h3>
          <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <p>
              Les vraies connexions aux bases de données ne sont pas supportées dans l'environnement du navigateur pour des raisons de sécurité.
            </p>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Solutions disponibles :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Utilisez un environnement serveur (Node.js, Electron)</li>
                  <li>Déployez l'application sur un serveur backend</li>
                  <li>Utilisez les connexions simulées pour les tests</li>
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Server className="w-4 h-4" />
              <span className="text-xs font-medium">
                Mode actuel : Navigateur (connexions simulées uniquement)
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1"
          title="Fermer"
        >
          ×
        </button>
      </div>
    </div>
  );
};