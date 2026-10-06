// Deterministic KYB check engine. Each check is plain code with its rule text
// shown to the analyst, and every finding cites source anchors (see sources.js).
import { basic, companyCore, companyNumber, addressKey, addressText, monthsBetween, yearsBetween } from './normalise.js';
import { matchPerson, matchCompanyName, STRENGTH_LABEL } from './match.js';

export const ENGINE_VERSION = 'kyb-rules 1.4.0';

const SEV_RANK = { none: 0, low: 1, medium: 2, high: 3 };

function result(def, status, severity, summary, findings = []) {
  return { id: def.id, category: def.category, name: def.name, rule: def.rule, status, severity, summary, findings };
}

const activeOfficers = (app) => app.registry.officers.filter((o) => !o.resignedOn);

export function ownershipPeople(node, path = 'OWN', factor = 1, out = []) {
  (node.holders || []).forEach((h, i) => {
    const p = `${path}/${i}`;
    const eff = factor * (h.pct / 100);
    if (h.type === 'individual') out.push({ ...h, anchor: p, effectivePct: eff * 100 });
    else ownershipPeople(h, p, eff, out);
  });
  return out;
}

export function ownershipNodes(node, path = 'OWN', depth = 0, out = []) {
  out.push({ node, path, depth });
  (node.holders || []).forEach((h, i) => ownershipNodes(h, `${path}/${i}`, depth + 1, out));
  return out;
}

export function corporateDepth(node) {
  let max = 0;
  for (const h of node.holders || []) {
    if (h.type !== 'individual') max = Math.max(max, 1 + corporateDepth(h));
  }
  return max;
}

// ---------------------------------------------------------------- Registry
export const REG01 = {
  id: 'REG-01', category: 'Registry', name: 'Registry status',
  rule: 'registry.status must be "active". dissolved, liquidation or administration is a hard stop; "proposal to strike off" is a flag.',
  run(app) {
    const s = app.registry.status;
    if (s === 'active') return result(this, 'pass', 'none', 'Company is active on the register.', [{ text: 'Status: active', evidence: ['REG/status'] }]);
    if (s === 'proposal-to-strike-off') return result(this, 'flag', 'medium', 'Registrar has proposed striking the company off.', [{ text: 'Status: active, proposal to strike off', evidence: ['REG/status'] }]);
    const ev = ['REG/status']; if (app.registry.dissolvedOn) ev.push('REG/dissolvedOn');
    return result(this, 'fail', 'high', `Company is ${s} on the register. It cannot open an account.`, [{ text: `Status: ${s}${app.registry.dissolvedOn ? ` since ${app.registry.dissolvedOn}` : ''}`, evidence: ev }]);
  },
};

export const REG02 = {
  id: 'REG-02', category: 'Registry', name: 'Dormant accounts vs trading claim',
  rule: 'If the latest filed accounts are "dormant" but the application claims trading history and expected volume > £0, flag.',
  run(app) {
    const last = app.registry.accounts[0];
    if (!last) return result(this, 'flag', 'low', 'No accounts filed yet, so trading claims cannot be checked against filings.', [{ text: 'No accounts on file', evidence: ['REG/incorporatedOn'] }]);
    if (last.type === 'dormant' && app.application.expectedMonthlyVolumeGBP > 0 && app.application.yearsTrading > 0) {
      return result(this, 'flag', 'medium', `Latest accounts (to ${last.madeUpTo}) are dormant, yet the application claims ${app.application.yearsTrading} years trading.`, [
        { text: `Accounts to ${last.madeUpTo}: dormant`, evidence: ['REG/accounts/0'] },
        { text: `Claims ${app.application.yearsTrading} years trading and £${app.application.expectedMonthlyVolumeGBP.toLocaleString('en-GB')} per month`, evidence: ['APP/yearsTrading', 'APP/expectedMonthlyVolumeGBP'] },
      ]);
    }
    return result(this, 'pass', 'none', `Latest accounts (${last.type}, to ${last.madeUpTo}) are consistent with a trading company.`, [{ text: `Accounts to ${last.madeUpTo}: ${last.type}`, evidence: ['REG/accounts/0'] }]);
  },
};

