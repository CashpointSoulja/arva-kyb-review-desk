// 24 synthetic golden applications for the eval lab. Each seeds zero or more
// known risk signals; "expected" is what a careful analyst would flag.
import { buildApp, person, clone } from './factory.js';

const ind = (name, pct, dob, nationality = 'British') => ({ name, type: 'individual', pct, dob, nationality });

function base(n, name, extra = {}) {
  const id = `G-${String(n).padStart(2, '0')}`;
  return buildApp({
    id, name, number: String(16000000 + n * 1371).padStart(8, '0'), incorporatedOn: '2019-03-11', sic: '62012', industry: 'Software development',
    office: { line1: `${10 + n} Station Road`, city: 'Reading', postcode: `RG1 ${n}AA` }, volume: 80000, receivedAt: '2026-10-01T09:00:00Z',
    officers: [person('O1', extra.director || 'Alex Morgan', { dob: extra.dob || '1982-05', nationality: extra.nationality || 'British' })],
    holders: [ind(extra.director || 'Alex Morgan', 100, extra.dob || '1982-05', extra.nationality || 'British')],
    ...extra.spec,
  });
}

const G = [];
const add = (app, title, seeded, signals, tier, note) => G.push({ id: app.id, title, seeded, app, expected: { signals, tier }, note });

