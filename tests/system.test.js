import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, REF } from './helpers.js';
import { assess, CHECKS } from '../app/engine/index.js';
import { runChecks } from '../app/engine/checks.js';
import { anchorIndex } from '../app/engine/sources.js';
import { recommendTier, tierDirection, validateTierDecision, validateDisposition, validateDiscount } from '../app/engine/tiering.js';
import { toCSV, toJSON, csvCell, sortEntries } from '../app/engine/audit.js';
import { runEval } from '../app/engine/evals.js';
import { costModel, straightThroughRate } from '../app/engine/metrics.js';
import { APPLICATIONS, GOLDEN } from '../app/data/index.js';

test('20 checks registered with unique ids', () => { assert.equal(CHECKS.length, 20); assert.equal(new Set(CHECKS.map((c) => c.id)).size, 20); });
test('every check states its rule', () => CHECKS.forEach((c) => assert.ok(c.rule.length > 20, c.id)));
test('queue has 14 applications', () => assert.equal(APPLICATIONS.length, 14));
test('application ids are unique', () => assert.equal(new Set(APPLICATIONS.map((a) => a.id)).size, 14));
test('golden set has 24 cases', () => assert.equal(GOLDEN.length, 24));

for (const a of APPLICATIONS) {
  test(`${a.id}: every evidence anchor resolves to a source line`, () => {
    const r = assess(a, REF); const idx = anchorIndex(r.sources);
    for (const c of r.checks) for (const f of c.findings) for (const e of f.evidence) assert.ok(idx.has(e), `${c.id} → ${e}`);
  });
}
for (const a of APPLICATIONS) {
  test(`${a.id}: every flag carries at least one evidence-backed finding`, () => {
    for (const c of assess(a, REF).checks.filter((x) => x.status !== 'pass')) assert.ok(c.findings.some((f) => f.evidence.length), c.id);
  });
}
test('engine is deterministic', () => assert.deepEqual(runChecks(APPLICATIONS[4], assess(APPLICATIONS[4], REF) && { asOf: REF.asOf, ref: REF }), runChecks(APPLICATIONS[4], { asOf: REF.asOf, ref: REF })));
test('engine does not mutate the application', () => { const a = clean(); const before = JSON.stringify(a); assess(a, REF); assert.equal(JSON.stringify(a), before); });

