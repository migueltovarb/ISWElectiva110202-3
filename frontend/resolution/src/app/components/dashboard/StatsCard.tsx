'use client';

import Link from 'next/link';

interface StatsCardProps {
  title: string;
  count: number;
  details: string;
  link: string;
}

const StatsCard = ({ title, count, details, link }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-blue-600">{count}</p>
      <p className="mt-1 text-sm text-gray-500">{details}</p>
      <Link
        href={link}
        className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Ver todos →
      </Link>
    </div>
  );
};

export default StatsCard;