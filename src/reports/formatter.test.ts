import { describe, expect, test } from 'bun:test';
import { SAMPLE_CONFIG_WITH_AUTH } from '../__fixtures__/configs';
import {
  EMPTY_RESULTS,
  FAILING_P95_SCENARIO,
  FAILING_RESULTS,
  FAILING_SUCCESS_RATE_SCENARIO,
  FAILING_THROUGHPUT_SCENARIO,
  MULTI_VIOLATION_SCENARIO,
  PASSING_RESULTS,
  PASSING_SCENARIO
} from '../__fixtures__/results';
import type { LoadTestResults } from '../types';
import { checkThresholds, formatJson, formatReport } from './formatter';

const DEFAULT_THRESHOLDS = {
  p95MaxMs: 500,
  minSuccessRate: 95,
  minThroughput: 50
};

describe('checkThresholds', () => {
  test('given all passing scenarios, when checking thresholds, then returns passed with no violations', () => {
    const result = checkThresholds(PASSING_RESULTS, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('given p95 exceeding threshold, when checking thresholds, then returns p95 violation', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [FAILING_P95_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.metric).toBe('p95');
    expect(result.violations[0]!.actual).toBe(900);
    expect(result.violations[0]!.threshold).toBe(500);
  });

  test('given success rate below threshold, when checking thresholds, then returns successRate violation', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [FAILING_SUCCESS_RATE_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.metric).toBe('successRate');
    expect(result.violations[0]!.actual).toBe(85);
    expect(result.violations[0]!.threshold).toBe(95);
  });

  test('given throughput below threshold, when checking thresholds, then returns throughput violation', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [FAILING_THROUGHPUT_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.metric).toBe('throughput');
    expect(result.violations[0]!.actual).toBe(20);
    expect(result.violations[0]!.threshold).toBe(50);
  });

  test('given all three metrics failing, when checking thresholds, then returns 3 violations', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [MULTI_VIOLATION_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(3);
    const metrics = result.violations.map(v => v.metric).sort();
    expect(metrics).toEqual(['p95', 'successRate', 'throughput']);
  });

  test('given mixed passing and failing scenarios, when checking thresholds, then violations only for failing', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [PASSING_SCENARIO, FAILING_P95_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.scenario).toContain('Slow endpoint');
  });

  test('given empty scenarios, when checking thresholds, then returns passed', () => {
    const result = checkThresholds(EMPTY_RESULTS, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test('given p95 exactly at threshold, when checking thresholds, then passes', () => {
    const scenario = { ...PASSING_SCENARIO, p95: 500 };
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [scenario]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(true);
  });

  test('given success rate exactly at threshold, when checking thresholds, then passes', () => {
    const scenario = { ...PASSING_SCENARIO, successRate: 95 };
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [scenario]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(true);
  });

  test('given throughput exactly at threshold, when checking thresholds, then passes', () => {
    const scenario = { ...PASSING_SCENARIO, throughput: 50 };
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [scenario]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(true);
  });

  test('given p95 one unit above threshold, when checking thresholds, then fails', () => {
    const scenario = { ...PASSING_SCENARIO, p95: 501 };
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [scenario]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]!.metric).toBe('p95');
  });

  test('given a violation, when checking thresholds, then label includes @concurrency', () => {
    const results: LoadTestResults = {
      ...PASSING_RESULTS,
      scenarios: [FAILING_P95_SCENARIO]
    };
    const result = checkThresholds(results, DEFAULT_THRESHOLDS);

    expect(result.violations[0]!.scenario).toBe(
      `${FAILING_P95_SCENARIO.label} @${FAILING_P95_SCENARIO.concurrency}`
    );
  });
});

describe('formatReport', () => {
  test('given results without config, when formatting, then returns table without thresholds section', () => {
    const report = formatReport(PASSING_RESULTS);

    expect(report).toContain('LOAD TEST RESULTS');
    expect(report).not.toContain('THRESHOLDS');
  });

  test('given passing thresholds, when formatting, then contains ALL PASSED', () => {
    const report = formatReport(PASSING_RESULTS, SAMPLE_CONFIG_WITH_AUTH);

    expect(report).toContain('ALL PASSED');
  });

  test('given failing thresholds, when formatting, then contains FAILED and Violations', () => {
    const report = formatReport(FAILING_RESULTS, SAMPLE_CONFIG_WITH_AUTH);

    expect(report).toContain('FAILED');
    expect(report).toContain('Violations:');
  });

  test('given a tier, when formatting, then shows tier name', () => {
    const report = formatReport(
      PASSING_RESULTS,
      SAMPLE_CONFIG_WITH_AUTH,
      'CPX11'
    );

    expect(report).toContain('Tier: CPX11');
  });

  test('given tier with custom thresholds, when formatting, then uses tier-specific values', () => {
    const report = formatReport(
      PASSING_RESULTS,
      SAMPLE_CONFIG_WITH_AUTH,
      'CPX11'
    );

    // CPX11 has p95MaxMs: 800
    expect(report).toContain('800ms');
  });
});

describe('formatJson', () => {
  test('given results without config, when formatting json, then has no thresholds key', () => {
    const json = JSON.parse(formatJson(PASSING_RESULTS));

    expect(json.thresholds).toBeUndefined();
  });

  test('given results with config, when formatting json, then includes thresholds.passed and violations', () => {
    const json = JSON.parse(
      formatJson(PASSING_RESULTS, SAMPLE_CONFIG_WITH_AUTH)
    );

    expect(json.thresholds).toBeDefined();
    expect(json.thresholds.passed).toBe(true);
    expect(json.thresholds.violations).toEqual([]);
  });

  test('given tier, when formatting json, then uses tier thresholds in evaluation', () => {
    // FAILING_P95_SCENARIO has p95=900, CPX11 allows 800, so still fails
    const json = JSON.parse(
      formatJson(FAILING_RESULTS, SAMPLE_CONFIG_WITH_AUTH, 'CPX11')
    );

    expect(json.thresholds.passed).toBe(false);
  });

  test('given results, when formatting json, then preserves scenario data', () => {
    const json = JSON.parse(formatJson(PASSING_RESULTS));

    expect(json.scenarios).toHaveLength(1);
    expect(json.scenarios[0].endpoint).toBe('/dashboard');
    expect(json.baseUrl).toBe('http://localhost:3001');
  });
});
