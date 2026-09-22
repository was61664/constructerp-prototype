/**
 * Development configuration.
 *
 * The API base URL is configuration, not a constant buried in a service, so
 * pointing the app at a deployed API is a build-time swap rather than a code
 * change. See environment.production.ts for the deployed values.
 */
export const environment = {
  production: false,
  /** Empty string means "same origin"; the dev API runs on its own port. */
  apiBaseUrl: 'http://localhost:5210',
} as const;
