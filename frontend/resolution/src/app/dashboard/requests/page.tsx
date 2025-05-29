// app/dashboard/requests/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Request, requestsService } from '../../lib/requests';
import { useAuth } from '../../components/dashboard/AuthContext';

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient || !user) return;
    const fetchRequests = async () => {
      try {
        const data = await requestsService.getAllRequests(user.id);
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar solicitudes');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user, isClient]);

  const handleDelete = async (requestId: number, requestSubject: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la solicitud "${requestSubject}"?`)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(requestId));
    
    try {
      await requestsService.deleteRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la solicitud');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (!isClient || !user) return <div className="text-center py-8">Cargando solicitudes...</div>;
  if (loading) return <div className="text-center py-8">Cargando solicitudes...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <Link
          href="/dashboard/requests/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Nueva Solicitud
        </Link>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {requests.map((request) => (
            <li key={request.id} className="relative">
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <Link href={`/dashboard/requests/${request.id}`} className="block hover:bg-gray-50 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{request.subject}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <EstadoPill estado={request.status} />
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {request.description.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <FechaCreacion date={request.created_at} />
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (request.id) handleDelete(request.id, request.subject);
                  }}
                  disabled={deletingIds.has(request.id || 0)}
                  className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingIds.has(request.id || 0) ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FechaCreacion({ date }: { date?: string }) {
  const isClient = useIsClient();
  if (!isClient) return <span className="invisible">-</span>;
  if (date && !isNaN(new Date(date).getTime())) {
    return <span>{new Date(date).toLocaleDateString()}</span>;
  }
  return <span>Sin fecha</span>;
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

function EstadoPill({ estado }: { estado: string }) {
  const estadoLower = estado.toLowerCase();
  let color = 'bg-blue-100 text-blue-800';
  if ([ 'pending', 'pendiente' ].includes(estadoLower)) {
    color = 'bg-yellow-100 text-yellow-800';
  } else if ([ 'completed', 'completado' ].includes(estadoLower)) {
    color = 'bg-green-100 text-green-800';
  } else if ([ 'in_progress', 'en proceso' ].includes(estadoLower)) {
    color = 'bg-blue-100 text-blue-800';
  }
  return (
    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {traducirEstado(estado)}
    </p>
  );
}