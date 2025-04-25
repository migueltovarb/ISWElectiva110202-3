import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8 mt-12">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600">
              © {new Date().getFullYear()} Resolution. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/terms" className="text-gray-600 hover:text-blue-600">
              Términos y Condiciones
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-blue-600">
              Política de Privacidad
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-blue-600">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;