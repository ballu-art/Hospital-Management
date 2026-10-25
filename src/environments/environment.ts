export const environment = {
  production: false,
  appName: 'Hospital ERP',
  /** Base URL used by HTTP repositories (not used while mock repositories are active). */
  apiBaseUrl: '/api',
  /** Simulated latency for mock repositories, in milliseconds. */
  mockLatencyMs: 300,
} as const;
