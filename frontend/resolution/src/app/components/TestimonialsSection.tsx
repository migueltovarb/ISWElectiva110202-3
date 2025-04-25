import React from "react";

const testimonials = [
  {
    id: 1,
    quote: "Resolution ha transformado nuestra gestión de reclamos, reduciendo el tiempo de respuesta en un 60%.",
    author: "Carlos Méndez",
    role: "Director de Operaciones, Empresa XYZ"
  },
  {
    id: 2,
    quote: "La plataforma es intuitiva y el soporte excepcional. ¡Altamente recomendado!",
    author: "Ana Rodríguez",
    role: "Gerente de Servicio al Cliente"
  },
  {
    id: 3,
    quote: "Los reportes analíticos nos han dado visibilidad sin precedentes sobre nuestros casos.",
    author: "David Fernández",
    role: "Director de TI"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <div className="container">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Lo que dicen nuestros clientes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="card p-6">
            <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
            <div>
              <p className="font-semibold text-gray-900">{testimonial.author}</p>
              <p className="text-sm text-gray-500">{testimonial.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;