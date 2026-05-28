'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: Record<string, string[]>;
}

export function FileUpload({ onFileSelect, accept }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selected = acceptedFiles[0] || null;
      setFile(selected);
      onFileSelect(selected);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = () => {
    setFile(null);
    onFileSelect(null);
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border">
              <FileText className="h-5 w-5 text-neutral-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-neutral-700">{file.name}</p>
              <p className="text-xs text-neutral-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            {...(getRootProps() as Omit<ReturnType<typeof getRootProps>, 'onDrag'>)}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors',
              isDragActive
                ? 'border-accent bg-accent/5'
                : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border shadow-sm">
              <Upload className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-600">
                <span className="font-medium">Choose a file</span> or drag & drop it here
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">PDF, PNG, JPEG, WebP</p>
            </div>
            <button
              type="button"
              className="mt-1 rounded-lg border bg-white px-4 py-1.5 text-xs font-medium text-neutral-600 shadow-sm transition-colors hover:bg-neutral-50"
            >
              Browse Files
            </button>
            <p className="text-[11px] text-neutral-400">
              Upload images of your preferred document/image
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
