import FeatureCard from "./FeaturesCard";

const FeaturesSection = () => {
  return (
    <section className="container py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          title="Gestión Centralizada"
          description="Administre todos sus reclamos y solicitudes desde un único panel intuitivo."
          buttonText="Más información"
          buttonLink="/features#gestion" // Asegúrate de incluir esto
        />
        <FeatureCard
          title="Análisis Avanzado"
          description="Obtenga estadísticas detalladas y reportes personalizados sobre sus casos."
          buttonText="Ver demo"
          buttonLink="/demo" // Asegúrate de incluir esto
          buttonVariant="primary"
        />
        <FeatureCard
          title="Soporte 24/7"
          description="Nuestro equipo de expertos está disponible para ayudarle en cualquier momento."
          buttonText="Contacto"
          buttonLink="/contact" // Asegúrate de incluir esto
        />
      </div>
    </section>
  );
};

export default FeaturesSection;