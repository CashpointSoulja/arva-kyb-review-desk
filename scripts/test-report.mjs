// Runs the unit tests and writes the counts the Eval lab displays.
import { spawnSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';

const files = readdirSync('tests').filter((f) => f.endsWith('.test.js')).map((f) => `tests/${f}`);
const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { encoding: 'utf8' });
const out = r.stdout;
const n = (k) => Number((out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [])[1] || 0);
const summary = { tests: n('tests'), pass: n('pass'), fail: n('fail'), files: files.length, ranAt: new Date().toISOString(), node: process.version };
writeFileSync('app/data/test-summary.js', `// Written by scripts/test-report.mjs. Do not edit by hand.\nexport const TEST_SUMMARY = ${JSON.stringify(summary, null, 2)};\n`);
console.log(out.split('\n').filter((l) => /^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms)/.test(l)).join('\n'));
console.log(JSON.stringify(summary));
process.exit(r.status);
