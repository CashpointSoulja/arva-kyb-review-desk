import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, run, person } from './helpers.js';

test('REG-01 passes active company', () => assert.equal(run('REG-01', clean()).status, 'pass'));
test('REG-01 fails dissolved company', () => assert.equal(run('REG-01', clean({ spec: { registryStatus: 'dissolved', dissolvedOn: '2026-01-01' } })).status, 'fail'));
test('REG-01 dissolved is high severity', () => assert.equal(run('REG-01', clean({ spec: { registryStatus: 'dissolved', dissolvedOn: '2026-01-01' } })).severity, 'high'));
test('REG-01 cites registry status line', () => assert.ok(run('REG-01', clean({ spec: { registryStatus: 'dissolved', dissolvedOn: '2026-01-01' } })).findings[0].evidence.includes('REG/status')));
test('REG-01 flags liquidation', () => assert.notEqual(run('REG-01', clean({ spec: { registryStatus: 'liquidation' } })).status, 'pass'));
test('REG-02 passes trading accounts', () => assert.equal(run('REG-02', clean()).status, 'pass'));
test('REG-02 flags dormant accounts with trading claim', () => assert.equal(run('REG-02', clean({ spec: { accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-06-01' }] } })).status, 'flag'));
test('REG-02 dormant is medium', () => assert.equal(run('REG-02', clean({ spec: { accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-06-01' }] } })).severity, 'medium'));
test('REG-02 no accounts yet is low', () => assert.equal(run('REG-02', clean({ spec: { accounts: [] } })).severity, 'low'));
test('REG-03 passes consistent history', () => assert.equal(run('REG-03', clean()).status, 'pass'));
test('REG-03 flags claim beyond incorporation', () => assert.equal(run('REG-03', clean({ spec: { incorporatedOn: '2025-05-01', yearsTrading: 9 } })).status, 'flag'));
test('REG-03 tolerates one-year rounding', () => assert.equal(run('REG-03', clean({ spec: { incorporatedOn: '2023-11-01', yearsTrading: 3 } })).status, 'pass'));

function reactivated() {
  const a = clean({ spec: { volume: 300000, accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-05-02' }] } });
  a.registry.officers[0].appointedOn = '2026-07-14';
  return a;
}
test('REG-04 flags dormant + new officer + volume', () => assert.equal(run('REG-04', reactivated()).status, 'flag'));
test('REG-04 is high severity', () => assert.equal(run('REG-04', reactivated()).severity, 'high'));
test('REG-04 needs the officer change', () => assert.equal(run('REG-04', clean({ spec: { volume: 300000, accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-05-02' }] } })).status, 'pass'));
test('REG-04 ignores companies never dormant', () => { const a = clean(); a.registry.officers[0].appointedOn = '2026-07-14'; assert.equal(run('REG-04', a).status, 'pass'); });

test('DIR-01 passes unrelated director', () => assert.equal(run('DIR-01', clean()).status, 'pass'));
test('DIR-01 possible match flags', () => assert.equal(run('DIR-01', clean({ director: 'Darren Holt', dob: '1972-09' })).status, 'flag'));
test('DIR-01 strong match fails', () => assert.equal(run('DIR-01', clean({ director: 'Gareth Lloyd-Pryce', dob: '1979-08' })).status, 'fail'));
test('DIR-01 attaches reasoning', () => assert.ok(run('DIR-01', clean({ director: 'Darren Holt', dob: '1972-09' })).findings[0].reasoning.for.length));
test('DIR-01 cites both officer and register entry', () => {
  const ev = run('DIR-01', clean({ director: 'Darren Holt', dob: '1972-09' })).findings[0].evidence;
  assert.ok(ev.some((e) => e.startsWith('REG/officer/'))); assert.ok(ev.some((e) => e.startsWith('DQ/')));
});
test('DIR-01 ignores resigned officers', () => {
  const a = clean(); a.registry.officers.push(person('O9', 'Darren Holt', { dob: '1972-09', resignedOn: '2020-01-01' }));
  assert.equal(run('DIR-01', a).status, 'pass');
});
function withDissolved(n, recent = true) {
  const a = clean();
  a.registry.officers[0].otherAppointments = Array.from({ length: n }, (_, i) => ({ company: `Old Co ${i} Ltd`, number: `1200000${i}`, status: 'dissolved', dissolvedOn: recent ? `2025-0${i + 1}-01` : `2015-0${i + 1}-01`, role: 'Director' }));
  return a;
}
test('DIR-02 passes with one dissolved company', () => assert.equal(run('DIR-02', withDissolved(1)).status, 'pass'));
test('DIR-02 low flag with two', () => assert.equal(run('DIR-02', withDissolved(2)).severity, 'low'));
test('DIR-02 medium flag with three', () => assert.equal(run('DIR-02', withDissolved(3)).severity, 'medium'));
test('DIR-02 ignores dissolutions outside 36 months', () => assert.equal(run('DIR-02', withDissolved(3, false)).status, 'pass'));
test('DIR-03 passes ordinary address', () => assert.equal(run('DIR-03', clean()).status, 'pass'));
test('DIR-03 low flag at serviced office', () => assert.equal(run('DIR-03', clean({ spec: { office: { line1: '12 Hilton Mews', city: 'Manchester', postcode: 'M4 3JR' } } })).severity, 'low'));
test('DIR-03 address alone at formation agent is low', () => assert.equal(run('DIR-03', clean({ spec: { office: { line1: '71 Shelton Row', city: 'London', postcode: 'EC1V 2NX' } } })).severity, 'low'));
test('DIR-03 medium when officer clusters there', () => assert.equal(run('DIR-03', clean({ director: 'Gareth Lloyd-Pryce', dob: '1979-08', spec: { office: { line1: '71 Shelton Row', city: 'London', postcode: 'EC1V 2NX' } } })).severity, 'medium'));
test('DIR-04 passes matching directors', () => assert.equal(run('DIR-04', clean()).status, 'pass'));
test('DIR-04 flags undeclared registry director', () => { const a = clean(); a.registry.officers.push(person('O2', 'Simon Tate', { dob: '1966-01' })); assert.equal(run('DIR-04', a).status, 'flag'); });
test('DIR-04 flags declared director missing from registry', () => { const a = clean(); a.application.directors.push('Nobody Here'); assert.equal(run('DIR-04', a).status, 'flag'); });
