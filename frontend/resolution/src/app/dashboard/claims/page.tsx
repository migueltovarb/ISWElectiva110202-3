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
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient || !user) return;
    const fetchClaims = async () => {
      try {
        const data = await claimsService.getAllClaims(user.id);
        setClaims(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar reclamos');
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [user, isClient]);

  const handleDelete = async (claimId: number, claimSubject: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el reclamo "${claimSubject}"?`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(claimId));
    
    try {
      await claimsService.deleteClaim(claimId);
      setClaims(prev => prev.filter(claim => claim.id !== claimId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el reclamo');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(claimId);
        return newSet;
      });
    }
  };

  if (!isClient || !user) return <div className="text-center py-8">Cargando reclamos...</div>;
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
            <li key={claim.id} className="relative">
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <Link href={`/dashboard/claims/${claim.id}`} className="block hover:bg-gray-50 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{claim.subject}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ['pending', 'pendiente'].includes(claim.status.toLowerCase())
                          ? 'bg-yellow-100 text-yellow-800'
                          : ['completed', 'completado'].includes(claim.status.toLowerCase())
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {traducirEstado(claim.status)}
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
                      <FechaCreacion date={claim.created_at} />
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (claim.id) handleDelete(claim.id, claim.subject);
                  }}
                  disabled={deletingIds.has(claim.id || 0)}
                  className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingIds.has(claim.id || 0) ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

function FechaCreacion({ date }: { date?: string }) {
  const [fecha, setFecha] = useState<string | null>(null);
  useEffect(() => {
    if (date && !isNaN(new Date(date).getTime())) {
      setFecha(new Date(date).toLocaleDateString());
    } else {
      setFecha('Sin fecha');
    }
  }, [date]);
  // Solo renderiza después de montar en el cliente
  if (fecha === null) return <span className="invisible">-</span>;
  return <span>{fecha}</span>;
}

function traducirEstado(estado: string) {
  switch (estado.toLowerCase()) {
    case 'pending':
    case 'pendiente':
      return 'pendiente';
    case 'in_progress':
    case 'en proceso':
      return 'en proceso';
    case 'completed':
    case 'completado':
      return 'completado';
    default:
      return estado;
  }
}