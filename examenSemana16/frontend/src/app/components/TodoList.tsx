'use client';
import React, { useEffect, useState } from 'react';
import { HiPencil, HiTrash } from "react-icons/hi";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TodoList({ listId }: { listId: number | null }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [checkedTasks, setCheckedTasks] = useState<{[id: number]: boolean}>({});
  const [showApply, setShowApply] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (listId) {
      fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/`)
        .then(res => res.json())
        .then(setTasks);
    }
  }, [listId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });
    if (res.ok) {
      const data = await res.json();
      setTasks([...tasks, data]);
      setTitle('');
      setDescription('');
      setShowModal(false);
    }
  };

  const handleEditTask = (task: any) => {
    setEditId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
  };

  const handleSaveEdit = async (id: number) => {
    const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDesc }),
    });
    if (res.ok) {
      setTasks(tasks.map(t => t.id === id ? { ...t, title: editTitle, description: editDesc } : t));
      setEditId(null);
      setEditTitle('');
      setEditDesc('');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/${id}/`, { method: 'DELETE' });
    if (res.ok) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleCheck = (taskId: number) => {
    setCheckedTasks(prev => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      setShowApply(Object.values(updated).some(v => v));
      return updated;
    });
  };

  const handleApply = async () => {
    const toPatch = Object.entries(checkedTasks)
      .filter(([_, checked]) => checked)
      .map(([id]) => Number(id));
    await Promise.all(
      toPatch.map(async id => {
        const res = await fetch(`http://127.0.0.1:8000/api/todo-lists/${listId}/tasks/${id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        });
        return res.ok ? await res.json() : null;
      })
    );
    setTasks(tasks.map(task =>
      toPatch.includes(task.id) ? { ...task, completed: true } : task
    ));
    setCheckedTasks({});
    setShowApply(false);
  };

  if (!listId) return <div className="p-8">Selecciona una lista</div>;

  return (
    <main className="flex-1 p-8 relative bg-green-200">
      <h2 className="font-bold text-xl mb-4 text-green-600">Tareas</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id} className="mb-4 bg-white rounded shadow p-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!checkedTasks[task.id]}
                disabled={task.completed}
                onChange={() => handleCheck(task.id)}
              />
              {editId === task.id ? (
                <>
                  <input
                    className="p-1 rounded border text-gray-900"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(task.id)}
                    autoFocus
                  />
                  <button className="text-green-600" onClick={() => handleSaveEdit(task.id)}>✔</button>
                  <button className="text-red-600" onClick={() => setEditId(null)}>✖</button>
                </>
              ) : (
                <>
                  <span className={task.completed ? 'line-through text-gray-900' : 'text-gray-900'}>{task.title}</span>
                  <button title="Editar" onClick={() => handleEditTask(task)}>
                    <HiPencil className="w-5 h-5 text-green-900" />
                  </button>
                  {task.completed && (
                    <button title="Eliminar" onClick={() => handleDeleteTask(task.id)}>
                      <HiTrash className="w-5 h-5 text-green-900" />
                    </button>
                  )}
                </>
              )}
            </div>
            {editId === task.id ? (
              <textarea
                className="ml-6 p-1 rounded border w-full text-gray-900"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
              />
            ) : (
              <div className="ml-6 text-gray-500 text-sm">{task.description}</div>
            )}
            <div className="ml-6 text-gray-400 text-xs">Creada: {formatDate(task.created_at)}</div>
            {task.completed && (
              <div className="ml-6 text-green-600 text-xs font-bold">Completada</div>
            )}
          </li>
        ))}
      </ul>
      {/* Botón para mostrar el modal */}
      <button
        className="mt-8 bg-green-600 text-white px-4 py-2 rounded"
        onClick={() => setShowModal(true)}
      >
        Añadir tarea
      </button>
      {/* Modal para añadir tarea */}
      {showModal && (
        <div className="fixed inset-0 bg-green-200 bg-opacity-100 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="font-bold mb-4 text-lg text-green-600">Nueva tarea</h3>
            <form onSubmit={handleAddTask} className="flex flex-col gap-1">
              <input
                className="p-2 border rounded text-gray-900"
                placeholder="Título de la tarea"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="p-2 border rounded text-gray-900"
                placeholder="Descripción"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Añadir</button>
                <button type="button" className="bg-green-900 px-4 py-2 rounded" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showApply && (
        <button
          className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg"
          onClick={handleApply}
        >
          Aplicar cambios
        </button>
      )}
    </main>
  );
}