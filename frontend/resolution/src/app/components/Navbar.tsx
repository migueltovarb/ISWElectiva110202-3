import Link from "next/link";
import Button from "./Button";

const Navbar = () => {
  return (
    <nav className="container py-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-blue-600">
        Resolution
      </Link>
      <div className="flex gap-4">
        <Link href="/auth/login">
          <Button variant="outline">Iniciar Sesión</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="primary">Registrarse</Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;