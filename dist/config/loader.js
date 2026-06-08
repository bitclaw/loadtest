/**
 * Config loader — resolves per-app loadtest.config.ts files.
 *
 * Resolution order:
 *   1. Explicit `configDir` option (if provided)
 *   2. `process.cwd()` — standalone repo pattern
 *   3. `{REPO_ROOT}/apps/{appName}/` — monorepo pattern (legacy)
 *
 * If a config is found at an earlier path but its `appName` doesn't match,
 * it is skipped and the next path is tried (mitigation against loading
 * the wrong app's config from CWD).
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
function isModuleNotFound(error) {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
            ? String(error.message)
            : '';
    return (message.includes('Cannot find module') ||
        message.includes('ERR_MODULE_NOT_FOUND'));
}
/**
 * Load the loadtest config for a given app name.
 *
 * Tries multiple locations (in order):
 *   - `options.configDir/loadtest.config.ts`     (explicit override)
 *   - `process.cwd()/loadtest.config.ts`          (standalone repo)
 *   - `{REPO_ROOT}/apps/{appName}/loadtest.config.ts` (monorepo)
 */
export async function loadConfig(appName, options) {
    const searchPaths = [];
    if (options?.configDir) {
        searchPaths.push(join(options.configDir, 'loadtest.config.ts'));
    }
    searchPaths.push(join(process.cwd(), 'loadtest.config.ts'));
    searchPaths.push(join(REPO_ROOT, 'apps', appName, 'loadtest.config.ts'));
    for (const configPath of searchPaths) {
        try {
            const mod = await import(configPath);
            const config = mod.default ?? mod.config;
            if (!config) {
                console.warn(`Warning: No export found in ${configPath} — skipping`);
                continue;
            }
            // App name validation: skip if mismatch so the next path can be tried
            if (config.appName !== appName) {
                console.warn(`Warning: Config at ${configPath} has appName "${config.appName}", ` +
                    `requested "${appName}". Trying next path.`);
                continue;
            }
            return config;
        }
        catch (error) {
            if (isModuleNotFound(error)) {
                continue;
            }
            // Re-throw genuine errors (parse failures, type errors, etc.)
            throw new Error(`Error loading config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    throw new Error(`No loadtest config found for app "${appName}".\n` +
        `Tried:\n  ${searchPaths.join('\n  ')}\n\n` +
        `Create one following the pattern in apps/runmist/loadtest.config.ts`);
}
/**
 * List all available app names that have loadtest configs.
 */
export async function listConfiguredApps() {
    const { readdirSync, existsSync } = await import('node:fs');
    const appsDir = join(REPO_ROOT, 'apps');
    const apps = [];
    for (const entry of readdirSync(appsDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const configPath = join(appsDir, entry.name, 'loadtest.config.ts');
            if (existsSync(configPath)) {
                apps.push(entry.name);
            }
        }
    }
    return apps;
}
