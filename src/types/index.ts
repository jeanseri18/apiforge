// Export des types globaux pour une meilleure compatibilité
export * from './global';

// Réexport des types comme types globaux
export type {
  HttpMethod,
  AuthType,
  HttpHeader,
  QueryParam,
  AuthConfig,
  HttpRequest,
  HttpResponse,
  Collection,
  Variable,
  Environment,
  HistoryEntry,
  Test,
  Assertion
} from './global';