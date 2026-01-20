import { getDenomImage } from "../utils/denomImages";
import { getScaleStyle } from "../utils/moneyScale";
import { formatDenom } from "../utils/money";

/**
 * Renderuje JEDEN banknot/monete jako obrazek.
 * - Bez obramowek
 * - Draggable (HTML5 DnD)
 */
export default function MoneyImage({ denomCents, type, payload, onDragStart, onDragEnd }) {
  const img = getDenomImage(denomCents);

  return (
    <button
      className={`imgMoney ${type === "banknote" ? "imgMoney--note" : "imgMoney--coin"}`}
      style={{
        ...(img ? { backgroundImage: `url(${img})` } : null),
        ...getScaleStyle(denomCents, type === "banknote" ? "banknote" : "coin"),
      }}
      draggable
      onDragStart={(e) => onDragStart(e, payload)}
      onDragEnd={onDragEnd}
      title="Przeciągnij, aby przenieść"
      aria-label="money"
    >
      {!img && <span className="imgMoney__fallback">{formatDenom(denomCents)}</span>}
    </button>
  );
}
