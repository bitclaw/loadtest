/**
 * Reusable AppLoadTestConfig and ThresholdConfig test data.
 */

import type { AppLoadTestConfig, AuthConfig, ThresholdConfig } from '../types';

export const SAMPLE_AUTH_CONFIG: AuthConfig = {
  loginEndpoint: '/api/loadtest/auth',
  emailEnvVar: 'LOADTEST_EMAIL',
  passwordEnvVar: 'LOADTEST_PASSWORD',
  sessionCookieName: 'runmist_session'
};

const SAMPLE_THRESHOLDS: ThresholdConfig = {
  p95MaxMs: 500,
  minSuccessRate: 95,
  minThroughput: 50,
  tiers: {
    CPX11: { p95MaxMs: 800, minSuccessRate: 90, minThroughput: 30 },
    CPX31: { p95MaxMs: 300, minSuccessRate: 98, minThroughput: 100 }
  }
};

export const SAMPLE_CONFIG_WITH_AUTH: AppLoadTestConfig = {
  appName: 'runmist',
  baseUrl: 'http://localhost:3001',
  productionUrl: 'https://runmist.com',
  auth: SAMPLE_AUTH_CONFIG,
  publicEndpoints: [
    { path: '/login', label: 'Login page' },
    { path: '/', label: 'Landing page' }
  ],
  authenticatedEndpoints: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/servers', label: 'Servers' },
    { path: '/settings', label: 'Settings' }
  ],
  modes: {
    quick: { concurrencyLevels: [1, 10], durationSec: 5, warmupRequests: 3 },
    full: {
      concurrencyLevels: [10, 50, 100],
      durationSec: 10,
      warmupRequests: 5
    },
    stress: {
      concurrencyLevels: [50, 100, 200, 500],
      durationSec: 15,
      warmupRequests: 10
    }
  },
  thresholds: SAMPLE_THRESHOLDS
};

export const SAMPLE_CONFIG_PUBLIC_ONLY: AppLoadTestConfig = {
  appName: 'weatherdestination',
  baseUrl: 'http://localhost:3000',
  publicEndpoints: [
    { path: '/', label: 'Home' },
    { path: '/blog', label: 'Blog' },
    { path: '/docs', label: 'Docs' }
  ],
  authenticatedEndpoints: [],
  modes: {
    quick: { concurrencyLevels: [1, 10], durationSec: 5, warmupRequests: 3 },
    full: {
      concurrencyLevels: [10, 50, 100],
      durationSec: 10,
      warmupRequests: 5
    },
    stress: {
      concurrencyLevels: [50, 100, 200, 500],
      durationSec: 15,
      warmupRequests: 10
    }
  },
  thresholds: {
    p95MaxMs: 500,
    minSuccessRate: 99,
    minThroughput: 100
  }
};
