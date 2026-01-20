import { walletToUngroupedItems } from "../utils/money";
import Card from "./Card";
import MoneyImage from "./MoneyImage";

/**
 * Koperta jako DROP-TARGET.
 * W środku: NIE grupujemy – pokazujemy elementy obok siebie (maxRender limit).
 */
export default function Envelope({
  bucket,
  amountLabel,
  onDrop,
  onDragOver,
  onDragStart,
  onDragEnd,
  onSelect,
  selectedPayload,
  onTapTarget,
  maxRender = 80,
}) {
  const items = walletToUngroupedItems(bucket.wallet, maxRender);

  return (
    <div
      className={`envelope ${selectedPayload ? "envelope--ready" : ""}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, bucket.id)}
      onClick={() => onTapTarget?.(bucket.id)}
      role="button"
      tabIndex={0}
    >
      <div className="envelopeTop">
        <div className="envelopeName">{bucket.name}</div>
        <div className="envelopeAmount">{amountLabel}</div>
      </div>

      <div className="envelopeBody">
        <div className="moneyInline">
          {items.length === 0 ? (
            <span className="miniEmpty">pusto</span>
          ) : (
            items.map((it) => (
              <MoneyImage
                key={it.key}
                denomCents={it.denomCents}
                type={it.type}
                payload={{ source: "bucket", bucketId: bucket.id, denomCents: it.denomCents }}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onSelect={onSelect}
                selected={
                  selectedPayload?.source === "bucket" &&
                  selectedPayload?.bucketId === bucket.id &&
                  selectedPayload?.denomCents === it.denomCents
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
