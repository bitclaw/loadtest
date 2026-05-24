/**
 * Config loader — resolves per-app loadtest.config.ts files.
 */

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppLoadTestConfig } from '../types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');

/**
 * Load the loadtest config for a given app name.
 * Expects the file at `apps/{appName}/loadtest.config.ts`.
 */
export async function loadConfig(appName: string): Promise<AppLoadTestConfig> {
  const configPath = join(REPO_ROOT, 'apps', appName, 'loadtest.config.ts');

  try {
    const mod = await import(configPath);
    const config: AppLoadTestConfig = mod.default ?? mod.config;

    if (!config) {
      throw new Error(
        `No default export or named "config" export found in ${configPath}`
      );
    }

    if (config.appName !== appName) {
      console.warn(
        `Warning: Config appName "${config.appName}" doesn't match requested "${appName}"`
      );
    }

    return config;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : '';
    if (
      message.includes('Cannot find module') ||
      message.includes('ERR_MODULE_NOT_FOUND')
    ) {
      throw new Error(
        `No loadtest config found for app "${appName}".\n` +
          `Expected: apps/${appName}/loadtest.config.ts\n` +
          `Create one following the pattern in apps/runmist/loadtest.config.ts`
      );
    }
    throw error;
  }
}

/**
 * List all available app names that have loadtest configs.
 */
export async function listConfiguredApps(): Promise<string[]> {
  const { readdirSync, existsSync } = await import('node:fs');
  const appsDir = join(REPO_ROOT, 'apps');
  const apps: string[] = [];

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
