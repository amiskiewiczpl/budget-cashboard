import { useMemo, useRef, useState, useEffect } from "react"; // dodaj useEffect
import { useMemo, useRef, useState, useEffect } from "react";
import Card from "../../components/Card";
import Envelope from "../../components/Envelope";
import CashArea from "../../components/CashArea";
import RightExchangeZone from "../../components/RightExchangeZone";
import ExchangePanel from "../../components/ExchangePanel";
import LeftMergeZone from "../../components/LeftMergeZone";
import MergePanel from "../../components/MergePanel";
import { formatPLN, formatDenom } from "../../utils/money";
import { makeChangePlan } from "../../utils/exchange";
import { normalizeWalletFromTotalCents } from "../../utils/money";

function emptyMergeSelection() {
  return { source: null, bucketId: null, countsMap: {}, totalCents: 0 };
}

export default function VisualizationPage({ budget }) {
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

  // drag tracking
  const [draggingMoney, setDraggingMoney] = useState(null);
  const lastDragRef = useRef(null);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;

  // right exchange
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeDenom, setExchangeDenom] = useState(null);

  // left merge
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSel, setMergeSel] = useState(() => emptyMergeSelection());

  const isDragging = !!draggingMoney?.denomCents;

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
    if (!mergeSel?.source) warnedMixRef.current = false; // reset ostrze‘•enia po wyczyszczeniu koszyka
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

  // RIGHT: exchange on drop
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

    // 1) zdejmij z puli/koperty (rezerwacja)
    const ok = reserveOne?.(p);
    if (!ok) return clearDragging();

    // 2) walidacja ‘­rÆˆd‘'a ƒ?" POZA setState (‘•eby nie dublowa‘'o!)
    const cur = mergeSelRef.current;

    if (cur?.source) {
      const sameSource =
        cur.source === p.source &&
        (cur.source === "cash" || (cur.source === "bucket" && cur.bucketId === p.bucketId));

      if (!sameSource) {
        // oddaj tylko tŽt 1 sztukŽt, ktÆˆrŽ w‘'a‘>nie zarezerwowali‘>my
        returnReserved?.({
          source: p.source,
          bucketId: p.source === "bucket" ? p.bucketId : null,
          countsMap: { [String(p.denomCents)]: 1 },
        });

        if (!warnedMixRef.current) {
          warnedMixRef.current = true;
          window.alert(
            "Scalanie dzia‘'a tylko z jednego miejsca naraz (Pula albo jedna koperta). Zwracam pieniŽdze."
          );
        }

        clearDragging();
        return;
      }
    }

    // 3) dopisz do koszyka ƒ?" bez efektÆˆw ubocznych
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
    setMergeOpen(false);
  }

  function handleMerge() {
    if (!mergeSel?.source || !mergeSel.totalCents) return;
    mergeReserved?.({ source: mergeSel.source, bucketId: mergeSel.bucketId, totalCents: mergeSel.totalCents });
    setMergeSel(emptyMergeSelection());
    setMergeOpen(false);
  }

  function handleClear() {
    // alias do Return, bo czyszczenie bez oddania = strata
    handleReturn();
  }

  return (
    <main className="container mainContent">
      <Card title="Wizualizacja" className="spanAll">
        <div className="hint">
          Drag&Drop: przenos pieniadze miedzy Pula i kopertami.
          <br />
          Rozmienianie: przeciagnij w prawy pas (10%) i upusc.
          <br />
          Scalanie: upusc w lewy pas (10%) - pieniadze schodza do koszyka. Zwracaj albo Scal.
        </div>
      </Card>

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

      <section className="envelopes">
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
      </section>

      <Card title="Pula (upusc tutaj, aby oddac do puli)" className="spanAll chartCard">
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
      </Card>

      {/* LEFT merge */}
      <LeftMergeZone
        active={isDragging}
        onEnter={() => isDragging && setMergeOpen(true)}
        onLeave={() => setMergeOpen(false)}
        onDrop={addToMergeBasket}
      />
      <MergePanel
        visible={mergeOpen}
        selection={mergeSel}
        resultWallet={mergePreviewWallet}
        onReturn={handleReturn}
        onMerge={handleMerge}
      />

      {/* RIGHT exchange */}
      <RightExchangeZone
        active={isDragging}
        onEnter={() => isDragging && setExchangeOpen(true)}
        onLeave={() => setExchangeOpen(false)}
        onDrop={onDropExchange}
      />
      <ExchangePanel
        visible={exchangeOpen && isDragging}
        denomCents={exchangeDenom}
        plan={exchangePlan}
        onConfirm={onDropExchange}
      />
    </main>
  );
}
