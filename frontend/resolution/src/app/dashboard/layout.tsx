import { ReactNode } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import { AuthProvider } from '../components/dashboard/AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}