/**
 * Enhanced Bun-native load test runner.
 *
 * Wraps the existing runLoadTest() from load-test-utils.ts and adds
 * authentication support, per-app config, and threshold checking.
 */
import { type LoadTestResults } from '@bitclaw/sqlite/load-test-utils';
import type { AppLoadTestConfig, TestMode } from '../types';
/**
 * Run a full load test for an app using the Bun-native runner.
 *
 * 1. Tests public endpoints (no auth)
 * 2. Authenticates session pool (if auth configured)
 * 3. Tests authenticated endpoints with session cookies
 * 4. Merges results
 */
export declare function runAppLoadTest(config: AppLoadTestConfig, mode: TestMode, options?: {
    publicOnly?: boolean;
    baseUrl?: string;
}): Promise<LoadTestResults>;
//# sourceMappingURL=bun-runner.d.ts.map