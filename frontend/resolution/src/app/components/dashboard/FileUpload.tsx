// components/dashboard/FileUpload.tsx
'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  initialFiles?: string[];
}

export default function FileUpload({ onFilesChange, initialFiles = [] }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>(initialFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setFileNames(prev => [...prev, ...newFiles.map(file => file.name)]);
      onFilesChange([...selectedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    
    const newFileNames = [...fileNames];
    newFileNames.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setFileNames(newFileNames);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
        >
          Seleccionar Archivos
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <span className="text-sm text-gray-500">
          {fileNames.length > 0 ? 
            `${fileNames.length} archivo(s) seleccionado(s)` : 
            'No hay archivos seleccionados'}
        </span>
      </div>

      {fileNames.length > 0 && (
        <ul className="mt-2 space-y-1">
          {fileNames.map((name, index) => (
            <li 
              key={index} 
              className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded"
            >
              <span>{name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}