const fake = (sev, status = 'flag', id = `X-${sev}-${Math.random()}`) => ({ id, name: id, severity: sev, status, summary: '' });
test('no flags → low and STP recommended', () => { const r = recommendTier([fake('none', 'pass')]); assert.equal(r.tier, 'low'); assert.ok(r.stpRecommended); });
test('one low flag stays low', () => assert.equal(recommendTier([fake('low')]).tier, 'low'));
test('two low flags → medium', () => assert.equal(recommendTier([fake('low'), fake('low')]).tier, 'medium'));
test('one medium → medium', () => assert.equal(recommendTier([fake('medium')]).tier, 'medium'));
test('three mediums → high', () => assert.equal(recommendTier([fake('medium'), fake('medium'), fake('medium')]).tier, 'high'));
test('any high → high', () => assert.equal(recommendTier([fake('high')]).tier, 'high'));
test('a fail is a hard stop and blocks STP', () => { const r = recommendTier([fake('high', 'fail', 'REG-01')]); assert.deepEqual(r.hardStops, ['REG-01']); assert.ok(!r.stpRecommended); });
test('discounted flags drop out of the tier', () => assert.equal(recommendTier([fake('medium', 'flag', 'SCR-02')], { 'SCR-02': true }).tier, 'low'));
test('factors list every live flag', () => assert.equal(recommendTier([fake('low'), fake('medium')]).factors.length, 2));
test('adding a flag never lowers the tier (monotonic)', () => {
  const order = ['low', 'medium', 'high']; const sevs = ['low', 'medium', 'high'];
  let flags = [];
  for (let i = 0; i < 12; i++) { const before = order.indexOf(recommendTier(flags).tier); flags = [...flags, fake(sevs[i % 3])]; assert.ok(order.indexOf(recommendTier(flags).tier) >= before); }
});
test('tierDirection detects upgrade/downgrade/confirm', () => { assert.equal(tierDirection('low', 'high'), 'upgrade'); assert.equal(tierDirection('high', 'medium'), 'downgrade'); assert.equal(tierDirection('medium', 'medium'), 'confirm'); });
test('confirming a tier needs no rationale', () => assert.equal(validateTierDecision({ from: 'low', to: 'low', rationale: '' }), null));
test('changing a tier needs a rationale', () => assert.ok(validateTierDecision({ from: 'low', to: 'medium', rationale: 'short' })));
test('changing a tier with rationale is allowed', () => assert.equal(validateTierDecision({ from: 'medium', to: 'high', rationale: 'Sector policy requires EDD for payment firms' }), null));
const rec = (o = {}) => ({ hardStops: [], nonDiscountableStops: [], ...o });
test('disposition requires tier confirmation first', () => assert.ok(validateDisposition({ disposition: 'approve', tierConfirmed: false, finalTier: 'low', recommendation: rec(), rationale: 'All checks clear' })));
test('disposition requires rationale', () => assert.ok(validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: 'low', recommendation: rec(), rationale: '' })));
test('approve allowed for confirmed low tier', () => assert.equal(validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: 'low', recommendation: rec(), rationale: 'All checks clear' }), null));
test('cannot approve a high-tier case', () => assert.ok(validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: 'high', recommendation: rec(), rationale: 'Looks fine to me' })));
test('cannot approve over a non-discountable stop', () => assert.ok(validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: 'low', recommendation: rec({ hardStops: ['REG-01'], nonDiscountableStops: ['REG-01'] }), rationale: 'All checks clear', discounted: { 'REG-01': true } })));
test('can approve once a discountable stop is discounted', () => assert.equal(validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: 'medium', recommendation: rec({ hardStops: ['DIR-01'] }), rationale: 'Identity confirmed different person', discounted: { 'DIR-01': true } }), null));
test('escalation always allowed once confirmed', () => assert.equal(validateDisposition({ disposition: 'escalate-edd', tierConfirmed: true, finalTier: 'high', recommendation: rec({ hardStops: ['REG-01'], nonDiscountableStops: ['REG-01'] }), rationale: 'Dissolved company' }), null));
test('REG-01 cannot be discounted', () => assert.ok(validateDiscount('REG-01', 'This is a long enough reason text')));
test('discount needs a reason', () => assert.ok(validateDiscount('SCR-01', 'too short')));
test('discount with reason allowed', () => assert.equal(validateDiscount('SCR-01', 'Passport DOB differs from list entry by 7 years'), null));

test('agent audit has one row per check plus intake and tier', () => { const r = assess(clean(), REF); assert.equal(r.audit.length, 22); });
test('audit timestamps are ordered', () => { const r = assess(clean(), REF); assert.deepEqual(sortEntries(r.audit), r.audit); });
test('csvCell quotes commas and quotes', () => assert.equal(csvCell('a, "b"'), '"a, ""b"""'));
test('CSV has header plus a row per entry', () => { const r = assess(clean(), REF); assert.equal(toCSV(r.audit).split('\n').length, r.audit.length + 1); });
test('JSON export round-trips', () => { const r = assess(clean(), REF); const j = JSON.parse(toJSON(r.audit, { exportedAt: 'x' })); assert.equal(j.count, r.audit.length); assert.equal(j.entries[0].caseId, 'T-1'); });

const ev = runEval(GOLDEN, REF);
test('eval catch rate is reported honestly below 100%', () => assert.ok(ev.summary.catchRate < 1 && ev.summary.catchRate > 0.85));
test('eval keeps the G-19 honest miss on record', () => assert.ok(ev.summary.misses.some((m) => m.id === 'G-19')));
test('eval records the co-working false positive', () => assert.ok(ev.cases.find((c) => c.id === 'G-08').falsePositives.includes('DIR-03')));
test('clean golden cases raise no flags except the known FP', () => ev.cases.filter((c) => !c.expected.length && c.id !== 'G-08').forEach((c) => assert.deepEqual(c.flagged, [], c.id)));
test('escalation precision is computed', () => assert.ok(ev.summary.escalationPrecision >= 0 && ev.summary.escalationPrecision <= 1));

test('cost model saves time vs manual', () => assert.ok(costModel(['low', 'medium', 'high']).analystHoursSaved > 0));
test('cost model all-high still cheaper than manual', () => assert.ok(costModel(['high', 'high']).costReduction > 0));
test('STP counts only confirmed low approvals', () => {
  const s = straightThroughRate({ a: { disposition: 'approve', tierDirection: 'confirm' }, b: { disposition: 'approve', tierDirection: 'upgrade' } }, { a: { stpRecommended: true }, b: { stpRecommended: true } });
  assert.equal(s.stp, 1);
});
