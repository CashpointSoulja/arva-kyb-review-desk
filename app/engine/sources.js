// Turns an application plus the reference entries cited by checks into
// numbered source lines. Every evidence anchor a check emits resolves here.
import { addressText, addressKey } from './normalise.js';

const gbp = (n) => `£${Number(n).toLocaleString('en-GB')}`;

function ownershipLines(node, path, depth, out) {
  out.push({
    anchor: path,
    label: depth === 0 ? 'Applicant' : `${'· '.repeat(depth - 1)}${node.type === 'individual' ? 'Individual' : 'Company'}`,
    text: depth === 0
      ? `${node.name} (${node.jurisdiction})`
      : `${node.name}, ${node.pct}%${node.jurisdiction ? `, ${node.jurisdiction}` : ''}${node.type === 'individual' && node.dob ? `, born ${node.dob}` : ''}${node.bearer ? ', BEARER SHARES' : ''}${node.nominee ? ', NOMINEE' : ''}`,
    depth,
  });
  (node.holders || []).forEach((h, i) => ownershipLines(h, `${path}/${i}`, depth + 1, out));
}

export function buildSources(app, checks, ref) {
  const a = app.application;
  const r = app.registry;
  const sources = [];

  sources.push({
    id: 'APP', kind: 'application', title: 'Application form (submitted to Northbank)',
    lines: [
      ['legalName', 'Legal name', a.legalName],
      ['tradingName', 'Trading name', a.tradingName || 'None given'],
      ['companyNumber', 'Company number', a.companyNumber],
      ['registeredAddress', 'Registered address', addressText(a.registeredAddress)],
      ['tradingAddress', 'Trading address', addressText(a.tradingAddress)],
      ['industry', 'Industry', `${a.industry} (SIC ${a.sic})`],
      ['yearsTrading', 'Years trading', String(a.yearsTrading)],
      ['expectedMonthlyVolumeGBP', 'Expected monthly volume', gbp(a.expectedMonthlyVolumeGBP)],
      ['purpose', 'Account purpose', a.purpose],
      ['directors', 'Declared directors', a.directors.join('; ')],
      ['ubos', 'Declared UBOs', a.ubos.length ? a.ubos.map((u) => `${u.name} ${u.pct}%`).join('; ') : 'None declared'],
    ].map(([k, label, text]) => ({ anchor: `APP/${k}`, label, text })),
  });

  const reg = [
    { anchor: 'REG/name', label: 'Company name', text: r.name },
    { anchor: 'REG/companyNumber', label: 'Company number', text: r.companyNumber },
    { anchor: 'REG/status', label: 'Company status', text: r.status },
  ];
  if (r.dissolvedOn) reg.push({ anchor: 'REG/dissolvedOn', label: 'Dissolved on', text: r.dissolvedOn });
  reg.push(
    { anchor: 'REG/incorporatedOn', label: 'Incorporated on', text: r.incorporatedOn },
    { anchor: 'REG/type', label: 'Company type', text: r.type },
    { anchor: 'REG/sic', label: 'Nature of business (SIC)', text: r.sic.join(', ') },
    { anchor: 'REG/registeredOffice', label: 'Registered office', text: addressText(r.registeredOffice) },
  );
  r.previousNames.forEach((p, i) => reg.push({ anchor: `REG/previousName/${i}`, label: 'Previous name', text: `${p.name} (until ${p.until})` }));
  r.accounts.forEach((acc, i) => reg.push({ anchor: `REG/accounts/${i}`, label: 'Accounts', text: `Made up to ${acc.madeUpTo}: ${acc.type} (filed ${acc.filedOn})` }));
  r.filings.forEach((f, i) => reg.push({ anchor: `REG/filing/${i}`, label: `Filing ${f.type}`, text: `${f.date}: ${f.description}` }));
  r.officers.forEach((o) => {
    reg.push({ anchor: `REG/officer/${o.id}`, label: o.role, text: `${o.name}, born ${o.dob}, ${o.nationality}, appointed ${o.appointedOn}${o.resignedOn ? `, resigned ${o.resignedOn}` : ''}` });
    o.otherAppointments.forEach((ap, i) => reg.push({ anchor: `REG/officer/${o.id}/appt/${i}`, label: '· Other appointment', text: `${ap.company} (${ap.number}): ${ap.status}${ap.dissolvedOn ? ` ${ap.dissolvedOn}` : ''}` }));
  });
  r.psc.forEach((p, i) => reg.push({ anchor: `REG/psc/${i}`, label: 'Person with significant control', text: `${p.name}: ${p.control}` }));
  sources.push({ id: 'REG', kind: 'registry', title: `Companies register entry ${r.companyNumber} (synthetic)`, lines: reg });

  const own = [];
  ownershipLines(app.ownership, 'OWN', 0, own);
  sources.push({ id: 'OWN', kind: 'ownership', title: 'Ownership structure (register filings plus declared structure chart)', lines: own });

  app.documents.forEach((d) => sources.push({
    id: `DOC/${d.id}`, kind: 'document', title: `${d.id} · ${d.title}`, issuedOn: d.issuedOn,
    lines: d.lines.map((t, i) => ({ anchor: `DOC/${d.id}/L${i + 1}`, label: `L${i + 1}`, text: t })),
  }));
  // Line 0 of a document is its header line; checks cite L0 for whole-document findings.
  app.documents.forEach((d, k) => {
    const s = sources.find((x) => x.id === `DOC/${d.id}`);
    s.lines.unshift({ anchor: `DOC/${d.id}/L0`, label: 'Dated', text: `${d.title}, dated ${d.issuedOn}` });
    void k;
  });

  const cited = new Set(checks.flatMap((c) => c.findings.flatMap((f) => f.evidence)));
  const listSource = (prefix, list, fmt) => {
    const lines = list.entries.filter((e) => cited.has(`${prefix}/${e.id}`)).map((e) => ({ anchor: `${prefix}/${e.id}`, label: e.id, text: fmt(e) }));
    if (lines.length) sources.push({ id: prefix, kind: 'list', title: list.title, lines });
  };
  listSource('SAN', ref.sanctions, (e) => `${e.name}${e.dob ? `, born ${e.dob}` : ''}${e.nationality ? `, ${e.nationality}` : ''}. ${e.regime}, listed ${e.listedOn}`);
  listSource('PEP', ref.pep, (e) => `${e.name}, born ${e.dob}, ${e.nationality}. ${e.position}, since ${e.since}`);
  listSource('DQ', ref.disqualified, (e) => `${e.name}, born ${e.dob}, ${e.nationality}. Disqualified ${e.period}: ${e.reason}`);

  for (const art of ref.media) {
    if (![...cited].some((c) => c.startsWith(`MED/${art.id}/`))) continue;
    sources.push({ id: `MED/${art.id}`, kind: 'media', title: `${art.outlet} · ${art.date} · "${art.headline}"`, lines: art.lines.map((t, i) => ({ anchor: `MED/${art.id}/L${i}`, label: `¶${i + 1}`, text: t })) });
  }
  const key = addressKey(r.registeredOffice);
  if (cited.has(`ADDR/${key}`)) {
    const idx = ref.addressIndex[key];
    sources.push({ id: 'ADDR', kind: 'list', title: 'Registered-address search (synthetic)', lines: [{ anchor: `ADDR/${key}`, label: 'Address', text: `${idx.label}: ${idx.activeCompanies} active companies. ${idx.note}.` }] });
  }
  return sources;
}

export function anchorIndex(sources) {
  const m = new Map();
  for (const s of sources) for (const l of s.lines) m.set(l.anchor, { ...l, sourceId: s.id, sourceTitle: s.title });
  return m;
}
