import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const result = spawnSync(process.execPath, [
  'node_modules/vitest/vitest.mjs',
  'run',
  'game/facilities/recipeEconomy.report.test.ts',
  '--reporter=verbose',
], {
  env: {
    ...process.env,
    RECIPE_ECONOMY_REPORT: '1',
    RECIPE_ECONOMY_REPORT_PATH: resolve(process.cwd(), 'economy-report.md'),
  },
  stdio: ['inherit', 'pipe', 'pipe'],
});

if (result.status === 0) {
  console.log('Markdown report written to economy-report.md');
} else if (result.stderr) {
  console.error(result.stderr.toString('utf8'));
}

process.exit(result.status ?? 1);
