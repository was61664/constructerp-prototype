/**
 * Production configuration.
 *
 * apiBaseUrl is deliberately empty: the GitHub Pages build has no backend to
 * talk to, so the app falls back to its local mock store (see ErpGateway).
 * Set this to the deployed API's origin once one exists.
 */
export const environment = {
  production: true,
  apiBaseUrl: '',
} as const;
