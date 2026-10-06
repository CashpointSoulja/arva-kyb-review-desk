import { REF, APPLICATIONS, GOLDEN } from '../data/index.js';
import { TEST_SUMMARY } from '../data/test-summary.js';
import { assess, ENGINE_VERSION } from '../engine/index.js';
import { NON_DISCOUNTABLE } from '../engine/checks.js';
import { anchorIndex } from '../engine/sources.js';
import { recommendTier, tierDirection, validateTierDecision, validateDisposition, validateDiscount, TIER_RULE } from '../engine/tiering.js';
import { toCSV, toJSON, sortEntries } from '../engine/audit.js';
import { runEval } from '../engine/evals.js';
import { costModel, straightThroughRate, ASSUMPTIONS } from '../engine/metrics.js';
import { STRENGTH_LABEL } from '../engine/match.js';
import { addressText } from '../engine/normalise.js';

const REPO = 'https://github.com/CashpointSoulja/arva-kyb-review-desk';
const ANALYSTS = ['Aisha Okafor', 'Ravi Desai', 'Mira Lindqvist'];
const SLA_HOURS = 24;
const DEMO_START = Date.parse('2026-10-06T09:00:00Z');
const T0 = Date.now();
const now = () => new Date(DEMO_START + (Date.now() - T0));

const CASES = Object.fromEntries(APPLICATIONS.map((a) => [a.id, assess(a, REF)]));
const INDEX = Object.fromEntries(Object.entries(CASES).map(([id, c]) => [id, anchorIndex(c.sources)]));
const EVAL = runEval(GOLDEN, REF);
const GOLD = Object.fromEntries(GOLDEN.map((g) => [g.id, assess(g.app, REF)]));

const KEY = 'kyb-desk-state-v1';
const fresh = () => ({ analyst: ANALYSTS[0], decisions: {}, discounts: {}, human: [], lastCase: APPLICATIONS[6].id });
let S;
try { S = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };
const ui = { queueTier: 'all', queueStatus: 'all', auditCase: 'all', auditActor: 'all', openForm: null, errors: {} };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const fmtTime = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC';
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const gbp = (n, d = 2) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const tierBadge = (t, cls = '') => `<span class="tier ${t} ${cls}">${t}</span>`;

function log(caseId, type, detail, extra = {}) {
  S.human.push({ ts: now().toISOString(), caseId, actor: `Analyst: ${S.analyst}`, type, ruleId: extra.ruleId || '', detail, evidence: extra.evidence || '', engine: ENGINE_VERSION });
  save();
}

function rec(id) { return recommendTier(CASES[id].checks, S.discounts[id] || {}); }
function statusOf(id) {
  const d = S.decisions[id];
  if (d?.disposition === 'approve') return { label: 'Approved', cls: 'ok' };
  if (d?.disposition === 'request-info') return { label: 'Information requested', cls: 'warn' };
  if (d?.disposition === 'escalate-edd') return { label: 'Escalated to EDD', cls: 'bad' };
  if (d?.tierConfirmed) return { label: 'Tier confirmed', cls: '' };
  const s = CASES[id].app.status;
  return { label: s, cls: s === 'Awaiting information' ? 'warn' : '' };
}
function sla(app) {
  const due = Date.parse(app.receivedAt) + SLA_HOURS * 3600e3;
  if (S.decisions[app.id]?.disposition) return { text: 'Decided', cls: '' };
  const ms = due - now().getTime();
  const h = Math.floor(Math.abs(ms) / 3600e3); const m = Math.floor((Math.abs(ms) % 3600e3) / 60e3);
  if (ms < 0) return { text: `Overdue ${h}h ${String(m).padStart(2, '0')}m`, cls: 'over' };
  return { text: `${h}h ${String(m).padStart(2, '0')}m left`, cls: ms < 4 * 3600e3 ? 'near' : '' };
}
const slaHtml = (app) => { const s = sla(app); return `<span class="sla ${s.cls}" data-sla="${app.id}">${s.text}</span>`; };
const flagIds = (id) => CASES[id].checks.filter((c) => c.status !== 'pass').map((c) => c.id);
const analystOf = (app) => S.decisions[app.id]?.by || app.analyst;

