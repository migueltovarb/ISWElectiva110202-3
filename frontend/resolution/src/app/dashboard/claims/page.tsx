// app/dashboard/claims/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Claim, claimsService } from '../../lib/claims';
import { useAuth } from '../../components/dashboard/AuthContext';

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !user) return;
        
        const data = await claimsService.getAllClaims(token);
        setClaims(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar reclamos');
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [user]);

  if (loading) return <div className="text-center py-8">Cargando reclamos...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reclamos</h1>
        <Link
          href="/dashboard/claims/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Nuevo Reclamo
        </Link>
      </div>

      {/* Tabla de reclamos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {claims.map((claim) => (
            <li key={claim.id}>
              <Link href={`/dashboard/claims/${claim.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{claim.subject}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        claim.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : claim.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {claim.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {claim.description.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span>{new Date(claim.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}