import { formatPLN } from "../utils/money";

export default function VariantDashboard({ budget, variant, title, subtitle }) {
  const {
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
  } = budget;
  const historyItems = (state.transactions || []).slice(0, 10);

  function formatHistoryTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <main className={`variantPage variantPage--${variant} variantPage--dashboard`}>
      <section className="variantHero">
        <div className="variantHero__copy">
          <div className="variantHero__eyebrow">{title}</div>
          <h2 className="variantHero__title">Twoj budzet, ladnie poukladany</h2>
          <p className="variantHero__subtitle">{subtitle}</p>
        </div>

        <div className="variantHero__metrics">
          <div className="variantMetric">
            <div className="variantMetric__label">Do rozdysponowania</div>
            <div className="variantMetric__value">{formatPLN(cashAmount)}</div>
          </div>
          <div className="variantMetric">
            <div className="variantMetric__label">Suma srodkow</div>
            <div className="variantMetric__value">{formatPLN(totalAmount)}</div>
          </div>
          <div className="variantMetric">
            <div className="variantMetric__label">W kopertach</div>
            <div className="variantMetric__value">{formatPLN(sumBucketsAmount)}</div>
          </div>
        </div>
      </section>

      <section className="variantGrid">
        <div className="variantPanel variantPanel--buckets">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Koperty</h3>
            <span className="variantPanel__meta">Zarzadzanie celami</span>
          </div>

          {state.buckets.length === 0 ? (
            <div className="variantEmpty">Brak kopert.</div>
          ) : (
            <div className="variantList">
              {state.buckets.map((b) => (
                <div className="variantRow" key={b.id}>
                  <div className="variantRow__left">
                    <span className="variantRow__name">{b.name}</span>
                    <div className="variantRow__actions">
                      <button className="btnTiny" onClick={() => renameBucket(b.id)}>
                        Zmien nazwe
                      </button>
                      <button className="btnTiny btnTiny--danger" onClick={() => deleteBucket(b.id)}>
                        Usun
                      </button>
                    </div>
                  </div>
                  <span className="variantRow__value">{formatPLN(bucketsAmounts[b.id] || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="variantPanel variantPanel--actions">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Akcje</h3>
            <span className="variantPanel__meta">Szybkie operacje</span>
          </div>
          <div className="variantActions">
            <button className="btn btn--primary" onClick={addCash}>
              + Zasil konto
            </button>
            <button className="btn btn--ghost" onClick={removeCash}>
              - Usun z puli
            </button>
            <button className="btn btn--ghost" onClick={addBucket}>
              + Dodaj koperte
            </button>
            <button className="btn btn--ghost" onClick={transferBetweenBuckets} disabled={!state.buckets.length}>
              + Transfer
            </button>
            <button className="btn btn--ghost" onClick={allocateToBucket} disabled={!state.buckets.length}>
              + Przypisz
            </button>
          </div>
        </div>

        <div className="variantPanel variantPanel--history">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Historia</h3>
            <span className="variantPanel__meta">Wydatki i notatki</span>
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

        <div className="variantPanel variantPanel--chart">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Podzial kopert</h3>
            <span className="variantPanel__meta">Szybki przeglad</span>
          </div>
          <div className="variantChart">
            {state.buckets.map((b) => {
              const amount = bucketsAmounts[b.id] || 0;
              const pct = Math.round((amount / maxBucketAmount) * 100);
              return (
                <div key={b.id} className="variantChartRow">
                  <div className="variantChartLabel">{b.name}</div>
                  <div className="variantChartBarWrap" aria-label={`${b.name}: ${formatPLN(amount)}`}>
                    <div className="variantChartBar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="variantChartValue">{formatPLN(amount)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
