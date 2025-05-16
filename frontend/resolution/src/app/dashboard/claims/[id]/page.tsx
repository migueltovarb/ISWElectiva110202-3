// app/dashboard/claims/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Claim, claimsService } from '../../../lib/claims';
import { useAuth } from '../../../components/dashboard/AuthContext';
import FileUpload from '../../../components/dashboard/FileUpload';

function FechaCreacion({ date }: { date: string }) {
  const [fecha, setFecha] = useState('');
  useEffect(() => {
    setFecha(new Date(date).toLocaleDateString());
  }, [date]);
  return <span>{fecha}</span>;
}

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !user) {
          router.push('/auth/login');
          return;
        }
        
        const data = await claimsService.getClaimById(Number(id), token);
        setClaim(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el reclamo');
      } finally {
        setLoading(false);
      }
    };

    fetchClaim();
  }, [id, user, router]);

  if (loading) return <div className="text-center py-8">Cargando reclamo...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;
  if (!claim) return <div className="text-center py-8">Reclamo no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Detalle del Reclamo</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {claim.subject}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Creado el: {claim.created_at ? <FechaCreacion date={claim.created_at} /> : 'N/A'} | Estado: {' '}
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              claim.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : claim.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {claim.status}
            </span>
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{claim.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}