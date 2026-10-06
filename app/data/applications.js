// The Northbank review queue: 14 synthetic business onboarding applications.
// All companies, people, addresses and registry entries are fictional.
import { buildApp, person, rebuildDocs } from './factory.js';

const ind = (name, pct, dob, nationality = 'British') => ({ name, type: 'individual', pct, dob, nationality });

const apps = [];

apps.push(buildApp({
  id: 'NB-24101', name: 'Glenmorrach Distillery Ltd', number: 'SC612784', incorporatedOn: '2016-05-12', sic: '11010', industry: 'Distilling and blending of spirits',
  office: { line1: '4 Burnside Road', city: 'Aberlour', postcode: 'AB38 9PN' }, volume: 180000, receivedAt: '2026-10-06T06:12:00Z', analyst: 'Aisha Okafor',
  officers: [person('O1', 'Isla Fraser', { dob: '1974-06', appointedOn: '2016-05-12' }), person('O2', 'Callum Rennie', { dob: '1969-02', appointedOn: '2016-05-12' })],
  holders: [ind('Isla Fraser', 60, '1974-06'), ind('Callum Rennie', 40, '1969-02')],
  website: 'glenmorrach.example', purpose: 'Operating account for duty payments, bottling suppliers and export receipts',
}));

apps.push(buildApp({
  id: 'NB-24102', name: 'Irwell Freight & Logistics Ltd', number: '11482907', incorporatedOn: '2018-07-03', sic: '49410', industry: 'Freight transport by road',
  office: { line1: '12 Hilton Mews', city: 'Manchester', postcode: 'M4 3JR' }, volume: 260000, receivedAt: '2026-10-05T15:40:00Z', analyst: 'Aisha Okafor',
  officers: [
    person('O1', 'Daniel Ashworth', { dob: '1981-10', appointedOn: '2018-07-03', otherAppointments: [
      { company: 'Ashworth Haulage Ltd', number: '10233871', status: 'dissolved', dissolvedOn: '2024-02-10', role: 'Director' },
      { company: 'Pennine Last Mile Ltd', number: '11008345', status: 'dissolved', dissolvedOn: '2024-11-30', role: 'Director' },
      { company: 'DA Fleet Services Ltd', number: '12477109', status: 'dissolved', dissolvedOn: '2025-08-14', role: 'Director' },
      { company: 'Irwell Warehousing Ltd', number: '13650021', status: 'active', dissolvedOn: null, role: 'Director' },
    ] }),
    person('O2', 'Priya Nair', { dob: '1986-03', appointedOn: '2020-01-15' }),
  ],
  holders: [ind('Daniel Ashworth', 70, '1981-10'), ind('Priya Nair', 30, '1986-03')],
  purpose: 'Fuel cards, driver payroll and customer receipts',
}));

apps.push(buildApp({
  id: 'NB-24103', name: 'Sable & Thread Ltd', number: '12904455', incorporatedOn: '2020-09-14', sic: '47910', industry: 'Online retail of clothing (e-commerce)',
  office: { line1: '22 Calvert Avenue', city: 'London', postcode: 'E2 7JP' }, volume: 95000, receivedAt: '2026-10-06T07:05:00Z', analyst: 'Unassigned',
  officers: [person('O1', 'Amara Osei', { dob: '1990-03', appointedOn: '2020-09-14' }), person('O2', 'Leo Hartley', { dob: '1989-12', appointedOn: '2020-09-14' })],
  holders: [ind('Amara Osei', 55, '1990-03'), ind('Leo Hartley', 45, '1989-12')],
  website: 'sableandthread.example', purpose: 'Card acquiring settlement and supplier payments',
}));

{
  const a = buildApp({
    id: 'NB-24104', name: 'Corrie Bay Seafoods Ltd', number: 'SC587311', incorporatedOn: '2017-11-20', sic: '46380', industry: 'Wholesale of fish and seafood',
    office: { line1: '2 Harbour Brae', city: 'Mallaig', postcode: 'PH41 4PU' }, volume: 400000, yearsTrading: 8, receivedAt: '2026-10-05T11:20:00Z', analyst: 'Ravi Desai',
    officers: [
      person('O1', 'Marcus Delaney', { dob: '1984-07', appointedOn: '2026-06-02' }),
      person('O2', 'Morag Sinclair', { dob: '1958-01', appointedOn: '2017-11-20', resignedOn: '2026-06-02' }),
    ],
    holders: [ind('Marcus Delaney', 100, '1984-07')],
    accounts: [
      { madeUpTo: '2025-11-30', type: 'dormant', filedOn: '2026-05-28' },
      { madeUpTo: '2024-11-30', type: 'dormant', filedOn: '2025-06-03' },
      { madeUpTo: '2023-11-30', type: 'micro-entity', filedOn: '2024-07-19' },
    ],
    filings: [
      { date: '2026-06-02', type: 'PSC01', description: 'Notification of Marcus Delaney as a person with significant control' },
      { date: '2026-06-02', type: 'PSC07', description: 'Cessation of Morag Sinclair as a person with significant control' },
      { date: '2026-06-02', type: 'AP01', description: 'Appointment of Marcus Delaney as director' },
      { date: '2026-05-28', type: 'AA', description: 'Dormant company accounts made up to 30 November 2025' },
    ],
    purpose: 'Export receipts from EU buyers and payments to fishing vessels',
  });
  apps.push(a);
}

