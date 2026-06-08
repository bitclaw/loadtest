/**
 * @bitclaw/loadtest - Load testing infrastructure.
 *
 * Public API for programmatic usage from app-specific test files
 * and the CLI.
 */
export { authenticateSession, createSessionPool } from './auth/session';
export { DEFAULT_MODES, DEFAULT_THRESHOLDS, HETZNER_TIERS } from './config/defaults';
export { listConfiguredApps, loadConfig } from './config/loader';
export { checkThresholds, formatJson, formatReport } from './reports/formatter';
export { runAppLoadTest } from './runner/bun-runner';
export { runK6Test } from './runner/k6-runner';
export type { AppLoadTestConfig, AuthConfig, EndpointConfig, Engine, K6RunOptions, LoadTestResults, ModeConfig, RunOptions, ScenarioResult, SessionState, TestMode, ThresholdConfig, ThresholdResult, ThresholdViolation } from './types';
//# sourceMappingURL=index.d.ts.map