// Name matching with explained reasoning. The output is a strength band plus
// the reasons for and against the match, never a bare similarity score.
import { personTokens, companyCore } from './normalise.js';

export function levenshtein(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Known spelling and transliteration variants (synthetic policy table).
export const NAME_VARIANTS = [
  ['mohammed', 'muhammad', 'mohamed', 'mohammad'],
  ['yousef', 'youssef', 'yusuf', 'josef'],
  ['aleksandr', 'aleksander', 'alexander', 'alexandr', 'oleksandr'],
  ['aleksandrovich', 'alexandrovich', 'oleksandrovych'],
  ['sergei', 'sergey', 'serhiy'],
  ['dmitri', 'dmitry', 'dmytro'],
  ['price', 'pryce'],
  ['catherine', 'katherine', 'kathryn', 'katharine'],
  ['stephen', 'steven'],
  ['dawei', 'david'],
];

export function variantOf(a, b) {
  return NAME_VARIANTS.some((g) => g.includes(a) && g.includes(b));
}

// Common surnames in the synthetic population: a match on one of these is weaker evidence.
export const COMMON_SURNAMES = new Set(['smith', 'jones', 'chen', 'wang', 'patel', 'khan', 'brown', 'taylor', 'williams', 'lee', 'li', 'singh']);

export function tokenRelation(a, b) {
  if (a === b) return 'exact';
  if (variantOf(a, b)) return 'variant';
  const d = levenshtein(a, b);
  if (Math.min(a.length, b.length) >= 4 && d === 1) return 'edit1';
  if (Math.min(a.length, b.length) >= 6 && d === 2) return 'edit2';
  if ((a.length === 1 && b.startsWith(a)) || (b.length === 1 && a.startsWith(b))) return 'initial';
  return null;
}

const REL_LABEL = {
  exact: 'identical',
  variant: 'known spelling/transliteration variant',
  edit1: 'one letter different',
  edit2: 'two letters different',
  initial: 'initial matches',
};

/**
 * Compare an applicant person against a list entry.
 * subject / entry: { name, dob: 'YYYY-MM' | 'YYYY', nationality }
 * Returns { strength: 'strong'|'possible'|'weak'|'none', points, for: [], against: [] }
 */
export function matchPerson(subject, entry) {
  const s = personTokens(subject.name);
  const e = personTokens(entry.name);
  const reasonsFor = [];
  const reasonsAgainst = [];
  let points = 0;
  if (!s.length || !e.length) return { strength: 'none', points: 0, for: [], against: ['Name missing'] };

  const sSur = s[s.length - 1];
  // Lists sometimes record surname first; try both orientations for the entry surname.
  const surnameCandidates = [e[e.length - 1], e[0]];
  let surRel = null; let entrySur = null;
  for (const c of surnameCandidates) {
    const r = tokenRelation(sSur, c);
    if (r && r !== 'initial') { surRel = r; entrySur = c; break; }
  }
  if (!surRel) {
    return { strength: 'none', points: 0, for: [], against: [`Surname "${sSur}" does not match any surname on the entry`] };
  }
  const surnameFlipped = entrySur === e[0] && e.length > 1 && entrySur !== e[e.length - 1];
  points += surRel === 'exact' ? 3 : surRel === 'variant' ? 2.5 : surRel === 'edit1' ? 2 : 1;
  reasonsFor.push(`Surname "${sSur}" vs "${entrySur}": ${REL_LABEL[surRel]}${surnameFlipped ? ' (list records surname first)' : ''}`);
  if (COMMON_SURNAMES.has(sSur)) {
    points -= 1.5;
    reasonsAgainst.push(`"${sSur}" is a very common surname, so a surname match alone says little`);
  }

  const sGiven = s.slice(0, -1);
  const eRest = e.filter((t) => t !== entrySur);
  const used = new Set();
  let givenMatched = 0;
  for (const g of sGiven) {
    let best = null; let bestIdx = -1;
    eRest.forEach((t, i) => {
      if (used.has(i)) return;
      const r = tokenRelation(g, t);
      if (r && (!best || ['exact', 'variant', 'edit1', 'edit2', 'initial'].indexOf(r) < ['exact', 'variant', 'edit1', 'edit2', 'initial'].indexOf(best))) { best = r; bestIdx = i; }
    });
    if (best) {
      used.add(bestIdx);
      givenMatched++;
      points += best === 'exact' ? 2 : best === 'variant' ? 1.75 : best === 'edit1' ? 1.5 : best === 'initial' ? 0.5 : 1;
      reasonsFor.push(`Given name "${g}" vs "${eRest[bestIdx]}": ${REL_LABEL[best]}`);
    } else {
      points -= 1;
      reasonsAgainst.push(`Given name "${g}" has no counterpart on the list entry`);
    }
  }
  eRest.forEach((t, i) => {
    if (!used.has(i)) {
      points -= 0.5;
      reasonsAgainst.push(`List entry has an extra name "${t}" not on the applicant record`);
    }
  });
  if (sGiven.length && !givenMatched) reasonsAgainst.push('No given name matches');

  // Date of birth.
  if (subject.dob && entry.dob) {
    const [sy, sm] = subject.dob.split('-');
    const [ey, em] = entry.dob.split('-');
    if (sy === ey && sm && em && sm === em) { points += 2.5; reasonsFor.push(`Month and year of birth identical (${entry.dob})`); }
    else if (sy === ey) { points += 1.5; reasonsFor.push(`Year of birth identical (${ey})${sm && em ? `, but month differs (${sm} vs ${em})` : ''}`); if (sm && em) points -= 0.5; }
    else if (Math.abs(Number(sy) - Number(ey)) <= 1) { points += 0.5; reasonsFor.push(`Year of birth within one year (${sy} vs ${ey})`); }
    else { points -= 3; reasonsAgainst.push(`Year of birth differs by ${Math.abs(Number(sy) - Number(ey))} years (${sy} vs ${ey})`); }
  } else {
    reasonsAgainst.push('Date of birth not available on one side, so it cannot confirm or rule out the match');
  }

  // Nationality.
  if (subject.nationality && entry.nationality) {
    if (subject.nationality.toLowerCase() === entry.nationality.toLowerCase()) { points += 1; reasonsFor.push(`Nationality identical (${entry.nationality})`); }
    else { points -= 1; reasonsAgainst.push(`Nationality differs (${subject.nationality} vs ${entry.nationality}); dual nationality is possible`); }
  }

  const strength = points >= 7 ? 'strong' : points >= 4.5 ? 'possible' : points >= 2 ? 'weak' : 'none';
  return { strength, points: Math.round(points * 100) / 100, for: reasonsFor, against: reasonsAgainst };
}

export function matchCompanyName(a, b) {
  const x = companyCore(a);
  const y = companyCore(b);
  if (!x || !y) return { relation: 'none' };
  if (x === y) return { relation: 'exact' };
  const d = levenshtein(x, y);
  if (d <= 2 && Math.min(x.length, y.length) >= 8) return { relation: 'close', distance: d };
  return { relation: 'none', distance: d };
}

export const STRENGTH_LABEL = {
  strong: 'Strong match',
  possible: 'Possible match',
  weak: 'Weak match',
  none: 'No match',
};
