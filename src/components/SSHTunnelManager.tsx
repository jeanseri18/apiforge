import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Play,
  Square,
  Trash2,
  Edit,
  Key,
  Upload,
  Download,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { sshService } from '../services/sshService';
import type { SSHConfig, SSHTunnel, SSHConnectionInfo, SSHStats } from '../services/sshService';

const SSHTunnelManager: React.FC = () => {
  const [tunnels, setTunnels] = useState<SSHTunnel[]>([]);
  const [stats, setStats] = useState<SSHStats | null>(null);
  const [selectedTunnel, setSelectedTunnel] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<SSHConnectionInfo | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tunnelForm, setTunnelForm] = useState<{
    name: string;
    config: SSHConfig;
  }>({
    name: '',
    config: {
      host: '',
      port: 22,
      username: '',
      password: '',
      privateKey: '',
      passphrase: '',
      localPort: 3000,
      remoteHost: 'localhost',
      remotePort: 5432,
      keepAlive: true,
      timeout: 30000
    }
  });

  const [keyGenForm, setKeyGenForm] = useState({
    type: 'rsa' as 'rsa' | 'ed25519' | 'ecdsa',
    bits: 2048,
    comment: 'database-browser-key'
  });

  const [generatedKeys, setGeneratedKeys] = useState<{
    privateKey: string;
    publicKey: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  useEffect(() => {
    loadTunnels();
    loadStats();

    // Listen to SSH service events
    const handleTunnelCreated = (tunnel: SSHTunnel) => {
      setTunnels(prev => [...prev, tunnel]);
    };

    const handleTunnelStatusChanged = (tunnel: SSHTunnel) => {
      setTunnels(prev => prev.map(t => t.id === tunnel.id ? tunnel : t));
    };

    const handleStatsUpdated = (newStats: SSHStats) => {
      setStats(newStats);
    };

    sshService.on('tunnelCreated', handleTunnelCreated);
    sshService.on('tunnelStatusChanged', handleTunnelStatusChanged);
    sshService.on('tunnelConnected', handleTunnelStatusChanged);
    sshService.on('tunnelDisconnected', handleTunnelStatusChanged);
    sshService.on('tunnelError', handleTunnelStatusChanged);
    sshService.on('statsUpdated', handleStatsUpdated);

    return () => {
      sshService.off('tunnelCreated', handleTunnelCreated);
      sshService.off('tunnelStatusChanged', handleTunnelStatusChanged);
      sshService.off('tunnelConnected', handleTunnelStatusChanged);
      sshService.off('tunnelDisconnected', handleTunnelStatusChanged);
      sshService.off('tunnelError', handleTunnelStatusChanged);
      sshService.off('statsUpdated', handleStatsUpdated);
    };
  }, []);

  const loadTunnels = () => {
    setTunnels(sshService.getAllTunnels());
  };

  const loadStats = () => {
    setStats(sshService.getStats());
  };

  const handleCreateTunnel = async () => {
    if (!tunnelForm.name.trim()) {
      setError('Tunnel name is required');
      return;
    }

    setLoading({ create: true });
    setError(null);

    try {
      await sshService.createTunnel(tunnelForm.name, tunnelForm.config);
      setShowCreateModal(false);
      resetForm();
      loadTunnels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tunnel');
    } finally {
      setLoading({ create: false });
    }
  };

  const handleConnectTunnel = async (tunnelId: string) => {
    setLoading({ [tunnelId]: true });
    setError(null);

    try {
      await sshService.connectTunnel(tunnelId);
      loadTunnels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect tunnel');
    } finally {
      setLoading({ [tunnelId]: false });
    }
  };

  const handleDisconnectTunnel = async (tunnelId: string) => {
    setLoading({ [tunnelId]: true });
    setError(null);

    try {
      await sshService.disconnectTunnel(tunnelId);
      loadTunnels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect tunnel');
    } finally {
      setLoading({ [tunnelId]: false });
    }
  };

  const handleDeleteTunnel = async (tunnelId: string) => {
    if (!confirm('Are you sure you want to delete this tunnel?')) {
      return;
    }

    setLoading({ [tunnelId]: true });
    setError(null);

    try {
      await sshService.deleteTunnel(tunnelId);
      loadTunnels();
      if (selectedTunnel === tunnelId) {
        setSelectedTunnel(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tunnel');
    } finally {
      setLoading({ [tunnelId]: false });
    }
  };

  const handleTestConnection = async () => {
    setLoading({ test: true });
    setError(null);
    setConnectionTestResult(null);

    try {
      const result = await sshService.testSSHConnection(tunnelForm.config);
      setConnectionTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setLoading({ test: false });
    }
  };

  const handleGenerateKeys = async () => {
    setLoading({ keygen: true });
    setError(null);

    try {
      const keys = await sshService.generateSSHKey(keyGenForm.type, keyGenForm.bits);
      setGeneratedKeys(keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate keys');
    } finally {
      setLoading({ keygen: false });
    }
  };

  const handleImportPrivateKey = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const result = await sshService.importSSHKey(content);
    
    if (result.isValid) {
      setTunnelForm(prev => ({
        ...prev,
        config: {
          ...prev.config,
          privateKey: content
        }
      }));
    } else {
      setError('Invalid private key file');
    }
  };

  const resetForm = () => {
    setTunnelForm({
      name: '',
      config: {
        host: '',
        port: 22,
        username: '',
        password: '',
        privateKey: '',
        passphrase: '',
        localPort: 3000,
        remoteHost: 'localhost',
        remotePort: 5432,
        keepAlive: true,
        timeout: 30000
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: SSHTunnel['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SSHTunnel['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-100';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedTunnelData = selectedTunnel ? tunnels.find(t => t.id === selectedTunnel) : null;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">SSH Tunnel Manager</h1>
              <p className="text-sm text-gray-600">Secure database connections through SSH tunnels</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyGenerator(true)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Key className="w-4 h-4 mr-2" />
              Generate Keys
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tunnel
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Total Tunnels</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalTunnels}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-600">Active</div>
              <div className="text-2xl font-bold text-green-900">{stats.activeTunnels}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Connections</div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalConnections}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-yellow-600">Avg Latency</div>
              <div className="text-2xl font-bold text-yellow-900">{Math.round(stats.averageLatency)}ms</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-red-600">Errors</div>
              <div className="text-2xl font-bold text-red-900">{stats.connectionErrors}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        {/* Tunnels List */}
        <div className="w-1/2 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">SSH Tunnels</h2>
          </div>
          
          <div className="overflow-y-auto">
            {tunnels.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SSH Tunnels</h3>
                <p className="text-gray-600 mb-4">Create your first SSH tunnel to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tunnel
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tunnels.map(tunnel => (
                  <div
                    key={tunnel.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTunnel === tunnel.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTunnel(tunnel.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(tunnel.status)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{tunnel.name}</div>
                          <div className="text-sm text-gray-500">
                            {tunnel.config.username}@{tunnel.config.host}:{tunnel.config.port}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tunnel.status)}`}>
                          {tunnel.status}
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          {tunnel.status === 'connected' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDisconnectTunnel(tunnel.id);
                              }}
                              disabled={loading[tunnel.id]}
                              className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Disconnect"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectTunnel(tunnel.id);
                              }}
                              disabled={loading[tunnel.id] || tunnel.status === 'connecting'}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Connect"
                            >
                              {loading[tunnel.id] ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTunnel(tunnel.id);
                            }}
                            disabled={loading[tunnel.id]}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>Local: {tunnel.localPort}</span>
                      <span className="mx-2">→</span>
                      <span>Remote: {tunnel.config.remoteHost}:{tunnel.config.remotePort}</span>
                    </div>
                    
                    {tunnel.status === 'error' && tunnel.lastError && (
                      <div className="mt-2 text-xs text-red-600">
                        Error: {tunnel.lastError}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Tunnel Details */}
        <div className="w-1/2 bg-white">
          {selectedTunnelData ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Tunnel Details</h2>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTunnelData.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTunnelData.status)}`}>
                      {selectedTunnelData.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTunnelData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTunnelData.createdAt.toLocaleString()}
                      </span>
                    </div>
                    {selectedTunnelData.connectedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Connected:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedTunnelData.connectedAt.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Connection Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Connection Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">SSH Host:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTunnelData.config.host}:{selectedTunnelData.config.port}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTunnelData.config.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Auth Method:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedTunnelData.config.privateKey ? 'Private Key' : 'Password'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Port Forwarding */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Port Forwarding</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Local Port:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTunnelData.localPort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remote Host:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTunnelData.config.remoteHost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remote Port:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedTunnelData.config.remotePort}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Connection String:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-mono text-gray-900 mr-2">
                          localhost:{selectedTunnelData.localPort}
                        </span>
                        <button
                          onClick={() => copyToClipboard(`localhost:${selectedTunnelData.localPort}`)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Statistics */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Statistics</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bytes Sent:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedTunnelData.bytesTransferred.sent / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bytes Received:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(selectedTunnelData.bytesTransferred.received / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tunnel Selected</h3>
                <p className="text-gray-600">Select a tunnel from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Tunnel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create SSH Tunnel</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Basic Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tunnel Name</label>
                  <input
                    type="text"
                    value={tunnelForm.name}
                    onChange={(e) => setTunnelForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Database Tunnel"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SSH Host</label>
                    <input
                      type="text"
                      value={tunnelForm.config.host}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, host: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="ssh.example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SSH Port</label>
                    <input
                      type="number"
                      value={tunnelForm.config.port}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, port: parseInt(e.target.value) || 22 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={tunnelForm.config.username}
                    onChange={(e) => setTunnelForm(prev => ({
                      ...prev,
                      config: { ...prev.config, username: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={tunnelForm.config.password}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, password: e.target.value }
                      }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Password (optional if using private key)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Advanced Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Port Forwarding</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local Port</label>
                    <input
                      type="number"
                      value={tunnelForm.config.localPort}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, localPort: parseInt(e.target.value) || 3000 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remote Host</label>
                    <input
                      type="text"
                      value={tunnelForm.config.remoteHost}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, remoteHost: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="localhost"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remote Port</label>
                  <input
                    type="number"
                    value={tunnelForm.config.remotePort}
                    onChange={(e) => setTunnelForm(prev => ({
                      ...prev,
                      config: { ...prev.config, remotePort: parseInt(e.target.value) || 5432 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={tunnelForm.config.privateKey}
                        onChange={(e) => setTunnelForm(prev => ({
                          ...prev,
                          config: { ...prev.config, privateKey: e.target.value }
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Key File
                        <input
                          type="file"
                          accept=".pem,.key,.ppk"
                          onChange={handleImportPrivateKey}
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setShowKeyGenerator(true)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
                
                {tunnelForm.config.privateKey && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passphrase</label>
                    <input
                      type="password"
                      value={tunnelForm.config.passphrase}
                      onChange={(e) => setTunnelForm(prev => ({
                        ...prev,
                        config: { ...prev.config, passphrase: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Private key passphrase (if required)"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Connection Test */}
            {connectionTestResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">Connection Test Successful</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>Server: {connectionTestResult.serverVersion}</div>
                  <div>Fingerprint: {connectionTestResult.fingerprint}</div>
                  <div>Algorithms: {connectionTestResult.algorithms.kex}, {connectionTestResult.algorithms.cipher}</div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={loading.test || !tunnelForm.config.host || !tunnelForm.config.username}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 disabled:opacity-50"
              >
                {loading.test ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleCreateTunnel}
                  disabled={loading.create || !tunnelForm.name.trim() || !tunnelForm.config.host || !tunnelForm.config.username}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading.create ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Tunnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Key Generator Modal */}
      {showKeyGenerator && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">SSH Key Generator</h3>
              <button
                onClick={() => setShowKeyGenerator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Type</label>
                  <select
                    value={keyGenForm.type}
                    onChange={(e) => setKeyGenForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rsa">RSA</option>
                    <option value="ed25519">Ed25519</option>
                    <option value="ecdsa">ECDSA</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Size (bits)</label>
                  <select
                    value={keyGenForm.bits}
                    onChange={(e) => setKeyGenForm(prev => ({ ...prev, bits: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={keyGenForm.type === 'ed25519'}
                  >
                    <option value={2048}>2048</option>
                    <option value={3072}>3072</option>
                    <option value={4096}>4096</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <input
                  type="text"
                  value={keyGenForm.comment}
                  onChange={(e) => setKeyGenForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Key comment"
                />
              </div>
              
              {generatedKeys && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Private Key</label>
                      <button
                        onClick={() => copyToClipboard(generatedKeys.privateKey)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </button>
                    </div>
                    <textarea
                      value={generatedKeys.privateKey}
                      readOnly
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Public Key</label>
                      <button
                        onClick={() => copyToClipboard(generatedKeys.publicKey)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </button>
                    </div>
                    <textarea
                      value={generatedKeys.publicKey}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setTunnelForm(prev => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            privateKey: generatedKeys.privateKey
                          }
                        }));
                        setShowKeyGenerator(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Use in Tunnel
                    </button>
                    
                    <button
                      onClick={() => {
                        const blob = new Blob([generatedKeys.privateKey], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `ssh_key_${keyGenForm.type}_${Date.now()}.pem`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleGenerateKeys}
                disabled={loading.keygen}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading.keygen ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-2" />
                )}
                Generate Keys
              </button>
              
              <button
                onClick={() => setShowKeyGenerator(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SSHTunnelManager;