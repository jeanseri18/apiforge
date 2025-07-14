// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
    return true;
  }

  off(event: string, listener?: Function): this {
    if (!this.events[event]) {
      return this;
    }
    if (listener) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    } else {
      delete this.events[event];
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  localPort: number;
  remoteHost: string;
  remotePort: number;
  keepAlive?: boolean;
  readyTimeout?: number;
  timeout?: number;
  algorithms?: {
    kex?: string[];
    cipher?: string[];
    serverHostKey?: string[];
    hmac?: string[];
  };
}

export interface SSHTunnel {
  id: string;
  name: string;
  config: SSHConfig;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  localPort: number;
  createdAt: Date;
  connectedAt?: Date;
  lastError?: string;
  bytesTransferred: {
    sent: number;
    received: number;
  };
  connectionCount: number;
}

export interface SSHConnectionInfo {
  serverVersion: string;
  clientVersion: string;
  algorithms: {
    kex: string;
    cipher: string;
    serverHostKey: string;
    hmac: string;
  };
  fingerprint: string;
  uptime: number;
}

export interface SSHStats {
  totalTunnels: number;
  activeTunnels: number;
  totalBytesTransferred: number;
  totalConnections: number;
  averageLatency: number;
  connectionErrors: number;
}

export class SSHService extends EventEmitter {
  private tunnels: Map<string, SSHTunnel> = new Map();
  private connections: Map<string, any> = new Map(); // Simulated SSH connections
  private portCounter = 3000;
  private stats: SSHStats = {
    totalTunnels: 0,
    activeTunnels: 0,
    totalConnections: 0,
    totalBytesTransferred: 0,
    averageLatency: 0,
    connectionErrors: 0
  };

  constructor() {
    super();
    this.startStatsMonitoring();
  }

