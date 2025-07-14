import { HttpRequest, HttpResponse, HttpHeader, QueryParam } from '../types/global';

interface RequestConfig {
  timeout?: number;
  followRedirects?: boolean;
  validateSSL?: boolean;
  maxRedirects?: number;
}

class HttpService {
  private defaultConfig: RequestConfig = {
    timeout: 30000,
    followRedirects: true,
    validateSSL: true,
    maxRedirects: 5
  };

  async executeRequest(
    request: HttpRequest,
    environment?: Record<string, string>,
    config?: RequestConfig
  ): Promise<HttpResponse> {
    const startTime = Date.now();
    const requestConfig = { ...this.defaultConfig, ...config };
    
    let processedRequest: HttpRequest = request;

    try {
      // Substituer les variables d'environnement
      processedRequest = this.processVariables(request, environment);
      
      // Construire l'URL avec les paramètres de requête (incluant les API keys)
      const url = this.buildUrl(processedRequest.url, processedRequest.queryParams, processedRequest.auth);
      
      // Préparer les en-têtes
      const headers = this.buildHeaders(processedRequest.headers, processedRequest.auth, processedRequest);
      
      // Debug: Afficher les en-têtes d'authentification
      console.log('🔐 Configuration d\'authentification:', {
        authType: processedRequest.auth.type,
        authConfig: processedRequest.auth,
        headers: headers,
        hasAuthHeader: !!headers['Authorization'],
        url: url
      });
      
      // Préparer le corps de la requête
      const body = this.buildBody(processedRequest);
      
      // Configuration de la requête fetch - Plus permissive pour l'authentification
      const fetchConfig: RequestInit = {
        method: processedRequest.method,
        headers,
        body,
        redirect: requestConfig.followRedirects ? 'follow' : 'manual',
        signal: AbortSignal.timeout(requestConfig.timeout!),
        // Configuration plus permissive pour l'authentification
        mode: 'cors',
        credentials: 'omit' // Changé de 'omit' à 'same-origin'
      };

      // Exécuter la requête
      const response = await fetch(url, fetchConfig);
      const endTime = Date.now();
      
      // Lire le corps de la réponse
      let responseText = '';
      const contentType = response.headers.get('content-type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          const jsonData = await response.json();
          responseText = JSON.stringify(jsonData);
        } else {
          responseText = await response.text();
        }
      } catch (error) {
        try {
          responseText = await response.text();
        } catch {
          responseText = 'Erreur lors de la lecture de la réponse';
        }
      }
      
      // Construire la réponse
      const httpResponse: HttpResponse = {
        id: crypto.randomUUID(),
        requestId: request.id,
        status: response.status,
        statusText: response.statusText,
        headers: this.extractHeaders(response.headers),
        body: responseText,
        size: new Blob([responseText]).size,
        time: endTime - startTime,
        timestamp: new Date()
      };

      return httpResponse;
    } catch (error) {
      const endTime = Date.now();
      
      // Gérer les erreurs avec plus de détails pour l'authentification
      let status = 0;
      let statusText = 'Network Error';
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      
      if (error instanceof TypeError) {
        errorMessage = 'Erreur réseau';
        if (error.message.includes('Failed to fetch')) {
          errorDetails = 'Impossible de joindre le serveur. Causes possibles:\n• Serveur hors ligne ou URL incorrecte\n• Problème CORS - Le serveur doit autoriser les requêtes cross-origin\n• Token d\'authentification invalide ou expiré\n• Certificat SSL invalide\n• Pare-feu bloquant la connexion';
        } else {
          errorDetails = 'Vérifiez votre connexion internet, le token d\'authentification, ou les paramètres CORS du serveur';
        }
        statusText = 'Network Error';
      } else if (error instanceof DOMException && error.name === 'TimeoutError') {
        errorMessage = 'Délai d\'attente dépassé';
        errorDetails = `La requête a pris plus de ${requestConfig.timeout}ms à répondre`;
        statusText = 'Timeout';
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Requête annulée';
        errorDetails = 'La requête a été interrompue';
        statusText = 'Aborted';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('URL invalide')) {
          errorDetails = 'Vérifiez le format de l\'URL (doit commencer par http:// ou https://)';
          statusText = 'Invalid URL';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de joindre le serveur';
          errorDetails = 'Le serveur est peut-être hors ligne, l\'URL est incorrecte, ou le token d\'authentification est invalide';
          statusText = 'Connection Failed';
        }
      }

