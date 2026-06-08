/**
 * k6 runner - spawns k6 as a subprocess.
 *
 * k6 scripts live in packages/loadtest/k6/{appName}.js and are
 * hand-written JavaScript (k6 doesn't support TypeScript natively).
 */
import type { K6RunOptions } from '../types';
/**
 * Run a k6 load test script for the given app.
 */
export declare function runK6Test(appName: string, options: K6RunOptions): Promise<void>;
//# sourceMappingURL=k6-runner.d.ts.map