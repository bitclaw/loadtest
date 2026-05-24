import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test
} from 'bun:test';
import {
  SAMPLE_CONFIG_PUBLIC_ONLY,
  SAMPLE_CONFIG_WITH_AUTH
} from '../__fixtures__/configs';
import { PASSING_RESULTS, PASSING_SCENARIO } from '../__fixtures__/results';
import type { AppLoadTestConfig } from '../types';

const mockRunLoadTest = mock((..._args: unknown[]) =>
  Promise.resolve({
    ...PASSING_RESULTS,
    scenarios: [PASSING_SCENARIO]
  })
);

// Load the real module first so we can spread all its exports into the mock.
// This prevents a bun bug where mock.module() leaks across test workers on
// low-core CI machines, causing other files (formatter.ts) to miss exports
// like formatResults.
const realLoadTestUtils = await import('@bitclaw/sqlite/load-test-utils');

mock.module('@bitclaw/sqlite/load-test-utils', () => ({
  ...realLoadTestUtils,
  runLoadTest: mockRunLoadTest
}));

// Re-import after mocking
const { runAppLoadTest } = await import('./bun-runner');

const originalFetch = globalThis.fetch;
let consoleSpy: ReturnType<typeof spyOn>;

/** Create a minimal mock Response with only the properties used by the runner. */
function createMockResponse(overrides: {
  ok?: boolean;
  status?: number;
  cookies?: string[];
  text?: string;
}): Response {
  const { ok = true, status = 200, cookies = [], text = '' } = overrides;
  const headers = new Headers();
  // getSetCookie is a standard Headers method in bun
  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie);
  }
  const response = new Response(text, { status, headers });
  // Override ok for non-standard status codes in tests
  if (ok !== (status >= 200 && status < 300)) {
    Object.defineProperty(response, 'ok', { value: ok });
  }
  return response;
}

beforeEach(() => {
  mockRunLoadTest.mockClear();
  consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  consoleSpy.mockRestore();
  delete process.env.LOADTEST_EMAIL;
  delete process.env.LOADTEST_PASSWORD;
});

function mockVerifyFetch(): void {
  globalThis.fetch = mock(() =>
    Promise.resolve(createMockResponse({}))
  ) as unknown as typeof fetch;
}

function mockFetchWithAuth(): void {
  let callCount = 0;
  globalThis.fetch = mock(() => {
    callCount++;
    if (callCount === 1) {
      // verifyApp
      return Promise.resolve(createMockResponse({}));
    }
    // authenticateSession
    return Promise.resolve(
      createMockResponse({
        cookies: ['runmist_session=pool_session; Path=/']
      })
    );
  }) as unknown as typeof fetch;
}