  async createTunnel(name: string, config: SSHConfig): Promise<string> {
    const tunnelId = `tunnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const localPort = config.localPort || this.getNextAvailablePort();

    const tunnel: SSHTunnel = {
      id: tunnelId,
      name,
      config: {
        ...config,
        localPort
      },
      status: 'disconnected',
      localPort,
      createdAt: new Date(),
      bytesTransferred: {
        sent: 0,
        received: 0
      },
      connectionCount: 0
    };

    this.tunnels.set(tunnelId, tunnel);
    this.stats.totalTunnels++;
    
    this.emit('tunnelCreated', tunnel);
    return tunnelId;
  }

  async connectTunnel(tunnelId: string): Promise<void> {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      throw new Error(`Tunnel ${tunnelId} not found`);
    }

    if (tunnel.status === 'connected') {
      throw new Error(`Tunnel ${tunnelId} is already connected`);
    }

    tunnel.status = 'connecting';
    this.emit('tunnelStatusChanged', tunnel);

    try {
      // Validate SSH configuration
      await this.validateSSHConfig(tunnel.config);

      // Simulate SSH connection establishment
      const connection = await this.establishSSHConnection(tunnel.config);
      
      // Setup port forwarding
      await this.setupPortForwarding(connection, tunnel);
      
      tunnel.status = 'connected';
      tunnel.connectedAt = new Date();
      tunnel.lastError = undefined;
      
      this.connections.set(tunnelId, connection);
      this.stats.activeTunnels++;
      this.stats.totalConnections++;
      
      this.emit('tunnelConnected', tunnel);
      
      // Start monitoring the tunnel
      this.monitorTunnel(tunnelId);
      
    } catch (error) {
      tunnel.status = 'error';
      tunnel.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.stats.connectionErrors++;
      
      this.emit('tunnelError', tunnel, error);
      throw error;
    }
  }

  async disconnectTunnel(tunnelId: string): Promise<void> {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      throw new Error(`Tunnel ${tunnelId} not found`);
    }

    if (tunnel.status === 'disconnected') {
      return;
    }

    const connection = this.connections.get(tunnelId);
    if (connection) {
      // Simulate connection cleanup
      await this.closeSSHConnection(connection);
      this.connections.delete(tunnelId);
    }

    tunnel.status = 'disconnected';
    tunnel.connectedAt = undefined;
    
    if (this.stats.activeTunnels > 0) {
      this.stats.activeTunnels--;
    }
    
    this.emit('tunnelDisconnected', tunnel);
  }

  async deleteTunnel(tunnelId: string): Promise<void> {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      throw new Error(`Tunnel ${tunnelId} not found`);
    }

    // Disconnect if connected
    if (tunnel.status === 'connected') {
      await this.disconnectTunnel(tunnelId);
    }

    this.tunnels.delete(tunnelId);
    this.emit('tunnelDeleted', tunnelId);
  }

  async testSSHConnection(config: SSHConfig): Promise<SSHConnectionInfo> {
    try {
      // Simulate SSH connection test
      await this.validateSSHConfig(config);
      
      const connectionInfo: SSHConnectionInfo = {
        serverVersion: 'OpenSSH_8.9',
        clientVersion: 'SSH-2.0-NodeSSH',
        algorithms: {
          kex: 'diffie-hellman-group14-sha256',
          cipher: 'aes128-ctr',
          hmac: 'hmac-sha2-256',
          serverHostKey: 'rsa-sha2-512'
        },
        fingerprint: this.generateFingerprint(config.host),
        uptime: Math.floor(Math.random() * 86400) // Random uptime in seconds
      };

      return connectionInfo;
    } catch (error) {
      throw new Error(`SSH connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getTunnel(tunnelId: string): SSHTunnel | undefined {
    return this.tunnels.get(tunnelId);
  }

  getAllTunnels(): SSHTunnel[] {
    return Array.from(this.tunnels.values());
  }

  getActiveTunnels(): SSHTunnel[] {
    return Array.from(this.tunnels.values()).filter(tunnel => tunnel.status === 'connected');
  }

  getStats(): SSHStats {
    return { ...this.stats };
  }

  async generateSSHKey(type: 'rsa' | 'ed25519' | 'ecdsa' = 'rsa', bits: number = 2048): Promise<{ privateKey: string; publicKey: string }> {
    // Simulate SSH key generation
    const keyId = Math.random().toString(36).substr(2, 16);
    
    const privateKey = `-----BEGIN ${type.toUpperCase()} PRIVATE KEY-----
` +
      `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC${keyId}
` +
      `[Simulated private key content]
` +
      `-----END ${type.toUpperCase()} PRIVATE KEY-----`;
    
    const publicKey = `ssh-${type} AAAAB3NzaC1${type}AAAAC${keyId} generated-key@database-browser`;
    
    return { privateKey, publicKey };
  }

  async importSSHKey(privateKeyContent: string, passphrase?: string): Promise<{ isValid: boolean; keyType: string; fingerprint: string }> {
    try {
      // Simulate SSH key validation
      if (!privateKeyContent.includes('BEGIN') || !privateKeyContent.includes('PRIVATE KEY')) {
        throw new Error('Invalid private key format');
      }

      // Detect key type
      let keyType = 'unknown';
      if (privateKeyContent.includes('RSA PRIVATE KEY')) keyType = 'rsa';
      else if (privateKeyContent.includes('EC PRIVATE KEY')) keyType = 'ecdsa';
      else if (privateKeyContent.includes('OPENSSH PRIVATE KEY')) keyType = 'ed25519';

      const fingerprint = this.generateKeyFingerprint(privateKeyContent);

      return {
        isValid: true,
        keyType,
        fingerprint
      };
    } catch (error) {
      return {
        isValid: false,
        keyType: 'unknown',
        fingerprint: ''
      };
    }
  }

  async getPortForwardingRules(tunnelId: string): Promise<Array<{ localPort: number; remoteHost: string; remotePort: number; active: boolean }>> {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel) {
      throw new Error(`Tunnel ${tunnelId} not found`);
    }

    // Simulate port forwarding rules
    return [
      {
        localPort: tunnel.localPort,
        remoteHost: tunnel.config.remoteHost || 'localhost',
        remotePort: tunnel.config.remotePort || 5432,
        active: tunnel.status === 'connected'
      }
    ];
  }

