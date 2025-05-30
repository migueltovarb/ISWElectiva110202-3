'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/dashboard/AuthContext';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ReportsData {
  claims_stats: {
    total: number;
    pendiente: number;
    en_proceso: number;
    completado: number;
  };
  requests_stats: {
    total: number;
    pendiente: number;
    en_proceso: number;
    completado: number;
  };
  claims_chart_data: Array<{
    date: string;
    pendiente: number;
    en_proceso: number;
    completado: number;
    total: number;
  }>;
  requests_chart_data: Array<{
    date: string;
    pendiente: number;
    en_proceso: number;
    completado: number;
    total: number;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}

const COLORS = {
  pendiente: '#FCD34D',
  en_proceso: '#60A5FA',
  completado: '#34D399'
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    // Verificar si el usuario es administrador
    if (!user.is_admin) {
      setError('Acceso denegado. Solo administradores pueden acceder a los reportes.');
      setLoading(false);
      return;
    }

    fetchReportsData();
  }, [user]);

  const fetchReportsData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports?user_id=${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReportsData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_proceso':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const createPieData = (stats: any) => [
    { name: 'Pendiente', value: stats.pendiente, color: COLORS.pendiente },
    { name: 'En Proceso', value: stats.en_proceso, color: COLORS.en_proceso },
    { name: 'Completado', value: stats.completado, color: COLORS.completado },
  ];

  if (!user) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!user.is_admin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl mb-4">Acceso Denegado</div>
        <p>Solo los administradores pueden acceder a los reportes.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!reportsData) {
    return <div className="text-center py-8">No hay datos disponibles.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Estadísticas</h1>
        <p className="text-gray-600">
          Datos del {formatDate(reportsData.date_range.start_date)} al {formatDate(reportsData.date_range.end_date)}
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Reclamos */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Reclamos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-2xl text-blue-600">{reportsData.claims_stats.total}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('pendiente')}`}>
                  Pendiente
                </span>
                <span className="font-medium">{reportsData.claims_stats.pendiente}</span>
              </div>
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('en_proceso')}`}>
                  En Proceso
                </span>
                <span className="font-medium">{reportsData.claims_stats.en_proceso}</span>
              </div>
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('completado')}`}>
                  Completado
                </span>
                <span className="font-medium">{reportsData.claims_stats.completado}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Solicitudes */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Solicitudes</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-2xl text-green-600">{reportsData.requests_stats.total}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('pendiente')}`}>
                  Pendiente
                </span>
                <span className="font-medium">{reportsData.requests_stats.pendiente}</span>
              </div>
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('en_proceso')}`}>
                  En Proceso
                </span>
                <span className="font-medium">{reportsData.requests_stats.en_proceso}</span>
              </div>
              <div className="flex justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor('completado')}`}>
                  Completado
                </span>
                <span className="font-medium">{reportsData.requests_stats.completado}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas de Pie */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución Reclamos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={createPieData(reportsData.claims_stats)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {createPieData(reportsData.claims_stats).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución Solicitudes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={createPieData(reportsData.requests_stats)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {createPieData(reportsData.requests_stats).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficas de Tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tendencia de Reclamos */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tendencia de Reclamos (Últimos 30 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportsData.claims_chart_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value, name) => [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name]}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1F2937" strokeWidth={3} name="Total" />
              <Line type="monotone" dataKey="pendiente" stroke={COLORS.pendiente} strokeWidth={2} name="Pendiente" />
              <Line type="monotone" dataKey="en_proceso" stroke={COLORS.en_proceso} strokeWidth={2} name="En Proceso" />
              <Line type="monotone" dataKey="completado" stroke={COLORS.completado} strokeWidth={2} name="Completado" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia de Solicitudes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Tendencia de Solicitudes (Últimos 30 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportsData.requests_chart_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value, name) => [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name]}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1F2937" strokeWidth={3} name="Total" />
              <Line type="monotone" dataKey="pendiente" stroke={COLORS.pendiente} strokeWidth={2} name="Pendiente" />
              <Line type="monotone" dataKey="en_proceso" stroke={COLORS.en_proceso} strokeWidth={2} name="En Proceso" />
              <Line type="monotone" dataKey="completado" stroke={COLORS.completado} strokeWidth={2} name="Completado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de Barras Comparativa */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Comparación por Estado (Últimos 7 días)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportsData.claims_chart_data.slice(-7).map((claim, index) => ({
            date: claim.date,
            'Reclamos Pendientes': claim.pendiente,
            'Reclamos En Proceso': claim.en_proceso,
            'Reclamos Completados': claim.completado,
            'Solicitudes Pendientes': reportsData.requests_chart_data.slice(-7)[index]?.pendiente || 0,
            'Solicitudes En Proceso': reportsData.requests_chart_data.slice(-7)[index]?.en_proceso || 0,
            'Solicitudes Completadas': reportsData.requests_chart_data.slice(-7)[index]?.completado || 0,
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip labelFormatter={(value) => formatDate(value)} />
            <Legend />
            <Bar dataKey="Reclamos Pendientes" fill="#FCD34D" />
            <Bar dataKey="Reclamos En Proceso" fill="#60A5FA" />
            <Bar dataKey="Reclamos Completados" fill="#34D399" />
            <Bar dataKey="Solicitudes Pendientes" fill="#FBBF24" />
            <Bar dataKey="Solicitudes En Proceso" fill="#3B82F6" />
            <Bar dataKey="Solicitudes Completadas" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Botón de Actualizar */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchReportsData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Actualizar Reportes
        </button>
      </div>
    </div>
  );
} 