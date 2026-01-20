import VariantTableVisualization from "../../layouts/VariantTableVisualization";

export default function TableVisualizationGlass({ budget }) {
  return (
    <VariantTableVisualization
      budget={budget}
      variant="glass"
      title="Stol"
      subtitle="Widok ukladu kopert dookola puli."
    />
  );
}
