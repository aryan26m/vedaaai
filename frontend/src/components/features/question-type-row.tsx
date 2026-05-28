'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';

const QUESTION_TYPES = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Answer Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False',
  'Fill in the Blanks',
  'Match the Following',
];

interface QuestionTypeRowProps {
  index: number;
  type: string;
  count: number;
  marks: number;
  onTypeChange: (type: string) => void;
  onCountChange: (count: number) => void;
  onMarksChange: (marks: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function QuestionTypeRow({
  index,
  type,
  count,
  marks,
  onTypeChange,
  onCountChange,
  onMarksChange,
  onRemove,
  canRemove,
}: QuestionTypeRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value)}
        className="flex-1 h-10 rounded-lg border border-input bg-white px-3 text-sm text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <option value="">Select type...</option>
        {QUESTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="w-20">
        <Input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => onCountChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="text-center"
          placeholder="Qty"
        />
      </div>

      <div className="w-20">
        <Input
          type="number"
          min={1}
          max={50}
          value={marks}
          onChange={(e) => onMarksChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="text-center"
          placeholder="Marks"
        />
      </div>
    </motion.div>
  );
}
