// Explainable risk tiering. The tier comes from the flagged checks by a
// fixed rule; the analyst confirms, upgrades or downgrades. Nothing auto-approves.
import { NON_DISCOUNTABLE } from './checks.js';

export const TIER_RULE = 'High if any high-severity flag, or 3+ medium flags. Medium if any medium flag, or 2+ low flags. Otherwise low.';
export const TIER_ORDER = ['low', 'medium', 'high'];

export function recommendTier(checks, discounted = {}) {
  const live = checks.filter((c) => (c.status === 'flag' || c.status === 'fail') && !discounted[c.id]);
  const factors = live.map((c) => ({ checkId: c.id, name: c.name, severity: c.severity, status: c.status, summary: c.summary }));
  const n = (sev) => live.filter((c) => c.severity === sev).length;
  let tier = 'low'; let because;
  if (n('high') > 0) { tier = 'high'; because = `${n('high')} high-severity flag${n('high') > 1 ? 's' : ''}`; }
  else if (n('medium') >= 3) { tier = 'high'; because = `${n('medium')} medium flags`; }
  else if (n('medium') > 0) { tier = 'medium'; because = `${n('medium')} medium flag${n('medium') > 1 ? 's' : ''}`; }
  else if (n('low') >= 2) { tier = 'medium'; because = `${n('low')} low flags`; }
  else because = live.length ? '1 low flag only' : 'no flags';
  const hardStops = live.filter((c) => c.status === 'fail').map((c) => c.id);
  const stpRecommended = tier === 'low' && hardStops.length === 0;
  const recommendedAction = hardStops.length ? 'escalate' : tier === 'high' ? 'escalate' : tier === 'medium' ? 'review' : 'approve';
  return {
    tier, because, factors, hardStops, stpRecommended, recommendedAction,
    nonDiscountableStops: hardStops.filter((id) => NON_DISCOUNTABLE.includes(id)),
    counts: { high: n('high'), medium: n('medium'), low: n('low') },
  };
}

export function tierDirection(from, to) {
  const d = TIER_ORDER.indexOf(to) - TIER_ORDER.indexOf(from);
  return d > 0 ? 'upgrade' : d < 0 ? 'downgrade' : 'confirm';
}

// Rules for analyst actions. Returns null when allowed, else the reason it is blocked.
export function validateTierDecision({ from, to, rationale }) {
  if (!TIER_ORDER.includes(to)) return 'Unknown tier';
  const dir = tierDirection(from, to);
  if (dir !== 'confirm' && String(rationale || '').trim().length < 20) return 'Upgrading or downgrading the tier needs a rationale of at least 20 characters';
  return null;
}

export function validateDisposition({ disposition, tierConfirmed, finalTier, recommendation, rationale, discounted = {} }) {
  if (!['approve', 'request-info', 'escalate-edd'].includes(disposition)) return 'Unknown disposition';
  if (!tierConfirmed) return 'Confirm the risk tier before recording a disposition';
  if (String(rationale || '').trim().length < 10) return 'Every disposition needs a written rationale (10+ characters)';
  if (disposition === 'approve') {
    const openStops = recommendation.hardStops.filter((id) => !discounted[id]);
    if (recommendation.nonDiscountableStops.length) return `Cannot approve: ${recommendation.nonDiscountableStops.join(', ')} is a hard stop that cannot be discounted`;
    if (openStops.length) return `Cannot approve while ${openStops.join(', ')} is unresolved`;
    if (finalTier === 'high') return 'High-tier applications cannot be approved from the desk; escalate to EDD';
  }
  return null;
}

export function validateDiscount(checkId, reason) {
  if (NON_DISCOUNTABLE.includes(checkId)) return `${checkId} cannot be discounted`;
  if (String(reason || '').trim().length < 20) return 'Discounting a finding needs a reason of at least 20 characters';
  return null;
}
