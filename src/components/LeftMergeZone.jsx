export default function LeftMergeZone({ active, onEnter, onLeave, onDrop }) {
  return (
    <div
      className={`leftMergeZone ${active ? "leftMergeZone--active" : ""}`}
      onDragEnter={(e) => {
        if (!active) return;
        e.preventDefault();
        onEnter?.();
      }}
      onDragOver={(e) => {
        if (!active) return;
        e.preventDefault();
        onEnter?.();
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
