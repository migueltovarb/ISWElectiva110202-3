'use client';
import React, { useEffect, useState } from 'react';

export default function Sidebar({ onSelect, selectedId }: { onSelect: (id: number) => void, selectedId: number | null }) {
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/todo-lists/')
      .then(res => res.json())
      .then(setLists);
  }, []);

  return (
    <aside className="w-60 bg-gray-900 text-white p-4 h-full flex flex-col">
      <h2 className="font-bold mb-4">Mis Listas</h2>
      <ul className="flex-1">
        {lists.map(list => (
          <li
            key={list.id}
            className={`p-2 rounded cursor-pointer ${selectedId === list.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            onClick={() => onSelect(list.id)}
          >
            {list.name}
          </li>
        ))}
      </ul>
      {/* Aquí puedes agregar un formulario para crear nuevas listas */}
    </aside>
  );
}