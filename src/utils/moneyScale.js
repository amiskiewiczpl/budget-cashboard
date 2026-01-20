// Standaryzacja rozmiarow (oddzielnie monety i banknoty)

export const COIN_SCALE = {
  500: 1,
  200: 0.89583333333,
  100: 0.95833333333,
  50: 0.85416666666,
  20: 0.77083333333,
  10: 0.6875,
  5: 0.8125,
  2: 0.72916666666,
  1: 0.64583333333,
};

export const NOTE_SCALE = {
  50000: 1,
  20000: 0.96,
  10000: 0.92,
  5000: 0.88,
  2000: 0.84,
  1000: 0.8,
};

export function getScale(denomCents, type) {
  const d = Number(denomCents);
  if (type === 'coin') return COIN_SCALE[d] ?? 1;
  return NOTE_SCALE[d] ?? 1;
}

// Zwraca style z transform: scale() bez zmiany layoutu.
// thumb=true daje bardziej zbity rozmiar w panelach.
export function getScaleStyle(denomCents, type, thumb = false) {
  const s = getScale(denomCents, type);
  const scale = thumb ? Math.min(1, s) : s;
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'center',
  };
}
