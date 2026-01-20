import { useMemo, useRef, useState, useEffect } from "react";
import { formatPLN, walletToBreakdown, walletToUngroupedItems, normalizeWalletFromTotalCents } from "../utils/money";
import { makeChangePlan } from "../utils/exchange";
import MoneyImage from "../components/MoneyImage";
import MergePanel from "../components/MergePanel";
import ExchangePanel from "../components/ExchangePanel";

export default function VariantTableVisualization({ budget, variant, title, subtitle }) {
  const {
    state,
    bucketsAmounts,
    moveOneToBucket,
    moveOneToCash,
    exchangeOne,
    reserveOne,
    returnReserved,
    mergeReserved,
    mergeAllPossible,
    returnAllToCash,
  } = budget;
  const seats = state.buckets || [];
  const seatCount = Math.max(seats.length, 1);
  const [draggingMoney, setDraggingMoney] = useState(null);
  const lastDragRef = useRef(null);
  const tableRef = useRef(null);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [exchangeDenom, setExchangeDenom] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSel, setMergeSel] = useState(() => ({ source: null, bucketId: null, countsMap: {}, totalCents: 0 }));
  const [seatPositions, setSeatPositions] = useState({});
  const mergeSelRef = useRef(mergeSel);
  const warnedMixRef = useRef(false);
  const isDragging = !!draggingMoney?.denomCents;
  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;

  useEffect(() => {
    mergeSelRef.current = mergeSel;
    if (!mergeSel?.source) warnedMixRef.current = false;
  }, [mergeSel]);

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
  }, [draggingMoney]);

  useEffect(() => {
    if (!tableRef.current || typeof ResizeObserver === "undefined") return;
    const el = tableRef.current;
    const updatePositions = () => {
      const rect = el.getBoundingClientRect();
      const cards = Array.from(el.querySelectorAll(".tableViz__seatCard"));
      const maxCard = cards.reduce(
        (acc, card) => {
          const r = card.getBoundingClientRect();
          return { width: Math.max(acc.width, r.width), height: Math.max(acc.height, r.height) };
        },
        { width: 160, height: 120 }
      );
      const center = el.querySelector(".tableViz__center");
      const centerRect = center ? center.getBoundingClientRect() : { width: 280, height: 220 };
      const padRaw = getComputedStyle(el).getPropertyValue("--ring-pad");
      const pad = Number.parseFloat(padRaw) || 24;
      const innerPad = pad + 18;
      const maxX = Math.max(0, rect.width / 2 - maxCard.width / 2 - pad);
      const maxY = Math.max(0, rect.height / 2 - maxCard.height / 2 - pad);
      const minX = centerRect.width / 2 + maxCard.width / 2 + innerPad;
      const minY = centerRect.height / 2 + maxCard.height / 2 + innerPad;
      const next = {};
      seats.forEach((b, i) => {
        const theta = (Math.PI * 2 * i) / seatCount - Math.PI / 2;
        let x = Math.cos(theta) * maxX;
        let y = Math.sin(theta) * maxY;
        if (Math.abs(x) < minX && Math.abs(y) < minY) {
          const absX = Math.max(1, Math.abs(x));
          const absY = Math.max(1, Math.abs(y));
          const scale = Math.max(minX / absX, minY / absY);
          x *= scale;
          y *= scale;
        }
        x = Math.max(-maxX, Math.min(maxX, x));
        y = Math.max(-maxY, Math.min(maxY, y));
        next[b.id] = { x: Math.round(x), y: Math.round(y) };
      });
      setSeatPositions(next);
    };
    const raf = () => requestAnimationFrame(updatePositions);
    raf();
    const ro = new ResizeObserver(raf);
    ro.observe(el);
    const center = el.querySelector(".tableViz__center");
    if (center) ro.observe(center);
    Array.from(el.querySelectorAll(".tableViz__seatCard")).forEach((card) => ro.observe(card));
    return () => ro.disconnect();
  }, [seats, seatCount]);

  const exchangePlan = useMemo(() => {
    if (!exchangeDenom) return null;
    return makeChangePlan(exchangeDenom);
  }, [exchangeDenom]);

  const mergePreviewWallet = useMemo(() => {
    if (!mergeSel?.totalCents) return {};
    return normalizeWalletFromTotalCents(mergeSel.totalCents);
  }, [mergeSel?.totalCents]);

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
    setMergeSel({ source: null, bucketId: null, countsMap: {}, totalCents: 0 });
    setMergeOpen(false);
  }

  function handleMerge() {
    if (!mergeSel?.source || !mergeSel.totalCents) return;
    mergeReserved?.({ source: mergeSel.source, bucketId: mergeSel.bucketId, totalCents: mergeSel.totalCents });
    setMergeSel({ source: null, bucketId: null, countsMap: {}, totalCents: 0 });
    setMergeOpen(false);
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

  const cashBreakdown = walletToBreakdown(state.cashWallet);

  return (
    <main className={`tablePage tablePage--${variant}`}>
      <section className="tableHero">
        <div className="tableHero__copy">
          <div className="tableHero__eyebrow">{title}</div>
          <h2 className="tableHero__title">Wizualizacja stol</h2>
          <p className="tableHero__subtitle">{subtitle}</p>
        </div>
      </section>

      <section className="tableViz" ref={tableRef}>
        <div className="tableViz__center">
          <div
            className={`tableViz__cash ${selectedPayload ? "tableViz__cash--ready" : ""}`}
            onDragOver={allowDrop}
            onDrop={onDropCash}
            onClick={onTapCash}
          >
            <div className="tableViz__cashLabel">Pula</div>
            {cashBreakdown.length === 0 ? (
              <div className="tableViz__cashEmpty">Brak gotowki</div>
            ) : (
              <div className="tableViz__cashStack">
                {cashBreakdown.map((p) => {
                  const limit = Math.min(p.count, 6);
                  return (
                    <div className="tableViz__cashGroup" key={p.cents}>
                      {Array.from({ length: limit }).map((_, i) => (
                        <MoneyImage
                          key={`${p.cents}-${i}`}
                          denomCents={p.cents}
                          type={p.type}
                          payload={{ source: "cash", denomCents: p.cents }}
                          onDragStart={setPayload}
                          onDragEnd={clearDragging}
                          onSelect={selectPayload}
                          selected={selectedPayload?.source === "cash" && selectedPayload?.denomCents === p.cents}
                        />
                      ))}
                      {p.count > limit && <div className="tableViz__cashMore">+{p.count - limit}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="tableViz__actions tableViz__actions--below">
            <div
              className={`tableViz__action ${isDragging ? "tableViz__action--active" : ""}`}
              onDragEnter={() => isDragging && setExchangeOpen(true)}
              onDragLeave={() => setExchangeOpen(false)}
              onDragOver={allowDrop}
              onDrop={onDropExchange}
              onClick={onDropExchange}
            >
              Rozmien
            </div>
            <div
              className={`tableViz__action ${isDragging ? "tableViz__action--active" : ""}`}
              onDragOver={allowDrop}
              onDrop={addToMergeBasket}
              onClick={addToMergeBasket}
            >
              Scal
            </div>
            <button type="button" className="tableViz__actionCircle" onClick={mergeAllPossible}>
              Scal mozliwe
            </button>
            <button type="button" className="tableViz__actionCircle" onClick={returnAllToCash}>
              Zwroc do puli
            </button>
          </div>
        </div>

        <div className="tableViz__ring" aria-label="Koperty dookola puli">
          {seats.length === 0 ? (
            <div className="tableViz__empty">Brak kopert.</div>
          ) : (
            seats.map((b, i) => (
              <div
                className="tableViz__seat"
                key={b.id}
                style={{
                  "--tx": `${seatPositions[b.id]?.x ?? 0}px`,
                  "--ty": `${seatPositions[b.id]?.y ?? 0}px`,
                }}
              >
                <div
                  className={`tableViz__seatCard ${selectedPayload ? "tableViz__seatCard--ready" : ""}`}
                  onDragOver={allowDrop}
                  onDrop={(e) => onDropBucket(e, b.id)}
                  onClick={() => onTapBucket(b.id)}
                >
                  <div className="tableViz__seatName">{b.name}</div>
                  <div className="tableViz__seatValue">{formatPLN(bucketsAmounts[b.id] || 0)}</div>
                  <div className="tableViz__seatMoney">
                    {walletToUngroupedItems(b.wallet, 3).map((it) => (
                      <MoneyImage
                        key={it.key}
                        denomCents={it.denomCents}
                        type={it.type}
                        payload={{ source: "bucket", bucketId: b.id, denomCents: it.denomCents }}
                        onDragStart={setPayload}
                        onDragEnd={clearDragging}
                        onSelect={selectPayload}
                        selected={
                          selectedPayload?.source === "bucket" &&
                          selectedPayload?.bucketId === b.id &&
                          selectedPayload?.denomCents === it.denomCents
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <MergePanel
        visible={mergeOpen}
        selection={mergeSel}
        resultWallet={mergePreviewWallet}
        onReturn={handleReturn}
        onMerge={handleMerge}
      />
      <ExchangePanel visible={exchangeOpen && isDragging} denomCents={exchangeDenom} plan={exchangePlan} onConfirm={onDropExchange} />
    </main>
  );
}
