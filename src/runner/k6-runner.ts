/**
 * k6 runner — spawns k6 as a subprocess.
 *
 * k6 scripts live in packages/loadtest/k6/{appName}.js and are
 * hand-written JavaScript (k6 doesn't support TypeScript natively).
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { K6RunOptions } from '../types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const K6_SCRIPTS_DIR = resolve(__dirname, '..', '..', 'k6');

/**
 * Check if k6 is installed.
 */
async function checkK6(): Promise<boolean> {
  try {
    const proc = Bun.spawn(['k6', 'version'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const code = await proc.exited;
    return code === 0;
  } catch {
    return false;
  }
}

/**
 * Run a k6 load test script for the given app.
 */
export async function runK6Test(
  appName: string,
  options: K6RunOptions
): Promise<void> {
  // Verify k6 is installed
  const hasK6 = await checkK6();
  if (!hasK6) {
    throw new Error(
      'k6 is not installed.\n' +
        'Install: https://grafana.com/docs/k6/latest/set-up/install-k6/\n' +
        '  macOS: brew install k6\n' +
        '  Linux: sudo apt install k6  (or snap install k6)\n' +
        '  Docker: docker run -i grafana/k6 run -'
    );
  }

  // Find the script
  const scriptPath = join(K6_SCRIPTS_DIR, `${appName}.js`);
  if (!existsSync(scriptPath)) {
    throw new Error(
      `No k6 script found for "${appName}".\n` +
        `Expected: packages/loadtest/k6/${appName}.js\n` +
        `Available scripts: ${listK6Scripts().join(', ') || '(none)'}`
    );
  }

  // Build k6 args
  const args: string[] = ['run'];

  // Pass config via env vars
  const env = {
    ...process.env,
    BASE_URL: options.baseUrl,
    ...(options.email ? { LOADTEST_EMAIL: options.email } : {}),
    ...(options.password ? { LOADTEST_PASSWORD: options.password } : {})
  };

  // JSON summary output
  if (options.jsonOutput) {
    args.push('--summary-export', options.jsonOutput);
  }

  args.push(scriptPath);

  // Spawn k6 and stream output
  const child = Bun.spawn(['k6', ...args], {
    env,
    stdio: ['inherit', 'inherit', 'inherit']
  });

  const exitCode = await child.exited;
  if (exitCode !== 0) {
    throw new Error(`k6 exited with code ${exitCode}`);
  }
}

function listK6Scripts(): string[] {
  try {
    return readdirSync(K6_SCRIPTS_DIR)
      .filter(f => f.endsWith('.js'))
      .map(f => f.replace('.js', ''));
  } catch {
    return [];
  }
}