export const REG03 = {
  id: 'REG-03', category: 'Registry', name: 'Incorporation age vs years trading',
  rule: 'Claimed years trading must not exceed company age + 1 year. A predecessor business is possible, so this is a flag for evidence, not a fail.',
  run(app, ctx) {
    const age = yearsBetween(app.registry.incorporatedOn, ctx.asOf);
    const claim = app.application.yearsTrading;
    const ev = [{ text: `Incorporated ${app.registry.incorporatedOn} (${age.toFixed(1)} years ago)`, evidence: ['REG/incorporatedOn'] }, { text: `Application claims ${claim} years trading`, evidence: ['APP/yearsTrading'] }];
    if (claim > age + 1) return result(this, 'flag', 'medium', `Claims ${claim} years trading but the company is ${age.toFixed(1)} years old. Ask whether a predecessor sole trader or partnership existed.`, ev);
    return result(this, 'pass', 'none', `Trading claim (${claim} yrs) fits company age (${age.toFixed(1)} yrs).`, ev);
  },
};

export const REG04 = {
  id: 'REG-04', category: 'Registry', name: 'Dormant-then-active pattern',
  rule: 'Dormant accounts in the last 24 months AND a new officer or PSC change in the last 12 months AND expected volume ≥ £50,000/month → high-risk reactivation pattern.',
  run(app, ctx) {
    const dormantIdx = app.registry.accounts.findIndex((a) => a.type === 'dormant' && monthsBetween(a.madeUpTo, ctx.asOf) <= 24);
    const recentOfficers = app.registry.officers.map((o, i) => ({ o, i })).filter(({ o }) => monthsBetween(o.appointedOn, ctx.asOf) <= 12);
    const pscFilings = app.registry.filings.map((f, i) => ({ f, i })).filter(({ f }) => /^PSC/.test(f.type) && monthsBetween(f.date, ctx.asOf) <= 12);
    const vol = app.application.expectedMonthlyVolumeGBP;
    if (dormantIdx >= 0 && (recentOfficers.length || pscFilings.length) && vol >= 50000) {
      const findings = [{ text: `Dormant accounts to ${app.registry.accounts[dormantIdx].madeUpTo}`, evidence: [`REG/accounts/${dormantIdx}`] }];
      recentOfficers.forEach(({ o }) => findings.push({ text: `${o.name} appointed ${o.appointedOn}`, evidence: [`REG/officer/${o.id}`] }));
      pscFilings.forEach(({ f, i }) => findings.push({ text: `${f.type} filed ${f.date}: ${f.description}`, evidence: [`REG/filing/${i}`] }));
      findings.push({ text: `Expected volume £${vol.toLocaleString('en-GB')}/month`, evidence: ['APP/expectedMonthlyVolumeGBP'] });
      return result(this, 'flag', 'high', 'A dormant company changed control recently and now expects high volume: a common shell-reactivation pattern.', findings);
    }
    return result(this, 'pass', 'none', 'No dormant-then-active pattern.', []);
  },
};

// ---------------------------------------------------------------- Directors
export const DIR01 = {
  id: 'DIR-01', category: 'Directors', name: 'Disqualified-director near-match',
  rule: 'Each active officer is compared with the disqualified directors register using name tokens, date of birth and nationality. Strong match → fail; possible → flag (high); weak → shown with reasons, no flag.',
  run(app, ctx) {
    const findings = []; let worst = 'none';
    const order = ['none', 'weak', 'possible', 'strong'];
    for (const o of activeOfficers(app)) {
      for (const e of ctx.ref.disqualified.entries) {
        const m = matchPerson(o, e);
        if (m.strength === 'none') continue;
        findings.push({ text: `${o.name} vs ${e.name} (${e.id}): ${STRENGTH_LABEL[m.strength]}`, evidence: [`REG/officer/${o.id}`, `DQ/${e.id}`], reasoning: m });
        if (order.indexOf(m.strength) > order.indexOf(worst)) worst = m.strength;
      }
    }
    if (worst === 'strong') return result(this, 'fail', 'high', 'An active officer strongly matches a disqualified director.', findings);
    if (worst === 'possible') return result(this, 'flag', 'high', 'An active officer possibly matches a disqualified director. Analyst must confirm or discount.', findings);
    return result(this, 'pass', 'none', findings.length ? 'Only weak name overlaps; reasons shown.' : 'No officer resembles a register entry.', findings);
  },
};

