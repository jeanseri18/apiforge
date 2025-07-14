import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Network, Server, Database } from 'lucide-react';

interface NetworkDiagnosticProps {
  host: string;
  port?: number;
  onClose: () => void;
}

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function NetworkDiagnostic({ host, port = 3306, onClose }: NetworkDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const diagnosticTests = [
    {
      name: 'Résolution DNS',
      test: 'dns',
      description: 'Vérification de la résolution du nom d\'hôte'
    },
    {
      name: 'Connectivité réseau',
      test: 'network',
      description: 'Test de connectivité vers le serveur'
    },
    {
      name: 'Port MySQL',
      test: 'port',
      description: `Vérification de l\'accessibilité du port ${port}`
    },
    {
      name: 'Latence réseau',
      test: 'latency',
      description: 'Mesure du temps de réponse'
    }
  ];

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);

    for (const test of diagnosticTests) {
      const startTime = Date.now();
      
      // Ajouter le test en cours
      setResults(prev => [...prev, {
        test: test.name,
        status: 'pending',
        message: 'Test en cours...'
      }]);

      try {
        let result: DiagnosticResult;
        
        switch (test.test) {
          case 'dns':
            result = await testDNSResolution(host);
            break;
          case 'network':
            result = await testNetworkConnectivity(host);
            break;
          case 'port':
            result = await testPortConnectivity(host, port);
            break;
          case 'latency':
            result = await testLatency(host);
            break;
          default:
            result = {
              test: test.name,
              status: 'error',
              message: 'Test non implémenté'
            };
        }

        result.duration = Date.now() - startTime;
        
        // Mettre à jour le résultat
        setResults(prev => prev.map(r => 
          r.test === test.name ? result : r
        ));
        
      } catch (error) {
        const errorResult: DiagnosticResult = {
          test: test.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          duration: Date.now() - startTime
        };
        
        setResults(prev => prev.map(r => 
          r.test === test.name ? errorResult : r
        ));
      }

      // Pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const testDNSResolution = async (hostname: string): Promise<DiagnosticResult> => {
    try {
      // Simulation d'un test DNS via une requête HTTP
      const response = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        const ip = data.Answer[0].data;
        return {
          test: 'Résolution DNS',
          status: 'success',
          message: `Résolu vers ${ip}`
        };
      } else {
        return {
          test: 'Résolution DNS',
          status: 'error',
          message: 'Impossible de résoudre le nom d\'hôte'
        };
      }
    } catch (error) {
      return {
        test: 'Résolution DNS',
        status: 'error',
        message: 'Erreur lors de la résolution DNS'
      };
    }
  };

  const testNetworkConnectivity = async (hostname: string): Promise<DiagnosticResult> => {
    try {
      // Test de connectivité basique via notre API backend
      const response = await fetch('/api/database/health');
      
      if (response.ok) {
        return {
          test: 'Connectivité réseau',
          status: 'success',
          message: 'Connexion réseau fonctionnelle'
        };
      } else {
        return {
          test: 'Connectivité réseau',
          status: 'error',
          message: 'Problème de connectivité réseau'
        };
      }
    } catch (error) {
      return {
        test: 'Connectivité réseau',
        status: 'error',
        message: 'Pas de connexion réseau'
      };
    }
  };

  const testPortConnectivity = async (hostname: string, port: number): Promise<DiagnosticResult> => {
    // Note: Les navigateurs ne permettent pas de tester directement les ports
    // On simule le test en essayant une connexion via notre backend
    try {
      const testConnection = {
        type: 'mysql',
        host: hostname,
        port: port,
        database: 'test',
        username: 'test',
        password: 'test'
      };

      const response = await fetch('http://localhost:3001/api/database/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConnection),
      });

      if (response.status === 500) {
        const errorData = await response.json();
        if (errorData.error.includes('ENOTFOUND')) {
          return {
            test: 'Port MySQL',
            status: 'error',
            message: `Nom d'hôte non résolu: ${hostname}`
          };
        } else if (errorData.error.includes('ECONNREFUSED')) {
          return {
            test: 'Port MySQL',
            status: 'error',
            message: `Port ${port} fermé ou inaccessible`
          };
        } else if (errorData.error.includes('ETIMEDOUT')) {
          return {
            test: 'Port MySQL',
            status: 'error',
            message: `Timeout sur le port ${port}`
          };
        } else {
          return {
            test: 'Port MySQL',
            status: 'success',
            message: `Port ${port} accessible (erreur d'authentification attendue)`
          };
        }
      }

      return {
        test: 'Port MySQL',
        status: 'success',
        message: `Port ${port} accessible`
      };
    } catch (error) {
      return {
        test: 'Port MySQL',
        status: 'error',
        message: 'Impossible de tester le port'
      };
    }
  };

  const testLatency = async (hostname: string): Promise<DiagnosticResult> => {
    try {
      const startTime = Date.now();
      
      // Test de latence via une requête HTTP simple
      await fetch(`https://${hostname}`, { 
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => {});
      
      const latency = Date.now() - startTime;
      
      let status: 'success' | 'error' = 'success';
      let message = `Latence: ${latency}ms`;
      
      if (latency > 5000) {
        status = 'error';
        message += ' (très lente)';
      } else if (latency > 2000) {
        message += ' (lente)';
      } else if (latency > 1000) {
        message += ' (acceptable)';
      } else {
        message += ' (rapide)';
      }
      
      return {
        test: 'Latence réseau',
        status,
        message
      };
    } catch (error) {
      return {
        test: 'Latence réseau',
        status: 'error',
        message: 'Impossible de mesurer la latence'
      };
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Network className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Diagnostic Réseau
                </h3>
                <p className="text-sm text-gray-500">
                  Test de connectivité vers {host}:{port}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={runDiagnostic}
              disabled={isRunning}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Diagnostic en cours...</span>
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
                  <span>Lancer le diagnostic</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {diagnosticTests.map((test, index) => {
              const result = results.find(r => r.test === test.name);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {result ? getStatusIcon(result.status) : <div className="w-4 h-4" />}
                      <span className="font-medium text-gray-900">{test.name}</span>
                    </div>
                    {result?.duration && (
                      <span className="text-xs text-gray-500">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                  {result && (
                    <p className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {results.length > 0 && !isRunning && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">
                    Recommandations
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Vérifiez les paramètres de connexion dans votre panel d'hébergement</li>
                    <li>• Assurez-vous que votre IP est autorisée à se connecter</li>
                    <li>• Testez avec un autre outil (phpMyAdmin, MySQL Workbench)</li>
                    <li>• Consultez le guide de connexion OVH pour plus d'aide</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}