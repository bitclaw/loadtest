/**
 * CLI `run` command - executes load tests against an app.
 */

import type { Command } from 'commander';
import { listConfiguredApps, loadConfig } from '../../config/loader';
import {
  checkThresholds,
  formatJson,
  formatReport
} from '../../reports/formatter';
import { runAppLoadTest } from '../../runner/bun-runner';
import { runK6Test } from '../../runner/k6-runner';
import type { Engine, TestMode } from '../../types';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Run load tests against an app')
    .option('--app <name>', 'App to test (e.g., runmist, weatherdestination)')
    .option('--mode <mode>', 'Test mode: quick, full, stress', 'quick')
    .option('--engine <engine>', 'Test engine: bun, k6', 'bun')
    .option('--production', 'Test against production URL', false)
    .option('--public-only', 'Only test public endpoints', false)
    .option('--json', 'Output results as JSON', false)
    .option(
      '--tier <tier>',
      'Hetzner tier for threshold comparison (CPX11/21/31/41)'
    )
    .option('--url <url>', 'Override base URL')
    .option('--list', 'List available apps with load test configs')
    .action(async opts => {
      try {
        // Handle --list
        if (opts.list) {
          const apps = await listConfiguredApps();
          if (apps.length === 0) {
            process.stdout.write('No apps with load test configs found.\n');
          } else {
            process.stdout.write('Apps with load test configs:\n');
            for (const app of apps) {
              process.stdout.write(`  ${app}\n`);
            }
          }
          return;
        }

        if (!opts.app) {
          console.error('--app is required. Use --list to see available apps.');
          process.exit(1);
        }

        const mode = opts.mode as TestMode;
        const engine = opts.engine as Engine;

        // Validate mode
        if (!['quick', 'full', 'stress'].includes(mode)) {
          console.error(`Invalid mode "${mode}". Use: quick, full, stress`);
          process.exit(1);
        }

        // Validate engine
        if (!['bun', 'k6'].includes(engine)) {
          console.error(`Invalid engine "${engine}". Use: bun, k6`);
          process.exit(1);
        }

        // Load config
        const config = await loadConfig(opts.app);

        // Determine base URL
        const baseUrl =
          opts.url ??
          (opts.production && config.productionUrl
            ? config.productionUrl
            : config.baseUrl);
        // Run with selected engine
        if (engine === 'k6') {
          await runK6Test(opts.app, {
            baseUrl,
            email: process.env.LOADTEST_EMAIL,
            password: process.env.LOADTEST_PASSWORD,
            jsonOutput: opts.json
              ? `loadtest-${opts.app}-${Date.now()}.json`
              : undefined
          });
        } else {
          const results = await runAppLoadTest(config, mode, {
            publicOnly: opts.publicOnly,
            baseUrl
          });

          if (opts.json) {
            process.stdout.write(`${formatJson(results, config, opts.tier)}\n`);
          } else {
            process.stdout.write(
              `${formatReport(results, config, opts.tier)}\n`
            );
          }

          // Check thresholds and set exit code
          const thresholds = opts.tier
            ? (config.thresholds.tiers?.[opts.tier] ?? config.thresholds)
            : config.thresholds;

          const check = checkThresholds(results, thresholds);
          if (!check.passed) {
            process.exit(1);
          }
        }
      } catch (error: unknown) {
        console.error(
          `\nError: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });
}
