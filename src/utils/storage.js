import { normalizeWalletFromTotalCents, toCents } from "./money";

export const STORAGE_KEY = "budget-cashboard:v2_wallets";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function getDefaultState() {
  const defaultBuckets = [
    { id: makeId(), name: "Jedzenie" },
    { id: makeId(), name: "Transport" },
    { id: makeId(), name: "Mieszkanie" },
    { id: makeId(), name: "Rozrywka" },
    { id: makeId(), name: "Oszczędności" },
  ];

  return {
    cashWallet: {},
    buckets: defaultBuckets.map((b) => ({ ...b, wallet: {} })),
    transactions: [],
  };
}

export function migrateV1toV2(parsed) {
  const cash = Number(parsed?.cash);
  const buckets = Array.isArray(parsed?.buckets) ? parsed.buckets : [];

  const cashWallet = Number.isFinite(cash) ? normalizeWalletFromTotalCents(toCents(cash)) : {};

  const migratedBuckets = buckets
    .filter((b) => b && typeof b.name === "string")
    .map((b) => ({
      id: typeof b.id === "string" ? b.id : makeId(),
      name: b.name,
      wallet:
        b.wallet && typeof b.wallet === "object"
          ? b.wallet
          : Number.isFinite(Number(b.amount))
          ? normalizeWalletFromTotalCents(toCents(Number(b.amount)))
          : {},
    }));

  if (migratedBuckets.length === 0) return getDefaultState();

  return {
    cashWallet,
    buckets: migratedBuckets,
    transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem("budget-cashboard:v1");
      if (oldRaw) return migrateV1toV2(JSON.parse(oldRaw));
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);

    if (parsed?.cashWallet && Array.isArray(parsed?.buckets)) {
      return {
        cashWallet: parsed.cashWallet || {},
        buckets: parsed.buckets.map((b) => ({
          id: b.id || makeId(),
          name: b.name || "Koperta",
          wallet: b.wallet || {},
        })),
        transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
      };
    }

    return migrateV1toV2(parsed);
  } catch {
    return getDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function makeIdSafe() {
  return makeId();
}
