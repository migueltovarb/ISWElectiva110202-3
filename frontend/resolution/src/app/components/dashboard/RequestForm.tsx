// components/dashboard/RequestForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { requestsService } from '../../lib/requests';
import { claimsService } from '../../lib/claims';

type RequestFormProps = {
  type: 'claim' | 'request';
};

export default function RequestForm({ type }: RequestFormProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    requestType: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('Debes estar autenticado para enviar un formulario');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const payload = {
        subject: formData.subject,
        description: formData.description,
        requestType: formData.requestType,
        user: user.id,
        status: 'pending', // Assuming a default status is required
        files: files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
        })),
      };

      if (type === 'claim') {
        await claimsService.createClaim(payload, token);
      } else {
        await requestsService.createRequest(payload, token);
      }

      router.push(`/dashboard/${type}s`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">
        {type === 'claim' ? 'Nuevo Reclamo' : 'Nueva Solicitud'}
      </h2>
      
      {user && (
        <p className="mb-4 text-sm text-gray-600">
          Usuario: {user.first_name} {user.last_name}
        </p>
      )}

      {error && <div className="mb-4 text-red-500">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto
          </label>
          <input
            type="text"
            id="subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.subject}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="requestType"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={formData.requestType}
            onChange={(e) => setFormData({...formData, requestType: e.target.value})}
            required
          >
            <option value="">Seleccionar tipo</option>
            <option value="technical">Técnico</option>
            <option value="administrative">Administrativo</option>
            <option value="general">General</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documentos Adjuntos
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}