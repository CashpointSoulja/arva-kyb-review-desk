import { runChecks, ENGINE_VERSION, CHECKS } from './checks.js';
import { recommendTier } from './tiering.js';
import { buildSources } from './sources.js';
import { agentEntries } from './audit.js';

export function makeCtx(ref) {
  return {
    asOf: ref.asOf,
    ref: { sanctions: ref.sanctions, pep: ref.pep, disqualified: ref.disqualified, media: ref.media, addressIndex: ref.addressIndex, jurisdictions: ref.jurisdictions, sectors: ref.sectors },
  };
}

export function assess(app, ref) {
  const ctx = makeCtx(ref);
  const checks = runChecks(app, ctx);
  const recommendation = recommendTier(checks);
  const sources = buildSources(app, checks, ctx.ref);
  return { app, checks, recommendation, sources, audit: agentEntries(app, checks, recommendation), engine: ENGINE_VERSION };
}

export { ENGINE_VERSION, CHECKS };
