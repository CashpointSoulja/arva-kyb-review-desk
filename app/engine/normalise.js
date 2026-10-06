// Text normalisation shared by every check. Pure functions, no I/O.

const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'sir', 'dame', 'lord', 'lady', 'prof']);
const COMPANY_SUFFIXES = [
  'limited', 'ltd', 'plc', 'llp', 'lp', 'inc', 'incorporated', 'co', 'company', 'holdings', 'group', 'uk',
];

export function stripDiacritics(s) {
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function basic(s) {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function personTokens(name) {
  return basic(String(name ?? '').replace(/-/g, ' ')).split(' ').filter((t) => t && !TITLES.has(t));
}

export function companyCore(name) {
  const toks = basic(name).split(' ').filter(Boolean);
  while (toks.length > 1 && COMPANY_SUFFIXES.includes(toks[toks.length - 1])) toks.pop();
  return toks.join(' ');
}

export function companyNumber(n) {
  const s = String(n ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^\d{1,8}$/.test(s)) return s.padStart(8, '0');
  return s;
}

export function postcode(p) {
  return String(p ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Address key: postcode plus the first building number or name token.
export function addressKey(addr) {
  if (!addr) return '';
  const pc = postcode(addr.postcode);
  const line = basic(addr.line1);
  const num = (line.match(/\b\d+[a-z]?\b/) || [line.split(' ')[0] || ''])[0];
  return `${pc}|${num}`;
}

export function addressText(addr) {
  if (!addr) return '';
  return [addr.line1, addr.line2, addr.city, addr.postcode].filter(Boolean).join(', ');
}

export function monthsBetween(fromIso, toIso) {
  const a = new Date(fromIso + (fromIso.length === 10 ? 'T00:00:00Z' : ''));
  const b = new Date(toIso + (toIso.length === 10 ? 'T00:00:00Z' : ''));
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) - (b.getUTCDate() < a.getUTCDate() ? 1 : 0);
}

export function yearsBetween(fromIso, toIso) {
  return monthsBetween(fromIso, toIso) / 12;
}
