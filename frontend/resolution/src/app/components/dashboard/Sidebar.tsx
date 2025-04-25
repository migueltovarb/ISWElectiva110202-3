'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Reclamos', path: '/dashboard/claims', icon: '📝' },
    { name: 'Solicitudes', path: '/dashboard/requests', icon: '📋' },
    { name: 'Reportes', path: '/dashboard/reports', icon: '📈' },
    { name: 'Configuración', path: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white p-4 min-h-screen">
      <div className="mb-8 p-4">
        <h1 className="text-2xl font-bold">Resolution</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;