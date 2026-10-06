// Runs the golden set and fails if results drop below the documented baseline (EVALS.md).
import { REF, GOLDEN } from '../app/data/index.js';
import { runEval } from '../app/engine/evals.js';

const { summary: s } = runEval(GOLDEN, REF);
const pct = (x) => `${(x * 100).toFixed(1)}%`;
console.log(`cases ${s.cases} · caught ${s.caughtSignals}/${s.seededSignals} (${pct(s.catchRate)}) · false-positive flags ${s.falsePositiveFlags} · tier agreement ${s.tierAgreement}/${s.cases}`);
console.log(`escalation precision ${pct(s.escalationPrecision)} (${s.escalated} escalated) · recall ${pct(s.escalationRecall)} (${s.shouldEscalate} should escalate)`);
for (const m of s.misses) console.log(`known miss ${m.id}: ${m.missed.join(', ')} - ${m.title}`);

const gates = [
  ['24 golden cases', s.cases === 24],
  ['catch rate >= 95%', s.catchRate >= 0.95],
  ['false-positive flags <= 1', s.falsePositiveFlags <= 1],
  ['tier agreement >= 23/24', s.tierAgreement >= 23],
  ['escalation precision = 100%', s.escalationPrecision === 1],
  ['honest miss still reported', s.misses.length >= 1],
];
let ok = true;
for (const [name, pass] of gates) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); ok &&= pass; }
process.exit(ok ? 0 : 1);
