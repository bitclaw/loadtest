/**
 * Default thresholds per Hetzner VPS tier.
 *
 * These are application-level targets (full HTTP stack), not raw
 * SQLite pool benchmarks. Expect lower throughput than pool.exec().
 */
export declare const HETZNER_TIERS: {
    readonly CPX11: {
        readonly vcpu: 2;
        readonly ram: 2048;
        readonly monthly: 4.15;
    };
    readonly CPX21: {
        readonly vcpu: 3;
        readonly ram: 4096;
        readonly monthly: 7.49;
    };
    readonly CPX31: {
        readonly vcpu: 4;
        readonly ram: 8192;
        readonly monthly: 15.49;
    };
    readonly CPX41: {
        readonly vcpu: 8;
        readonly ram: 16384;
        readonly monthly: 30.99;
    };
};
export declare const DEFAULT_THRESHOLDS: {
    /** Default (no tier specified) */
    readonly default: {
        readonly p95MaxMs: 500;
        readonly minSuccessRate: 95;
        readonly minThroughput: 50;
    };
    /** Per-tier overrides */
    readonly tiers: {
        readonly CPX11: {
            readonly p95MaxMs: 800;
            readonly minSuccessRate: 90;
            readonly minThroughput: 30;
        };
        readonly CPX21: {
            readonly p95MaxMs: 500;
            readonly minSuccessRate: 95;
            readonly minThroughput: 50;
        };
        readonly CPX31: {
            readonly p95MaxMs: 300;
            readonly minSuccessRate: 98;
            readonly minThroughput: 100;
        };
        readonly CPX41: {
            readonly p95MaxMs: 200;
            readonly minSuccessRate: 99;
            readonly minThroughput: 200;
        };
    };
};
export declare const DEFAULT_MODES: {
    readonly quick: {
        readonly concurrencyLevels: readonly [1, 10];
        readonly durationSec: 5;
        readonly warmupRequests: 3;
    };
    readonly full: {
        readonly concurrencyLevels: readonly [10, 50, 100];
        readonly durationSec: 10;
        readonly warmupRequests: 5;
    };
    readonly stress: {
        readonly concurrencyLevels: readonly [50, 100, 200, 500];
        readonly durationSec: 15;
        readonly warmupRequests: 10;
    };
};
//# sourceMappingURL=defaults.d.ts.map