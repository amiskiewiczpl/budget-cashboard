// Auto-load nominałów (Vite).
// Pliki wrzucasz do: src/assets/money/denoms/
// Nazwa pliku = wartość w groszach, np:
// 2000.jpg (20 zł), 100.jpg (1 zł), 50.jpg (50 gr), 1.jpg (1 gr)
const denomModules = import.meta.glob("../assets/money/denoms/*.jpg", {
  eager: true,
  import: "default",
});

const MAP = (() => {
  const out = {};
  for (const [path, url] of Object.entries(denomModules)) {
    const file = path.split("/").pop() || "";
    const base = file.split(".")[0];
    const cents = Number(base);
    if (Number.isFinite(cents)) out[cents] = url;
  }
  return out;
})();

export function getDenomImage(cents) {
  return MAP[Number(cents)] || null;
}
