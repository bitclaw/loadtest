/**
 * Load test authentication — obtains session cookies from the
 * dedicated /api/loadtest/auth endpoint.
 */
import type { AuthConfig, SessionState } from '../types';
/**
 * Authenticate against the dedicated loadtest auth endpoint.
 * Returns the raw Set-Cookie header value for injection into requests.
 */
export declare function authenticateSession(baseUrl: string, auth: AuthConfig): Promise<SessionState>;
/**
 * Pre-create a pool of authenticated sessions for high-concurrency tests.
 * Distributes load across multiple sessions so a single token isn't hammered.
 *
 * @param count Number of sessions to create (default: 1 per 20 concurrent workers)
 */
export declare function createSessionPool(baseUrl: string, auth: AuthConfig, count: number): Promise<SessionState[]>;
//# sourceMappingURL=session.d.ts.map