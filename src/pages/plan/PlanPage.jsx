export default function PlanPage() {
  return (
    <main className="variantPage variantPage--glass variantPage--plan">
      <section className="variantHero">
        <div className="variantHero__copy">
          <div className="variantHero__eyebrow">Plan</div>
          <h2 className="variantHero__title">Kierunek i priorytety projektu</h2>
          <p className="variantHero__subtitle">
            Placeholder na roadmape, cele i notatki. Tutaj bedzie zarys dalszego rozwoju.
          </p>
        </div>
      </section>

      <section className="variantGrid variantPlan">
        <div className="variantPanel variantPanel--roadmap">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Roadmapa</h3>
            <span className="variantPanel__meta">Q1-Q3</span>
          </div>
          <div className="variantPlaceholder">Sekcje i kamienie milowe pojawia sie tutaj.</div>
        </div>

        <div className="variantPanel variantPanel--backlog">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Backlog</h3>
            <span className="variantPanel__meta">Do zaplanowania</span>
          </div>
          <div className="variantPlaceholder">Lista tematow i pomyslow do przegladu.</div>
        </div>

        <div className="variantPanel variantPanel--notes">
          <div className="variantPanel__header">
            <h3 className="variantPanel__title">Notatki</h3>
            <span className="variantPanel__meta">Szkic</span>
          </div>
          <div className="variantPlaceholder">Miejsce na przyszle decyzje i zalozenia.</div>
        </div>
      </section>
    </main>
  );
}
