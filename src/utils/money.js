import { DENOMS } from "./denoms";

export function formatPLN(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function parseMoney(input) {
  if (typeof input !== "string") return null;

  const cleaned = input
    .trim()
    .replaceAll(" ", "")
    .replaceAll("zł", "")
    .replaceAll("PLN", "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!cleaned) return null;

  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;

  return Math.round(num * 100) / 100;
}

export function toCents(amount) {
  return Math.round((Number(amount) || 0) * 100);
}

export function fromCents(cents) {
  return (Number(cents) || 0) / 100;
}

// Wallet = { [denomCents: string]: numberCount }
export function walletTotalCents(wallet) {
  if (!wallet) return 0;
  let sum = 0;
  for (const d of DENOMS) {
    const c = Number(wallet[String(d.cents)] || 0);
    sum += d.cents * c;
  }
  return sum;
}

export function walletGetCount(wallet, denomCents) {
  return Number((wallet || {})[String(denomCents)] || 0);
}

export function walletSetCount(wallet, denomCents, count) {
  const w = { ...(wallet || {}) };
  const k = String(denomCents);
  if (count <= 0) delete w[k];
  else w[k] = count;
  return w;
}

export function walletInc(wallet, denomCents, delta) {
  const cur = walletGetCount(wallet, denomCents);
  return walletSetCount(wallet, denomCents, cur + delta);
}

export function normalizeWalletFromTotalCents(totalCents) {
  let remaining = Math.max(0, Number(totalCents) || 0);
  let w = {};
  for (const d of DENOMS) {
    const count = Math.floor(remaining / d.cents);
    if (count > 0) {
      w[String(d.cents)] = count;
      remaining -= count * d.cents;
    }
  }
  return w;
}

export function walletToBreakdown(wallet) {
  const out = [];
  for (const d of DENOMS) {
    const count = walletGetCount(wallet, d.cents);
    if (count > 0) out.push({ ...d, count });
  }
  return out;
}

/**
 * Koperty: NIE grupujemy. Zwraca listę pojedynczych itemów obok siebie.
 * maxRender ogranicza liczbę renderowanych elementów (żeby nie zabić UI)
 */
export function walletToUngroupedItems(wallet, maxRender = 80) {
  const items = [];
  for (const d of DENOMS) {
    const count = walletGetCount(wallet, d.cents);
    const n = Math.min(count, Math.max(0, maxRender - items.length));
    for (let i = 0; i < n; i++) {
      items.push({ key: `${d.cents}-${i}-${items.length}`, denomCents: d.cents, type: d.type });
    }
    if (items.length >= maxRender) break;
  }
  return items;
}

export function denomType(denomCents) {
  const d = DENOMS.find((x) => x.cents === Number(denomCents));
  return d?.type || (Number(denomCents) >= 1000 ? "banknote" : "coin");
}

// UI helper: format pojedynczego nominału (w groszach) na etykietę "X zł" / "Y gr".
export function formatDenom(denomCents) {
  const c = Number(denomCents || 0);
  if (!Number.isFinite(c) || c <= 0) return "-";

  if (c < 100) return `${c} gr`;

  // dla złotówek pokazuj bez miejsc po przecinku, bo nominały są całe
  const zl = Math.round(c / 100);
  return `${zl} zł`;
}
