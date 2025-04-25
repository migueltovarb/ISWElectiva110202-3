import Link from 'next/link';

interface QuickActionProps {
  title: string;
  icon: string;
  href: string;
}

const QuickAction = ({ title, icon, href }: QuickActionProps) => {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </Link>
  );
};

export default QuickAction;