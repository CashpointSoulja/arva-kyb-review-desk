import test from 'node:test';
import assert from 'node:assert/strict';
import { levenshtein, variantOf, matchPerson, matchCompanyName } from '../app/engine/match.js';

test('levenshtein identical is 0', () => assert.equal(levenshtein('morozan', 'morozan'), 0));
test('levenshtein one substitution', () => assert.equal(levenshtein('pryce', 'price'), 1));
test('levenshtein insert/delete', () => assert.equal(levenshtein('holt', 'holts'), 1));
test('variantOf knows David/Dawei group', () => assert.ok(variantOf('david', 'dawei')));
test('variantOf rejects unrelated names', () => assert.ok(!variantOf('david', 'helena')));

test('exact name, DOB and nationality is strong', () => {
  const m = matchPerson({ name: 'Fiona Kerrigan', dob: '1977-04', nationality: 'British' }, { name: 'Fiona Margaret Kerrigan', dob: '1977-04', nationality: 'British' });
  assert.equal(m.strength, 'strong');
});
test('nationality mismatch lowers to possible', () => {
  const m = matchPerson({ name: 'Viktor Morozan', dob: '1968-07', nationality: 'British' }, { name: 'Viktor Aleksandr Morozan', dob: '1968-03', nationality: 'Moldovan' });
  assert.equal(m.strength, 'possible');
});
test('possible match explains for and against', () => {
  const m = matchPerson({ name: 'Viktor Morozan', dob: '1968-07', nationality: 'British' }, { name: 'Viktor Aleksandr Morozan', dob: '1968-03', nationality: 'Moldovan' });
  assert.ok(m.for.length >= 2); assert.ok(m.against.length >= 1);
});
test('reasoning never exposes a bare percentage', () => {
  const m = matchPerson({ name: 'Viktor Morozan', dob: '1968-07' }, { name: 'Viktor Aleksandr Morozan', dob: '1968-03' });
  for (const line of [...m.for, ...m.against]) assert.ok(!/\d+(\.\d+)?%/.test(line), line);
});
test('common surname with distant DOB is none', () => {
  const m = matchPerson({ name: 'David Chen', dob: '1990-02', nationality: 'British' }, { name: 'Chen Dawei', dob: '1959-11', nationality: 'Singaporean' });
  assert.equal(m.strength, 'none');
});
test('common surname within a year is only weak', () => {
  const m = matchPerson({ name: 'David Chen', dob: '1960-02', nationality: 'British' }, { name: 'Chen Dawei', dob: '1959-11', nationality: 'Singaporean' });
  assert.equal(m.strength, 'weak');
});
test('surname-first list order is handled', () => {
  const m = matchPerson({ name: 'Dawei Chen', dob: '1959-11', nationality: 'Singaporean' }, { name: 'Chen Dawei', dob: '1959-11', nationality: 'Singaporean' });
  assert.notEqual(m.strength, 'none');
});
test('one-letter surname spelling difference still matches', () => {
  const m = matchPerson({ name: 'Gareth Lloyd-Pryce', dob: '1979-08', nationality: 'British' }, { name: 'Gareth Lloyd Price', dob: '1979-08', nationality: 'British' });
  assert.equal(m.strength, 'strong');
});
test('different surname is none', () => assert.equal(matchPerson({ name: 'Isla Fraser' }, { name: 'Isla Rennie' }).strength, 'none'));
test('missing DOB is listed as a reason against', () => {
  const m = matchPerson({ name: 'Marek Dolan', dob: '1975-02' }, { name: 'Marek Dolan' });
  assert.ok(m.against.some((s) => /date of birth/i.test(s)));
});
test('name-only match tops out at possible', () => assert.equal(matchPerson({ name: 'Marek Dolan' }, { name: 'Marek Dolan' }).strength, 'possible'));
test('diacritics do not block a match', () => assert.notEqual(matchPerson({ name: 'Zoe Muller', dob: '1980-01' }, { name: 'Zoë Müller', dob: '1980-01' }).strength, 'none'));
test('match is symmetric in strength for simple names', () => {
  const a = { name: 'Isla Fraser', dob: '1974-06' }; const b = { name: 'Isla Fraser', dob: '1974-06' };
  assert.equal(matchPerson(a, b).strength, matchPerson(b, a).strength);
});
test('company exact core match ignores suffix', () => assert.equal(matchCompanyName('Kestrel Lane Media Ltd', 'Kestrel Lane Media').relation, 'exact'));
test('company one-letter typo is close', () => assert.equal(matchCompanyName('Ridgeway Analytics Ltd', 'Ridgeway Analytica Ltd').relation, 'close'));
test('unrelated company is none', () => assert.equal(matchCompanyName('Wren & Fable Books Ltd', 'Kestrel Lane Media').relation, 'none'));