export const DIR02 = {
  id: 'DIR-02', category: 'Directors', name: 'Dissolved-company history',
  rule: 'Count each active officer\'s other appointments at companies dissolved in the last 36 months. 2 → low; 3 or more → medium.',
  run(app, ctx) {
    const findings = []; let sev = 'none';
    for (const o of activeOfficers(app)) {
      const hits = o.otherAppointments.map((a, i) => ({ a, i })).filter(({ a }) => a.status === 'dissolved' && a.dissolvedOn && monthsBetween(a.dissolvedOn, ctx.asOf) <= 36);
      if (hits.length >= 2) {
        const s = hits.length >= 3 ? 'medium' : 'low';
        if (SEV_RANK[s] > SEV_RANK[sev]) sev = s;
        findings.push({ text: `${o.name}: ${hits.length} companies dissolved in 36 months (${hits.map(({ a }) => a.company).join(', ')})`, evidence: [`REG/officer/${o.id}`, ...hits.map(({ i }) => `REG/officer/${o.id}/appt/${i}`)] });
      }
    }
    if (sev === 'none') return result(this, 'pass', 'none', 'No officer has a recent run of dissolved companies.', []);
    return result(this, 'flag', sev, 'An officer has a recent run of dissolved companies (phoenixing risk).', findings);
  },
};

export const DIR03 = {
  id: 'DIR-03', category: 'Directors', name: 'Shared registered address',
  rule: 'Registered office shared by ≥ 20 active companies → low flag. An active officer appointed at ≥ 5 companies at that address → medium.',
  run(app, ctx) {
    const key = addressKey(app.registry.registeredOffice);
    const idx = ctx.ref.addressIndex[key];
    if (!idx || idx.activeCompanies < 20) return result(this, 'pass', 'none', `Registered office is not a high-density address${idx ? ` (${idx.activeCompanies} companies)` : ''}.`, [{ text: addressText(app.registry.registeredOffice), evidence: ['REG/registeredOffice'] }]);
    const findings = [{ text: `${idx.activeCompanies} active companies registered at ${idx.label}`, evidence: ['REG/registeredOffice', `ADDR/${key}`] }];
    let sev = 'low';
    for (const o of activeOfficers(app)) {
      const n = idx.officerClusters[o.name] || 0;
      if (n >= 5) { sev = 'medium'; findings.push({ text: `${o.name} is an officer of ${n} companies at this address`, evidence: [`REG/officer/${o.id}`, `ADDR/${key}`] }); }
    }
    return result(this, 'flag', sev, sev === 'medium' ? 'High-density address with an officer cluster.' : 'High-density registered address. Often benign (formation agent or serviced office), so it is a low flag.', findings);
  },
};

export const DIR04 = {
  id: 'DIR-04', category: 'Directors', name: 'Declared directors vs registry',
  rule: 'Directors declared on the application must equal the active directors on the register (normalised names).',
  run(app) {
    const reg = activeOfficers(app).filter((o) => o.role === 'Director');
    const regNames = reg.map((o) => basic(o.name));
    const decl = app.application.directors.map(basic);
    const missingOnApp = reg.filter((o) => !decl.includes(basic(o.name)));
    const notOnReg = app.application.directors.filter((d) => !regNames.includes(basic(d)));
    if (!missingOnApp.length && !notOnReg.length) return result(this, 'pass', 'none', `All ${reg.length} directors match the register.`, [{ text: app.application.directors.join(', '), evidence: ['APP/directors'] }]);
    const findings = [];
    missingOnApp.forEach((o) => findings.push({ text: `${o.name} is a director on the register but not declared`, evidence: [`REG/officer/${o.id}`, 'APP/directors'] }));
    notOnReg.forEach((d) => findings.push({ text: `${d} is declared but not an active director on the register`, evidence: ['APP/directors'] }));
    return result(this, 'flag', 'medium', 'Declared directors do not match the register.', findings);
  },
};