      const errorResponse = {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        url: processedRequest?.url || request.url,
        method: request.method,
        authType: processedRequest?.auth?.type || 'none'
      };

      const httpResponse: HttpResponse = {
        id: crypto.randomUUID(),
        requestId: request.id,
        status,
        statusText,
        headers: {},
        body: JSON.stringify(errorResponse, null, 2),
        size: JSON.stringify(errorResponse).length,
        time: endTime - startTime,
        timestamp: new Date()
      };

      return httpResponse;
    }
  }

  private processVariables(
    request: HttpRequest,
    environment?: Record<string, string>
  ): HttpRequest {
    if (!environment) return request;

    const substitute = (text: string): string => {
      return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        return environment[varName.trim()] || match;
      });
    };

    return {
      ...request,
      url: substitute(request.url),
      headers: request.headers.map(header => ({
        ...header,
        key: substitute(header.key),
        value: substitute(header.value)
      })),
      queryParams: request.queryParams.map(param => ({
        ...param,
        key: substitute(param.key),
        value: substitute(param.value)
      })),
      body: request.body ? {
        ...request.body,
        content: substitute(request.body.content)
      } : undefined,
      // Traiter aussi l'authentification
      auth: {
        ...request.auth,
        basic: request.auth.basic ? {
          username: substitute(request.auth.basic.username || ''),
          password: substitute(request.auth.basic.password || '')
        } : undefined,
        bearer: request.auth.bearer ? {
          token: substitute(request.auth.bearer.token || '')
        } : undefined,
        apiKey: request.auth.apiKey ? {
          key: substitute(request.auth.apiKey.key || ''),
          value: substitute(request.auth.apiKey.value || ''),
          addTo: request.auth.apiKey.addTo
        } : undefined
      }
    };
  }

  // Méthode modifiée pour gérer les API keys dans les query params et ajouter automatiquement le protocole
  private buildUrl(baseUrl: string, queryParams: QueryParam[], auth: HttpRequest['auth']): string {
    try {
      // Ajouter automatiquement http:// si aucun protocole n'est spécifié
      let processedUrl = baseUrl.trim();
      if (!processedUrl.match(/^https?:\/\//i)) {
        processedUrl = 'https://' + processedUrl;
      }
      
      const url = new URL(processedUrl);
      
      // Ajouter les paramètres de requête normaux
      queryParams
        .filter(param => param.enabled && param.key && param.value)
        .forEach(param => {
          url.searchParams.append(param.key, param.value);
        });
      
      // Ajouter les API keys comme paramètres de requête si nécessaire
      if (auth.type === 'api-key' && auth.apiKey?.addTo === 'query' && auth.apiKey.key && auth.apiKey.value) {
        url.searchParams.append(auth.apiKey.key, auth.apiKey.value);
      }
      
      return url.toString();
    } catch (error) {
      throw new Error(`URL invalide: ${baseUrl}`);
    }
  }

  private buildHeaders(
    headers: HttpHeader[],
    auth: HttpRequest['auth'],
    request?: HttpRequest
  ): Record<string, string> {
    const headerMap: Record<string, string> = {};
    
    // Ajouter les en-têtes personnalisés
    headers
      .filter(header => header.enabled && header.key)
      .forEach(header => {
        headerMap[header.key] = header.value;
      });
    
    // Ajouter l'authentification
    if (auth.type !== 'none') {
      switch (auth.type) {
        case 'basic':
          if (auth.basic?.username && auth.basic?.password) {
            const credentials = btoa(`${auth.basic.username}:${auth.basic.password}`);
            headerMap['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'bearer':
          if (auth.bearer?.token) {
            headerMap['Authorization'] = `Bearer ${auth.bearer.token}`;
          }
          break;
        case 'api-key':
          if (auth.apiKey?.key && auth.apiKey?.value && auth.apiKey.addTo === 'header') {
            headerMap[auth.apiKey.key] = auth.apiKey.value;
          }
          break;
      }
    }
    
    // Ajouter des en-têtes par défaut si pas déjà présents
    const hasHeader = (headerName: string) => {
      return Object.keys(headerMap).some(key => key.toLowerCase() === headerName.toLowerCase()) ||
             headers.some(h => h.key.toLowerCase() === headerName.toLowerCase());
    };
    
    // Accept header
    if (!hasHeader('Accept')) {
      headerMap['Accept'] = 'application/json, text/plain, */*';
    }
    
    // Content-Type automatique selon le type de corps
    if (request?.body && request.body.type !== 'none' && !hasHeader('Content-Type')) {
      switch (request.body.type) {
        case 'raw':
          try {
            JSON.parse(request.body.content);
            headerMap['Content-Type'] = 'application/json';
          } catch {
            headerMap['Content-Type'] = 'text/plain';
          }
          break;
        case 'form-data':
          // FormData définit automatiquement le Content-Type avec boundary
          break;
        case 'x-www-form-urlencoded':
          headerMap['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
        default:
          headerMap['Content-Type'] = 'text/plain';
      }
    }
    
    // User-Agent par défaut
    if (!hasHeader('User-Agent')) {
      headerMap['User-Agent'] = 'APIForge/1.0';
    }
    
    // SUPPRIMÉ : Les en-têtes CORS problématiques qui peuvent interférer avec l'authentification
    // Ces en-têtes peuvent causer des problèmes avec certaines APIs authentifiées
    
    return headerMap;
  }

  private buildBody(request: HttpRequest): string | FormData | null {
    if (!request.body || request.body.type === 'none') {
      return null;
    }

    switch (request.body.type) {
      case 'raw':
        return request.body.content;
      case 'form-data':
        const formData = new FormData();
        try {
          const data = JSON.parse(request.body.content);
          Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        } catch {
          return request.body.content;
        }
        return formData;
      case 'x-www-form-urlencoded':
        return request.body.content;
      default:
        return request.body.content;
    }
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const headerMap: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    return headerMap;
  }

  // Méthodes utilitaires inchangées
  validateUrl(url: string): boolean {
    try {
      // Ajouter automatiquement http:// si aucun protocole n'est spécifié
      let processedUrl = url.trim();
      if (!processedUrl.match(/^https?:\/\//i)) {
        processedUrl = 'http://' + processedUrl;
      }
      new URL(processedUrl);
      return true;
    } catch {
      return false;
    }
  }

  formatResponseBody(body: string, contentType?: string): string {
    if (!contentType) return body;
    
    try {
      if (contentType.includes('application/json')) {
        return JSON.stringify(JSON.parse(body), null, 2);
      }
      if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        return body;
      }
    } catch {
      // Si le formatage échoue, retourner le corps original
    }
    
    return body;
  }

  getResponseSize(response: HttpResponse): string {
    const bytes = response.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getResponseTime(response: HttpResponse): string {
    const ms = response.time;
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  // Méthode améliorée pour diagnostiquer les problèmes d'authentification
  diagnoseResponse(response: HttpResponse): string[] {
    const issues: string[] = [];
    
    // Messages d'erreur spécifiques selon le statut HTTP
    switch (response.status) {
      case 0:
        issues.push('🔌 Erreur réseau: Impossible de joindre le serveur');
        break;
      case 400:
        issues.push('❌ 400 Bad Request: Requête malformée - Vérifiez les paramètres et le format');
        break;
      case 401:
        issues.push('🔐 401 Unauthorized: Authentification requise - Token invalide ou manquant');
        break;
      case 403:
        issues.push('🚫 403 Forbidden: Accès refusé - Permissions insuffisantes');
        break;
      case 404:
        issues.push('🔍 404 Not Found: Ressource introuvable - Vérifiez l\'URL');
        break;
      case 405:
        issues.push('⚠️ 405 Method Not Allowed: Méthode HTTP non autorisée');
        break;
      case 408:
        issues.push('⏱️ 408 Request Timeout: Délai d\'attente dépassé');
        break;
      case 409:
        issues.push('⚡ 409 Conflict: Conflit avec l\'état actuel de la ressource');
        break;
      case 422:
        issues.push('📝 422 Unprocessable Entity: Données invalides - Vérifiez le format JSON');
        break;
      case 429:
        issues.push('🚦 429 Too Many Requests: Limite de taux dépassée - Attendez avant de réessayer');
        break;
      case 500:
        issues.push('💥 500 Internal Server Error: Erreur interne du serveur');
        break;
      case 502:
        issues.push('🌐 502 Bad Gateway: Passerelle défaillante');
        break;
      case 503:
        issues.push('🔧 503 Service Unavailable: Service temporairement indisponible');
        break;
      case 504:
        issues.push('⏰ 504 Gateway Timeout: Délai d\'attente de la passerelle');
        break;
      default:
        if (response.status >= 400 && response.status < 500) {
          issues.push(`❌ ${response.status} ${response.statusText}: Erreur côté client`);
        } else if (response.status >= 500) {
          issues.push(`💥 ${response.status} ${response.statusText}: Erreur côté serveur`);
        }
        break;
    }
    
    // Vérifier le corps de la réponse
    if (!response.body || response.body.trim() === '') {
      issues.push('Corps de réponse vide - Le serveur n\'a retourné aucune donnée');
    } else {
      try {
        const parsed = JSON.parse(response.body);
        if (typeof parsed === 'object' && parsed !== null) {
          // Vérifier les messages d'erreur d'authentification courants
          if (parsed.error && typeof parsed.error === 'string') {
            const errorMsg = parsed.error.toLowerCase();
            if (errorMsg.includes('unauthorized') || errorMsg.includes('invalid token') || errorMsg.includes('expired')) {
              issues.push('Erreur d\'authentification détectée dans la réponse');
            }
          }
          
          if (Array.isArray(parsed) && parsed.length === 0) {
            issues.push('Réponse JSON valide mais tableau vide');
          } else if (Object.keys(parsed).length === 0) {
            issues.push('Réponse JSON valide mais objet vide');
          }
        }
      } catch {
        if (response.body.length < 10) {
          issues.push('Réponse très courte, possiblement incomplète');
        }
      }
    }
    
    // Vérifier les en-têtes CORS
    const corsHeaders = ['access-control-allow-origin', 'access-control-allow-methods'];
    const hasCorsHeaders = corsHeaders.some(header => 
      Object.keys(response.headers).some(key => key.toLowerCase() === header)
    );
    
    if (!hasCorsHeaders && response.status === 0) {
      issues.push('Possible problème CORS - Le serveur ne permet peut-être pas les requêtes cross-origin');
    }
    
    // Vérifier le content-type
    const contentType = Object.entries(response.headers)
      .find(([key]) => key.toLowerCase() === 'content-type')?.[1];
    
    if (!contentType) {
      issues.push('Aucun Content-Type spécifié dans la réponse');
    } else if (contentType.includes('text/html') && response.body.includes('<html')) {
      issues.push('La réponse semble être une page HTML au lieu de données API');
    }
    
    return issues;
  }

  // Nouvelle méthode pour tester l'authentification
  testAuthentication(auth: HttpRequest['auth']): string[] {
    const issues: string[] = [];
    
    switch (auth.type) {
      case 'basic':
        if (!auth.basic?.username || !auth.basic?.password) {
          issues.push('Authentification Basic: Nom d\'utilisateur ou mot de passe manquant');
        }
        break;
      case 'bearer':
        if (!auth.bearer?.token) {
          issues.push('Authentification Bearer: Token manquant');
        } else if (auth.bearer.token.length < 10) {
          issues.push('Authentification Bearer: Token très court, possiblement invalide');
        }
        break;
      case 'api-key':
        if (!auth.apiKey?.key || !auth.apiKey?.value) {
          issues.push('Authentification API Key: Clé ou valeur manquante');
        }
        if (!auth.apiKey?.addTo) {
          issues.push('Authentification API Key: Position (header/query) non spécifiée');
        }
        break;
    }
    
    return issues;
  }
}

export const httpService = new HttpService();
export default httpService;