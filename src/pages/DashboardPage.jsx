import Card from "../components/Card";
import { formatPLN } from "../utils/money";

export default function DashboardPage({ budget }) {
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

  return (
    <main className="container mainContent">
      <Card title="Pula" className="spanAll">
        <div className="row">
          <div className="metric">
            <div className="metric__label">Do rozdysponowania</div>
            <div className="metric__value">{formatPLN(cashAmount)}</div>
          </div>
          <div className="metric">
            <div className="metric__label">Suma środków</div>
            <div className="metric__value">{formatPLN(totalAmount)}</div>
          </div>
        </div>

        <div className="hint">Wizualizacja działa tylko przeciąganiem (drag&drop). Bez “klik-klik”.</div>
      </Card>

      <section className="threeCol">
        <Card title="Koperty">
          {state.buckets.length === 0 ? (
            <div className="empty">Brak kopert.</div>
          ) : (
            <div className="list">
              {state.buckets.map((b) => (
                <div className="listRow" key={b.id}>
                  <div className="listLeft">
                    <span className="listName">{b.name}</span>
                    <div className="listActions">
                      <button className="btnTiny" onClick={() => renameBucket(b.id)}>
                        Zmień nazwę
                      </button>
                      <button className="btnTiny btnTiny--danger" onClick={() => deleteBucket(b.id)}>
                        Usuń
                      </button>
                    </div>
                  </div>
                  <span className="listValue">{formatPLN(bucketsAmounts[b.id] || 0)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="hint" style={{ marginTop: 12 }}>
            Suma w kopertach: <b>{formatPLN(sumBucketsAmount)}</b>
          </div>
        </Card>

        <Card title="Historia / Wydatki">
          <div className="empty">Dodamy później.</div>
        </Card>

        <Card title="Szybkie akcje">
          <div className="actionsGrid">
            <button className="btn btn--primary" onClick={addCash}>
              + Zasil konto
            </button>

            <button className="btn btn--ghost" onClick={removeCash}>
              - Usuń z puli
            </button>
            <button className="btn btn--ghost" onClick={addBucket}>
              + Dodaj kopertę
            </button>
            <button className="btn btn--ghost" onClick={transferBetweenBuckets} disabled={!state.buckets.length}>
              + Transfer
            </button>
            <button className="btn btn--ghost" onClick={allocateToBucket} disabled={!state.buckets.length}>
              + Przypisz
            </button>
          </div>
        </Card>
      </section>

      <Card title="Bucket chart" className="spanAll chartCard">
        <div className="chart">
          {state.buckets.map((b) => {
            const amount = bucketsAmounts[b.id] || 0;
            const pct = Math.round((amount / maxBucketAmount) * 100);
            return (
              <div key={b.id} className="chartRow">
                <div className="chartLabel">{b.name}</div>
                <div className="chartBarWrap" aria-label={`${b.name}: ${formatPLN(amount)}`}>
                  <div className="chartBar" style={{ width: `${pct}%` }} />
                </div>
                <div className="chartValue">{formatPLN(amount)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </main>
  );
}