// ---------------------------------------------------------------- Ownership
export const OWN01 = {
  id: 'OWN-01', category: 'Ownership', name: 'Shareholdings sum to 100%',
  rule: 'At every company in the ownership tree, direct holdings must sum to 100% ± 0.5. Any gap is unexplained ownership.',
  run(app) {
    const findings = [];
    for (const { node, path } of ownershipNodes(app.ownership)) {
      if (node.type === 'individual' || !node.holders) continue;
      const sum = node.holders.reduce((s, h) => s + h.pct, 0);
      if (Math.abs(sum - 100) > 0.5) findings.push({ text: `${node.name}: holdings sum to ${sum}% (${(100 - sum).toFixed(1)}% unaccounted)`, evidence: [path, ...node.holders.map((_, i) => `${path}/${i}`)] });
    }
    if (findings.length) return result(this, 'flag', 'medium', 'Ownership does not add up to 100% somewhere in the tree.', findings);
    return result(this, 'pass', 'none', 'Holdings sum to 100% at every level.', [{ text: app.ownership.holders.map((h) => `${h.name} ${h.pct}%`).join(' + '), evidence: ['OWN'] }]);
  },
};

export const OWN02 = {
  id: 'OWN-02', category: 'Ownership', name: 'Layered ownership depth',
  rule: '3 or more corporate layers between the applicant and an individual → medium flag. Non-UK layers are listed with their policy tier.',
  run(app, ctx) {
    const depth = corporateDepth(app.ownership);
    const foreign = ownershipNodes(app.ownership).filter(({ node }) => node.type !== 'individual' && node.jurisdiction && !['United Kingdom', 'Scotland'].includes(node.jurisdiction));
    const findings = foreign.map(({ node, path }) => ({ text: `${node.name} (${node.jurisdiction}, policy tier: ${(ctx.ref.jurisdictions[node.jurisdiction] || { tier: 'unlisted' }).tier})`, evidence: [path] }));
    if (depth >= 3) return result(this, 'flag', 'medium', `${depth} corporate layers before an individual owner.`, [{ text: `Corporate depth ${depth}`, evidence: ['OWN'] }, ...findings]);
    return result(this, 'pass', 'none', `${depth} corporate layer${depth === 1 ? '' : 's'}; below the layering threshold.`, findings);
  },
};

export const OWN03 = {
  id: 'OWN-03', category: 'Ownership', name: 'Bearer-share and nominee risk',
  rule: 'Any holder recorded as bearer shares or nominee, or incorporated in a jurisdiction the policy table marks bearerRisk, → high flag.',
  run(app, ctx) {
    const findings = [];
    for (const { node, path } of ownershipNodes(app.ownership).slice(1)) {
      const j = ctx.ref.jurisdictions[node.jurisdiction];
      if (node.bearer) findings.push({ text: `${node.name}: holding recorded as bearer shares`, evidence: [path] });
      if (node.nominee) findings.push({ text: `${node.name}: holding is through a nominee`, evidence: [path] });
      if (node.type !== 'individual' && j && j.bearerRisk) findings.push({ text: `${node.name}: ${node.jurisdiction} is marked bearerRisk in the policy table`, evidence: [path] });
    }
    if (findings.length) return result(this, 'flag', 'high', 'Ownership includes bearer-share or nominee features that can hide the real owner.', findings);
    return result(this, 'pass', 'none', 'No bearer-share or nominee features.', []);
  },
};

