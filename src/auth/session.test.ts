import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { SAMPLE_AUTH_CONFIG } from '../__fixtures__/configs';
import { authenticateSession, createSessionPool } from './session';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.LOADTEST_EMAIL;
  delete process.env.LOADTEST_PASSWORD;
});

function mockFetch(status: number, cookies: string[] = [], body = ''): void {
  globalThis.fetch = mock(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      headers: {
        getSetCookie: () => cookies
      },
      text: () => Promise.resolve(body)
    } as unknown as Response)
  ) as unknown as typeof fetch;
}

function setCredentials(): void {
  process.env.LOADTEST_EMAIL = 'admin@test.local';
  process.env.LOADTEST_PASSWORD = 'secret123';
}

describe('authenticateSession', () => {
  test('given valid credentials, when authenticating, then returns cookies and authenticated true', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=abc123; Path=/; HttpOnly']);

    const result = await authenticateSession(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG
    );

    expect(result.cookies).toBe('runmist_session=abc123');
    expect(result.authenticated).toBe(true);
  });

  test('given valid credentials, when authenticating, then sends POST with correct URL, body, and Content-Type', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=abc123']);

    await authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG);

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/api/loadtest/auth');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body as string)).toEqual({
      email: 'admin@test.local',
      password: 'secret123'
    });
  });

  test('given missing email env var, when authenticating, then throws with env var names', async () => {
    process.env.LOADTEST_PASSWORD = 'secret123';

    await expect(
      authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG)
    ).rejects.toThrow('LOADTEST_EMAIL');
  });

  test('given missing password env var, when authenticating, then throws with env var names', async () => {
    process.env.LOADTEST_EMAIL = 'admin@test.local';

    await expect(
      authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG)
    ).rejects.toThrow('LOADTEST_PASSWORD');
  });

  test('given server returns 401, when authenticating, then throws with status and hint', async () => {
    setCredentials();
    mockFetch(401, [], 'Unauthorized');

    await expect(
      authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG)
    ).rejects.toThrow(/401/);
  });

  test('given server returns 500, when authenticating, then throws with status', async () => {
    setCredentials();
    mockFetch(500, [], 'Internal Server Error');

    await expect(
      authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG)
    ).rejects.toThrow(/500/);
  });

  test('given response without session cookie, when authenticating, then throws with cookie name', async () => {
    setCredentials();
    mockFetch(200, ['other_cookie=value']);

    await expect(
      authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG)
    ).rejects.toThrow('runmist_session');
  });

  test('given multiple cookies, when authenticating, then extracts correct one', async () => {
    setCredentials();
    mockFetch(200, [
      'csrf_token=xyz; Path=/',
      'runmist_session=correct_value; Path=/; HttpOnly',
      'tracking=abc'
    ]);

    const result = await authenticateSession(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG
    );

    expect(result.cookies).toBe('runmist_session=correct_value');
  });

  test('given cookie with attributes, when authenticating, then strips to name=value', async () => {
    setCredentials();
    mockFetch(200, [
      'runmist_session=myvalue; Path=/; HttpOnly; Secure; SameSite=Lax'
    ]);

    const result = await authenticateSession(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG
    );

    expect(result.cookies).toBe('runmist_session=myvalue');
  });

  test('given custom login endpoint, when authenticating, then uses correct URL', async () => {
    setCredentials();
    mockFetch(200, ['custom_session=value']);

    const customAuth = {
      ...SAMPLE_AUTH_CONFIG,
      loginEndpoint: '/custom/auth/endpoint',
      sessionCookieName: 'custom_session'
    };

    await authenticateSession('http://localhost:3001', customAuth);

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock>;
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3001/custom/auth/endpoint');
  });

  test('given valid credentials, when authenticating, then passes redirect manual to fetch', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=abc123']);

    await authenticateSession('http://localhost:3001', SAMPLE_AUTH_CONFIG);

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof mock>;
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.redirect).toBe('manual');
  });
});

describe('createSessionPool', () => {
  test('given count of 3, when creating pool, then returns 3 sessions', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=session_val']);

    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const sessions = await createSessionPool(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG,
      3
    );
    consoleSpy.mockRestore();

    expect(sessions).toHaveLength(3);
    expect(sessions.every(s => s.authenticated)).toBe(true);
  });

  test('given count of 0, when creating pool, then returns 1 session', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=session_val']);

    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const sessions = await createSessionPool(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG,
      0
    );
    consoleSpy.mockRestore();

    expect(sessions).toHaveLength(1);
  });

  test('given auth failure mid-pool, when creating pool, then throws', async () => {
    setCredentials();
    let callCount = 0;
    globalThis.fetch = mock((..._args: unknown[]) => {
      callCount++;
      if (callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: { getSetCookie: () => [] },
          text: () => Promise.resolve('Server Error')
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: {
          getSetCookie: () => ['runmist_session=val']
        },
        text: () => Promise.resolve('')
      } as unknown as Response);
    }) as unknown as typeof fetch;

    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    await expect(
      createSessionPool('http://localhost:3001', SAMPLE_AUTH_CONFIG, 3)
    ).rejects.toThrow(/500/);
    consoleSpy.mockRestore();
  });

  test('given successful pool creation, when checking sessions, then each has authenticated true', async () => {
    setCredentials();
    mockFetch(200, ['runmist_session=session_val']);

    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
    const sessions = await createSessionPool(
      'http://localhost:3001',
      SAMPLE_AUTH_CONFIG,
      2
    );
    consoleSpy.mockRestore();

    for (const session of sessions) {
      expect(session.authenticated).toBe(true);
    }
  });
});
