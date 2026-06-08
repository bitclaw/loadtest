/**
 * Load test authentication - obtains session cookies from the
 * dedicated /api/loadtest/auth endpoint.
 */

import type { AuthConfig, SessionState } from '../types';

/**
 * Authenticate against the dedicated loadtest auth endpoint.
 * Returns the raw Set-Cookie header value for injection into requests.
 */
export async function authenticateSession(
  baseUrl: string,
  auth: AuthConfig
): Promise<SessionState> {
  // Use direct credentials if provided, otherwise read from env vars
  const email = auth.credentials?.email ?? process.env[auth.emailEnvVar];
  const password =
    auth.credentials?.password ?? process.env[auth.passwordEnvVar];

  if (!email || !password) {
    throw new Error(
      `Missing credentials. Set ${auth.emailEnvVar} and ${auth.passwordEnvVar} env vars.\n` +
        `Example: ${auth.emailEnvVar}=admin@runmist.local ${auth.passwordEnvVar}=runmist123 bun run loadtest ...`
    );
  }

  const url = `${baseUrl}${auth.loginEndpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual'
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Auth failed (${response.status}): ${body}\n` +
        `Endpoint: ${url}\n` +
        `Make sure LOADTEST_AUTH_ENABLED=true is set in the app's env.`
    );
  }

  // Extract session cookie from Set-Cookie header
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const sessionCookie = setCookie.find(c =>
    c.startsWith(`${auth.sessionCookieName}=`)
  );

  if (!sessionCookie) {
    throw new Error(
      `No ${auth.sessionCookieName} cookie in response.\n` +
        `Set-Cookie headers: ${setCookie.join('; ')}`
    );
  }

  // Extract just the cookie name=value pair (strip attributes like Path, HttpOnly, etc.)
  const cookieValue = sessionCookie.split(';')[0]!;

  return {
    cookies: cookieValue,
    authenticated: true
  };
}

/**
 * Pre-create a pool of authenticated sessions for high-concurrency tests.
 * Distributes load across multiple sessions so a single token isn't hammered.
 *
 * @param count Number of sessions to create (default: 1 per 20 concurrent workers)
 */
export async function createSessionPool(
  baseUrl: string,
  auth: AuthConfig,
  count: number
): Promise<SessionState[]> {
  const poolSize = Math.max(1, count);

  const sessions: SessionState[] = [];
  for (let i = 0; i < poolSize; i++) {
    const session = await authenticateSession(baseUrl, auth);
    sessions.push(session);
  }
  return sessions;
}
