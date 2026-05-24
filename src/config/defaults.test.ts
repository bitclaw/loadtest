import { describe, expect, test } from 'bun:test';
import { DEFAULT_MODES, DEFAULT_THRESHOLDS, HETZNER_TIERS } from './defaults';

describe('HETZNER_TIERS', () => {
  test('given tier constants, when checking keys, then contains all four tiers', () => {
    const keys = Object.keys(HETZNER_TIERS);

    expect(keys).toContain('CPX11');
    expect(keys).toContain('CPX21');
    expect(keys).toContain('CPX31');
    expect(keys).toContain('CPX41');
    expect(keys).toHaveLength(4);
  });

  test('given CPX11, when checking specs, then has correct values', () => {
    expect(HETZNER_TIERS.CPX11.vcpu).toBe(2);
    expect(HETZNER_TIERS.CPX11.ram).toBe(2048);
    expect(HETZNER_TIERS.CPX11.monthly).toBe(4.15);
  });

  test('given CPX41, when checking specs, then has correct values', () => {
    expect(HETZNER_TIERS.CPX41.vcpu).toBe(8);
    expect(HETZNER_TIERS.CPX41.ram).toBe(16384);
    expect(HETZNER_TIERS.CPX41.monthly).toBe(30.99);
  });

  test('given all tiers, when checking values, then all have positive specs', () => {
    for (const [, tier] of Object.entries(HETZNER_TIERS)) {
      expect(tier.vcpu).toBeGreaterThan(0);
      expect(tier.ram).toBeGreaterThan(0);
      expect(tier.monthly).toBeGreaterThan(0);
    }
  });

  test('given tiers in ascending order, when comparing RAM, then each tier has more RAM', () => {
    expect(HETZNER_TIERS.CPX21.ram).toBeGreaterThan(HETZNER_TIERS.CPX11.ram);
    expect(HETZNER_TIERS.CPX31.ram).toBeGreaterThan(HETZNER_TIERS.CPX21.ram);
    expect(HETZNER_TIERS.CPX41.ram).toBeGreaterThan(HETZNER_TIERS.CPX31.ram);
  });
});

describe('DEFAULT_THRESHOLDS', () => {
  test('given default thresholds, when checking keys, then has all three metric keys', () => {
    expect(DEFAULT_THRESHOLDS.default.p95MaxMs).toBeDefined();
    expect(DEFAULT_THRESHOLDS.default.minSuccessRate).toBeDefined();
    expect(DEFAULT_THRESHOLDS.default.minThroughput).toBeDefined();
  });

  test('given tier thresholds, when checking keys, then matches HETZNER_TIERS keys', () => {
    const tierKeys = Object.keys(DEFAULT_THRESHOLDS.tiers);
    const hetznerKeys = Object.keys(HETZNER_TIERS);

    expect(tierKeys).toEqual(hetznerKeys);
  });

  test('given CPX41 vs CPX11, when comparing thresholds, then CPX41 is stricter', () => {
    const cpx11 = DEFAULT_THRESHOLDS.tiers.CPX11;
    const cpx41 = DEFAULT_THRESHOLDS.tiers.CPX41;

    // Stricter means lower p95, higher success rate, higher throughput
    expect(cpx41.p95MaxMs).toBeLessThan(cpx11.p95MaxMs);
    expect(cpx41.minSuccessRate).toBeGreaterThan(cpx11.minSuccessRate);
    expect(cpx41.minThroughput).toBeGreaterThan(cpx11.minThroughput);
  });

  test('given each tier, when checking fields, then all have three metric keys', () => {
    for (const [, tier] of Object.entries(DEFAULT_THRESHOLDS.tiers)) {
      expect(tier.p95MaxMs).toBeDefined();
      expect(tier.minSuccessRate).toBeDefined();
      expect(tier.minThroughput).toBeDefined();
    }
  });
});

describe('DEFAULT_MODES', () => {
  test('given mode constants, when checking keys, then has quick/full/stress', () => {
    expect(DEFAULT_MODES.quick).toBeDefined();
    expect(DEFAULT_MODES.full).toBeDefined();
    expect(DEFAULT_MODES.stress).toBeDefined();
  });

  test('given quick vs full, when comparing duration, then quick is shorter', () => {
    expect(DEFAULT_MODES.quick.durationSec).toBeLessThan(
      DEFAULT_MODES.full.durationSec
    );
  });

  test('given stress mode, when comparing concurrency, then has highest max concurrency', () => {
    const quickMax = Math.max(...DEFAULT_MODES.quick.concurrencyLevels);
    const fullMax = Math.max(...DEFAULT_MODES.full.concurrencyLevels);
    const stressMax = Math.max(...DEFAULT_MODES.stress.concurrencyLevels);

    expect(stressMax).toBeGreaterThan(fullMax);
    expect(fullMax).toBeGreaterThan(quickMax);
  });

  test('given each mode, when checking fields, then has required properties', () => {
    for (const [, mode] of Object.entries(DEFAULT_MODES)) {
      expect(mode.concurrencyLevels).toBeInstanceOf(Array);
      expect(mode.concurrencyLevels.length).toBeGreaterThan(0);
      expect(mode.durationSec).toBeGreaterThan(0);
      expect(mode.warmupRequests).toBeGreaterThan(0);
    }
  });

  test('given each mode, when checking concurrency levels, then sorted ascending', () => {
    for (const [, mode] of Object.entries(DEFAULT_MODES)) {
      const levels = [...mode.concurrencyLevels];
      const sorted = [...levels].sort((a, b) => a - b);
      expect(levels).toEqual(sorted);
    }
  });
});
