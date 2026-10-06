import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, run, ind } from './helpers.js';
import { ownershipPeople, corporateDepth } from '../app/engine/checks.js';

const layered = (jur = 'United Kingdom', depth = 3) => {
  let node = ind('Alex Morgan', 100);
  for (let i = depth; i >= 1; i--) node = { name: `Layer ${i} Ltd`, type: 'company', pct: 100, jurisdiction: jur, holders: [node] };
  return clean({ spec: { holders: [node] } });
};

test('OWN-01 passes 100%', () => assert.equal(run('OWN-01', clean()).status, 'pass'));
test('OWN-01 flags under 100%', () => assert.equal(run('OWN-01', clean({ spec: { holders: [ind('A B', 50), ind('C D', 40)] } })).status, 'flag'));
test('OWN-01 flags over 100%', () => assert.equal(run('OWN-01', clean({ spec: { holders: [ind('A B', 70), ind('C D', 40)] } })).status, 'flag'));
test('OWN-01 checks nested levels', () => {
  const a = clean({ spec: { holders: [{ name: 'Mid Ltd', type: 'company', pct: 100, jurisdiction: 'United Kingdom', holders: [ind('A B', 60)] }] } });
  assert.equal(run('OWN-01', a).status, 'flag');
});
test('OWN-02 passes direct ownership', () => assert.equal(run('OWN-02', clean()).status, 'pass'));
test('OWN-02 passes one UK layer', () => assert.equal(run('OWN-02', layered('United Kingdom', 1)).status, 'pass'));
test('OWN-02 flags depth 3', () => assert.equal(run('OWN-02', layered('United Kingdom', 3)).status, 'flag'));
test('corporateDepth counts company layers', () => assert.equal(corporateDepth(layered('United Kingdom', 3).ownership), 3));
test('OWN-03 passes UK structure', () => assert.equal(run('OWN-03', layered('United Kingdom', 2)).status, 'pass'));
test('OWN-03 flags bearer-risk jurisdiction', () => assert.equal(run('OWN-03', layered('Seychelles', 1)).severity, 'high'));
test('OWN-03 flags explicit bearer shares', () => {
  const a = clean({ spec: { holders: [{ name: 'Bearer SA', type: 'company', pct: 100, jurisdiction: 'United Kingdom', bearer: true, holders: [ind('A B', 100)] }] } });
  assert.equal(run('OWN-03', a).status, 'flag');
});
test('OWN-03 flags nominee holder', () => {
  const a = clean({ spec: { holders: [{ name: 'Nom Ltd', type: 'company', pct: 100, jurisdiction: 'United Kingdom', nominee: true, holders: [ind('A B', 100)] }] } });
  assert.equal(run('OWN-03', a).status, 'flag');
});
test('ownershipPeople multiplies through layers', () => {
  const a = clean({ spec: { holders: [{ name: 'Mid Ltd', type: 'company', pct: 50, jurisdiction: 'United Kingdom', holders: [ind('A B', 50), ind('C D', 50)] }, ind('E F', 50)] } });
  const p = ownershipPeople(a.ownership);
  assert.equal(Math.round(p.find((x) => x.name === 'A B').effectivePct), 25);
});
test('OWN-04 passes when UBOs declared', () => assert.equal(run('OWN-04', clean()).status, 'pass'));
test('OWN-04 flags undeclared 25%+ owner', () => {
  const a = clean({ spec: { holders: [ind('Alex Morgan', 60), ind('Oliver Grant', 40, '1970-10')] } }); a.application.ubos = [{ name: 'Alex Morgan', pct: 60 }];
  assert.equal(run('OWN-04', a).status, 'flag');
});
test('OWN-04 ignores undeclared owner under 25%', () => {
  const a = clean({ spec: { holders: [ind('Alex Morgan', 80), ind('Oliver Grant', 20, '1970-10')] } }); a.application.ubos = [{ name: 'Alex Morgan', pct: 80 }];
  assert.equal(run('OWN-04', a).status, 'pass');
});
test('OWN-04 flags declared percentage that disagrees', () => {
  const a = clean(); a.application.ubos = [{ name: 'Alex Morgan', pct: 60 }];
  assert.equal(run('OWN-04', a).status, 'flag');
});