{
  const a = buildApp({
    id: 'NB-24105', name: 'Halden Peak Holdings Ltd', number: '13377021', incorporatedOn: '2021-03-08', sic: '70100', industry: 'Activities of head offices (property holding)',
    office: { line1: '3 Kelso Yard', city: 'London', postcode: 'E2 8DY' }, volume: 750000, receivedAt: '2026-10-04T09:55:00Z', analyst: 'Ravi Desai', status: 'In review',
    officers: [person('O1', 'Lucas Brennan', { dob: '1977-09', appointedOn: '2021-03-08', nationality: 'Irish' })],
    holders: [
      { name: 'Ardmore Capital Ltd', type: 'company', pct: 100, jurisdiction: 'Jersey', holders: [
        { name: 'Seacliff Investments SA', type: 'company', pct: 60, jurisdiction: 'Panama', bearer: true, holders: [
          { name: 'Orbis Nominees Ltd', type: 'company', pct: 100, jurisdiction: 'Seychelles', nominee: true, holders: [ind('Helena Varga', 100, '1972-04', 'Hungarian')] },
        ] },
        ind('Lucas Brennan', 25, '1977-09', 'Irish'),
      ] },
    ],
    purpose: 'Rental income collection and intra-group transfers',
  });
  a.application.ubos = [{ name: 'Lucas Brennan', pct: 25 }];
  apps.push(a);
}

apps.push(buildApp({
  id: 'NB-24106', name: 'Kestrel Lane Media Ltd', number: '10776540', incorporatedOn: '2017-05-22', sic: '59112', industry: 'Video production',
  office: { line1: '18 Wharf Approach', city: 'Leeds', postcode: 'LS2 7HZ' }, volume: 70000, receivedAt: '2026-10-05T13:02:00Z', analyst: 'Mira Lindqvist',
  officers: [person('O1', 'Owen Pritchard', { dob: '1983-09', appointedOn: '2017-05-22' }), person('O2', 'Hannah Mistry', { dob: '1991-05', appointedOn: '2019-08-01' })],
  holders: [ind('Owen Pritchard', 80, '1983-09'), ind('Hannah Mistry', 20, '1991-05')],
}));

apps.push(buildApp({
  id: 'NB-24107', name: 'Aster Quay Trading Ltd', number: '14022318', incorporatedOn: '2022-01-17', sic: '46900', industry: 'Non-specialised wholesale trade',
  office: { line1: '9 Quayside Lane', city: 'Hull', postcode: 'HU1 1PS' }, volume: 320000, receivedAt: '2026-10-06T05:48:00Z', analyst: 'Aisha Okafor',
  officers: [person('O1', 'Viktor Morozan', { dob: '1968-07', appointedOn: '2022-01-17' }), person('O2', 'Elena Rusu', { dob: '1979-11', appointedOn: '2022-01-17', nationality: 'Romanian' })],
  holders: [ind('Viktor Morozan', 51, '1968-07'), ind('Elena Rusu', 49, '1979-11', 'Romanian')],
  purpose: 'Import payments for industrial fittings from Eastern European suppliers',
}));

apps.push(buildApp({
  id: 'NB-24108', name: 'Penrose Analytics Ltd', number: '12655093', incorporatedOn: '2020-02-03', sic: '62020', industry: 'IT consultancy',
  office: { line1: '41 Mill Road', city: 'Cambridge', postcode: 'CB1 2LA' }, volume: 60000, receivedAt: '2026-10-06T07:51:00Z', analyst: 'Unassigned',
  officers: [person('O1', 'David Chen', { dob: '1960-02', appointedOn: '2020-02-03' }), person('O2', 'Sophie Turnbull', { dob: '1987-06', appointedOn: '2021-04-12' })],
  holders: [ind('David Chen', 50, '1960-02'), ind('Sophie Turnbull', 50, '1987-06')],
}));

