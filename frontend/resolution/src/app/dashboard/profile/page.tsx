'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../components/dashboard/AuthContext';
import axios from 'axios';

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

interface Profile {
  id: number;
  user: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

function Avatar({ nombre, apellido }: { nombre: string; apellido: string }) {
  if (!nombre && !apellido) return null;
  const initials = `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl font-bold text-blue-700 border-4 border-white shadow-md">
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const isClient = useIsClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isClient || !user) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/profile/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const perfilData = Array.isArray(res.data) ? res.data[0] : res.data;
        setProfile(perfilData);
        setForm({
          nombre: perfilData.nombre || perfilData.first_name || '',
          apellido: perfilData.apellido || perfilData.last_name || '',
          email: perfilData.email || '',
          telefono: perfilData.telefono || perfilData.phone || '',
        });
      } catch (err) {
        setError('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, isClient]);

  // Ultra seguro: nada se renderiza hasta que todo esté listo
  if (!isClient) return null;
  if (!user) return <div className="text-center py-8">Cargando perfil...</div>;
  if (loading) return <div className="text-center py-8">Cargando perfil...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!profile) return <div className="text-center py-8">No hay perfil disponible.</div>;

  // Guardar cambios usando el profile.id
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/profile/${profile.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({ ...profile, ...form });
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Mi Perfil</h1>
      <div className="flex gap-6 items-center mb-8">
        <Avatar nombre={profile.nombre || profile.first_name || ''} apellido={profile.apellido || profile.last_name || ''} />
        <div>
          <div className="text-lg font-semibold text-gray-800">{profile.nombre || profile.first_name} {profile.apellido || profile.last_name}</div>
          <div className="text-gray-500">{profile.email}</div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                disabled={saving}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellido</label>
              <input
                type="text"
                name="apellido"
                value={form.apellido}
                onChange={e => setForm({ ...form, apellido: e.target.value })}
                disabled={saving}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={saving}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                disabled={saving}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow disabled:opacity-50"
          >
            Guardar Cambios
          </button>
        </div>
        {success && <div className="text-green-600 font-medium">{success}</div>}
        {error && <div className="text-red-500 font-medium">{error}</div>}
      </div>
    </div>
  );
} 