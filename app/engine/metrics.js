// Operating-cost model. All inputs are stated assumptions (TO TEST), not measurements.
export const ASSUMPTIONS = {
  analystCostPerHourGBP: 48,
  manualMinutesPerReview: 95,
  deskMinutes: { low: 6, medium: 28, high: 70 },
  engineCostPerCaseGBP: 0.35,
  source: 'Synthetic planning assumptions for the Northbank scenario. Replace with time-and-motion data from a pilot.',
};

export function costModel(tiers, a = ASSUMPTIONS) {
  const n = tiers.length || 1;
  const manualCost = (a.manualMinutesPerReview / 60) * a.analystCostPerHourGBP;
  const deskMinutesTotal = tiers.reduce((s, t) => s + a.deskMinutes[t], 0);
  const deskCost = (deskMinutesTotal / n / 60) * a.analystCostPerHourGBP + a.engineCostPerCaseGBP;
  const minutesSaved = a.manualMinutesPerReview * n - deskMinutesTotal;
  return {
    cases: tiers.length,
    manualCostPerReview: manualCost,
    deskCostPerReview: deskCost,
    costReduction: 1 - deskCost / manualCost,
    analystHoursSaved: minutesSaved / 60,
    avgDeskMinutes: deskMinutesTotal / n,
  };
}

export function straightThroughRate(decisions, recs) {
  // STP = recommended for straight-through AND approved by an analyst without changing the tier.
  const ids = Object.keys(recs);
  const stp = ids.filter((id) => recs[id].stpRecommended && decisions[id]?.disposition === 'approve' && decisions[id]?.tierDirection === 'confirm');
  const decided = ids.filter((id) => decisions[id]?.disposition);
  return { stp: stp.length, decided: decided.length, total: ids.length, recommended: ids.filter((id) => recs[id].stpRecommended).length };
}
