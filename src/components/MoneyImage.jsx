import { getDenomImage } from "../utils/denomImages";
import { getScaleStyle } from "../utils/moneyScale";
import { formatDenom } from "../utils/money";

/**
 * Renderuje JEDEN banknot/monete jako obrazek.
 * - Bez obramowek
 * - Draggable (HTML5 DnD)
 */
export default function MoneyImage({ denomCents, type, payload, onDragStart, onDragEnd, onSelect, selected = false }) {
  const img = getDenomImage(denomCents);
  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)")?.matches;

  return (
    <button
      className={`imgMoney ${type === "banknote" ? "imgMoney--note" : "imgMoney--coin"} ${
        selected ? "imgMoney--selected" : ""
      }`}
      style={{
        ...(img ? { backgroundImage: `url(${img})` } : null),
        ...getScaleStyle(denomCents, type === "banknote" ? "banknote" : "coin"),
      }}
      draggable={!isCoarsePointer}
      onDragStart={(e) => {
        if (isCoarsePointer) return;
        onDragStart(e, payload);
      }}
      onDragEnd={isCoarsePointer ? undefined : onDragEnd}
      onClick={(e) => {
        if (!isCoarsePointer || !onSelect) return;
        e.stopPropagation();
        onSelect(payload);
      }}
      title="Przeciągnij, aby przenieść"
      aria-label="money"
    >
      {!img && <span className="imgMoney__fallback">{formatDenom(denomCents)}</span>}
    </button>
  );
}
