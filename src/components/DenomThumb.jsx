import { getDenomImage } from "../utils/denomImages";
import { denomType } from "../utils/money";
import { getScaleStyle } from "../utils/moneyScale";

export default function DenomThumb({ denomCents }) {
  const img = getDenomImage(denomCents);
  const type = denomType(denomCents);

  return (
    <div
      className={`denomThumb ${type === "banknote" ? "denomThumb--note" : "denomThumb--coin"}`}
      style={{
        ...(img ? { backgroundImage: `url(${img})` } : null),
        ...getScaleStyle(denomCents, type, true),
      }}
      aria-label="denom"
    />
  );
}