  private async validateSSHConfig(config: SSHConfig): Promise<void> {
    if (!config.host) {
      throw new Error('SSH host is required');
    }

    if (!config.username) {
      throw new Error('SSH username is required');
    }

    if (!config.password && !config.privateKey) {
      throw new Error('Either password or private key is required');
    }

    if (config.port && (config.port < 1 || config.port > 65535)) {
      throw new Error('SSH port must be between 1 and 65535');
    }

    if (config.localPort && (config.localPort < 1024 || config.localPort > 65535)) {
      throw new Error('Local port must be between 1024 and 65535');
    }

    // Simulate network connectivity check
    await this.simulateNetworkCheck(config.host, config.port || 22);
  }

  private async establishSSHConnection(config: SSHConfig): Promise<any> {
    // Simulate SSH connection establishment with retry logic
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate random connection failures
        if (Math.random() < 0.1) {
          throw new Error('Connection timeout');
        }

        // Return simulated connection object
        return {
          id: Math.random().toString(36).substr(2, 9),
          host: config.host,
          port: config.port || 22,
          username: config.username,
          connected: true,
          startTime: Date.now()
        };
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  private async setupPortForwarding(connection: any, tunnel: SSHTunnel): Promise<void> {
    // Simulate port forwarding setup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate port binding check
    if (Math.random() < 0.05) {
      throw new Error(`Port ${tunnel.localPort} is already in use`);
    }
  }

  private async closeSSHConnection(connection: any): Promise<void> {
    // Simulate connection cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    connection.connected = false;
  }

  private async simulateNetworkCheck(host: string, port: number): Promise<void> {
    // Simulate network connectivity check
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate network failures
    if (Math.random() < 0.05) {
      throw new Error(`Cannot reach ${host}:${port}`);
    }
  }

  private generateFingerprint(host: string): string {
    // Generate a simulated SSH fingerprint
    const chars = '0123456789abcdef';
    let fingerprint = '';
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 2 === 0) fingerprint += ':';
      fingerprint += chars[Math.floor(Math.random() * chars.length)];
    }
    return `SHA256:${fingerprint}`;
  }

  private generateKeyFingerprint(privateKey: string): string {
    // Generate a simulated key fingerprint based on content
    const hash = privateKey.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `SHA256:${hex.match(/.{2}/g)?.join(':') || hex}`;
  }

  private getNextAvailablePort(): number {
    return this.portCounter++;
  }

  private monitorTunnel(tunnelId: string): void {
    const tunnel = this.tunnels.get(tunnelId);
    if (!tunnel || tunnel.status !== 'connected') {
      return;
    }

    // Simulate periodic monitoring
    const monitorInterval = setInterval(() => {
      const currentTunnel = this.tunnels.get(tunnelId);
      if (!currentTunnel || currentTunnel.status !== 'connected') {
        clearInterval(monitorInterval);
        return;
      }

      // Simulate data transfer
      const bytesTransferred = Math.floor(Math.random() * 1024);
      currentTunnel.bytesTransferred.sent += bytesTransferred;
      currentTunnel.bytesTransferred.received += Math.floor(bytesTransferred * 0.8);
      
      this.stats.totalBytesTransferred += bytesTransferred;
      
      // Simulate random disconnections (very rare)
      if (Math.random() < 0.001) {
        this.disconnectTunnel(tunnelId).catch(console.error);
      }
    }, 5000);
  }

  private startStatsMonitoring(): void {
    setInterval(() => {
      // Update stats
      this.stats.activeTunnels = Array.from(this.tunnels.values())
        .filter(tunnel => tunnel.status === 'connected').length;
      
      // Simulate latency calculation
      this.stats.averageLatency = 50 + Math.random() * 100;
      
      this.emit('statsUpdated', this.stats);
    }, 10000);
  }
}

// Instance singleton
const sshService = new SSHService();

export default sshService;
export { sshService };