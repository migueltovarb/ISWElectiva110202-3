import Link from "next/link";
import Button from "./Button";

interface FeatureCardProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string; // Asegúrate de que esta prop sea requerida
  buttonVariant?: "primary" | "outline";
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  buttonText,
  buttonLink = "#", // Valor por defecto como fallback
  buttonVariant = "outline",
}) => {
  return (
    <div className="card p-6 flex flex-col h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6 flex-grow">{description}</p>
      <div className="mt-auto">
        <Link href={buttonLink} passHref>
          <Button variant={buttonVariant}>{buttonText}</Button>
        </Link>
      </div>
    </div>
  );
};

export default FeatureCard;