test('SCR-01 passes clean director', () => assert.equal(run('SCR-01', clean()).status, 'pass'));
test('SCR-01 flags possible match', () => assert.equal(run('SCR-01', clean({ director: 'Rustam Sabirov', dob: '1975-06' })).status, 'flag'));
test('SCR-01 possible match is high severity', () => assert.equal(run('SCR-01', clean({ director: 'Rustam Sabirov', dob: '1975-06' })).severity, 'high'));
test('SCR-01 weak match is shown but does not flag', () => {
  const r = run('SCR-01', clean({ director: 'David Chen', dob: '1960-02' }));
  assert.equal(r.status, 'pass'); assert.ok(r.findings.some((f) => f.reasoning?.strength === 'weak'));
});
test('SCR-01 screens UBOs not just directors', () => {
  const a = clean({ spec: { holders: [ind('Alex Morgan', 50), ind('Rustam Sabirov', 50, '1975-06')] } });
  assert.equal(run('SCR-01', a).status, 'flag');
});
test('SCR-01 finding explains why it might be wrong', () => {
  const f = run('SCR-01', clean({ director: 'Rustam Sabirov', dob: '1975-06' })).findings.find((x) => x.reasoning);
  assert.ok(f.reasoning.against.length >= 1);
});
test('SCR-02 flags PEP match', () => assert.equal(run('SCR-02', clean({ director: 'Tomasz Wieczorek', dob: '1961-12', nationality: 'Polish' })).status, 'flag'));
test('SCR-02 PEP is medium, not a hard stop', () => assert.equal(run('SCR-02', clean({ director: 'Tomasz Wieczorek', dob: '1961-12', nationality: 'Polish' })).severity, 'medium'));
test('SCR-02 passes non-PEP', () => assert.equal(run('SCR-02', clean()).status, 'pass'));
test('SCR-03 flags financial-crime article on director', () => assert.equal(run('SCR-03', clean({ director: 'Marek Dolan', dob: '1975-02' })).severity, 'high'));
test('SCR-03 neutral coverage does not flag', () => assert.equal(run('SCR-03', clean({ spec: { name: 'Glenmorrach Distillery Ltd' } })).status, 'pass'));
test('SCR-03 cites the article paragraph', () => {
  const ev = run('SCR-03', clean({ director: 'Marek Dolan', dob: '1975-02' })).findings.flatMap((f) => f.evidence);
  assert.ok(ev.some((e) => /^MED\/.+\/L\d+$/.test(e)));
});
test('SCR-03 does not screen previous names (known gap)', () => {
  const a = clean({ spec: { previousNames: [{ name: 'Brightwater Trading Ltd', until: '2024-06-30' }] } });
  assert.equal(run('SCR-03', a).status, 'pass');
});

test('DOC-01 passes consistent names', () => assert.equal(run('DOC-01', clean()).status, 'pass'));
test('DOC-01 flags statement name mismatch', () => { const a = clean(); a.documents[1].fields.companyName.value = 'Other Name Ltd'; assert.equal(run('DOC-01', a).status, 'flag'); });
test('DOC-01 tolerates Ltd vs Limited', () => { const a = clean(); a.documents[1].fields.companyName.value = 'Testbed Widgets Limited'; assert.equal(run('DOC-01', a).status, 'pass'); });
test('DOC-01 flags application vs registry mismatch', () => { const a = clean(); a.application.legalName = 'Testbed Gadgets Ltd'; assert.equal(run('DOC-01', a).status, 'flag'); });
test('DOC-02 passes consistent number', () => assert.equal(run('DOC-02', clean()).status, 'pass'));
test('DOC-02 fails certificate number mismatch', () => { const a = clean(); a.documents[0].fields.companyNumber.value = '16099999'; assert.equal(run('DOC-02', a).status, 'fail'); });
test('DOC-02 tolerates missing leading zero', () => { const a = clean({ spec: { number: '09833410' } }); a.application.companyNumber = '9833410'; assert.equal(run('DOC-02', a).status, 'pass'); });
test('DOC-03 passes consistent address', () => assert.equal(run('DOC-03', clean()).status, 'pass'));
test('DOC-03 flags different postcode on bill', () => { const a = clean(); a.documents[2].fields.address.value = { line1: '3 Market Place', city: 'Ashby', postcode: 'LE65 1AH' }; assert.equal(run('DOC-03', a).status, 'flag'); });
test('DOC-03 tolerates postcode formatting', () => { const a = clean(); a.documents[2].fields.address.value = { line1: '1 Test Street', city: 'Reading', postcode: 'rg19zz' }; assert.equal(run('DOC-03', a).status, 'pass'); });
test('DOC-04 passes recent documents', () => assert.equal(run('DOC-04', clean()).status, 'pass'));
test('DOC-04 flags stale utility bill', () => assert.equal(run('DOC-04', clean({ spec: { docDates: { utility: '2026-04-10' } } })).status, 'flag'));
test('DOC-04 ignores certificate age', () => assert.equal(run('DOC-04', clean({ spec: { incorporatedOn: '2001-01-01' } })).status, 'pass'));
test('BUS-01 passes software', () => assert.equal(run('BUS-01', clean()).status, 'pass'));
test('BUS-01 flags crypto exchange', () => assert.equal(run('BUS-01', clean({ spec: { sic: '66190', industry: 'Crypto-asset exchange' } })).status, 'flag'));
test('BUS-01 flags payment services', () => assert.equal(run('BUS-01', clean({ spec: { sic: '64999', industry: 'Payments' } })).severity, 'medium'));
