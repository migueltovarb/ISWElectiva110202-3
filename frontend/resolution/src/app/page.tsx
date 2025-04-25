import React from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import TestimonialsSection from "./components/TestimonialsSection";
import Footer from "./components/Footer";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section con animación */}
        <section className="animate-fadeIn">
          <HeroSection />
        </section>

        {/* Features Section con fondo degradado */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50 animate-fadeInUp">
          <FeaturesSection />
        </section>

        {/* Sección de testimonios */}
        <section className="py-16 bg-white animate-fadeIn">
          <TestimonialsSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;