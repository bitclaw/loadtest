/**
 * Report formatting and threshold checking.
 */
import type { AppLoadTestConfig, LoadTestResults, ThresholdConfig, ThresholdResult } from '../types';
/**
 * Format load test results as a human-readable report.
 * Extends the upstream formatResults() with threshold checks.
 */
export declare function formatReport(results: LoadTestResults, config?: AppLoadTestConfig, tier?: string): string;
/**
 * Format results as JSON for machine consumption.
 */
export declare function formatJson(results: LoadTestResults, config?: AppLoadTestConfig, tier?: string): string;
/**
 * Check all scenarios against the given thresholds.
 */
export declare function checkThresholds(results: LoadTestResults, thresholds: Omit<ThresholdConfig, 'tiers'>): ThresholdResult;
//# sourceMappingURL=formatter.d.ts.map