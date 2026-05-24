/**
 * Report formatting and threshold checking.
 */

import { formatResults as formatTable } from '@bitclaw/sqlite/load-test-utils';
import type {
  AppLoadTestConfig,
  LoadTestResults,
  ThresholdConfig,
  ThresholdResult,
  ThresholdViolation
} from '../types';

/**
 * Format load test results as a human-readable report.
 * Extends the upstream formatResults() with threshold checks.
 */
export function formatReport(
  results: LoadTestResults,
  config?: AppLoadTestConfig,
  tier?: string
): string {
  const lines: string[] = [];

  // Use upstream table formatter
  lines.push(formatTable(results));

  // Add threshold results if config provided
  if (config) {
    const thresholds = resolveThresholds(config.thresholds, tier);
    const check = checkThresholds(results, thresholds);

    lines.push('');
    lines.push('='.repeat(70));
    lines.push(
      check.passed ? '  THRESHOLDS: ALL PASSED' : '  THRESHOLDS: FAILED'
    );
    if (tier) {
      lines.push(`  Tier: ${tier}`);
    }
    lines.push(
      `  P95 max: ${thresholds.p95MaxMs}ms | Min success: ${thresholds.minSuccessRate}% | Min throughput: ${thresholds.minThroughput} req/s`
    );
    lines.push('='.repeat(70));

    if (!check.passed) {
      lines.push('');
      lines.push('  Violations:');
      for (const v of check.violations) {
        lines.push(
          `    ${v.scenario}: ${v.metric} = ${v.actual.toFixed(1)} (threshold: ${v.threshold})`
        );
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format results as JSON for machine consumption.
 */
export function formatJson(
  results: LoadTestResults,
  config?: AppLoadTestConfig,
  tier?: string
): string {
  const output: Record<string, unknown> = {
    ...results,
    thresholds: undefined as ThresholdResult | undefined
  };

  if (config) {
    const thresholds = resolveThresholds(config.thresholds, tier);
    output.thresholds = checkThresholds(results, thresholds);
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Check all scenarios against the given thresholds.
 */
export function checkThresholds(
  results: LoadTestResults,
  thresholds: Omit<ThresholdConfig, 'tiers'>
): ThresholdResult {
  const violations: ThresholdViolation[] = [];

  for (const scenario of results.scenarios) {
    const label = `${scenario.label} @${scenario.concurrency}`;

    if (scenario.p95 > thresholds.p95MaxMs) {
      violations.push({
        scenario: label,
        metric: 'p95',
        actual: scenario.p95,
        threshold: thresholds.p95MaxMs
      });
    }

    if (scenario.successRate < thresholds.minSuccessRate) {
      violations.push({
        scenario: label,
        metric: 'successRate',
        actual: scenario.successRate,
        threshold: thresholds.minSuccessRate
      });
    }

    if (scenario.throughput < thresholds.minThroughput) {
      violations.push({
        scenario: label,
        metric: 'throughput',
        actual: scenario.throughput,
        threshold: thresholds.minThroughput
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Resolve the effective thresholds for a given tier.
 */
function resolveThresholds(
  config: ThresholdConfig,
  tier?: string
): Omit<ThresholdConfig, 'tiers'> {
  if (tier && config.tiers?.[tier]) {
    return config.tiers[tier];
  }

  return {
    p95MaxMs: config.p95MaxMs,
    minSuccessRate: config.minSuccessRate,
    minThroughput: config.minThroughput
  };
}
