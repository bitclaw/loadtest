# @bitclaw/loadtest

Load testing CLI for sqlite-saas apps. Supports both Bun-native and k6 test engines.

## Quick Start

```bash
# From repo root
bun run loadtest:bun --app runmist          # Quick Bun-native test
bun run loadtest:k6 --app runmist           # Full k6 test

# From package directory
cd packages/loadtest
bun src/cli.ts run --app runmist --mode quick
bun src/cli.ts report --app runmist
```

## CLI Usage

```bash
loadtest run [options]     # Run load tests
loadtest report [options]  # Generate report from results
```

### Run Options

| Flag | Default | Description |
|------|---------|-------------|
| `--app <name>` | required | App to test (matches `apps/{name}/`) |
| `--mode <mode>` | `quick` | Test mode: `quick`, `full`, or `stress` |
| `--engine <engine>` | `bun` | Engine: `bun` (native) or `k6` |
| `--production` | `false` | Test against production URL |
| `--public-only` | `false` | Skip authenticated endpoints |
| `--json` | `false` | Output results as JSON |
| `--tier <tier>` | — | Hetzner tier for threshold overrides |

## Per-App Configuration

Each app defines a `loadtest.config.ts` in its directory:

```typescript
// apps/runmist/loadtest.config.ts
import type { AppLoadTestConfig } from '@bitclaw/loadtest'

export default {
  appName: 'runmist',
  baseUrl: 'http://localhost:3001',
  productionUrl: 'https://runmist.com',

  auth: {
    loginEndpoint: '/api/loadtest/auth',
    emailEnvVar: 'LOADTEST_EMAIL',
    passwordEnvVar: 'LOADTEST_PASSWORD',
    sessionCookieName: 'runmist_session',
  },

  publicEndpoints: [
    { path: '/', method: 'GET' },
    { path: '/api/health', method: 'GET' },
  ],

  authenticatedEndpoints: [
    { path: '/dashboard', method: 'GET' },
    { path: '/servers', method: 'GET' },
  ],

  modes: {
    quick: { concurrencyLevels: [1, 5], durationSec: 5, warmupRequests: 10 },
    full: { concurrencyLevels: [1, 5, 10, 25], durationSec: 15, warmupRequests: 50 },
    stress: { concurrencyLevels: [1, 10, 25, 50, 100], durationSec: 30, warmupRequests: 100 },
  },

  thresholds: {
    p95MaxMs: 50,
    minSuccessRate: 99.5,
    minThroughput: 100,
    tiers: {
      cpx21: { p95MaxMs: 50, minSuccessRate: 99.5, minThroughput: 100 },
      cpx31: { p95MaxMs: 30, minSuccessRate: 99.9, minThroughput: 200 },
    },
  },
} satisfies AppLoadTestConfig
```

## Engines

### Bun-Native (`--engine bun`)

Uses Bun's built-in HTTP client for fast, zero-dependency load testing. Best for quick local validation.

### k6 (`--engine k6`)

Uses [k6](https://k6.io/) for production-grade load testing with detailed metrics. Requires k6 to be installed. k6 scripts are in `k6/` directory (e.g., `k6/runmist.js`).

## Thresholds

Tests can define pass/fail thresholds:

- **p95MaxMs** — Maximum acceptable P95 latency
- **minSuccessRate** — Minimum success rate (0-100%)
- **minThroughput** — Minimum req/s at lowest concurrency

Hetzner tier overrides let you set different thresholds per server type.

## Testing

```bash
cd packages/loadtest
bun test
```

6 test files covering config loading, runners, auth, and report formatting.
