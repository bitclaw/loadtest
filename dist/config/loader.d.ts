/**
 * Config loader — resolves per-app loadtest.config.ts files.
 */
import type { AppLoadTestConfig } from '../types';
/**
 * Load the loadtest config for a given app name.
 * Expects the file at `apps/{appName}/loadtest.config.ts`.
 */
export declare function loadConfig(appName: string): Promise<AppLoadTestConfig>;
/**
 * List all available app names that have loadtest configs.
 */
export declare function listConfiguredApps(): Promise<string[]>;
//# sourceMappingURL=loader.d.ts.map