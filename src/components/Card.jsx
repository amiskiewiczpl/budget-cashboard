export default function Card({ title, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="card__header">
        <h2 className="card__title">{title}</h2>
      </div>
      <div className="card__body">{children}</div>
    </section>
  );
}
