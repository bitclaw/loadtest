/**
 * Default thresholds per Hetzner VPS tier.
 *
 * These are application-level targets (full HTTP stack), not raw
 * SQLite pool benchmarks. Expect lower throughput than pool.exec().
 */
export const HETZNER_TIERS = {
    CPX11: { vcpu: 2, ram: 2048, monthly: 4.15 },
    CPX21: { vcpu: 3, ram: 4096, monthly: 7.49 },
    CPX31: { vcpu: 4, ram: 8192, monthly: 15.49 },
    CPX41: { vcpu: 8, ram: 16384, monthly: 30.99 }
};
export const DEFAULT_THRESHOLDS = {
    /** Default (no tier specified) */
    default: {
        p95MaxMs: 500,
        minSuccessRate: 95,
        minThroughput: 50
    },
    /** Per-tier overrides */
    tiers: {
        CPX11: {
            p95MaxMs: 800,
            minSuccessRate: 90,
            minThroughput: 30
        },
        CPX21: {
            p95MaxMs: 500,
            minSuccessRate: 95,
            minThroughput: 50
        },
        CPX31: {
            p95MaxMs: 300,
            minSuccessRate: 98,
            minThroughput: 100
        },
        CPX41: {
            p95MaxMs: 200,
            minSuccessRate: 99,
            minThroughput: 200
        }
    }
};
export const DEFAULT_MODES = {
    quick: {
        concurrencyLevels: [1, 10],
        durationSec: 5,
        warmupRequests: 3,
        repeat: 1
    },
    full: {
        concurrencyLevels: [10, 50, 100],
        durationSec: 10,
        warmupRequests: 5,
        repeat: 3
    },
    stress: {
        concurrencyLevels: [50, 100, 200, 500],
        durationSec: 15,
        warmupRequests: 10,
        repeat: 3
    }
};
