// app/dashboard/requests/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Request, requestsService } from '../../../lib/requests';
import { useAuth } from '../../../components/dashboard/AuthContext';
import FileUpload from '../../../components/dashboard/FileUpload';

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token || !user) {
          router.push('/auth/login');
          return;
        }
        
        const data = await requestsService.getRequestById(Number(params.id), token);
        setRequest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [params.id, user, router]);

  if (loading) return <div className="text-center py-8">Cargando solicitud...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;
  if (!request) return <div className="text-center py-8">Solicitud no encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Detalle de la Solicitud</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {request.subject}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Creado el: {new Date(request.date).toLocaleDateString()} | Estado: {' '}
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              request.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : request.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {request.status}
            </span>
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Tipo</h4>
              <p className="mt-1 text-sm text-gray-900 capitalize">{request.requestType}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Descripción</h4>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{request.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Documentos Adjuntos</h4>
              <div className="mt-4">
                <FileUpload 
                  onFilesChange={() => {}} 
                />
                {request.files?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {request.files.map((file, index) => (
                      <li key={index} className="text-sm text-gray-500">{file}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}