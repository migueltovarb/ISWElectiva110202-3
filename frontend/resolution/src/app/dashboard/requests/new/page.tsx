'use client';

import RequestForm from '../../../components/dashboard/RequestForm';
import { useState, useEffect } from 'react';

export default function NewRequestPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false); 
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <RequestForm type="request" />
    </div>
  );
}
