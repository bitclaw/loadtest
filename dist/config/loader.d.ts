/**
 * Config loader - resolves per-app loadtest.config.ts files.
 *
 * Resolution order:
 *   1. Explicit `configDir` option (if provided)
 *   2. `process.cwd()` - standalone repo pattern
 *   3. `{REPO_ROOT}/apps/{appName}/` - monorepo pattern (legacy)
 *
 * If a config is found at an earlier path but its `appName` doesn't match,
 * it is skipped and the next path is tried (mitigation against loading
 * the wrong app's config from CWD).
 */
import type { AppLoadTestConfig } from '../types';
/**
 * Load the loadtest config for a given app name.
 *
 * Tries multiple locations (in order):
 *   - `options.configDir/loadtest.config.ts`     (explicit override)
 *   - `process.cwd()/loadtest.config.ts`          (standalone repo)
 *   - `{REPO_ROOT}/apps/{appName}/loadtest.config.ts` (monorepo)
 */
export declare function loadConfig(appName: string, options?: {
    configDir?: string;
}): Promise<AppLoadTestConfig>;
/**
 * List all available app names that have loadtest configs.
 */
export declare function listConfiguredApps(): Promise<string[]>;
//# sourceMappingURL=loader.d.ts.map