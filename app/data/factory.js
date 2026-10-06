// Builders for synthetic KYB applications. A builder produces an internally
// consistent application; individual cases then override fields to seed risk.

const clone = (o) => JSON.parse(JSON.stringify(o));

function fmtAddr(a) {
  return [a.line1, a.line2, a.city, a.postcode].filter(Boolean).join(', ');
}

export function person(id, name, opts = {}) {
  return {
    id, name, role: opts.role || 'Director', appointedOn: opts.appointedOn || '2019-04-01', resignedOn: opts.resignedOn || null,
    dob: opts.dob || '1980-01', nationality: opts.nationality || 'British', otherAppointments: opts.otherAppointments || [],
  };
}

export function buildDocs(app) {
  const name = app.registry.name;
  const num = app.registry.companyNumber;
  const ro = app.registry.registeredOffice;
  const ta = app.application.tradingAddress || ro;
  return [
    {
      id: 'D1', type: 'certificate', title: 'Certificate of incorporation', issuedOn: app.registry.incorporatedOn,
      lines: [
        'CERTIFICATE OF INCORPORATION OF A PRIVATE LIMITED COMPANY',
        `Company number ${num}`,
        `The Registrar of Companies hereby certifies that ${name.toUpperCase()}`,
        'is this day incorporated under the Companies Act 2006 as a private company,',
        'that the company is limited by shares, and the situation of its registered office is in',
        `${app.registry.jurisdictionLabel || 'England and Wales'}. Given on ${app.registry.incorporatedOn}.`,
      ],
      fields: { companyName: { value: name, line: 3 }, companyNumber: { value: num, line: 2 } },
    },
    {
      id: 'D2', type: 'bank-statement', title: 'Business bank statement (current provider)', issuedOn: app.docDates?.statement || '2026-09-01',
      lines: [
        'Statement of account, business current account',
        `Account name: ${name}`,
        `Address: ${fmtAddr(ta)}`,
        `Statement period: ${app.docDates?.statementPeriod || '01 Aug 2026 to 31 Aug 2026'}`,
        `Money in: £${(app.application.expectedMonthlyVolumeGBP * 0.9).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`,
      ],
      fields: { companyName: { value: name, line: 2 }, address: { value: clone(ta), line: 3 } },
    },
    {
      id: 'D3', type: 'proof-of-address', title: 'Utility bill (proof of trading address)', issuedOn: app.docDates?.utility || '2026-08-18',
      lines: [
        'Commercial electricity supply, quarterly bill',
        `Customer: ${name}`,
        `Supply address: ${fmtAddr(ta)}`,
        `Bill date: ${app.docDates?.utility || '2026-08-18'}`,
      ],
      fields: { companyName: { value: name, line: 2 }, address: { value: clone(ta), line: 3 } },
    },
  ];
}

/**
 * Build a clean application. spec: {
 *  id, name, number, incorporatedOn, sic, industry, office, trading, volume, officers, holders,
 *  receivedAt, analyst, status, website, tradingName
 * }
 */
export function buildApp(spec) {
  const officers = spec.officers.map((o) => clone(o));
  const holders = clone(spec.holders);
  const app = {
    id: spec.id,
    receivedAt: spec.receivedAt || '2026-10-06T07:30:00Z',
    analyst: spec.analyst || 'Unassigned',
    status: spec.status || 'Ready for review',
    docDates: spec.docDates || null,
    application: {
      legalName: spec.name,
      tradingName: spec.tradingName || null,
      companyNumber: spec.number,
      registeredAddress: clone(spec.office),
      tradingAddress: clone(spec.trading || spec.office),
      industry: spec.industry,
      sic: spec.sic,
      yearsTrading: spec.yearsTrading ?? Math.max(0, Math.floor((Date.parse('2026-10-06') - Date.parse(spec.incorporatedOn)) / 31557600000)),
      expectedMonthlyVolumeGBP: spec.volume,
      website: spec.website || null,
      purpose: spec.purpose || 'Business current account for supplier payments and card acquiring settlement',
      directors: officers.filter((o) => !o.resignedOn && o.role === 'Director').map((o) => o.name),
      ubos: [],
    },
    registry: {
      companyNumber: spec.number,
      name: spec.name,
      previousNames: spec.previousNames || [],
      status: spec.registryStatus || 'active',
      dissolvedOn: spec.dissolvedOn || null,
      type: 'Private limited company',
      jurisdictionLabel: spec.jurisdictionLabel || (String(spec.number).startsWith('SC') ? 'Scotland' : 'England and Wales'),
      incorporatedOn: spec.incorporatedOn,
      sic: [spec.sic],
      registeredOffice: clone(spec.office),
      accounts: spec.accounts || [
        { madeUpTo: '2025-12-31', type: 'small', filedOn: '2026-07-22' },
        { madeUpTo: '2024-12-31', type: 'small', filedOn: '2025-08-30' },
      ],
      filings: spec.filings || [
        { date: '2026-07-22', type: 'AA', description: 'Accounts made up to 31 December 2025' },
        { date: '2026-04-11', type: 'CS01', description: 'Confirmation statement, no updates' },
      ],
      officers,
      psc: holders.filter((h) => h.pct >= 25).map((h) => ({ name: h.name, kind: h.type, control: `Ownership of shares, ${h.pct >= 75 ? '75% or more' : h.pct >= 50 ? 'more than 50% but less than 75%' : '25% to 50%'}` })),
    },
    ownership: { name: spec.name, type: 'company', jurisdiction: 'United Kingdom', holders },
  };
  app.application.ubos = effectiveIndividuals(app.ownership).filter((u) => u.pct >= 25).map((u) => ({ name: u.name, pct: Math.round(u.pct * 10) / 10 }));
  app.documents = buildDocs(app);
  return app;
}

function effectiveIndividuals(node, factor = 1, out = []) {
  for (const h of node.holders || []) {
    const share = factor * (h.pct / 100);
    if (h.type === 'individual') {
      const ex = out.find((o) => o.name === h.name);
      if (ex) ex.pct += share * 100; else out.push({ name: h.name, pct: share * 100 });
    } else {
      effectiveIndividuals(h, share, out);
    }
  }
  return out;
}

export function rebuildDocs(app) {
  app.documents = buildDocs(app);
  return app;
}

export { clone };
