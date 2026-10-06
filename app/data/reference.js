// Synthetic reference data. Every list, person, company and article here is fictional.

export const AS_OF = '2026-10-06';

export const SANCTIONS_LIST = {
  title: 'Consolidated sanctions list (synthetic extract)',
  entries: [
    { id: 'SL-40217', kind: 'person', name: 'Viktor Aleksandr Morozan', dob: '1968-03', nationality: 'Moldovan', regime: 'Synthetic regime A (asset freeze)', listedOn: '2023-02-24', aliases: ['Viktor Morozan'] },
    { id: 'SL-40381', kind: 'person', name: 'Chen Dawei', dob: '1959-11', nationality: 'Singaporean', regime: 'Synthetic regime C (export controls)', listedOn: '2022-07-01', aliases: [] },
    { id: 'SL-40502', kind: 'person', name: 'Rustam Karimovich Sabirov', dob: '1975-06', nationality: 'Kyrgyz', regime: 'Synthetic regime A (asset freeze)', listedOn: '2024-05-13', aliases: [] },
    { id: 'SL-40633', kind: 'person', name: 'Yousef Karim Haddad', dob: '1971-09', nationality: 'Lebanese', regime: 'Synthetic regime B (terrorist financing)', listedOn: '2021-10-19', aliases: [] },
    { id: 'SL-40790', kind: 'entity', name: 'Volgaline Shipping Agency', regime: 'Synthetic regime A (asset freeze)', listedOn: '2023-02-24', aliases: [] },
    { id: 'SL-40815', kind: 'person', name: 'Ilse Marta Vrank', dob: '1964-01', nationality: 'Austrian', regime: 'Synthetic regime D (corruption)', listedOn: '2025-03-03', aliases: [] },
  ],
};

export const PEP_LIST = {
  title: 'Politically exposed persons register (synthetic extract)',
  entries: [
    { id: 'PEP-7712', name: 'Fiona Margaret Kerrigan', dob: '1977-04', nationality: 'British', position: 'Elected councillor, finance committee chair, synthetic borough council (domestic PEP)', since: '2022-05' },
    { id: 'PEP-7790', name: 'Tomasz Wieczorek', dob: '1961-12', nationality: 'Polish', position: 'Deputy minister of transport, synthetic government (foreign PEP)', since: '2019-11' },
    { id: 'PEP-7804', name: 'Adaeze Nwosu', dob: '1983-02', nationality: 'Nigerian', position: 'Board member, synthetic state-owned port authority (foreign PEP)', since: '2024-01' },
  ],
};

export const DISQUALIFIED_DIRECTORS = {
  title: 'Disqualified directors register (synthetic extract)',
  entries: [
    { id: 'DQ-11903', name: 'Gareth Lloyd Price', dob: '1979-08', nationality: 'British', period: '2022-03-01 to 2030-02-28', reason: 'Unfit conduct: trading while insolvent, failure to keep accounting records' },
    { id: 'DQ-11957', name: 'Darren Michael Holt', dob: '1972-05', nationality: 'British', period: '2021-11-15 to 2028-11-14', reason: 'Bounce-back loan misuse' },
    { id: 'DQ-12044', name: 'Sandra Okonjo', dob: '1985-10', nationality: 'British', period: '2024-06-10 to 2031-06-09', reason: 'VAT fraud facilitation' },
  ],
};

// Registered-address density from a synthetic registry address search.
export const ADDRESS_INDEX = {
  'EC1V2NX|71': { label: '71 Shelton Row, London EC1V 2NX', activeCompanies: 46, note: 'Registered-office provider address', officerClusters: { 'Gareth Lloyd-Pryce': 12 } },
  'M43JR|12': { label: '12 Hilton Mews, Manchester M4 3JR', activeCompanies: 31, note: 'Serviced office and co-working building', officerClusters: {} },
  'E28DY|3': { label: '3 Kelso Yard, London E2 8DY', activeCompanies: 24, note: 'Registered-office provider address', officerClusters: {} },
};

