import { useEffect, useMemo, useState } from "react";
import { loadState, saveState, makeIdSafe } from "./storage";
import {
  fromCents,
  toCents,
  parseMoney,
  formatPLN,
  walletTotalCents,
  normalizeWalletFromTotalCents,
  walletInc,
  walletGetCount,
} from "./money";
import { makeChangePlan } from "./exchange";

function promptPickBucket(buckets, title) {
  if (!buckets.length) {
    alert("Nie masz jeszcze żadnych kopert.");
    return null;
  }

  const options = buckets.map((b, i) => `${i + 1}. ${b.name}`).join("\n");
  const input = window.prompt(`${title}\n\nWybierz numer:\n${options}`, "1");
  if (input === null) return null;

  const idx = Number(input.trim());
  if (!Number.isInteger(idx) || idx < 1 || idx > buckets.length) {
    alert("Nieprawidłowy numer koperty.");
    return null;
  }
  return buckets[idx - 1];
}

export default function useBudgetState() {
  const [state, setState] = useState(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  function addTransaction(prev, label) {
    if (!label) return prev;
    const entry = { id: makeIdSafe(), ts: Date.now(), label };
    const list = [entry, ...(prev.transactions || [])].slice(0, 50);
    return { ...prev, transactions: list };
  }

  function mergeAllPossible() {
    setState((prev) => {
      const cashTotal = walletTotalCents(prev.cashWallet);
      const newCashWallet = normalizeWalletFromTotalCents(cashTotal);
      const newBuckets = prev.buckets.map((b) => {
        const total = walletTotalCents(b.wallet);
        return { ...b, wallet: normalizeWalletFromTotalCents(total) };
      });
      return addTransaction(
        { ...prev, cashWallet: newCashWallet, buckets: newBuckets },
        "Scalono wszystko mozliwe"
      );
    });
  }

  function returnAllToCash() {
    setState((prev) => {
      let totalCents = walletTotalCents(prev.cashWallet);
      for (const b of prev.buckets) {
        totalCents += walletTotalCents(b.wallet);
      }
      const newCashWallet = normalizeWalletFromTotalCents(totalCents);
      const newBuckets = prev.buckets.map((b) => ({ ...b, wallet: {} }));
      return addTransaction(
        { ...prev, cashWallet: newCashWallet, buckets: newBuckets },
        "Zwrocono wszystko do puli"
      );
    });
  }

  const cashCents = useMemo(() => walletTotalCents(state.cashWallet), [state.cashWallet]);
  const cashAmount = fromCents(cashCents);

  const bucketsAmounts = useMemo(() => {
    const map = {};
    for (const b of state.buckets) map[b.id] = fromCents(walletTotalCents(b.wallet));
    return map;
  }, [state.buckets]);

  const sumBucketsAmount = useMemo(() => {
    return state.buckets.reduce((acc, b) => acc + fromCents(walletTotalCents(b.wallet)), 0);
  }, [state.buckets]);

  const totalAmount = cashAmount + sumBucketsAmount;

  const maxBucketAmount = useMemo(() => {
    const max = Math.max(...state.buckets.map((b) => fromCents(walletTotalCents(b.wallet))), 0);
    return Math.max(max, 1);
  }, [state.buckets]);

  // --------- Dashboard actions ---------
  function addCash() {
    const input = window.prompt("Ile chcesz zasilić pulę? (np. 1000,00)", "1000,00");
    if (input === null) return;

    const amount = parseMoney(input);
    if (amount === null) return alert("Nie rozpoznaję kwoty.");
    if (amount <= 0) return alert("Kwota musi być większa od zera.");

    setState((prev) => {
      const newCashC = walletTotalCents(prev.cashWallet) + toCents(amount);
      return addTransaction(
        { ...prev, cashWallet: normalizeWalletFromTotalCents(newCashC) },
        `Zasilono pule ${formatPLN(amount)}`
      );
    });
  }

  function removeCash() {
    const input = window.prompt("Ile chcesz usunąć z puli? (np. 100,00)", "100,00");
    if (input === null) return;

    const amount = parseMoney(input);
    if (amount === null) return alert("Nie rozpoznaję kwoty.");
    if (amount <= 0) return alert("Kwota musi być większa od zera.");

    const amtC = toCents(amount);
    if (amtC > cashCents) return alert("Nie możesz usunąć więcej niż masz w puli.");

    setState((prev) => {
      const newCashC = walletTotalCents(prev.cashWallet) - amtC;
      return addTransaction(
        { ...prev, cashWallet: normalizeWalletFromTotalCents(newCashC) },
        `Usunieto z puli ${formatPLN(amount)}`
      );
    });
  }

  function addBucket() {
    const name = window.prompt("Nazwa nowej koperty:", "Nowa koperta");
    if (name === null) return;

    const trimmed = name.trim();
    if (!trimmed) return alert("Nazwa nie może być pusta.");

    setState((prev) => ({
      ...prev,
      buckets: [...prev.buckets, { id: makeIdSafe(), name: trimmed, wallet: {} }],
    }));
  }

  function allocateToBucket() {
    if (cashCents <= 0) return alert("Nie masz nic w puli.");

    const bucket = promptPickBucket(state.buckets, "Do której koperty przypisać?");
    if (!bucket) return;

    const input = window.prompt(`Ile przypisać do "${bucket.name}"?`, "100,00");
    if (input === null) return;

    const amount = parseMoney(input);
    if (amount === null) return alert("Nie rozpoznaję kwoty.");
    if (amount <= 0) return alert("Kwota musi być > 0.");

    const amtC = toCents(amount);
    if (amtC > cashCents) return alert("Nie możesz przypisać więcej niż masz w puli.");

    setState((prev) => {
      const newCashC = walletTotalCents(prev.cashWallet) - amtC;
      const newBuckets = prev.buckets.map((b) => {
        if (b.id !== bucket.id) return b;
        const bC = walletTotalCents(b.wallet) + amtC;
        return { ...b, wallet: normalizeWalletFromTotalCents(bC) };
      });
      return addTransaction(
        { ...prev, cashWallet: normalizeWalletFromTotalCents(newCashC), buckets: newBuckets },
        `Przypisano ${formatPLN(amount)} do ${bucket.name}`
      );
    });
  }

  function transferBetweenBuckets() {
    const from = promptPickBucket(state.buckets, "Z której koperty przelać?");
    if (!from) return;

    const fromCentsAvail = walletTotalCents(from.wallet);
    if (fromCentsAvail <= 0) return alert("W tej kopercie nie ma środków.");

    const to = promptPickBucket(state.buckets, "Do której koperty przelać?");
    if (!to) return;
    if (to.id === from.id) return alert("Nie możesz przelać do tej samej koperty.");

    const input = window.prompt(`Ile przelać z "${from.name}" do "${to.name}"?`, "50,00");
    if (input === null) return;

    const amount = parseMoney(input);
    if (amount === null) return alert("Nie rozpoznaję kwoty.");
    if (amount <= 0) return alert("Kwota musi być > 0.");

    const amtC = toCents(amount);
    if (amtC > fromCentsAvail) return alert("Nie możesz przelać więcej niż masz w tej kopercie.");

    setState((prev) => {
      const newBuckets = prev.buckets.map((b) => {
        if (b.id === from.id) {
          const c = walletTotalCents(b.wallet) - amtC;
          return { ...b, wallet: normalizeWalletFromTotalCents(c) };
        }
        if (b.id === to.id) {
          const c = walletTotalCents(b.wallet) + amtC;
          return { ...b, wallet: normalizeWalletFromTotalCents(c) };
        }
        return b;
      });
      return addTransaction(
        { ...prev, buckets: newBuckets },
        `Transfer ${formatPLN(amount)}: ${from.name} -> ${to.name}`
      );
    });
  }

  function renameBucket(bucketId) {
    const b = state.buckets.find((x) => x.id === bucketId);
    if (!b) return;

    const name = window.prompt(`Nowa nazwa koperty (było: "${b.name}")`, b.name);
    if (name === null) return;

    const trimmed = name.trim();
    if (!trimmed) return alert("Nazwa nie może być pusta.");

    setState((prev) => ({
      ...prev,
      buckets: prev.buckets.map((x) => (x.id === bucketId ? { ...x, name: trimmed } : x)),
    }));
  }

  function deleteBucket(bucketId) {
    const b = state.buckets.find((x) => x.id === bucketId);
    if (!b) return;

    const ok = window.confirm(
      `Usunąć kopertę "${b.name}"?\n\nOK = usuń kopertę i przenieś jej środki do Puli.`
    );
    if (!ok) return;

    setState((prev) => {
      const bucket = prev.buckets.find((x) => x.id === bucketId);
      if (!bucket) return prev;

      let newCashWallet = { ...(prev.cashWallet || {}) };
      const bucketTotal = walletTotalCents(bucket.wallet);
      for (const [k, v] of Object.entries(bucket.wallet || {})) {
        const denom = Number(k);
        const cnt = Number(v || 0);
        if (cnt > 0) newCashWallet = walletInc(newCashWallet, denom, cnt);
      }

      return addTransaction(
        {
          ...prev,
          cashWallet: newCashWallet,
          buckets: prev.buckets.filter((x) => x.id !== bucketId),
        },
        bucketTotal > 0
          ? `Usunieto koperte "${bucket.name}" (do puli ${formatPLN(fromCents(bucketTotal))})`
          : `Usunieto koperte "${bucket.name}"`
      );
    });
  }

  // --------- Drag actions (NO CLICK SELECT) ---------
  function moveOneToBucket(payload, targetBucketId) {
    if (!payload?.denomCents) return;
    const denom = payload.denomCents;

    setState((prev) => {
      const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
      const targetIdx = buckets.findIndex((b) => b.id === targetBucketId);
      if (targetIdx === -1) return prev;

      if (payload.source === "cash") {
        const have = walletGetCount(prev.cashWallet, denom);
        if (have <= 0) return prev;

        const newCashWallet = walletInc(prev.cashWallet, denom, -1);
        buckets[targetIdx].wallet = walletInc(buckets[targetIdx].wallet, denom, +1);
        return addTransaction(
          { ...prev, cashWallet: newCashWallet, buckets },
          `Pula -> ${buckets[targetIdx].name}: ${formatPLN(denom / 100)}`
        );
      }

      if (payload.source === "bucket") {
        const fromIdx = buckets.findIndex((b) => b.id === payload.bucketId);
        if (fromIdx === -1) return prev;
        if (fromIdx === targetIdx) return prev;

        const have = walletGetCount(buckets[fromIdx].wallet, denom);
        if (have <= 0) return prev;

        buckets[fromIdx].wallet = walletInc(buckets[fromIdx].wallet, denom, -1);
        buckets[targetIdx].wallet = walletInc(buckets[targetIdx].wallet, denom, +1);
        return addTransaction(
          { ...prev, buckets },
          `${buckets[fromIdx].name} -> ${buckets[targetIdx].name}: ${formatPLN(denom / 100)}`
        );
      }

      return prev;
    });
  }

  function moveOneToCash(payload) {
    if (!payload?.denomCents) return;
    if (payload.source !== "bucket") return;

    const denom = payload.denomCents;

    setState((prev) => {
      const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
      const fromIdx = buckets.findIndex((b) => b.id === payload.bucketId);
      if (fromIdx === -1) return prev;

      const have = walletGetCount(buckets[fromIdx].wallet, denom);
      if (have <= 0) return prev;

      buckets[fromIdx].wallet = walletInc(buckets[fromIdx].wallet, denom, -1);
      const newCashWallet = walletInc(prev.cashWallet, denom, +1);
      return addTransaction(
        { ...prev, cashWallet: newCashWallet, buckets },
        `${buckets[fromIdx].name} -> Pula: ${formatPLN(denom / 100)}`
      );
    });
  }

  // --------- Exchange (drop w prawy pas) ---------
  // payload: { source: "cash"|"bucket", bucketId?: string, denomCents: number }
  function exchangeOne(payload) {
    if (!payload?.denomCents) return false;
    const denom = Number(payload.denomCents);
    const plan = makeChangePlan(denom);
    if (!plan) return false;

    setState((prev) => {
      if (payload.source === "cash") {
        const have = walletGetCount(prev.cashWallet, denom);
        if (have <= 0) return prev;

        let w = walletInc(prev.cashWallet, denom, -1);
        for (const p of plan) w = walletInc(w, Number(p.cents), Number(p.count || 0));
        return addTransaction(
          { ...prev, cashWallet: w },
          `Rozmieniono ${formatPLN(denom / 100)} w Puli`
        );
      }

      if (payload.source === "bucket") {
        const bucketId = payload.bucketId;
        if (!bucketId) return prev;

        const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
        const idx = buckets.findIndex((b) => b.id === bucketId);
        if (idx === -1) return prev;

        const have = walletGetCount(buckets[idx].wallet, denom);
        if (have <= 0) return prev;

        let w = walletInc(buckets[idx].wallet, denom, -1);
        for (const p of plan) w = walletInc(w, Number(p.cents), Number(p.count || 0));
        buckets[idx].wallet = w;
        return addTransaction(
          { ...prev, buckets },
          `Rozmieniono ${formatPLN(denom / 100)} w ${buckets[idx].name}`
        );
      }

      return prev;
    });

    return true;
  }

  // --------- Merge basket helpers (drop w lewy pas) ---------
  // Zdejmuje 1 szt. z portfela (zniknie z UI). Zwraca true/false.
  function reserveOne(payload) {
    if (!payload?.denomCents) return false;
    const denom = Number(payload.denomCents);

    let ok = false;
    setState((prev) => {
      if (payload.source === "cash") {
        const have = walletGetCount(prev.cashWallet, denom);
        if (have <= 0) return prev;
        ok = true;
        return { ...prev, cashWallet: walletInc(prev.cashWallet, denom, -1) };
      }

      if (payload.source === "bucket") {
        const bucketId = payload.bucketId;
        if (!bucketId) return prev;

        const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
        const idx = buckets.findIndex((b) => b.id === bucketId);
        if (idx === -1) return prev;

        const have = walletGetCount(buckets[idx].wallet, denom);
        if (have <= 0) return prev;

        ok = true;
        buckets[idx].wallet = walletInc(buckets[idx].wallet, denom, -1);
        return { ...prev, buckets };
      }

      return prev;
    });

    return ok;
  }

  // Oddaje do portfela to, co bylo zarezerwowane w koszyku.
  function returnReserved({ source, bucketId, countsMap }) {
    if (!source || !countsMap) return;

    setState((prev) => {
      if (source === "cash") {
        let w = { ...(prev.cashWallet || {}) };
        for (const [k, v] of Object.entries(countsMap)) {
          const denom = Number(k);
          const cnt = Number(v || 0);
          if (cnt > 0) w = walletInc(w, denom, cnt);
        }
        return { ...prev, cashWallet: w };
      }

      if (source === "bucket") {
        if (!bucketId) return prev;
        const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
        const idx = buckets.findIndex((b) => b.id === bucketId);
        if (idx === -1) return prev;

        let w = { ...(buckets[idx].wallet || {}) };
        for (const [k, v] of Object.entries(countsMap)) {
          const denom = Number(k);
          const cnt = Number(v || 0);
          if (cnt > 0) w = walletInc(w, denom, cnt);
        }
        buckets[idx].wallet = w;
        return { ...prev, buckets };
      }

      return prev;
    });
  }

  // Scalanie: pieniadze juz sa zdjete (reserve), tylko dodaj wynik greedy z totalCents.
  function mergeReserved({ source, bucketId, totalCents }) {
    const total = Number(totalCents || 0);
    if (!source || total <= 0) return;

    const outWallet = normalizeWalletFromTotalCents(total);

    setState((prev) => {
      if (source === "cash") {
        let w = { ...(prev.cashWallet || {}) };
        for (const [k, v] of Object.entries(outWallet)) {
          const denom = Number(k);
          const cnt = Number(v || 0);
          if (cnt > 0) w = walletInc(w, denom, cnt);
        }
        return addTransaction(
          { ...prev, cashWallet: w },
          `Scalono ${formatPLN(total / 100)} w Puli`
        );
      }

      if (source === "bucket") {
        if (!bucketId) return prev;
        const buckets = prev.buckets.map((b) => ({ ...b, wallet: { ...(b.wallet || {}) } }));
        const idx = buckets.findIndex((b) => b.id === bucketId);
        if (idx === -1) return prev;

        let w = { ...(buckets[idx].wallet || {}) };
        for (const [k, v] of Object.entries(outWallet)) {
          const denom = Number(k);
          const cnt = Number(v || 0);
          if (cnt > 0) w = walletInc(w, denom, cnt);
        }
        buckets[idx].wallet = w;
        return addTransaction(
          { ...prev, buckets },
          `Scalono ${formatPLN(total / 100)} w ${buckets[idx].name}`
        );
      }

      return prev;
    });
  }

  return {
    state,
    cashAmount,
    sumBucketsAmount,
    totalAmount,
    bucketsAmounts,
    maxBucketAmount,
    addCash,
    removeCash,
    addBucket,
    allocateToBucket,
    transferBetweenBuckets,
    renameBucket,
    deleteBucket,
    moveOneToBucket,
    moveOneToCash,
    exchangeOne,
    reserveOne,
    returnReserved,
    mergeReserved,
    mergeAllPossible,
    returnAllToCash,
  };
}
