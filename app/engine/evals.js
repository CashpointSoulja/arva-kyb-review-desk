// Golden-set evaluation: seeded risk signals vs what the engine flags.
import { assess } from './index.js';

export function evaluateCase(gc, ref) {
  const { checks, recommendation } = assess(gc.app, ref);
  const flagged = checks.filter((c) => c.status === 'flag' || c.status === 'fail').map((c) => c.id);
  const expected = gc.expected.signals;
  const caught = expected.filter((s) => flagged.includes(s));
  const missed = expected.filter((s) => !flagged.includes(s));
  const falsePositives = flagged.filter((s) => !expected.includes(s));
  return {
    id: gc.id, title: gc.title, seeded: gc.seeded, expectedTier: gc.expected.tier, tier: recommendation.tier,
    tierMatch: gc.expected.tier === recommendation.tier, expected, flagged, caught, missed, falsePositives, note: gc.note || '',
  };
}

export function runEval(golden, ref) {
  const cases = golden.map((g) => evaluateCase(g, ref));
  const seededTotal = cases.reduce((s, c) => s + c.expected.length, 0);
  const caughtTotal = cases.reduce((s, c) => s + c.caught.length, 0);
  const fpTotal = cases.reduce((s, c) => s + c.falsePositives.length, 0);
  const escalated = cases.filter((c) => c.tier === 'high');
  const shouldEscalate = cases.filter((c) => c.expectedTier === 'high');
  const truePosEsc = escalated.filter((c) => c.expectedTier === 'high');
  return {
    cases,
    summary: {
      cases: cases.length,
      seededSignals: seededTotal,
      caughtSignals: caughtTotal,
      catchRate: seededTotal ? caughtTotal / seededTotal : 0,
      falsePositiveFlags: fpTotal,
      casesWithFalsePositive: cases.filter((c) => c.falsePositives.length).length,
      cleanCases: cases.filter((c) => !c.expected.length).length,
      tierAgreement: cases.filter((c) => c.tierMatch).length,
      escalated: escalated.length,
      shouldEscalate: shouldEscalate.length,
      escalationPrecision: escalated.length ? truePosEsc.length / escalated.length : 0,
      escalationRecall: shouldEscalate.length ? truePosEsc.length / shouldEscalate.length : 0,
      misses: cases.filter((c) => c.missed.length).map((c) => ({ id: c.id, title: c.title, missed: c.missed, note: c.note })),
    },
  };
}
