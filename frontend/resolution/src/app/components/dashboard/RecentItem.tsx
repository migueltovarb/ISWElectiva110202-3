import { useEffect, useState } from 'react';

interface RecentItemProps {
    title: string;
    status: string;
    time: string;
    priority?: string;
  }
  
  const RecentItem = ({ title, status, time, priority }: RecentItemProps) => {
    const statusColors: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-yellow-100 text-yellow-800',
      "en proceso": 'bg-blue-100 text-blue-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completado: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      aprobado: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
    };

    // Normaliza el estado para buscar el color
    const normalizedStatus = status.replace(/_/g, ' ').toLowerCase();
    const color = statusColors[normalizedStatus] || statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';

    return (
      <div className="p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <span
            className={`text-xs px-2 py-1 rounded-full mr-2 ${color}`}
          >
            {status}
          </span>
          <span>• {time}</span>
        </div>
      </div>
    );
  };
  
  export default RecentItem;