describe('runAppLoadTest', () => {
  test('given public-only config, when running, then calls runLoadTest with public endpoints', async () => {
    mockVerifyFetch();

    const results = await runAppLoadTest(SAMPLE_CONFIG_PUBLIC_ONLY, 'quick');

    expect(mockRunLoadTest).toHaveBeenCalledTimes(1);
    const config = mockRunLoadTest.mock.calls[0]![0] as {
      endpoints: { path: string }[];
    };
    expect(config.endpoints.map(e => e.path)).toEqual(['/', '/blog', '/docs']);
    expect(results.scenarios).toHaveLength(1);
  });

  test('given auth config and authenticated endpoints, when running, then creates session pool', async () => {
    mockFetchWithAuth();
    process.env.LOADTEST_EMAIL = 'admin@test.local';
    process.env.LOADTEST_PASSWORD = 'secret123';

    await runAppLoadTest(SAMPLE_CONFIG_WITH_AUTH, 'quick');

    // Called twice: once for public, once for authenticated
    expect(mockRunLoadTest).toHaveBeenCalledTimes(2);
  });

  test('given publicOnly option, when running with auth config, then skips session pool and authenticated endpoints', async () => {
    mockVerifyFetch();

    await runAppLoadTest(SAMPLE_CONFIG_WITH_AUTH, 'quick', {
      publicOnly: true
    });

    // Only called once for public endpoints
    expect(mockRunLoadTest).toHaveBeenCalledTimes(1);

    // Verify no auth fetch calls (only 1 fetch for verifyApp)
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock>;
    expect(fetchMock.mock.calls).toHaveLength(1);
  });

  test('given auth config, when running authenticated endpoints, then injects Cookie header', async () => {
    mockFetchWithAuth();
    process.env.LOADTEST_EMAIL = 'admin@test.local';
    process.env.LOADTEST_PASSWORD = 'secret123';

    await runAppLoadTest(SAMPLE_CONFIG_WITH_AUTH, 'quick');

    // Second call is for authenticated endpoints
    const authedConfig = mockRunLoadTest.mock.calls[1]![0] as {
      endpoints: { headers?: Record<string, string> }[];
    };
    for (const ep of authedConfig.endpoints) {
      expect(ep.headers?.Cookie).toBe('runmist_session=pool_session');
    }
  });

  test('given no auth but authenticated endpoints, when running, then logs skip message', async () => {
    mockVerifyFetch();
    const configNoAuth: AppLoadTestConfig = {
      ...SAMPLE_CONFIG_WITH_AUTH,
      auth: undefined
    };

    const warnMessages: string[] = [];
    const warnSpy = spyOn(console, 'warn').mockImplementation(
      (...args: unknown[]) => {
        warnMessages.push(args.join(' '));
      }
    );

    await runAppLoadTest(configNoAuth, 'quick');

    const skipMsg = warnMessages.find(m => m.includes('Skipping'));
    expect(skipMsg).toBeDefined();
    expect(skipMsg).toContain('no auth config');
    warnSpy.mockRestore();
  });

  test('given quick mode, when running, then uses quick mode concurrency and duration', async () => {
    mockVerifyFetch();

    await runAppLoadTest(SAMPLE_CONFIG_PUBLIC_ONLY, 'quick');

    const config = mockRunLoadTest.mock.calls[0]![0] as {
      concurrencyLevels: number[];
      durationSec: number;
    };
    expect(config.concurrencyLevels).toEqual([1, 10]);
    expect(config.durationSec).toBe(5);
  });

  test('given baseUrl override, when running, then passes override to runLoadTest', async () => {
    mockVerifyFetch();

    await runAppLoadTest(SAMPLE_CONFIG_PUBLIC_ONLY, 'quick', {
      baseUrl: 'http://custom:9999'
    });

    const config = mockRunLoadTest.mock.calls[0]![0] as { baseUrl: string };
    expect(config.baseUrl).toBe('http://custom:9999');
  });

  test('given app is unreachable, when running, then throws Cannot reach error', async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error('Connection refused'))
    ) as unknown as typeof fetch;

    await expect(
      runAppLoadTest(SAMPLE_CONFIG_PUBLIC_ONLY, 'quick')
    ).rejects.toThrow('Cannot reach');
  });

  test('given app returns 500, when running, then throws with status code', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        createMockResponse({
          ok: false,
          status: 500,
          text: 'Internal Server Error'
        })
      )
    ) as unknown as typeof fetch;

    await expect(
      runAppLoadTest(SAMPLE_CONFIG_PUBLIC_ONLY, 'quick')
    ).rejects.toThrow('500');
  });

  test('given multiple sessions, when running auth endpoints, then round-robins cookies', async () => {
    // Configure a mode with high concurrency to trigger pool size > 1
    const highConcurrencyConfig: AppLoadTestConfig = {
      ...SAMPLE_CONFIG_WITH_AUTH,
      modes: {
        ...SAMPLE_CONFIG_WITH_AUTH.modes,
        quick: {
          concurrencyLevels: [1, 50],
          durationSec: 5,
          warmupRequests: 3
        }
      },
      authenticatedEndpoints: [
        { path: '/a', label: 'A' },
        { path: '/b', label: 'B' },
        { path: '/c', label: 'C' }
      ]
    };

    let sessionCount = 0;
    let callCount = 0;
    globalThis.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(createMockResponse({}));
      }
      sessionCount++;
      return Promise.resolve(
        createMockResponse({
          cookies: [`runmist_session=session_${sessionCount}; Path=/`]
        })
      );
    }) as unknown as typeof fetch;

    process.env.LOADTEST_EMAIL = 'admin@test.local';
    process.env.LOADTEST_PASSWORD = 'secret123';

    await runAppLoadTest(highConcurrencyConfig, 'quick');

    // Check that authenticated endpoints got different cookies via round-robin
    const authedConfig = mockRunLoadTest.mock.calls[1]![0] as {
      endpoints: { path: string; headers?: Record<string, string> }[];
    };
    expect(authedConfig.endpoints).toHaveLength(3);
    // Endpoints should have cookies assigned via modulo
    for (const ep of authedConfig.endpoints) {
      expect(ep.headers?.Cookie).toMatch(/^runmist_session=session_\d+$/);
    }
  });
});
