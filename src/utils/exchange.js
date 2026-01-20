import { DENOMS } from "./denoms";

// Zwraca plan rozmienienia 1 szt. denomCents na mniejsze nominały (greedy)
export function makeChangePlan(denomCents) {
  const d = Number(denomCents);
  if (!Number.isFinite(d) || d <= 0) return null;

  // bierzemy nominały mniejsze od d
  const smaller = DENOMS.filter((x) => x.cents < d).sort((a, b) => b.cents - a.cents);
  if (!smaller.length) return null;

  let rem = d;
  const plan = [];
  for (const x of smaller) {
    const cnt = Math.floor(rem / x.cents);
    if (cnt > 0) {
      plan.push({ cents: x.cents, count: cnt, type: x.type });
      rem -= cnt * x.cents;
    }
  }
  return plan.length ? plan : null;
}

export function planTotalCents(plan) {
  if (!Array.isArray(plan)) return 0;
  return plan.reduce((acc, p) => acc + Number(p.cents) * Number(p.count || 0), 0);
}
