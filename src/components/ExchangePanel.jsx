import DenomThumb from "./DenomThumb";
import { formatDenom } from "../utils/money";

export default function ExchangePanel({ visible, denomCents, plan, onConfirm }) {
  const hasPlan = !!plan?.length;
  return (
    <aside className={`exchangePanel ${visible ? "exchangePanel--visible" : ""}`}
           aria-hidden={!visible}>
      <div className="exchangePanel__inner">
        <div className="exchangePanel__title">Rozmienianie (prawa strona)</div>

        {!denomCents ? (
          <div className="exchangePanel__muted">Przeciągnij banknot/monetę w prawy pas, aby zobaczyć podział.</div>
        ) : (
          <>
            <div className="exchangePanel__muted">Nominał: <b>{formatDenom(denomCents)}</b></div>
            {(!plan || !plan.length) ? (
              <div className="exchangePanel__muted">Brak mniejszych nominałów do rozmienienia.</div>
            ) : (
              <div className="exchangePanel__list">
                {plan.map((p) => (
                  <div className="exchangeRow" key={p.cents}>
                    <div className="exchangeRow__img"><DenomThumb denomCents={p.cents} /></div>
                    <div>
                      <div className="exchangeRow__label">{formatDenom(p.cents)}</div>
                      <div className="exchangeRow__count">x {p.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="exchangePanel__hint">Upuść w prawym pasie, aby wykonać rozmienienie 1 sztuki.</div>

            {!!onConfirm && (
              <div className="exchangePanel__actions">
                <button
                  className="btn btn--primary"
                  onClick={() => onConfirm?.()}
                  disabled={!denomCents || !hasPlan}
                >
                  Rozmień
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
