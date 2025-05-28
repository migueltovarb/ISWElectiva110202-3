'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Reclamos', path: '/dashboard/claims', icon: '📝' },
    { name: 'Solicitudes', path: '/dashboard/requests', icon: '📋' },
    { name: 'Reportes', path: '/dashboard/reports', icon: '📈' },
    { name: 'Configuración', path: '/dashboard/settings', icon: '⚙️' },
  ];

  // Agregar el panel de administrador solo para usuarios admin
  const adminMenuItem = { name: 'Panel Admin', path: '/dashboard/admin', icon: '👑' };
  const allMenuItems = user?.is_admin ? [...menuItems, adminMenuItem] : menuItems;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    router.push('/auth/login');
    window.location.reload();
  };

  return (
    <div className="w-64 bg-gray-800 text-white p-4 min-h-screen">
      <div className="mb-8 p-4">
        <h1 className="text-2xl font-bold">Resolution</h1>
        {user && (
          <>
            <Link href="/dashboard/profile" className="flex items-center gap-3 mt-4 group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-xl font-bold text-blue-700 border-2 border-white shadow-md group-hover:ring-2 group-hover:ring-blue-400 transition">
                {`${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()}
              </div>
              <span className="text-lg font-semibold text-blue-200 group-hover:text-white transition">
                {user.first_name} {user.last_name}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition"
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
      <nav>
        <ul className="space-y-2">
          {allMenuItems.map((item) => (
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