export const OWN04 = {
  id: 'OWN-04', category: 'Ownership', name: 'UBO resolution',
  rule: 'Multiply holdings down the tree to get each individual\'s effective %. Every individual ≥ 25% must be declared as a UBO (within 5 points), and every declared UBO must resolve.',
  run(app) {
    const people = ownershipPeople(app.ownership);
    const merged = {};
    people.forEach((p) => { const k = basic(p.name); merged[k] = merged[k] || { name: p.name, pct: 0, anchors: [] }; merged[k].pct += p.effectivePct; merged[k].anchors.push(p.anchor); });
    const ubos = Object.values(merged).filter((p) => p.pct >= 25 - 1e-9);
    const declared = app.application.ubos;
    const findings = []; let sev = 'none';
    for (const u of ubos) {
      const d = declared.find((x) => basic(x.name) === basic(u.name));
      if (!d) { sev = 'medium'; findings.push({ text: `${u.name} holds ${u.pct.toFixed(1)}% effective but is not declared as a UBO`, evidence: [...u.anchors, 'APP/ubos'] }); }
      else if (Math.abs(d.pct - u.pct) > 5) { if (sev === 'none') sev = 'low'; findings.push({ text: `${u.name}: declared ${d.pct}% vs ${u.pct.toFixed(1)}% computed`, evidence: [...u.anchors, 'APP/ubos'] }); }
    }
    for (const d of declared) {
      if (!ubos.find((u) => basic(u.name) === basic(d.name))) { sev = 'medium'; findings.push({ text: `Declared UBO ${d.name} (${d.pct}%) does not resolve to ≥ 25% in the ownership tree`, evidence: ['APP/ubos', 'OWN'] }); }
    }
    if (!ubos.length && !findings.length) findings.push({ text: 'No individual reaches 25%; senior managing official recorded instead', evidence: ['OWN'] });
    if (sev !== 'none') return result(this, 'flag', sev, 'Declared UBOs do not match the computed ownership.', findings);
    return result(this, 'pass', 'none', ubos.length ? `UBOs resolved: ${ubos.map((u) => `${u.name} ${u.pct.toFixed(1)}%`).join(', ')}.` : 'No individual ≥ 25%.', findings.length ? findings : ubos.map((u) => ({ text: `${u.name}: ${u.pct.toFixed(1)}% effective`, evidence: [...u.anchors, 'APP/ubos'] })));
  },
};

// ---------------------------------------------------------------- Screening
function screeningSubjects(app) {
  const people = activeOfficers(app).map((o) => ({ name: o.name, dob: o.dob, nationality: o.nationality, anchor: `REG/officer/${o.id}`, label: o.role }));
  for (const p of ownershipPeople(app.ownership)) {
    if (!people.find((x) => basic(x.name) === basic(p.name))) people.push({ name: p.name, dob: p.dob, nationality: p.nationality, anchor: p.anchor, label: 'Shareholder' });
  }
  return people;
}

function personScreen(app, list, prefix) {
  const findings = []; let best = 'none';
  const order = ['none', 'weak', 'possible', 'strong'];
  for (const s of screeningSubjects(app)) {
    for (const e of list.entries.filter((x) => x.kind !== 'entity')) {
      const m = matchPerson(s, e);
      if (m.strength === 'none') continue;
      findings.push({ text: `${s.name} (${s.label}) vs ${e.name} (${e.id}): ${STRENGTH_LABEL[m.strength]}`, evidence: [s.anchor, `${prefix}/${e.id}`], reasoning: m });
      if (order.indexOf(m.strength) > order.indexOf(best)) best = m.strength;
    }
  }
  return { findings, best };
}

export const SCR01 = {
  id: 'SCR-01', category: 'Screening', name: 'Sanctions screening',
  rule: 'Officers, individual shareholders and company names are compared with the sanctions list. Strong → fail; possible → flag (high); weak → shown with reasons, no flag. Entity names must match exactly or within 2 letters.',
  run(app, ctx) {
    const { findings, best } = personScreen(app, ctx.ref.sanctions, 'SAN');
    let entityHit = false;
    const names = [app.registry.name, app.application.tradingName].filter(Boolean);
    for (const e of ctx.ref.sanctions.entries.filter((x) => x.kind === 'entity')) {
      for (const n of names) {
        const r = matchCompanyName(n, e.name);
        if (r.relation !== 'none') { entityHit = true; findings.push({ text: `${n} vs ${e.name} (${e.id}): ${r.relation} name match`, evidence: ['REG/name', `SAN/${e.id}`] }); }
      }
    }
    if (best === 'strong' || entityHit) return result(this, 'fail', 'high', 'Strong sanctions match. Hard stop pending review.', findings);
    if (best === 'possible') return result(this, 'flag', 'high', 'Possible sanctions match. Read the reasons for and against before discounting.', findings);
    return result(this, 'pass', 'none', findings.length ? 'Weak overlaps only; reasons shown for the file.' : 'No sanctions overlap.', findings);
  },
};

export const SCR02 = {
  id: 'SCR-02', category: 'Screening', name: 'PEP screening',
  rule: 'Officers and individual shareholders compared with the PEP register. Strong or possible → medium flag (PEP status requires EDD; it is not a prohibition).',
  run(app, ctx) {
    const { findings, best } = personScreen(app, ctx.ref.pep, 'PEP');
    if (best === 'strong' || best === 'possible') return result(this, 'flag', 'medium', 'A connected person is likely a politically exposed person.', findings);
    return result(this, 'pass', 'none', findings.length ? 'Weak overlaps only.' : 'No PEP overlap.', findings);
  },
};