{
  const a = buildApp({
    id: 'NB-24109', name: 'Tamar Valley Bakehouse Ltd', number: '09833410', incorporatedOn: '2015-10-05', sic: '10710', industry: 'Manufacture of bread and fresh pastry',
    office: { line1: '7 Fore Street', city: 'Tavistock', postcode: 'PL19 0AA' }, volume: 45000, receivedAt: '2026-10-05T17:15:00Z', analyst: 'Mira Lindqvist', status: 'Awaiting information',
    officers: [person('O1', 'Bethan Rowe', { dob: '1978-08', appointedOn: '2015-10-05' })],
    holders: [ind('Bethan Rowe', 100, '1978-08')],
    docDates: { utility: '2026-05-02' },
  });
  a.documents[1].fields.address.value = { line1: 'Unit 2 Pixon Lane', city: 'Tavistock', postcode: 'PL19 8DH' };
  a.documents[1].lines[2] = 'Address: Unit 2 Pixon Lane, Tavistock, PL19 8DH';
  apps.push(a);
}

apps.push(buildApp({
  id: 'NB-24110', name: 'Northgate Pharmacy Group Ltd', number: '08124466', incorporatedOn: '2012-06-29', sic: '47730', industry: 'Dispensing chemist',
  office: { line1: '55 Division Street', city: 'Sheffield', postcode: 'S1 2GH' }, volume: 210000, receivedAt: '2026-10-05T09:10:00Z', analyst: 'Ravi Desai',
  registryStatus: 'dissolved', dissolvedOn: '2025-12-09',
  officers: [person('O1', 'Imran Qureshi', { dob: '1971-03', appointedOn: '2012-06-29' })],
  holders: [ind('Imran Qureshi', 100, '1971-03')],
  filings: [
    { date: '2025-12-09', type: 'GAZ2', description: 'Final Gazette: dissolved via compulsory strike-off' },
    { date: '2025-09-23', type: 'GAZ1', description: 'First Gazette notice for compulsory strike-off' },
  ],
}));

apps.push(buildApp({
  id: 'NB-24111', name: 'Brightline Fintech Payments Ltd', number: '13891204', incorporatedOn: '2021-11-30', sic: '64999', industry: 'Payment services for small merchants',
  office: { line1: '120 Colmore Row', city: 'Birmingham', postcode: 'B3 3BD' }, volume: 1200000, receivedAt: '2026-10-04T16:30:00Z', analyst: 'Mira Lindqvist', status: 'In review',
  officers: [person('O1', 'Fiona Kerrigan', { dob: '1977-04', appointedOn: '2021-11-30' }), person('O2', 'Ravi Menon', { dob: '1982-01', appointedOn: '2021-11-30' })],
  holders: [ind('Fiona Kerrigan', 40, '1977-04'), ind('Ravi Menon', 60, '1982-01')],
  purpose: 'Merchant settlement float and safeguarding account',
}));

apps.push(buildApp({
  id: 'NB-24112', name: 'Oakhurst Joinery Ltd', number: '15988120', incorporatedOn: '2026-01-19', sic: '16230', industry: 'Bespoke joinery and carpentry',
  office: { line1: '6 Woodbridge Hill', city: 'Guildford', postcode: 'GU1 4RR' }, volume: 38000, yearsTrading: 11, receivedAt: '2026-10-06T08:02:00Z', analyst: 'Unassigned',
  officers: [person('O1', 'Tom Bexley', { dob: '1975-05', appointedOn: '2026-01-19' })],
  holders: [ind('Tom Bexley', 100, '1975-05')],
  accounts: [],
  filings: [{ date: '2026-01-19', type: 'NEWINC', description: 'Incorporation' }],
}));

apps.push(buildApp({
  id: 'NB-24113', name: 'Meridian Crest Consulting Ltd', number: '14560972', incorporatedOn: '2022-10-04', sic: '70229', industry: 'Management consultancy',
  office: { line1: '71 Shelton Row', city: 'London', postcode: 'EC1V 2NX' }, volume: 140000, receivedAt: '2026-10-05T10:44:00Z', analyst: 'Aisha Okafor',
  officers: [person('O1', 'Gareth Lloyd-Pryce', { dob: '1979-08', appointedOn: '2022-10-04' })],
  holders: [ind('Gareth Lloyd-Pryce', 100, '1979-08')],
}));

apps.push(buildApp({
  id: 'NB-24114', name: 'Wren & Fable Books Ltd', number: '11203577', incorporatedOn: '2018-02-12', sic: '47610', industry: 'Independent bookshop',
  office: { line1: '14 Low Petergate', city: 'York', postcode: 'YO1 7HH' }, volume: 32000, receivedAt: '2026-10-06T08:20:00Z', analyst: 'Unassigned',
  officers: [person('O1', 'Harriet Wren', { dob: '1985-11', appointedOn: '2018-02-12' }), person('O2', 'Joel Fable', { dob: '1983-07', appointedOn: '2018-02-12' })],
  holders: [ind('Harriet Wren', 50, '1985-11'), ind('Joel Fable', 50, '1983-07')],
}));

void rebuildDocs;
export const APPLICATIONS = apps;
