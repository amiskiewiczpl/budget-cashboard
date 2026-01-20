import { walletToBreakdown } from "../utils/money";
import MoneyImage from "./MoneyImage";

/**
 * Pula (cash) jako DROP-TARGET.
 * W puli grupujemy (bo to może być dużo), ale renderujemy kilka sztuk (maxPerDenom).
 */
export default function CashArea({ cashWallet, cashLabel, onDropCash, onDragOver, onDragStart, onDragEnd, maxPerDenom = 14 }) {
  const breakdown = walletToBreakdown(cashWallet);

  return (
    <div className="moneyArea" onDragOver={onDragOver} onDrop={onDropCash}>
      <div className="moneyHeader">
        <div className="moneyBig">{cashLabel}</div>
      </div>

      <div className="moneyGrid">
        {breakdown.length === 0 ? (
          <div className="empty">Pula jest pusta. Zasil konto na Dashboardzie.</div>
        ) : (
          breakdown.map((p) => (
            <div key={p.cents} className="moneyGroup">
              <div className="moneyGroupTitle">
                {p.label} <span className="muted">× {p.count}</span>
              </div>

              <div className="moneyStack">
                {Array.from({ length: Math.min(p.count, maxPerDenom) }).map((_, i) => (
                  <MoneyImage
                    key={i}
                    denomCents={p.cents}
                    type={p.type}
                    payload={{ source: "cash", denomCents: p.cents }}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {p.count > maxPerDenom && <div className="moreTag">+{p.count - maxPerDenom}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
