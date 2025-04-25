'use client';

import RequestForm from '../../../components/dashboard/RequestForm';
import { useState, useEffect } from 'react';

export default function NewRequestPage() {
  const [loading, setLoading] = useState(true); // Estado de carga

  useEffect(() => {
    setLoading(false); // No se verifica el usuario, se marca como no cargando
  }, []);

  // Si aún está cargando, mostramos un mensaje de carga
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <RequestForm type="claim" />
    </div>
  );
}
