/**
 * CLI `report` command - display or re-format previous results.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..', '..');
export function registerReportCommand(program) {
    program
        .command('report')
        .description('Display results from a previous k6 JSON export')
        .option('--file <path>', 'Path to JSON results file')
        .option('--last', 'Show the most recent results file')
        .action(async (opts) => {
        try {
            let filePath;
            if (opts.file) {
                filePath = resolve(opts.file);
            }
            else if (opts.last) {
                // Find the most recent loadtest-*.json file
                const files = readdirSync(REPO_ROOT)
                    .filter(f => f.startsWith('loadtest-') && f.endsWith('.json'))
                    .sort()
                    .reverse();
                if (files.length === 0) {
                    console.error('No loadtest result files found. Run a test with --json first.');
                    process.exit(1);
                }
                filePath = resolve(REPO_ROOT, files[0]);
            }
            else {
                console.error('Specify --file <path> or --last');
                process.exit(1);
                return;
            }
            const raw = readFileSync(filePath, 'utf-8');
            JSON.parse(raw);
        }
        catch (error) {
            console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    });
}