// ------------------------------------------------------------------ Queue
function viewQueue() {
  const apps = APPLICATIONS.filter((a) => (ui.queueTier === 'all' || rec(a.id).tier === ui.queueTier) && (ui.queueStatus === 'all' || (ui.queueStatus === 'open' ? !S.decisions[a.id]?.disposition : !!S.decisions[a.id]?.disposition)));
  const all = APPLICATIONS.map((a) => rec(a.id));
  const overdue = APPLICATIONS.filter((a) => sla(a).cls === 'over').length;
  const decided = APPLICATIONS.filter((a) => S.decisions[a.id]?.disposition).length;
  const seg = (k, v, l) => `<button data-action="qf" data-k="${k}" data-v="${v}" aria-pressed="${ui[k] === v}">${l}</button>`;
  return `
  <div class="page-head"><div><span class="eyebrow">Review queue</span><h1>Business onboarding, pre-checked</h1>
  <p>Every application below was run through ${CASES[APPLICATIONS[0].id].checks.length} deterministic checks before it reached you. Open one to see each finding, the rule that produced it and the source line behind it.</p></div></div>
  <div class="tiles">
    <div class="tile"><div class="big">${APPLICATIONS.length - decided}</div><div class="cap">Open applications <span class="delta">${decided} decided</span></div></div>
    <div class="tile"><div class="big g">${all.filter((r) => r.stpRecommended).length}</div><div class="cap">Recommended for straight-through. Each still needs your sign-off</div></div>
    <div class="tile"><div class="big">${all.filter((r) => r.tier === 'high').length}</div><div class="cap">High-tier, routed for enhanced due diligence</div></div>
    <div class="tile"><div class="big">${overdue}</div><div class="cap">Past the ${SLA_HOURS}h onboarding SLA ${overdue ? '<span class="delta bad">act first</span>' : ''}</div></div>
  </div>
  <div class="card">
    <div class="filters"><div class="seg" role="group" aria-label="Filter by tier">${seg('queueTier', 'all', 'All tiers')}${seg('queueTier', 'low', 'Low')}${seg('queueTier', 'medium', 'Medium')}${seg('queueTier', 'high', 'High')}</div>
    <div class="seg" role="group" aria-label="Filter by status">${seg('queueStatus', 'all', 'All')}${seg('queueStatus', 'open', 'Open')}${seg('queueStatus', 'done', 'Decided')}</div>
    <span class="sub">Demo clock ${fmtTime(now().toISOString()).slice(0, 13)}, SLA counts from receipt</span></div>
    <div class="tbl-wrap q"><table><thead><tr><th>Case</th><th>Company</th><th>Recommended tier</th><th>Flags</th><th>Status</th><th>SLA</th><th>Analyst</th></tr></thead><tbody>
    ${apps.map((a) => { const r = rec(a.id); const st = statusOf(a.id); return `<tr class="row" data-href="#/case/${a.id}" tabindex="0">
      <td class="mono">${a.id}</td><td><span class="co">${esc(a.registry.name)}</span><br><span class="sub">${esc(a.application.industry)}</span></td>
      <td>${tierBadge(S.decisions[a.id]?.finalTier || r.tier)}${r.stpRecommended ? '<br><span class="sub">STP recommended</span>' : ''}</td>
      <td><div class="flags">${flagIds(a.id).map((f) => `<span class="mono">${f}</span>`).join('') || '<span class="sub">None</span>'}</div></td>
      <td><span class="pill ${st.cls}">${st.label}</span></td><td>${slaHtml(a)}</td><td>${esc(analystOf(a))}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="qcards">${apps.map((a) => { const r = rec(a.id); const st = statusOf(a.id); return `<button class="qcard" data-href="#/case/${a.id}">
      <div class="top"><span class="co">${esc(a.registry.name)}</span>${tierBadge(S.decisions[a.id]?.finalTier || r.tier)}</div>
      <div class="meta"><span class="mono">${a.id}</span><span class="pill ${st.cls}">${st.label}</span>${slaHtml(a)}<span>${esc(analystOf(a))}</span></div>
      <div class="flags">${flagIds(a.id).map((f) => `<span class="mono">${f}</span>`).join('') || '<span class="sub">No flags</span>'}</div></button>`; }).join('')}</div>
    ${apps.length ? '' : '<p class="sub">No applications match these filters.</p>'}
  </div>`;
}

// ------------------------------------------------------------------ Case file
function chip(caseId, anchor, scope = 'case') {
  const idx = scope === 'gold' ? anchorIndex(GOLD[caseId].sources) : INDEX[caseId];
  const l = idx.get(anchor);
  return `<button class="chip" data-action="src" data-scope="${scope}" data-case="${caseId}" data-anchor="${esc(anchor)}" title="${esc(l ? `${l.label}: ${l.text}` : anchor)}"><span class="mono">${esc(anchor)}</span><span class="lbl">${esc(l ? l.text : '')}</span></button>`;
}

function reasoning(r) {
  return `<div class="reason"><div class="for"><h4>Why it matched</h4><ul>${r.for.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>Nothing beyond the surname</li>'}</ul></div>
  <div class="against"><h4>Why it might be wrong</h4><ul>${r.against.map((x) => `<li>${esc(x)}</li>`).join('') || '<li>No contradicting identifiers found</li>'}</ul></div></div>`;
}

function checkRow(id, c, locked) {
  const disc = S.discounts[id]?.[c.id];
  const stCls = disc ? 'disc' : `${c.status} ${c.severity}`;
  const icon = disc ? '–' : c.status === 'pass' ? '✓' : c.status === 'fail' ? '✕' : '!';
  const formOpen = ui.openForm === `disc:${id}:${c.id}`;
  const canDiscount = c.status !== 'pass' && !disc && !locked && !NON_DISCOUNTABLE.includes(c.id);
  return `<details class="check" id="chk-${c.id}" ${c.status !== 'pass' || formOpen ? 'open' : ''}>
  <summary><span class="st ${stCls}" aria-label="${disc ? 'discounted' : c.status}">${icon}</span>
  <span class="check-title"><span class="mono">${c.id}</span>${esc(c.name)}<span class="check-sum">${esc(c.summary)}</span></span>
  ${c.status === 'pass' ? '<span class="pill ok">Pass</span>' : disc ? '<span class="pill">Discounted</span>' : tierBadge(c.severity)}</summary>
  <div class="check-body"><p class="rule">Rule: ${esc(c.rule)}</p>
  ${c.findings.map((f) => `<div class="finding"><p>${esc(f.text)}${f.reasoning ? `<span class="strength ${f.reasoning.strength}">${STRENGTH_LABEL[f.reasoning.strength]}</span>` : ''}</p>
    ${f.reasoning && f.reasoning.strength !== 'none' ? reasoning(f.reasoning) : ''}
    <div class="chips">${f.evidence.map((e) => chip(id, e)).join('')}</div></div>`).join('')}
  ${disc ? `<div class="disc-note"><b>Discounted by ${esc(disc.by)}</b>: ${esc(disc.reason)}</div>` : ''}
  ${c.status !== 'pass' && NON_DISCOUNTABLE.includes(c.id) ? '<p class="sub">Hard stop. This finding cannot be discounted from the desk.</p>' : ''}
  ${canDiscount && !formOpen ? `<button class="link" data-action="disc-open" data-case="${id}" data-check="${c.id}">Discount this finding with a reason</button>` : ''}
  ${formOpen ? `<form class="discount" data-form="disc" data-case="${id}" data-check="${c.id}"><label class="sub" for="dr-${c.id}">Why is this finding not a risk? This is logged and visible to QA.</label>
    <textarea id="dr-${c.id}" name="reason" placeholder="e.g. Passport shows date of birth 1968-07, list entry is 1968-03 and nationality differs"></textarea>
    <p class="err">${esc(ui.errors[`disc:${c.id}`] || '')}</p><button class="btn small">Record discount</button> <button type="button" class="link" data-action="disc-cancel">Cancel</button></form>` : ''}
  </div></details>`;
}

function ownershipTree(id) {
  const lines = CASES[id].sources.find((s) => s.id === 'OWN').lines;
  return `<ul class="tree">${lines.map((l) => `<li style="--d:${l.depth}">${esc(l.text)} <span class="sub">${l.depth === 0 ? 'applicant' : ''}</span> ${l.depth ? chip(id, l.anchor).replace('class="chip"', 'class="chip" style="margin-left:6px"') : ''}</li>`).join('')}</ul>`;
}

function tierPanel(id) {
  const c = CASES[id]; const r = rec(id); const d = S.decisions[id] || {};
  const err = ui.errors[`tier:${id}`] || '';
  if (d.tierConfirmed) {
    return `<section class="card dark dots panel-tier" aria-labelledby="tp"><span class="eyebrow">Risk tier</span>
    <div class="rec"><h2 id="tp">${d.tierDirection === 'confirm' ? 'Tier confirmed' : d.tierDirection === 'upgrade' ? 'Tier upgraded' : 'Tier downgraded'}</h2>${tierBadge(d.finalTier, 'lg')}</div>
    <div class="done">Agent recommended <b>${d.recommendedTier.toUpperCase()}</b>. ${esc(d.by)} set <b>${d.finalTier.toUpperCase()}</b> at ${fmtTime(d.tierAt)}.${d.tierRationale ? `<br>Rationale: ${esc(d.tierRationale)}` : ''}</div></section>`;
  }
  return `<section class="card dark dots panel-tier" aria-labelledby="tp"><span class="eyebrow">Risk tier recommendation</span>
  <div class="rec"><h2 id="tp">Recommended</h2>${tierBadge(r.tier, 'lg')}</div>
  <p style="margin:0">Because: <strong>${esc(r.because)}</strong>${r.hardStops.length ? `. Hard stop: ${r.hardStops.join(', ')}` : ''}.</p>
  ${r.factors.length ? `<ul class="factors">${r.factors.map((f) => `<li><span class="mono">${f.checkId}</span><span>${esc(f.summary)} <em>(${f.severity})</em></span></li>`).join('')}</ul>` : '<p>No checks flagged. Every passing check and its evidence is listed on the left.</p>'}
  ${r.stpRecommended ? '<div class="stp">Eligible for straight-through processing. Nothing is approved until you confirm.</div>' : ''}
  <form data-form="tier" data-case="${id}"><fieldset style="border:0;padding:0;margin:0"><legend class="sub" style="color:#8fb1be">Your tier</legend>
  <div class="seg-tier">${['low', 'medium', 'high'].map((t) => `<label><input type="radio" name="tier" value="${t}" ${t === r.tier ? 'checked' : ''}>${t}</label>`).join('')}</div></fieldset>
  <label class="sr" for="tr-${id}">Rationale</label><textarea id="tr-${id}" name="rationale" placeholder="Rationale (required if you change the tier)"></textarea>
  <p class="err">${esc(err)}</p><button class="btn" data-testid="confirm-tier">Record tier</button></form>
  <p class="tier-rule">Tier rule (${esc(c.engine)}): ${esc(TIER_RULE)}</p></section>`;
}

function dispositionPanel(id) {
  const d = S.decisions[id] || {}; const r = rec(id);
  const err = ui.errors[`disp:${id}`] || '';
  if (d.disposition) {
    const label = { approve: 'Approved', 'request-info': 'More information requested', 'escalate-edd': 'Escalated to enhanced due diligence' }[d.disposition];
    return `<section class="card"><span class="eyebrow">Disposition</span><h2 style="margin-top:10px">${label}</h2>
    <div class="done" style="margin-top:8px">${esc(d.by)} at ${fmtTime(d.dispAt)}<br>Rationale: ${esc(d.dispRationale)}</div>
    <p class="sub">Recorded in the <a href="#/audit">audit trail</a>. Decisions are final in this demo. Use Reset on the audit page to start again.</p></section>`;
  }
  const locked = !d.tierConfirmed;
  const approveBlock = validateDisposition({ disposition: 'approve', tierConfirmed: true, finalTier: d.finalTier || r.tier, recommendation: r, rationale: 'xxxxxxxxxxxx', discounted: S.discounts[id] || {} });
  const opt = (v, t, s, dis) => `<label><input type="radio" name="disp" value="${v}" ${dis ? 'disabled' : ''}><span><b>${t}</b>${s}</span></label>`;
  return `<section class="card" aria-labelledby="dp"><span class="eyebrow">Disposition</span><h2 id="dp" style="margin-top:10px">Your decision</h2>
  ${locked ? '<p class="sub">Confirm the risk tier first. The decision options unlock after that.</p>' : ''}
  <form data-form="disp" data-case="${id}"><fieldset ${locked ? 'disabled' : ''} style="border:0;padding:0;margin:0"><div class="choice">
  ${opt('approve', 'Approve', approveBlock ? ` <span class="err" style="display:block">${esc(approveBlock)}</span>` : 'Open the account. Findings and evidence are kept with the decision.', !!approveBlock)}
  ${opt('request-info', 'Request more information', 'Ask the applicant for documents or clarification. The SLA pauses.', false)}
  ${opt('escalate-edd', 'Escalate to enhanced due diligence', 'Hand to the EDD team with this case file attached.', false)}</div>
  <label class="sr" for="dr-${id}">Decision rationale</label><textarea id="dr-${id}" name="rationale" placeholder="Rationale, written for the person who audits this later"></textarea>
  <p class="err">${esc(err)}</p><button class="btn dark-btn">Record decision</button></fieldset></form></section>`;
}

function caseAudit(id) {
  const rows = sortEntries([...CASES[id].audit, ...S.human.filter((h) => h.caseId === id)]).reverse().slice(0, 12);
  return `<section class="card"><span class="eyebrow">Case audit</span><ul class="mini-audit">${rows.map((e) => `<li><time>${fmtTime(e.ts)} · ${esc(e.actor)}</time>${esc(e.type.replace(/_/g, ' '))}${e.ruleId ? ` <span class="mono">${esc(e.ruleId)}</span>` : ''}</li>`).join('')}</ul>
  <p style="margin:10px 0 0"><a href="#/audit?case=${id}">Full trail and export →</a></p></section>`;
}

function viewCase(id) {
  if (!CASES[id]) id = S.lastCase;
  if (S.lastCase !== id || !S.human.some((h) => h.caseId === id && h.type === 'case_opened')) {
    S.lastCase = id; log(id, 'case_opened', `Opened case file for ${CASES[id].app.registry.name}`);
  }
  const c = CASES[id]; const a = c.app; const r = rec(id); const d = S.decisions[id] || {};
  const flagged = c.checks.filter((x) => x.status !== 'pass').length;
  const cats = [...new Set(c.checks.map((x) => x.category))];
  const reg = a.registry; const ap = a.application;
  return `
  <p style="margin:0 0 10px"><a href="#/queue">← Review queue</a></p>
  <section class="case-head dark dots"><span class="eyebrow">Agent case file · ${a.id}</span>
  <h1>${esc(reg.name)}</h1>
  <div class="case-meta"><span class="mono">${esc(reg.companyNumber)}</span><span>${esc(reg.jurisdictionLabel)}</span><span>${esc(ap.industry)}</span><span>Received ${fmtTime(a.receivedAt)}</span><span>${slaHtml(a)}</span><span>Analyst: ${esc(analystOf(a))}</span>${tierBadge(d.finalTier || r.tier)}</div></section>
  <div class="case-grid"><div class="main-col">
    <section class="card"><span class="eyebrow">Pre-check summary</span>
    <p style="margin:10px 0 0;color:var(--ink)">The agent ran ${c.checks.length} checks against the register, the applicant's documents and the screening lists before this case reached the queue. ${flagged ? `${flagged} need${flagged === 1 ? 's' : ''} your attention.` : 'None flagged.'} Click any chip to open the exact source line.</p>
    <div class="summary-strip"><div><b>${c.checks.length}</b><span>checks run</span></div><div><b>${flagged}</b><span>flagged</span></div><div><b>${c.sources.reduce((s, x) => s + x.lines.length, 0)}</b><span>source lines</span></div></div></section>
    <section class="card" aria-labelledby="ce"><span class="eyebrow">Check engine</span><h2 id="ce" style="margin-top:10px">Checks, rules and evidence</h2><p class="sub">Deterministic rules in code (${esc(c.engine)}). No check calls an external service at review time.</p>
    ${flagged ? `<div class="cat"><h3>Needs attention (${flagged})</h3>${c.checks.filter((x) => x.status !== 'pass').map((x) => checkRow(id, x, !!d.tierConfirmed)).join('')}</div>` : ''}
    ${cats.filter((cat) => c.checks.some((x) => x.category === cat && x.status === 'pass')).map((cat) => `<div class="cat"><h3>${cat} · passed</h3>${c.checks.filter((x) => x.category === cat && x.status === 'pass').map((x) => checkRow(id, x, !!d.tierConfirmed)).join('')}</div>`).join('')}</section>
    <section class="card"><span class="eyebrow">Company profile</span><h2 style="margin-top:10px">Register entry</h2>
    <dl class="kv"><dt>Status</dt><dd>${esc(reg.status)}${reg.dissolvedOn ? `, dissolved ${reg.dissolvedOn}` : ''} ${chip(id, 'REG/status')}</dd>
    <dt>Incorporated</dt><dd>${reg.incorporatedOn} ${chip(id, 'REG/incorporatedOn')}</dd><dt>Registered office</dt><dd>${esc(addressText(reg.registeredOffice))}</dd>
    <dt>SIC</dt><dd>${reg.sic.join(', ')} · ${esc(ap.industry)}</dd>${reg.previousNames.length ? `<dt>Previous names</dt><dd>${reg.previousNames.map((p) => esc(p.name)).join(', ')}</dd>` : ''}
    <dt>Latest accounts</dt><dd>${reg.accounts[0] ? `${reg.accounts[0].type}, to ${reg.accounts[0].madeUpTo}` : 'None filed'}</dd><dt>Declared volume</dt><dd>${gbp(ap.expectedMonthlyVolumeGBP, 0)} a month</dd><dt>Account purpose</dt><dd>${esc(ap.purpose)}</dd></dl></section>
    <section class="card"><span class="eyebrow">Officers</span><h2 style="margin-top:10px">Directors and secretaries</h2>
    <dl class="kv">${reg.officers.map((o) => `<dt>${esc(o.role)}${o.resignedOn ? ' (resigned)' : ''}</dt><dd>${esc(o.name)}, born ${o.dob}, ${esc(o.nationality)}, appointed ${o.appointedOn}${o.otherAppointments.length ? `<br><span class="sub">${o.otherAppointments.length} other appointment${o.otherAppointments.length > 1 ? 's' : ''}, ${o.otherAppointments.filter((x) => x.status === 'dissolved').length} dissolved</span>` : ''} ${chip(id, `REG/officer/${o.id}`)}</dd>`).join('')}</dl></section>
    <section class="card"><span class="eyebrow">Ownership</span><h2 style="margin-top:10px">Ownership tree</h2><p class="sub">Effective percentages are multiplied through each layer. Declared UBOs: ${esc(ap.ubos.map((u) => `${u.name} ${u.pct}%`).join(', ') || 'none')}.</p>${ownershipTree(id)}</section>
    <section class="card"><span class="eyebrow">Documents</span><h2 style="margin-top:10px">Uploaded documents</h2><div class="doclist">${a.documents.map((doc) => `<button class="doc" data-action="src" data-scope="case" data-case="${id}" data-anchor="DOC/${doc.id}/L1"><b>${esc(doc.title)}</b>${doc.id} · dated ${doc.issuedOn}</button>`).join('')}</div></section>
  </div>
  <div class="rail">${tierPanel(id)}${dispositionPanel(id)}${caseAudit(id)}</div></div>`;
}

// ------------------------------------------------------------------ Audit
function allEntries() { return sortEntries([...Object.values(CASES).flatMap((c) => c.audit), ...S.human]); }
function filteredEntries() {
  return allEntries().filter((e) => (ui.auditCase === 'all' || e.caseId === ui.auditCase) && (ui.auditActor === 'all' || (ui.auditActor === 'human' ? e.actor.startsWith('Analyst') : !e.actor.startsWith('Analyst'))));
}
function viewAudit() {
  const rows = filteredEntries();
  const shown = [...rows].reverse().slice(0, 250);
  return `<div class="page-head"><div><span class="eyebrow">Audit trail</span><h1>Every check, override and decision</h1>
  <p>Agent rows are written when an application is pre-checked. Analyst rows are written as you work. Each row names the rule, the evidence anchors and the engine version, so a reviewer can replay the decision.</p></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-action="export" data-fmt="csv">Export CSV</button><button class="btn ghost" data-action="export" data-fmt="json">Export JSON</button></div></div>
  <div class="card"><div class="filters">
  <label class="sub">Case <select data-action="af" data-k="auditCase" class="analyst-pick" style="border:1px solid #d9dcde;border-radius:4px;padding:5px 8px;background:#fff"><option value="all">All cases</option>${APPLICATIONS.map((a) => `<option value="${a.id}" ${ui.auditCase === a.id ? 'selected' : ''}>${a.id} · ${esc(a.registry.name)}</option>`).join('')}</select></label>
  <div class="seg" role="group" aria-label="Actor">${[['all', 'All actors'], ['agent', 'Agent'], ['human', 'Analysts']].map(([v, l]) => `<button data-action="qf" data-k="auditActor" data-v="${v}" aria-pressed="${ui.auditActor === v}">${l}</button>`).join('')}</div>
  <span class="sub">${rows.length} rows${rows.length > shown.length ? `, newest ${shown.length} shown, export has all` : ''}</span>
  <button class="link" data-action="reset" style="margin-left:auto">Reset demo decisions</button></div>
  <div class="tbl-wrap"><table class="resp-table"><thead><tr><th>Time (UTC)</th><th>Case</th><th>Actor</th><th>Event</th><th>Rule</th><th>Detail</th></tr></thead><tbody>
  ${shown.map((e) => `<tr><td data-l="Time" class="mono">${esc(e.ts.replace('T', ' ').slice(0, 19))}</td><td data-l="Case" class="mono">${esc(e.caseId)}</td><td data-l="Actor">${esc(e.actor)}</td><td data-l="Event">${esc(e.type.replace(/_/g, ' '))}</td><td data-l="Rule" class="mono">${esc(e.ruleId)}</td><td class="wide" data-l="Detail">${esc(e.detail)}${e.evidence ? `<br><span class="sub mono">${esc(e.evidence)}</span>` : ''}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}

// ------------------------------------------------------------------ Eval lab
function viewEvals() {
  const s = EVAL.summary;
  const miss = EVAL.cases.find((c) => c.id === 'G-19');
  const fp = EVAL.cases.find((c) => c.id === 'G-08');
  const article = REF.media.find((m) => m.subjects.some((x) => /brightwater/i.test(x)));
  const g19 = GOLDEN.find((g) => g.id === 'G-19');
  return `<div class="page-head"><div><span class="eyebrow">Eval lab</span><h1>24 golden applications, scored against the engine</h1>
  <p>Each golden case seeds known risk signals. The engine runs on the same code as the queue. Results are computed in your browser on page load, not typed in.</p></div></div>
  <div class="tiles">
    <div class="tile"><div class="big g">${pct(s.catchRate, 1)}</div><div class="cap">Catch rate: ${s.caughtSignals} of ${s.seededSignals} seeded signals flagged</div><div class="bar"><i style="width:${pct(s.catchRate, 1)}"></i></div></div>
    <div class="tile"><div class="big">${s.falsePositiveFlags}</div><div class="cap">False-positive flag${s.falsePositiveFlags === 1 ? '' : 's'} across ${s.cases} cases (${s.casesWithFalsePositive} case)</div></div>
    <div class="tile"><div class="big">${s.tierAgreement}/${s.cases}</div><div class="cap">Tier matches the expected tier</div></div>
    <div class="tile"><div class="big">${pct(s.escalationPrecision)}</div><div class="cap">Escalation precision (${s.escalated} escalated, recall ${pct(s.escalationRecall)})</div></div>
  </div>
  <section class="miss dark dots" aria-labelledby="hm"><span class="eyebrow">Honest miss · ${miss.id}</span>
  <h2 id="hm">The engine called this ${miss.tier.toUpperCase()}. It should be ${miss.expectedTier.toUpperCase()}.</h2>
  <p><strong>${esc(miss.title)}.</strong> ${esc(g19.app.registry.name)} was previously registered as <strong>${esc(g19.app.registry.previousNames[0].name)}</strong>. A synthetic fraud article names the old company. SCR-03 only screens the current legal and trading names, so nothing fired.</p>
  <div class="quote">${esc(article.lines[0])}<small>${esc(article.id)} · ${esc(article.outlet)} · ${article.date}</small></div>
  <div class="quote">${esc(article.lines[2])}<small>${esc(article.id)} ¶3</small></div>
  <div class="chips" style="margin:10px 0">${chip('G-19', 'REG/previousName/0', 'gold')}${chip('G-19', 'REG/name', 'gold')}</div>
  <p>Left on screen on purpose. The fix (screen every previous name, weighted by how recently it changed) is in ROADMAP-V2. It is not quietly tuned into v1, because widening name screening also widens false positives and needs its own eval run first.</p></section>
  <div class="two">
    <section class="card"><span class="eyebrow">Known false positive · ${fp.id}</span><h2 style="margin-top:10px">${esc(fp.title)}</h2><p>DIR-03 raised a low flag for a clean company at a serviced office with 31 tenants. It did not change the tier (one low flag stays low), but it costs the analyst a click. Proposed fix: an allow-list of verified serviced-office addresses, reviewed quarterly.</p></section>
    <section class="card"><span class="eyebrow">Unit tests</span><h2 style="margin-top:10px">${TEST_SUMMARY.pass} of ${TEST_SUMMARY.tests} passing</h2><p>${TEST_SUMMARY.files} test files cover normalisation, name matching, every check, tiering, disposition guards, audit export and the eval harness. Last run ${TEST_SUMMARY.ranAt.slice(0, 10)} on Node ${esc(TEST_SUMMARY.node)}. See <a href="${REPO}/blob/main/TEST-RESULTS.md">TEST-RESULTS.md</a>.</p></section>
  </div>
  <section class="card" style="margin-top:16px"><span class="eyebrow">Golden set</span><h2 style="margin-top:10px">All 24 cases</h2>
  <div class="tbl-wrap"><table class="resp-table"><thead><tr><th>Case</th><th>Scenario</th><th>Seeded</th><th>Expected</th><th>Flagged</th><th>Tier (exp → got)</th><th>Result</th></tr></thead><tbody>
  ${EVAL.cases.map((c) => `<tr><td data-l="Case" class="mono">${c.id}</td><td data-l="Scenario" class="co">${esc(c.title)}</td><td class="wide" data-l="Seeded">${esc(c.seeded)}</td><td data-l="Expected" class="mono">${c.expected.join(' ') || '–'}</td><td data-l="Flagged" class="mono">${c.flagged.join(' ') || '–'}</td><td data-l="Tier">${tierBadge(c.expectedTier)} → ${tierBadge(c.tier)}</td>
  <td data-l="Result">${c.missed.length ? `<span class="result-miss">Missed ${c.missed.join(', ')}</span>` : c.falsePositives.length ? `<span class="result-fp">False positive ${c.falsePositives.join(', ')}</span>` : '<span class="result-ok">Correct</span>'}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}

// ------------------------------------------------------------------ Metrics
function viewMetrics() {
  const recs = Object.fromEntries(APPLICATIONS.map((a) => [a.id, rec(a.id)]));
  const tiers = APPLICATIONS.map((a) => S.decisions[a.id]?.finalTier || recs[a.id].tier);
  const m = costModel(tiers);
  const stp = straightThroughRate(S.decisions, recs);
  const esc2 = APPLICATIONS.filter((a) => S.decisions[a.id]?.disposition === 'escalate-edd');
  const escHigh = esc2.filter((a) => recs[a.id].tier === 'high' || S.decisions[a.id].finalTier === 'high');
  const s = EVAL.summary;
  return `<div class="page-head"><div><span class="eyebrow">Metrics</span><h1>What the desk changes, in numbers</h1>
  <p>Cost and time are modelled from the stated assumptions below, applied to this queue's tier mix. They are hypotheses to test in a pilot, not measured results. Straight-through and escalation figures update as you record decisions.</p></div></div>
  <div class="tiles">
    <div class="tile"><div class="big g">${gbp(m.deskCostPerReview)}</div><div class="cap">Modelled cost per review <span class="delta">−${pct(m.costReduction)} vs ${gbp(m.manualCostPerReview)} manual</span></div></div>
    <div class="tile"><div class="big">${m.analystHoursSaved.toFixed(1)}h</div><div class="cap">Analyst time saved on this ${m.cases}-case queue (avg ${m.avgDeskMinutes.toFixed(0)} min vs ${ASSUMPTIONS.manualMinutesPerReview} min)</div></div>
    <div class="tile"><div class="big">${pct(stp.recommended / stp.total)}</div><div class="cap">Straight-through recommended (${stp.recommended}/${stp.total}). Confirmed and approved so far: ${stp.stp}</div></div>
    <div class="tile"><div class="big">${pct(s.escalationPrecision)}</div><div class="cap">Escalation precision on the golden set. Live: ${esc2.length ? `${escHigh.length}/${esc2.length} of your escalations were high tier` : 'no escalations yet'}</div></div>
  </div>
  <div class="two">
  <section class="card gov"><span class="eyebrow">Assumptions to test</span><h2 style="margin-top:10px">Cost model inputs</h2>
  <table class="assume"><tbody>
  <tr><td>Fully loaded analyst cost</td><td>${gbp(ASSUMPTIONS.analystCostPerHourGBP, 0)}/h</td></tr>
  <tr><td>Manual KYB review, start to finish</td><td>${ASSUMPTIONS.manualMinutesPerReview} min</td></tr>
  <tr><td>Desk review, low tier (confirm and sign)</td><td>${ASSUMPTIONS.deskMinutes.low} min</td></tr>
  <tr><td>Desk review, medium tier</td><td>${ASSUMPTIONS.deskMinutes.medium} min</td></tr>
  <tr><td>Desk review, high tier (prep for EDD)</td><td>${ASSUMPTIONS.deskMinutes.high} min</td></tr>
  <tr><td>Engine and data cost per case</td><td>${gbp(ASSUMPTIONS.engineCostPerCaseGBP)}</td></tr></tbody></table>
  <p class="sub">${esc(ASSUMPTIONS.source)}</p></section>
  <section class="card"><span class="eyebrow">Guardrail metrics</span><h2 style="margin-top:10px">What must not get worse</h2>
  <dl class="kv"><dt>Seeded-signal catch rate</dt><dd>${pct(s.catchRate, 1)} (target ≥ 95% before widening STP)</dd>
  <dt>Missed high-tier cases</dt><dd>${s.shouldEscalate - s.escalated} of ${s.shouldEscalate} (G-19, on screen in Eval lab)</dd>
  <dt>Tier overrides</dt><dd>${Object.values(S.decisions).filter((d) => d.tierDirection && d.tierDirection !== 'confirm').length} recorded this session. A rising override rate means the rules need review</dd>
  <dt>Discounted findings</dt><dd>${Object.values(S.discounts).reduce((n, x) => n + Object.keys(x).length, 0)} this session, each with a reason in the audit trail</dd>
  <dt>Auto-approvals</dt><dd>0, by design. Every approval has a named analyst</dd></dl>
  <p class="sub">Definitions in <a href="${REPO}/blob/main/METRICS.md">METRICS.md</a>.</p></section></div>`;
}

// ------------------------------------------------------------------ About
function viewAbout() {
  return `<div class="page-head"><div><span class="eyebrow">How it works</span><h1>The 30-second version</h1></div></div>
  <section class="card prose"><p style="color:var(--ink);font-size:17px">Banks have to check every business that opens an account: is it real, who owns it, is anyone on a sanctions list, do the documents agree. Analysts do this by hand, case by case. Most cases are clean, but every one takes the same slow path.</p>
  <p>This desk does the checking before the analyst opens the case. Each check is a written rule in code. Each finding points to the exact line it came from, whether that is the register entry, the bank statement or the news paragraph. The desk recommends a risk tier and says why. The analyst confirms or changes it, writes a reason, and decides. Everything lands in an audit trail a regulator can read.</p></section>
  <div class="steps">
    <section class="card gov"><h3>Agent prepares</h3><p>Registry, officers, ownership, documents and screening lists are pulled and checked against ${CASES[APPLICATIONS[0].id].checks.length} rules. Low-risk cases are flagged as eligible for straight-through.</p></section>
    <section class="card gov"><h3>Analyst decides</h3><p>Confirm, upgrade or downgrade the tier with a rationale. Discount a finding only with a reason. Approve, request information, or escalate to EDD. Nothing auto-approves.</p></section>
    <section class="card gov"><h3>Audit proves it</h3><p>Every check, finding, override and decision is timestamped with its rule ID, evidence anchors and engine version. Export as CSV or JSON.</p></section>
  </div>
  <section class="card prose" style="margin-top:16px"><h2>Boundaries of this concept</h2><ul>
  <li>Synthetic data only. Northbank, every company, person, register entry, list entry and article are fictional.</li>
  <li>No live lookups. The register, sanctions, PEP and media data are fixed files, so results are reproducible.</li>
  <li>No auto-approval. High-tier cases cannot be approved from the desk. Dissolved companies and certificate number mismatches are hard stops that cannot be discounted.</li>
  <li>No bare match scores. Name matches show why they matched and why they might be wrong.</li></ul>
  <p>Product docs: <a href="${REPO}#readme">README</a> · <a href="${REPO}/blob/main/PRD.md">PRD</a> · <a href="${REPO}/blob/main/VIABILITY.md">Viability</a> · <a href="${REPO}/blob/main/ROADMAP-V2.md">Roadmap v2</a> · <a href="${REPO}/blob/main/EVALS.md">Evals</a> · <a href="${REPO}/blob/main/METRICS.md">Metrics</a></p></section>`;
}

// ------------------------------------------------------------------ Drawer
let lastFocus = null;
function openSource(scope, caseId, anchor) {
  const sources = scope === 'gold' ? GOLD[caseId].sources : CASES[caseId].sources;
  const src = sources.find((s) => s.lines.some((l) => l.anchor === anchor));
  if (!src) return;
  if (scope === 'case') log(caseId, 'evidence_viewed', `Viewed ${anchor} in ${src.title}`, { evidence: anchor });
  const dr = $('#drawer');
  dr.innerHTML = `<div class="drawer-head"><div><span class="eyebrow">Source · ${esc(src.id)}</span><h2 style="margin-top:8px">${esc(src.title)}</h2><p class="sub" style="margin:4px 0 0">${scope === 'gold' ? 'Golden case ' : 'Case '}${esc(caseId)} · highlighted line is the evidence</p></div><button class="btn ghost small" data-action="close" aria-label="Close source">Close</button></div>
  <div class="drawer-body">${src.lines.map((l) => `<div class="src-line ${l.anchor === anchor ? 'hit' : ''}" ${l.anchor === anchor ? 'id="hit"' : ''}><div class="lab">${esc(l.label)}<span class="anc">${esc(l.anchor)}</span></div><div class="txt">${esc(l.text)}</div></div>`).join('')}</div>`;
  lastFocus = document.activeElement;
  dr.classList.add('open'); dr.setAttribute('aria-hidden', 'false'); $('#scrim').hidden = false;
  requestAnimationFrame(() => { $('#hit')?.scrollIntoView({ block: 'center' }); dr.querySelector('[data-action="close"]').focus(); });
}
function closeDrawer() {
  const dr = $('#drawer'); dr.classList.remove('open'); dr.setAttribute('aria-hidden', 'true'); $('#scrim').hidden = true;
  lastFocus?.focus?.();
}

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------------------------------------------------------ Router
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'queue';
  const [path, query] = h.split('?');
  const [page, arg] = path.split('/');
  return { page, arg, params: new URLSearchParams(query || '') };
}
function render(keepScroll = false) {
  const { page, arg, params } = route();
  if (page === 'audit' && params.get('case')) ui.auditCase = params.get('case');
  const y = window.scrollY;
  const view = $('#view');
  const views = { queue: viewQueue, case: () => viewCase(arg || S.lastCase), audit: viewAudit, evals: viewEvals, metrics: viewMetrics, about: viewAbout };
  view.innerHTML = (views[page] || viewQueue)();
  document.querySelectorAll('[data-nav]').forEach((a) => a.toggleAttribute('aria-current', false));
  const nav = document.querySelector(`[data-nav="${views[page] ? page : 'queue'}"]`);
  if (nav) { nav.setAttribute('aria-current', 'page'); }
  $('[data-nav="case"]').href = `#/case/${S.lastCase}`;
  document.title = `${{ queue: 'Review queue', case: CASES[arg]?.app.registry.name || 'Case file', audit: 'Audit trail', evals: 'Eval lab', metrics: 'Metrics', about: 'How it works' }[page] || 'Review queue'} · KYB Review Desk`;
  if (keepScroll) window.scrollTo(0, y);
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action], [data-href]');
  if (!t) return;
  if (t.dataset.href && !t.dataset.action) { location.hash = t.dataset.href; return; }
  const a = t.dataset.action;
  if (a === 'qf') { ui[t.dataset.k] = t.dataset.v; render(true); }
  else if (a === 'src') { e.preventDefault(); openSource(t.dataset.scope, t.dataset.case, t.dataset.anchor); }
  else if (a === 'close') closeDrawer();
  else if (a === 'disc-open') { e.preventDefault(); ui.openForm = `disc:${t.dataset.case}:${t.dataset.check}`; render(true); $(`#dr-${t.dataset.check}`)?.focus(); }
  else if (a === 'disc-cancel') { ui.openForm = null; render(true); }
  else if (a === 'export') {
    const rows = filteredEntries(); const stamp = now().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const scope = ui.auditCase === 'all' ? 'all-cases' : ui.auditCase;
    if (t.dataset.fmt === 'csv') download(`kyb-audit-${scope}-${stamp}.csv`, toCSV(rows), 'text/csv');
    else download(`kyb-audit-${scope}-${stamp}.json`, toJSON(rows, { exportedAt: now().toISOString(), scope }), 'application/json');
    log(ui.auditCase === 'all' ? 'ALL' : ui.auditCase, 'audit_exported', `Exported ${rows.length} audit rows as ${t.dataset.fmt.toUpperCase()}`);
    toast(`Exported ${rows.length} rows as ${t.dataset.fmt.toUpperCase()}`);
  } else if (a === 'reset') {
    if (confirm('Clear all decisions, discounts and analyst audit rows from this browser?')) { const an = S.analyst; S = fresh(); S.analyst = an; save(); render(); toast('Demo reset'); }
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#drawer').classList.contains('open')) closeDrawer();
  if (e.key === 'Enter' && e.target.matches('tr[data-href]')) location.hash = e.target.dataset.href;
});
$('#scrim').addEventListener('click', closeDrawer);
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-action="af"]')) { ui[e.target.dataset.k] = e.target.value; if (location.hash.includes('?')) history.replaceState(null, '', '#/audit'); render(true); }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const id = f.dataset.case; const fd = new FormData(f);
  if (f.dataset.form === 'disc') {
    const checkId = f.dataset.check; const reason = String(fd.get('reason') || '').trim();
    const err = validateDiscount(checkId, reason);
    if (err) { ui.errors[`disc:${checkId}`] = err; render(true); return; }
    delete ui.errors[`disc:${checkId}`];
    (S.discounts[id] ||= {})[checkId] = { reason, by: S.analyst, at: now().toISOString() };
    ui.openForm = null;
    log(id, 'finding_discounted', `${checkId} discounted: ${reason}`, { ruleId: checkId });
    toast(`${checkId} discounted. Tier recalculated.`);
  } else if (f.dataset.form === 'tier') {
    const r = rec(id); const to = fd.get('tier'); const rationale = String(fd.get('rationale') || '').trim();
    const err = validateTierDecision({ from: r.tier, to, rationale });
    if (err) { ui.errors[`tier:${id}`] = err; render(true); return; }
    delete ui.errors[`tier:${id}`];
    const dir = tierDirection(r.tier, to);
    S.decisions[id] = { ...(S.decisions[id] || {}), tierConfirmed: true, recommendedTier: r.tier, finalTier: to, tierDirection: dir, tierRationale: rationale, tierAt: now().toISOString(), by: S.analyst };
    log(id, `tier_${dir === 'confirm' ? 'confirmed' : dir === 'upgrade' ? 'upgraded' : 'downgraded'}`, `Tier ${r.tier.toUpperCase()} → ${to.toUpperCase()}${rationale ? `. Rationale: ${rationale}` : ''}`, { ruleId: 'TIER', evidence: r.factors.map((x) => x.checkId).join(' ') });
    toast(`Tier ${dir === 'confirm' ? 'confirmed' : dir + 'd'}: ${to.toUpperCase()}`);
  } else if (f.dataset.form === 'disp') {
    const d = S.decisions[id] || {}; const disposition = fd.get('disp'); const rationale = String(fd.get('rationale') || '').trim();
    const err = !disposition ? 'Choose a decision' : validateDisposition({ disposition, tierConfirmed: !!d.tierConfirmed, finalTier: d.finalTier, recommendation: rec(id), rationale, discounted: S.discounts[id] || {} });
    if (err) { ui.errors[`disp:${id}`] = err; render(true); return; }
    delete ui.errors[`disp:${id}`];
    S.decisions[id] = { ...d, disposition, dispRationale: rationale, dispAt: now().toISOString(), by: S.analyst };
    log(id, 'disposition_recorded', `${disposition.toUpperCase()} at tier ${d.finalTier.toUpperCase()}. Rationale: ${rationale}`, { ruleId: 'DISPOSITION' });
    toast('Decision recorded in the audit trail');
  }
  save(); render(true);
});

const sel = $('#analyst');
sel.innerHTML = ANALYSTS.map((a) => `<option ${a === S.analyst ? 'selected' : ''}>${a}</option>`).join('');
sel.addEventListener('change', () => { S.analyst = sel.value; save(); toast(`Signed in as ${S.analyst}`); });
window.addEventListener('hashchange', () => { closeDrawer(); render(); window.scrollTo(0, 0); $('#view').focus({ preventScroll: true }); });
setInterval(() => document.querySelectorAll('[data-sla]').forEach((el) => { const a = CASES[el.dataset.sla].app; const s = sla(a); el.textContent = s.text; el.className = `sla ${s.cls}`; }), 15000);
render();
