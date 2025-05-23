'use client';
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TodoList from './components/TodoList';

export default function Home() {
  const [selectedList, setSelectedList] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen">
      <Sidebar onSelect={setSelectedList} selectedId={selectedList} />
      <TodoList listId={selectedList} />
      {/* Aquí podrías agregar un panel de detalles si lo deseas */}
    </div>
  );
}