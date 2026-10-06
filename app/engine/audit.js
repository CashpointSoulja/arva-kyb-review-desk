// Regulator-readable audit trail: one row per check, finding, override and decision.
import { ENGINE_VERSION } from './checks.js';

function at(base, seconds) {
  return new Date(Date.parse(base) + seconds * 1000).toISOString();
}

export function agentEntries(app, checks, rec) {
  const out = [];
  let t = 4;
  out.push({ ts: at(app.receivedAt, 0), caseId: app.id, actor: 'Agent pre-check', type: 'application_received', ruleId: '', detail: `Application received for ${app.registry.name} (${app.registry.companyNumber})`, evidence: 'APP/legalName', engine: ENGINE_VERSION });
  for (const c of checks) {
    out.push({ ts: at(app.receivedAt, t), caseId: app.id, actor: 'Agent pre-check', type: 'check_run', ruleId: c.id, detail: `${c.name}: ${c.status.toUpperCase()}${c.severity !== 'none' ? ` (${c.severity})` : ''}. ${c.summary} Rule: ${c.rule}`, evidence: [...new Set(c.findings.flatMap((f) => f.evidence))].join(' '), engine: ENGINE_VERSION });
    t += 2;
  }
  out.push({ ts: at(app.receivedAt, t + 1), caseId: app.id, actor: 'Agent pre-check', type: 'tier_recommended', ruleId: 'TIER', detail: `Recommended tier ${rec.tier.toUpperCase()} (${rec.because}). ${rec.stpRecommended ? 'Straight-through processing recommended; analyst confirmation required.' : 'Analyst review required.'}`, evidence: rec.factors.map((f) => f.checkId).join(' '), engine: ENGINE_VERSION });
  return out;
}

export const AUDIT_COLUMNS = ['ts', 'caseId', 'actor', 'type', 'ruleId', 'detail', 'evidence', 'engine'];

export function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(entries) {
  return [AUDIT_COLUMNS.join(','), ...entries.map((e) => AUDIT_COLUMNS.map((k) => csvCell(e[k])).join(','))].join('\n');
}

export function toJSON(entries, meta = {}) {
  return JSON.stringify({ exportedAt: meta.exportedAt || new Date().toISOString(), engine: ENGINE_VERSION, scope: meta.scope || 'all', count: entries.length, entries }, null, 2);
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
}