add(base(1, 'Larchfield Software Ltd'), 'Clean software company', 'None', [], 'low');
add(base(2, 'Marlow Print Works Ltd', { director: 'Grace Whitlock', dob: '1979-02', spec: { sic: '18129', industry: 'Printing' } }), 'Clean printer', 'None', [], 'low');
add(base(3, 'Harbour Lane Dental Ltd', { director: 'James Lee', dob: '1990-08' }), 'Clean, common director name', 'None (common name must not flag)', [], 'low');
add(base(4, 'Fenwick Tiles Ltd', { spec: { registryStatus: 'dissolved', dissolvedOn: '2026-03-17' } }), 'Dissolved company applying', 'Registry status dissolved', ['REG-01'], 'high');
add(base(5, 'Quarry Hill Studio Ltd', { spec: { accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-06-30' }] } }), 'Dormant accounts but trading claim', 'Dormant accounts vs 7 years trading', ['REG-02'], 'medium');
{
  const a = base(6, 'Saltmarsh Imports Ltd', { spec: {
    volume: 300000,
    accounts: [{ madeUpTo: '2025-12-31', type: 'dormant', filedOn: '2026-05-02' }, { madeUpTo: '2024-12-31', type: 'dormant', filedOn: '2025-05-01' }],
    filings: [{ date: '2026-07-14', type: 'PSC01', description: 'Notification of a new person with significant control' }],
  } });
  a.registry.officers[0].appointedOn = '2026-07-14';
  add(a, 'Dormant then reactivated', 'Dormant accounts, new controller, high volume', ['REG-02', 'REG-04'], 'high');
}
add(base(7, 'Elmstead Bathrooms Ltd', { spec: { incorporatedOn: '2025-05-01', yearsTrading: 9, accounts: [{ madeUpTo: '2026-04-30', type: 'micro-entity', filedOn: '2026-08-01' }] } }), 'Young company claims long history', 'Incorporated 1.4 yrs ago, claims 9 yrs trading', ['REG-03'], 'medium');
add(base(8, 'Northern Loop Studio Ltd', { spec: { office: { line1: '12 Hilton Mews', city: 'Manchester', postcode: 'M4 3JR' } } }), 'Clean company in a co-working building', 'None (serviced office is benign)', [], 'low', 'Known false positive: DIR-03 flags any address with 20+ companies, including legitimate co-working buildings.');
add(base(9, 'Holt Building Services Ltd', { director: 'Darren Holt', dob: '1972-09' }), 'Director near-matches disqualified register', 'Disqualified-director possible match', ['DIR-01'], 'high');
{
  const a = base(10, 'Cobalt Courier Ltd');
  a.registry.officers[0].otherAppointments = [
    { company: 'Cobalt Couriers North Ltd', number: '12000101', status: 'dissolved', dissolvedOn: '2024-05-01', role: 'Director' },
    { company: 'Cobalt Same Day Ltd', number: '12000202', status: 'dissolved', dissolvedOn: '2025-01-20', role: 'Director' },
    { company: 'AM Parcel Ltd', number: '12000303', status: 'dissolved', dissolvedOn: '2026-02-11', role: 'Director' },
  ];
  add(a, 'Director with dissolved-company run', '3 companies dissolved in 36 months', ['DIR-02'], 'medium');
}
{
  const a = base(11, 'Brookvale Garden Design Ltd');
  a.registry.officers.push(person('O2', 'Simon Tate', { dob: '1966-01', appointedOn: '2023-02-01' }));
  add(a, 'Undeclared director', 'Register shows a director missing from the form', ['DIR-04'], 'medium');
}
{
  const a = base(12, 'Thornbury Optics Ltd', { spec: { holders: [ind('Alex Morgan', 50, '1982-05'), ind('Nadia Shah', 40, '1985-03')] } });
  add(a, 'Holdings sum to 90%', '10% of shares unaccounted for', ['OWN-01'], 'medium');
}
{
  const a = base(13, 'Pinnacle Yard Ltd', { spec: { holders: [{ name: 'PY Midco Ltd', type: 'company', pct: 100, jurisdiction: 'United Kingdom', holders: [{ name: 'PY Topco Ltd', type: 'company', pct: 100, jurisdiction: 'United Kingdom', holders: [{ name: 'PY Holdings Ltd', type: 'company', pct: 100, jurisdiction: 'United Kingdom', holders: [ind('Alex Morgan', 100, '1982-05')] }] }] }] } });
  add(a, 'Three UK holding layers', 'Corporate depth 3', ['OWN-02'], 'medium');
}
{
  const a = base(14, 'Coral Reach Marine Ltd', { spec: { holders: [{ name: 'Coral Reach Holdings Ltd', type: 'company', pct: 100, jurisdiction: 'Seychelles', holders: [ind('Alex Morgan', 100, '1982-05')] }] } });
  add(a, 'Parent in bearer-risk jurisdiction', 'Seychelles parent (bearerRisk)', ['OWN-03'], 'high');
}
{
  const a = base(15, 'Westgate Lettings Ltd', { spec: { holders: [ind('Alex Morgan', 60, '1982-05'), ind('Oliver Grant', 40, '1970-10')] } });
  a.application.ubos = [{ name: 'Alex Morgan', pct: 60 }];
  add(a, 'Undeclared 40% owner', 'UBO at 40% not declared', ['OWN-04'], 'medium');
}
add(base(16, 'Sabirov Metals Trading Ltd', { director: 'Rustam Sabirov', dob: '1975-06', spec: { sic: '46720', industry: 'Wholesale of metals' } }), 'Sanctions possible match', 'Director possibly matches SL-40502', ['SCR-01'], 'high');
add(base(17, 'Vistula Transit Consulting Ltd', { director: 'Tomasz Wieczorek', dob: '1961-12', nationality: 'Polish' }), 'Foreign PEP director', 'Director matches PEP-7790', ['SCR-02'], 'medium');
add(base(18, 'Dolan Merchant Services Ltd', { director: 'Marek Dolan', dob: '1975-02' }), 'Director in financial-crime news', 'Adverse media: laundering charge', ['SCR-03'], 'high');
add(base(19, 'Lumen Harbour Ltd', { spec: { office: { line1: '8 Vauxhall Quay', city: 'Plymouth', postcode: 'PL4 0DB' }, previousNames: [{ name: 'Brightwater Trading Ltd', until: '2024-06-30' }] } }), 'Adverse media under a former name', 'Fraud article names the company\'s previous name', ['SCR-03'], 'high', 'Honest miss: SCR-03 screens the current legal and trading names only. The fraud article names "Brightwater Trading Ltd", which the register lists as this company\'s previous name. Fix planned in ROADMAP-V2 (screen previous names), deliberately not tuned into v1.');
{
  const a = base(20, 'Ridgeway Analytics Ltd');
  a.documents[1].fields.companyName.value = 'Ridgeway Analytica Ltd';
  a.documents[1].lines[1] = 'Account name: Ridgeway Analytica Ltd';
  add(a, 'Bank statement in a different name', 'Statement account name differs', ['DOC-01'], 'medium');
}
{
  const a = base(21, 'Kingsmead Foods Ltd');
  a.documents[0].fields.companyNumber.value = '16099999';
  a.documents[0].lines[1] = 'Company number 16099999';
  add(a, 'Certificate for a different company number', 'Certificate number mismatch', ['DOC-02'], 'high');
}
{
  const a = base(22, 'Ashby Florists Ltd', { spec: { docDates: { utility: '2026-04-10' } } });
  a.documents[2].fields.address.value = { line1: '3 Market Place', city: 'Ashby', postcode: 'LE65 1AH' };
  a.documents[2].lines[2] = 'Supply address: 3 Market Place, Ashby, LE65 1AH';
  add(a, 'Old address on a stale utility bill', 'Address mismatch + document older than 3 months', ['DOC-03', 'DOC-04'], 'medium');
}
add(base(23, 'Ledgerline Digital Assets Ltd', { spec: { sic: '66190', industry: 'Crypto-asset exchange' } }), 'High-risk sector', 'Crypto-asset exchange (SIC 66190)', ['BUS-01'], 'medium');
{
  const a = base(24, 'Odra Remit Ltd', { director: 'Tomasz Wieczorek', dob: '1961-12', nationality: 'Polish', spec: { sic: '64999', industry: 'Money remittance', holders: [{ name: 'Odra Midco Ltd', type: 'company', pct: 100, jurisdiction: 'Cyprus', holders: [{ name: 'Odra Group BV', type: 'company', pct: 100, jurisdiction: 'Netherlands', holders: [{ name: 'Odra Topco Ltd', type: 'company', pct: 100, jurisdiction: 'Cyprus', holders: [ind('Tomasz Wieczorek', 100, '1961-12', 'Polish')] }] }] }] } });
  add(a, 'Combined: PEP, sector and layering', 'Three medium signals together', ['SCR-02', 'BUS-01', 'OWN-02'], 'high');
}

void clone;
export const GOLDEN = G;
