'use client';
import React, { useEffect, useState } from 'react';

export default function TodoList({ listId }: { listId: number | null }) {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (listId) {
      fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/`)
        .then(res => res.json())
        .then(setTasks);
    }
  }, [listId]);

  if (!listId) return <div className="p-8">Selecciona una lista</div>;

  return (
    <main className="flex-1 p-8">
      <h2 className="font-bold text-xl mb-4">Tareas</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id} className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={task.completed} readOnly />
            <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
          </li>
        ))}
      </ul>
      {/* Aquí puedes agregar un formulario para crear nuevas tareas */}
    </main>
  );
}