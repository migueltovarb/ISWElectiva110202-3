'use client';
import React, { useEffect, useState } from 'react';
import { HiPencil, HiTrash } from "react-icons/hi";

function EditIcon({ className = '' }) {
  return (
    <svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M4 21h4.586a1 1 0 0 0 .707-.293l10-10a1 1 0 0 0 0-1.414l-4.586-4.586a1 1 0 0 0-1.414 0l-10 10A1 1 0 0 0 4 21z" stroke="#2563eb" strokeWidth="2"/>
      <path d="M14.5 6.5l3 3" stroke="#2563eb" strokeWidth="2"/>
    </svg>
  );
}
function TrashIcon({ className = '' }) {
  return (
    <svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path d="M3 6h18" stroke="#2563eb" strokeWidth="2"/>
      <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="#2563eb" strokeWidth="2"/>
      <path d="M10 11v6M14 11v6" stroke="#2563eb" strokeWidth="2"/>
      <path d="M5 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" stroke="#2563eb" strokeWidth="2"/>
    </svg>
  );
}

export default function Sidebar({ onSelect, selectedId }: { onSelect: (id: number) => void, selectedId: number | null }) {
  const [lists, setLists] = useState<any[]>([]);
  const [newList, setNewList] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/todo-lists/')
      .then(res => res.json())
      .then(setLists);
  }, []);

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newList.trim()) return;
    const res = await fetch('http://127.0.0.1:8000/api/todo-lists/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newList }),
    });
    if (res.ok) {
      const data = await res.json();
      setLists([...lists, data]);
      setNewList('');
    }
  };

  const handleEditList = (id: number, name: string) => {
    setEditId(id);
    setEditName(name);
  };

  const handleSaveEdit = async (id: number) => {
    const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      setLists(lists.map(l => l.id === id ? { ...l, name: editName } : l));
      setEditId(null);
      setEditName('');
    }
  };

  const handleDeleteList = async (id: number) => {
    if (!window.confirm('¿Eliminar esta lista?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setLists(lists.filter(l => l.id !== id));
      if (selectedId === id) onSelect(0);
    }
  };

  return (
    <aside className="w-60 bg-green-600 text-white p-4 h-screen flex flex-col">
      <h2 className="font-bold mb-4 text-white">Mis Listas</h2>
      <ul className="flex-1 overflow-y-auto">
        {lists.map(list => (
          <li
            key={list.id}
            className={`p-2 rounded mb-2 flex items-center gap-2 ${selectedId === list.id ? 'bg-white text-green-600' : 'hover:bg-green-700'}`}
          >
            {editId === list.id ? (
              <>
                <input
                  className="flex-1 p-1 rounded text-gray-900"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(list.id)}
                  autoFocus
                />
                <button className="text-green-600" onClick={() => handleSaveEdit(list.id)}>✔</button>
                <button className="text-red-600" onClick={() => setEditId(null)}>✖</button>
              </>
            ) : (
              <>
                <span className="flex-1 cursor-pointer" onClick={() => onSelect(list.id)}>{list.name}</span>
                <button title="Editar" onClick={() => handleEditList(list.id, list.name)}>
                  <HiPencil className="w-5 h-5 text-green-900" />
                </button>
                <button title="Eliminar" onClick={() => handleDeleteList(list.id)}>
                  <HiTrash className="w-5 h-5 text-green-900" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddList} className="mt-4 flex gap-2">
        <input
          className="flex-1 p-1 rounded text-gray-900"
          placeholder="Nueva lista"
          value={newList}
          onChange={e => setNewList(e.target.value)}
        />
        <button type="submit" className="bg-white text-green-600 px-2 rounded">+</button>
      </form>
    </aside>
  );
}