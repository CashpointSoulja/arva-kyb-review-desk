import { buildApp, person, clone } from '../app/data/factory.js';
import { REF } from '../app/data/index.js';
import { makeCtx } from '../app/engine/index.js';
import { CHECKS } from '../app/engine/checks.js';

export const ctx = makeCtx(REF);
export const ind = (name, pct, dob = '1982-05', nationality = 'British') => ({ name, type: 'individual', pct, dob, nationality });

export function clean(over = {}) {
  return buildApp({
    id: 'T-1', name: 'Testbed Widgets Ltd', number: '15550001', incorporatedOn: '2019-03-11', sic: '62012', industry: 'Software development',
    office: { line1: '1 Test Street', city: 'Reading', postcode: 'RG1 9ZZ' }, volume: 50000,
    officers: [person('O1', over.director || 'Alex Morgan', { dob: over.dob || '1982-05', nationality: over.nationality || 'British' })],
    holders: [ind(over.director || 'Alex Morgan', 100, over.dob || '1982-05', over.nationality || 'British')],
    ...over.spec,
  });
}

export function run(id, app) {
  return CHECKS.find((c) => c.id === id).run(app, ctx);
}

export { person, clone, REF };
