import Link from "next/link";
import Button from "./Button";

const HeroSection = () => {
  return (
    <section className="container py-16 md:py-24 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Gestión de reclamos simplificada
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
        Soluciones eficientes para la gestión de reclamos y solicitudes empresariales
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/auth/register">
          <Button variant="primary">Registrarse</Button>
        </Link>
        <Link href="/auth/login">
          <Button variant="outline">Iniciar Sesión</Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;