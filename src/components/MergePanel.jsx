import DenomThumb from "./DenomThumb";
import { formatPLN } from "../utils/money";

export default function MergePanel({
  visible,
  selection,
  resultWallet,
  onReturn,
  onMerge,
}) {
  const hasItems = (selection?.totalCents || 0) > 0;
  const totalPLN = (selection?.totalCents || 0) / 100;

  const basketEntries = Object.entries(selection?.countsMap || {})
    .map(([k, v]) => ({ denomCents: Number(k), count: Number(v) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.denomCents - a.denomCents);

  const resultEntries = Object.entries(resultWallet || {})
    .map(([k, v]) => ({ denomCents: Number(k), count: Number(v) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.denomCents - a.denomCents);

  const renderThumbs = (denomCents, count) => {
    const limit = Math.min(count, 3);
    return (
      <div className="mergeItem__thumbs">
        {Array.from({ length: limit }).map((_, i) => (
          <div className="mergeItem__thumbItem" key={`${denomCents}-${i}`}>
            <DenomThumb denomCents={denomCents} />
          </div>
        ))}
        {count > limit && <div className="mergeItem__more">+{count - limit}</div>}
      </div>
    );
  };

  return (
    <aside className={`mergePanel ${visible ? "mergePanel--visible" : ""}`}>
      <div className="mergePanel__inner">
        <div className="mergePanel__header">
          <div className="mergePanel__kicker">SCALANIE</div>
          <div className="mergePanel__title">Koszyk</div>

          <div className="mergePanel__statRow">
            <div className="mergePanel__stat">
              <div className="mergePanel__statLabel">Wybrane</div>
              <div className="mergePanel__statValue">{formatPLN(totalPLN)}</div>
            </div>
          </div>
        </div>

        <div className="mergePanel__body">
          <div className="mergePanel__section">
            <div className="mergePanel__sectionTitle">W koszyku</div>

            {!hasItems ? (
              <div className="mergePanel__empty">Przeciągnij pieniądz w lewy pas.</div>
            ) : (
              <div className="mergePanel__list">
                {basketEntries.map((x) => (
                  <div className="mergeItem" key={`b-${x.denomCents}`}>
                    {renderThumbs(x.denomCents, x.count)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mergePanel__section">
            <div className="mergePanel__sectionTitle">Wynik po scaleniu</div>

            {!hasItems ? (
              <div className="mergePanel__empty">Tu pokaże się podgląd.</div>
            ) : (
              <div className="mergePanel__list">
                {resultEntries.map((x) => (
                  <div className="mergeItem mergeItem--result" key={`r-${x.denomCents}`}>
                    {renderThumbs(x.denomCents, x.count)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mergePanel__footer">
  <button className="btn btn--ghost" onClick={onReturn} disabled={!hasItems}>
    Zwróć
  </button>

  <button className="btn btn--primary" onClick={onMerge} disabled={!hasItems}>
    Scal
  </button>
</div>
      </div>
    </aside>
  );
}
