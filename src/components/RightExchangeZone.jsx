export default function RightExchangeZone({ active, onEnter, onLeave, onDrop }) {
  return (
    <div
      className={`rightExchangeZone ${active ? "rightExchangeZone--active" : ""}`}
      onDragEnter={(e) => {
        if (!active) return;
        e.preventDefault();
        onEnter?.();
      }}
      onDragOver={(e) => {
        if (!active) return;
        e.preventDefault();
        onEnter?.(); // klucz: trzyma panel otwarty
      }}
      onDragLeave={(e) => {
        if (!active) return;
        e.preventDefault();
        onLeave?.();
      }}
      onDrop={(e) => {
        if (!active) return;
        e.preventDefault();
        onDrop?.();
      }}
    />
  );
}
