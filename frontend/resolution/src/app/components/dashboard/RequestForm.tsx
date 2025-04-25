'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { claimsService } from '../../lib/claims';
import { requestsService } from '../../lib/requests';
import FileUpload from './FileUpload';

type RequestFormProps = {
  type: 'claim' | 'request';
};

export default function RequestForm({ type }: RequestFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    user: 1,  // Establecer el userId por defecto aquí
    subject: '',
    description: '',
    status: 'Pendiente',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // El userId por defecto (123) ya está en el estado `formData.user`
  const userId = formData.user;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const payload = {
        user: userId,  // No se necesita obtener el userId dinámicamente
        subject: formData.subject,
        description: formData.description,
        status: formData.status,
      };

      // Dependiendo del tipo (claim o request), llamar al servicio correspondiente
      if (type === 'claim') {
        await claimsService.createClaim(payload);
      } else {
        await requestsService.createRequest(payload);
      }

      router.push(`/dashboard/${type}s`);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error al enviar el formulario');
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

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto *
          </label>
          <input
            type="text"
            id="subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción *
          </label>
          <textarea
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado *
          </label>
          <select
            id="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
          >
            <option value="Pendiente">Pendiente</option>
            <option value="En Proceso">En Proceso</option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Documentos Adjuntos
          </label>
          <FileUpload onFilesChange={handleFileChange} />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${type}s`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            ) : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