const ADVERSE_HIGH = ['financial-crime', 'fraud', 'sanctions-evasion'];

export const SCR03 = {
  id: 'SCR-03', category: 'Screening', name: 'Adverse media',
  rule: 'Current legal name, trading name and active officers are searched in the media corpus. Adverse categories: fraud / financial crime → high; tax investigation and other adverse → medium; neutral coverage is shown as info.',
  run(app, ctx) {
    const companyNames = [app.registry.name, app.application.tradingName].filter(Boolean);
    const people = activeOfficers(app);
    const findings = []; let sev = 'none';
    for (const art of ctx.ref.media) {
      for (const subj of art.subjects) {
        let hit = null;
        for (const n of companyNames) if (companyCore(n) === companyCore(subj)) hit = { who: n, anchor: 'REG/name', why: 'Company name matches exactly after removing legal suffixes' };
        for (const o of people) {
          const m = matchPerson(o, { name: subj });
          if (m.strength === 'possible' || m.strength === 'strong' || (m.strength === 'weak' && m.for.length >= 2)) hit = { who: o.name, anchor: `REG/officer/${o.id}`, why: 'Officer name appears in the article', reasoning: m };
        }
        if (!hit) continue;
        const lineIdx = Math.max(0, art.lines.findIndex((l) => basic(l).includes(companyCore(subj)) || basic(l).includes(basic(subj))));
        const s = art.category === 'neutral' ? 'none' : ADVERSE_HIGH.includes(art.category) ? 'high' : 'medium';
        if (SEV_RANK[s] > SEV_RANK[sev]) sev = s;
        findings.push({ text: `${art.outlet}, ${art.date}: "${art.headline}" (${art.category})`, evidence: [hit.anchor, `MED/${art.id}/L${lineIdx}`], reasoning: hit.reasoning || { strength: 'strong', for: [hit.why], against: art.category === 'neutral' ? ['Coverage is not adverse'] : ['Allegations in media are unproven unless the article reports a conviction'] } });
      }
    }
    if (sev !== 'none') return result(this, 'flag', sev, 'Adverse media found for the company or an officer.', findings);
    return result(this, 'pass', 'none', findings.length ? 'Only neutral coverage found.' : 'No media hits.', findings);
  },
};

// ---------------------------------------------------------------- Documents
export const DOC01 = {
  id: 'DOC-01', category: 'Documents', name: 'Company name consistency',
  rule: 'Legal name on the application, the register and every document must be identical after removing legal suffixes and punctuation.',
  run(app) {
    const ref = companyCore(app.registry.name);
    const findings = [];
    if (companyCore(app.application.legalName) !== ref) findings.push({ text: `Application says "${app.application.legalName}", register says "${app.registry.name}"`, evidence: ['APP/legalName', 'REG/name'] });
    for (const d of app.documents) {
      const f = d.fields.companyName;
      if (f && companyCore(f.value) !== ref) findings.push({ text: `${d.title} names "${f.value}"`, evidence: [`DOC/${d.id}/L${f.line}`, 'REG/name'] });
    }
    if (findings.length) return result(this, 'flag', 'medium', 'Company name differs across sources.', findings);
    return result(this, 'pass', 'none', `Name consistent across application, register and ${app.documents.length} documents.`, [{ text: app.registry.name, evidence: ['APP/legalName', 'REG/name', ...app.documents.filter((d) => d.fields.companyName).map((d) => `DOC/${d.id}/L${d.fields.companyName.line}`)] }]);
  },
};

