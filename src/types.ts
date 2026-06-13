/**
 * Shared types for the @bitclaw/loadtest package.
 *
 * Builds on EndpointConfig from load-test-utils.ts and adds
 * authentication, per-app configuration, and threshold support.
 */

import type {
  EndpointConfig,
  LoadTestResults,
  ScenarioResult
} from '@bitclaw/sqlite/load-test-utils';

// Re-export upstream types for convenience
export type { EndpointConfig, LoadTestResults, ScenarioResult };

/* ------------------------------------------------------------------
 * Authentication
 * ------------------------------------------------------------------ */

export type AuthConfig = {
  /** Dedicated login endpoint path (e.g., "/api/loadtest/auth") */
  loginEndpoint: string;
  /** Env var name for the test user email */
  emailEnvVar: string;
  /** Env var name for the test user password */
  passwordEnvVar: string;
  /** Cookie name that holds the session (e.g., "runmist_session") */
  sessionCookieName: string;
  /** Direct credentials (used by RunMist dashboard, bypasses env vars) */
  credentials?: {
    email: string;
    password: string;
  };
};

export type SessionState = {
  cookies: string;
  authenticated: boolean;
};

/* ------------------------------------------------------------------
 * Test modes
 * ------------------------------------------------------------------ */

export type ModeConfig = {
  /** Concurrency levels to sweep through */
  concurrencyLevels: number[];
  /** Duration per scenario in seconds */
  durationSec: number;
  /** Warm-up requests before timing begins */
  warmupRequests: number;
  /**
   * Times to repeat each scenario (default 1). When > 1, scenarios run N
   * times and report median + coefficient of variation, exposing run-to-run
   * variance instead of a single noisy point estimate. Optional so existing
   * inline mode configs keep compiling.
   */
  repeat?: number;
};

/* ------------------------------------------------------------------
 * Thresholds
 * ------------------------------------------------------------------ */

export type ThresholdConfig = {
  /** Maximum acceptable P95 latency in ms */
  p95MaxMs: number;
  /** Minimum acceptable success rate (0-100) */
  minSuccessRate: number;
  /** Minimum req/s at lowest concurrency level */
  minThroughput: number;
  /** Per-Hetzner-tier threshold overrides */
  tiers?: Record<string, Omit<ThresholdConfig, 'tiers'>>;
};

/* ------------------------------------------------------------------
 * Per-app configuration
 * ------------------------------------------------------------------ */

export type AppLoadTestConfig = {
  /** App name (matches workspace directory, e.g., "runmist") */
  appName: string;
  /** Local base URL (e.g., "http://localhost:3001") */
  baseUrl: string;
  /** Production URL (e.g., "https://runmist.com") */
  productionUrl?: string;
  /** Direct origin URL for CDN bypass comparison (e.g., "http://87.99.x.x:3001") */
  directUrl?: string;
  /** Auth configuration (omit for public-only apps) */
  auth?: AuthConfig;
  /** Endpoints that don't require authentication */
  publicEndpoints: EndpointConfig[];
  /** Endpoints that require a valid session */
  authenticatedEndpoints: EndpointConfig[];
  /** Test mode configurations */
  modes: {
    quick: ModeConfig;
    full: ModeConfig;
    stress: ModeConfig;
  };
  /** Pass/fail thresholds */
  thresholds: ThresholdConfig;
};

/* ------------------------------------------------------------------
 * Runner options
 * ------------------------------------------------------------------ */

export type TestMode = 'quick' | 'full' | 'stress';
export type Engine = 'bun' | 'k6';

export type RunOptions = {
  app: string;
  mode: TestMode;
  engine: Engine;
  production: boolean;
  publicOnly: boolean;
  json: boolean;
  tier?: string;
};

/* ------------------------------------------------------------------
 * k6 runner options
 * ------------------------------------------------------------------ */

export type K6RunOptions = {
  baseUrl: string;
  email?: string;
  password?: string;
  jsonOutput?: string;
};

/* ------------------------------------------------------------------
 * Threshold evaluation result
 * ------------------------------------------------------------------ */

export type ThresholdResult = {
  passed: boolean;
  violations: ThresholdViolation[];
};

export type ThresholdViolation = {
  scenario: string;
  metric: string;
  actual: number;
  threshold: number;
};