// Northbank onboarding policy tables (synthetic).
export const JURISDICTION_TABLE = {
  'United Kingdom': { tier: 'standard', bearerRisk: false },
  Scotland: { tier: 'standard', bearerRisk: false },
  Jersey: { tier: 'enhanced-review', bearerRisk: false },
  Cyprus: { tier: 'enhanced-review', bearerRisk: false },
  'British Virgin Islands': { tier: 'enhanced-review', bearerRisk: false },
  Seychelles: { tier: 'high', bearerRisk: true },
  Panama: { tier: 'high', bearerRisk: true },
  Netherlands: { tier: 'standard', bearerRisk: false },
  Ireland: { tier: 'standard', bearerRisk: false },
};

export const HIGH_RISK_SECTORS = [
  { sic: '64999', label: 'Payment services / money remittance' },
  { sic: '66190', label: 'Crypto-asset exchange or custody' },
  { sic: '92000', label: 'Gambling and betting' },
  { sic: '46480', label: 'Wholesale of precious metals and jewellery' },
];

export const MEDIA_CORPUS = [
  {
    id: 'M-3301', outlet: 'Northern Ledger (synthetic)', date: '2026-06-14', category: 'tax-investigation',
    headline: 'Media firm named in HMRC VAT inquiry, filings show',
    subjects: ['Kestrel Lane Media', 'Owen Pritchard'],
    lines: [
      'Kestrel Lane Media Ltd, the Leeds-based video production company, is among six firms named in a VAT repayment inquiry, according to tribunal papers.',
      'The papers allege the company reclaimed input VAT on equipment invoices that the inquiry has not been able to trace to a supplier.',
      'Director Owen Pritchard told the Ledger the claims were "an administrative error by our former bookkeeper" and that the company is cooperating.',
      'No charges have been brought. The tribunal hearing is listed for early 2027.',
    ],
  },
  {
    id: 'M-3318', outlet: 'Trade Freight Weekly (synthetic)', date: '2025-11-02', category: 'neutral',
    headline: 'Irwell Freight wins regional grocery contract',
    subjects: ['Irwell Freight & Logistics'],
    lines: [
      'Irwell Freight & Logistics has won a two-year contract to run chilled deliveries for a regional grocery chain.',
      'The Manchester firm says it will add 14 vehicles to its fleet.',
    ],
  },
  {
    id: 'M-3342', outlet: 'Coastal Business Review (synthetic)', date: '2024-03-21', category: 'fraud',
    headline: 'Investors left out of pocket as Brightwater Trading collapses',
    subjects: ['Brightwater Trading'],
    lines: [
      'Brightwater Trading Ltd, a Plymouth commodities start-up, stopped returning investor calls in February.',
      'Three investors say they paid deposits for shipments that never arrived and have reported the firm to Action Fraud.',
      'The company later changed its name and moved its registered office, registry filings show.',
    ],
  },
  {
    id: 'M-3360', outlet: 'Glasgow Evening Courier (synthetic)', date: '2026-02-09', category: 'neutral',
    headline: 'Glenmorrach Distillery opens visitor centre',
    subjects: ['Glenmorrach Distillery'],
    lines: [
      'Glenmorrach Distillery has opened a visitor centre at its Speyside site, creating nine jobs.',
    ],
  },
  {
    id: 'M-3377', outlet: 'City Wire Daily (synthetic)', date: '2025-09-30', category: 'financial-crime',
    headline: 'Payments boss charged over laundering of fraud proceeds',
    subjects: ['Marek Dolan'],
    lines: [
      'Marek Dolan, 51, former managing director of a Croydon payments processor, has been charged with laundering the proceeds of invoice fraud.',
      'Prosecutors say more than £2.1m passed through merchant accounts he controlled between 2021 and 2023.',
      'He denies the charges.',
    ],
  },
];