export const DOC02 = {
  id: 'DOC-02', category: 'Documents', name: 'Company number consistency',
  rule: 'Company number on the application and documents must equal the register (zero-padded). A mismatch means the documents may belong to another entity: fail.',
  run(app) {
    const ref = companyNumber(app.registry.companyNumber);
    const findings = [];
    if (companyNumber(app.application.companyNumber) !== ref) findings.push({ text: `Application gives ${app.application.companyNumber}, register ${app.registry.companyNumber}`, evidence: ['APP/companyNumber', 'REG/companyNumber'] });
    for (const d of app.documents) {
      const f = d.fields.companyNumber;
      if (f && companyNumber(f.value) !== ref) findings.push({ text: `${d.title} shows ${f.value}`, evidence: [`DOC/${d.id}/L${f.line}`, 'REG/companyNumber'] });
    }
    if (findings.length) return result(this, 'fail', 'high', 'Company number mismatch. Documents may relate to a different company.', findings);
    return result(this, 'pass', 'none', `Company number ${ref} consistent.`, [{ text: ref, evidence: ['APP/companyNumber', 'REG/companyNumber', ...app.documents.filter((d) => d.fields.companyNumber).map((d) => `DOC/${d.id}/L${d.fields.companyNumber.line}`)] }]);
  },
};

export const DOC03 = {
  id: 'DOC-03', category: 'Documents', name: 'Address consistency',
  rule: 'Registered address on the application must match the register; trading-address documents must match the declared trading address (postcode + building number).',
  run(app) {
    const findings = [];
    if (addressKey(app.application.registeredAddress) !== addressKey(app.registry.registeredOffice)) findings.push({ text: `Application registered address "${addressText(app.application.registeredAddress)}" vs register "${addressText(app.registry.registeredOffice)}"`, evidence: ['APP/registeredAddress', 'REG/registeredOffice'] });
    for (const d of app.documents) {
      const f = d.fields.address;
      if (f && addressKey(f.value) !== addressKey(app.application.tradingAddress)) findings.push({ text: `${d.title} shows "${addressText(f.value)}" but declared trading address is "${addressText(app.application.tradingAddress)}"`, evidence: [`DOC/${d.id}/L${f.line}`, 'APP/tradingAddress'] });
    }
    if (findings.length) return result(this, 'flag', 'low', 'Address differs across sources. Often a recent move; ask for current proof of address.', findings);
    return result(this, 'pass', 'none', 'Addresses consistent.', [{ text: addressText(app.application.tradingAddress), evidence: ['APP/tradingAddress', ...app.documents.filter((d) => d.fields.address).map((d) => `DOC/${d.id}/L${d.fields.address.line}`)] }]);
  },
};

export const DOC04 = {
  id: 'DOC-04', category: 'Documents', name: 'Document recency',
  rule: 'Bank statements and proof of address must be dated within 3 months of review.',
  run(app, ctx) {
    const stale = app.documents.filter((d) => ['bank-statement', 'proof-of-address'].includes(d.type) && monthsBetween(d.issuedOn, ctx.asOf) >= 3);
    if (stale.length) return result(this, 'flag', 'low', `${stale.length} document${stale.length > 1 ? 's are' : ' is'} older than 3 months.`, stale.map((d) => ({ text: `${d.title} dated ${d.issuedOn}`, evidence: [`DOC/${d.id}/L0`] })));
    return result(this, 'pass', 'none', 'Supporting documents are recent.', []);
  },
};

// ---------------------------------------------------------------- Business
export const BUS01 = {
  id: 'BUS-01', category: 'Business', name: 'Sector risk',
  rule: 'SIC code in the high-risk sector table → medium flag (policy requires EDD regardless of other checks).',
  run(app, ctx) {
    const hit = ctx.ref.sectors.find((s) => app.registry.sic.includes(s.sic) || app.application.sic === s.sic);
    if (hit) return result(this, 'flag', 'medium', `High-risk sector: ${hit.label}.`, [{ text: `SIC ${hit.sic}: ${hit.label}`, evidence: ['APP/industry', 'REG/sic'] }]);
    return result(this, 'pass', 'none', `Sector (${app.application.industry}) is standard risk.`, [{ text: app.application.industry, evidence: ['APP/industry', 'REG/sic'] }]);
  },
};

export const CHECKS = [REG01, REG02, REG03, REG04, DIR01, DIR02, DIR03, DIR04, OWN01, OWN02, OWN03, OWN04, SCR01, SCR02, SCR03, DOC01, DOC02, DOC03, DOC04, BUS01];

export const NON_DISCOUNTABLE = ['REG-01', 'DOC-02'];

export function runChecks(app, ctx) {
  return CHECKS.map((c) => c.run(app, ctx));
}
