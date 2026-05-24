/**
 * Enhanced Bun-native load test runner.
 *
 * Wraps the existing runLoadTest() from load-test-utils.ts and adds
 * authentication support, per-app config, and threshold checking.
 */

import {
  type EndpointConfig,
  type LoadTestConfig,
  type LoadTestResults,
  runLoadTest
} from '@bitclaw/sqlite/load-test-utils';
import { createSessionPool } from '../auth/session';
import type { AppLoadTestConfig, TestMode } from '../types';

/**
 * Run a full load test for an app using the Bun-native runner.
 *
 * 1. Tests public endpoints (no auth)
 * 2. Authenticates session pool (if auth configured)
 * 3. Tests authenticated endpoints with session cookies
 * 4. Merges results
 */
export async function runAppLoadTest(
  config: AppLoadTestConfig,
  mode: TestMode,
  options: { publicOnly?: boolean; baseUrl?: string } = {}
): Promise<LoadTestResults> {
  const modeConfig = config.modes[mode];
  const baseUrl = options.baseUrl ?? config.baseUrl;

  // Verify the app is reachable
  await verifyApp(baseUrl, config);

  const directUrl = config.directUrl;
  const allScenarios: LoadTestResults['scenarios'] = [];
  let startedAt = new Date().toISOString();

  // 1. Public endpoints (CDN/main URL)
  if (config.publicEndpoints.length > 0) {
    const publicConfig: LoadTestConfig = {
      baseUrl,
      endpoints: config.publicEndpoints,
      concurrencyLevels: [...modeConfig.concurrencyLevels],
      durationSec: modeConfig.durationSec,
      warmupRequests: modeConfig.warmupRequests
    };

    const publicResults = await runLoadTest(publicConfig);
    startedAt = publicResults.startedAt;

    if (directUrl) {
      for (const s of publicResults.scenarios) {
        s.via = 'cdn';
        s.label = `${s.label} (CDN)`;
      }
    }
    allScenarios.push(...publicResults.scenarios);
  }

  // 2. Direct origin pass — run public endpoints against directUrl and interleave
  if (directUrl && config.publicEndpoints.length > 0) {
    await verifyApp(directUrl, config);

    const directConfig: LoadTestConfig = {
      baseUrl: directUrl,
      endpoints: config.publicEndpoints,
      concurrencyLevels: [...modeConfig.concurrencyLevels],
      durationSec: modeConfig.durationSec,
      warmupRequests: modeConfig.warmupRequests
    };

    const directResults = await runLoadTest(directConfig);
    for (const s of directResults.scenarios) {
      s.via = 'direct';
      s.label = `${s.label} (Direct)`;
    }

    // Interleave CDN and Direct: CDN@50, Direct@50, CDN@100, Direct@100...
    const cdnScenarios = allScenarios.splice(0);
    const directScenarios = directResults.scenarios;
    for (let i = 0; i < cdnScenarios.length; i++) {
      allScenarios.push(cdnScenarios[i]!);
      if (i < directScenarios.length) {
        allScenarios.push(directScenarios[i]!);
      }
    }
    if (directScenarios.length > cdnScenarios.length) {
      allScenarios.push(...directScenarios.slice(cdnScenarios.length));
    }
  }

  // 2. Authenticated endpoints
  if (
    !options.publicOnly &&
    config.auth &&
    config.authenticatedEndpoints.length > 0
  ) {
    const email =
      config.auth.credentials?.email ?? process.env[config.auth.emailEnvVar];
    const password =
      config.auth.credentials?.password ??
      process.env[config.auth.passwordEnvVar];

    if (!email || !password) {
      console.warn(
        `Skipping ${config.authenticatedEndpoints.length} authenticated endpoint(s) — no credentials provided. ` +
          `Set ${config.auth.emailEnvVar} and ${config.auth.passwordEnvVar} to include them.`
      );
    } else {
      // Determine session pool size (1 per 20 max concurrent workers)
      const maxConcurrency = Math.max(...modeConfig.concurrencyLevels);
      const poolSize = Math.max(1, Math.ceil(maxConcurrency / 20));

      const sessions = await createSessionPool(baseUrl, config.auth, poolSize);

      // Inject Cookie header into each authenticated endpoint
      // Round-robin across session pool
      const authedEndpoints: EndpointConfig[] =
        config.authenticatedEndpoints.map((ep, i) => ({
          ...ep,
          headers: {
            ...ep.headers,
            Cookie: sessions[i % sessions.length]!.cookies
          }
        }));

      const authedConfig: LoadTestConfig = {
        baseUrl,
        endpoints: authedEndpoints,
        concurrencyLevels: [...modeConfig.concurrencyLevels],
        durationSec: modeConfig.durationSec,
        warmupRequests: modeConfig.warmupRequests
      };

      const authedResults = await runLoadTest(authedConfig);
      allScenarios.push(...authedResults.scenarios);
    }
  } else if (
    !options.publicOnly &&
    config.authenticatedEndpoints.length > 0 &&
    !config.auth
  ) {
    console.warn(
      `Skipping ${config.authenticatedEndpoints.length} authenticated endpoint(s) — no auth config provided`
    );
  }

  return {
    baseUrl,
    startedAt,
    completedAt: new Date().toISOString(),
    scenarios: allScenarios
  };
}

async function verifyApp(
  baseUrl: string,
  config: AppLoadTestConfig
): Promise<void> {
  const checkPath =
    config.publicEndpoints[0]?.path ??
    config.authenticatedEndpoints[0]?.path ??
    '/';

  try {
    const response = await fetch(`${baseUrl}${checkPath}`, {
      signal: AbortSignal.timeout(5000),
      redirect: 'manual'
    });

    if (response.status >= 500) {
      throw new Error(
        `App returned ${response.status} at ${baseUrl}${checkPath}`
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('App returned')) {
      throw error;
    }
    throw new Error(
      `Cannot reach ${baseUrl}\n` +
        `Make sure ${config.appName} is running (e.g., bun run dev)`
    );
  }
}
