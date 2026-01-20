import { useMemo, useRef, useState, useEffect } from "react";
import Envelope from "../components/Envelope";
import CashArea from "../components/CashArea";
import RightExchangeZone from "../components/RightExchangeZone";
import ExchangePanel from "../components/ExchangePanel";
import LeftMergeZone from "../components/LeftMergeZone";
import MergePanel from "../components/MergePanel";
import { formatPLN, formatDenom } from "../utils/money";
import { makeChangePlan } from "../utils/exchange";
import { normalizeWalletFromTotalCents } from "../utils/money";

function emptyMergeSelection() {
  return { source: null, bucketId: null, countsMap: {}, totalCents: 0 };
}

export default function VariantVisualization({ budget, variant, title, subtitle }) {
  const {
    state,
    cashAmount,
    bucketsAmounts,
    moveOneToBucket,
    moveOneToCash,
    exchangeOne,
    reserveOne,
    returnReserved,
    mergeReserved,
  } = budget;

  const [draggingMoney, setDraggingMoney] = useState(null);
  const lastDragRef = useRef(null);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;

  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeDenom, setExchangeDenom] = useState(null);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSel, setMergeSel] = useState(() => emptyMergeSelection());

  const isDragging = !!draggingMoney?.denomCents;
  const historyItems = (state.transactions || []).slice(0, 10);

  function formatHistoryTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  const exchangePlan = useMemo(() => {
    if (!exchangeDenom) return null;
    return makeChangePlan(exchangeDenom);
  }, [exchangeDenom]);

  const mergePreviewWallet = useMemo(() => {
    if (!mergeSel?.totalCents) return {};
    return normalizeWalletFromTotalCents(mergeSel.totalCents);
  }, [mergeSel?.totalCents]);

  const mergeSelRef = useRef(mergeSel);
  const warnedMixRef = useRef(false);

  useEffect(() => {
    mergeSelRef.current = mergeSel;
    if (!mergeSel?.source) warnedMixRef.current = false;
  }, [mergeSel]);

  function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function setPayload(e, payload) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";

    setDraggingMoney(payload);
    lastDragRef.current = payload;
    setExchangeDenom(payload?.denomCents || null);
  }

  function selectPayload(payload) {
    if (!isCoarsePointer) return;
    setSelectedPayload(payload);
    setDraggingMoney(payload);
    lastDragRef.current = payload;
    setExchangeDenom(payload?.denomCents || null);
  }

  function clearDragging() {
    setDraggingMoney(null);
    lastDragRef.current = null;
    setExchangeDenom(null);
    setExchangeOpen(false);
    setSelectedPayload(null);
  }

  useEffect(() => {
    function handleDragEnd() {
      if (draggingMoney) clearDragging();
    }

    window.addEventListener("dragend", handleDragEnd);
    window.addEventListener("drop", handleDragEnd);
    return () => {
      window.removeEventListener("dragend", handleDragEnd);
      window.removeEventListener("drop", handleDragEnd);
    };
  }, [draggingMoney, clearDragging]);

  function readPayload(e) {
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function onDropBucket(e, bucketId) {
    e.preventDefault();
    const p = readPayload(e) || lastDragRef.current;
    if (!p?.denomCents) return clearDragging();
    moveOneToBucket(p, bucketId);
    clearDragging();
  }

  function onDropCash(e) {
    e.preventDefault();
    const p = readPayload(e) || lastDragRef.current;
    if (!p?.denomCents) return clearDragging();
    moveOneToCash(p);
    clearDragging();
  }

  function onTapBucket(bucketId) {
    if (!isCoarsePointer || !selectedPayload) return;
    moveOneToBucket(selectedPayload, bucketId);
    clearDragging();
  }

  function onTapCash() {
    if (!isCoarsePointer || !selectedPayload) return;
    moveOneToCash(selectedPayload);
    clearDragging();
  }

  function onDropExchange() {
    const p = lastDragRef.current;
    if (!p?.denomCents) return clearDragging();

    const plan = makeChangePlan(p.denomCents);
    if (!plan) return clearDragging();

    exchangeOne?.({
      source: p.source,
      bucketId: p.bucketId,
      denomCents: p.denomCents,
      plan,
    });

    clearDragging();
  }

  function addToMergeBasket(e) {
    if (e?.preventDefault) e.preventDefault();

    const p = lastDragRef.current;
    if (!p?.denomCents) return clearDragging();

    const ok = reserveOne?.(p);
    if (!ok) return clearDragging();

    const cur = mergeSelRef.current;

    if (cur?.source) {
      const sameSource =
        cur.source === p.source &&
        (cur.source === "cash" || (cur.source === "bucket" && cur.bucketId === p.bucketId));

      if (!sameSource) {
        returnReserved?.({
          source: p.source,
          bucketId: p.source === "bucket" ? p.bucketId : null,
          countsMap: { [String(p.denomCents)]: 1 },
        });

        if (!warnedMixRef.current) {
          warnedMixRef.current = true;
          window.alert(
            "Scalanie dziala tylko z jednego miejsca naraz (Pula albo jedna koperta). Zwracam pieniadze."
          );
        }

        clearDragging();
        return;
      }
    }

    setMergeSel((prev) => {
      if (!prev?.source) {
        return {
          source: p.source,
          bucketId: p.source === "bucket" ? p.bucketId : null,
          countsMap: { [String(p.denomCents)]: 1 },
          totalCents: Number(p.denomCents),
        };
      }

      const next = { ...prev, countsMap: { ...(prev.countsMap || {}) } };
      const k = String(p.denomCents);
      next.countsMap[k] = Number(next.countsMap[k] || 0) + 1;
      next.totalCents = Number(next.totalCents || 0) + Number(p.denomCents);
      return next;
    });

    setMergeOpen(true);
    clearDragging();
  }

  function handleReturn() {
    if (!mergeSel?.source) return;
    returnReserved?.({ source: mergeSel.source, bucketId: mergeSel.bucketId, countsMap: mergeSel.countsMap });
    setMergeSel(emptyMergeSelection());
    revealMerge(false);
  }

  function handleMerge() {
    if (!mergeSel?.source || !mergeSel.totalCents) return;
    mergeReserved?.({ source: mergeSel.source, bucketId: mergeSel.bucketId, totalCents: mergeSel.totalCents });
    setMergeSel(emptyMergeSelection());
    revealMerge(false);
  }

  function revealMerge(open) {
    setMergeOpen(open);
  }

  return (
    <main className={`variantPage variantPage--${variant} variantPage--viz`}>
      <section className="variantHero variantHero--viz">
        <div className="variantHero__copy">
          <div className="variantHero__eyebrow">{title}</div>
          <h2 className="variantHero__title">Wizualizacja przeplywu pieniedzy</h2>
          <p className="variantHero__subtitle">{subtitle}</p>
        </div>
        <div className="variantHero__metrics">
          <div className="variantMetric">
            <div className="variantMetric__label">Pula</div>
            <div className="variantMetric__value">{formatPLN(cashAmount)}</div>
          </div>
          <div className="variantMetric">
            <div className="variantMetric__label">Koperty</div>
            <div className="variantMetric__value">{state.buckets.length}</div>
          </div>
        </div>
      </section>

      {isCoarsePointer && selectedPayload && (
        <section className="mobileDragBar">
          <div className="mobileDragBar__label">Wybrano: {formatDenom(selectedPayload.denomCents)}</div>
          <div className="mobileDragBar__actions">
            <button type="button" className="mobileDragBar__btn" onClick={onDropExchange}>
              Rozmien
            </button>
            <button type="button" className="mobileDragBar__btn" onClick={addToMergeBasket}>
              Scalaj
            </button>
            <button type="button" className="mobileDragBar__btn" onClick={clearDragging}>
              Anuluj
            </button>
          </div>
        </section>
      )}

      <section className="variantVizGrid">
        <div className="variantPanel variantPanel--envelopes">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Koperty</h3>
            <span className="variantPanel__meta">Przeciagnij pieniadze</span>
          </div>
          <div className="variantEnvelopes">
            {state.buckets.map((b) => (
              <Envelope
                key={b.id}
                bucket={b}
                amountLabel={formatPLN(bucketsAmounts[b.id] || 0)}
                onDrop={onDropBucket}
                onDragOver={allowDrop}
                onDragStart={setPayload}
                onDragEnd={clearDragging}
                onSelect={selectPayload}
                selectedPayload={selectedPayload}
                onTapTarget={onTapBucket}
              />
            ))}
          </div>
        </div>

        <div className="variantPanel variantPanel--cash">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Pula</h3>
            <span className="variantPanel__meta">Upusc tutaj, aby oddac</span>
          </div>
          <CashArea
            cashWallet={state.cashWallet}
            cashLabel={formatPLN(cashAmount)}
            onDropCash={onDropCash}
            onDragOver={allowDrop}
            onDragStart={setPayload}
            onDragEnd={clearDragging}
            onSelect={selectPayload}
            selectedPayload={selectedPayload}
            onTapTarget={onTapCash}
          />
        </div>

        <div className="variantPanel variantPanel--history">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Historia ruchow</h3>
            <span className="variantPanel__meta">Ostatnie akcje</span>
          </div>
          {historyItems.length === 0 ? (
            <div className="variantEmpty">Brak historii.</div>
          ) : (
            <div className="historyList">
              {historyItems.map((item) => (
                <div className="historyItem" key={item.id}>
                  <div className="historyItem__label">{item.label}</div>
                  <div className="historyItem__time">{formatHistoryTime(item.ts)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <LeftMergeZone
        active={isDragging}
        onEnter={() => isDragging && revealMerge(true)}
        onLeave={() => revealMerge(false)}
        onDrop={addToMergeBasket}
      />
      <MergePanel
        visible={mergeOpen}
        selection={mergeSel}
        resultWallet={mergePreviewWallet}
        onReturn={handleReturn}
        onMerge={handleMerge}
      />

      <RightExchangeZone
        active={isDragging}
        onEnter={() => isDragging && setExchangeOpen(true)}
        onLeave={() => setExchangeOpen(false)}
        onDrop={onDropExchange}
      />
      <ExchangePanel visible={exchangeOpen && isDragging} denomCents={exchangeDenom} plan={exchangePlan} onConfirm={onDropExchange} />
    </main>
  );
}
