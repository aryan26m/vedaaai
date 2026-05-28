'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface GenerationProgressProps {
  status: string;
  progress: number;
  message: string;
  error?: string;
}

const statusConfig: Record<string, { icon: typeof Loader2; color: string; label: string }> = {
  queued: { icon: Loader2, color: 'text-neutral-500', label: 'Queued' },
  processing: { icon: Zap, color: 'text-amber-500', label: 'Processing' },
  generating: { icon: Zap, color: 'text-blue-500', label: 'Generating' },
  parsing: { icon: Loader2, color: 'text-purple-500', label: 'Parsing' },
  saving: { icon: Loader2, color: 'text-emerald-500', label: 'Saving' },
  completed: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
};

export function GenerationProgress({ status, progress, message, error }: GenerationProgressProps) {
  const config = statusConfig[status] || statusConfig.queued;
  const Icon = config.icon;
  const isActive = !['completed', 'failed'].includes(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('flex items-center justify-center', config.color)}>
          <Icon className={cn('h-5 w-5', isActive && 'animate-spin')} />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{config.label}</p>
          <p className="text-xs text-neutral-500">{message}</p>
        </div>
      </div>

      <Progress
        value={progress}
        className="h-2"
        indicatorClassName={cn(
          status === 'failed' ? 'bg-red-500' : status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500',
          isActive && 'progress-pulse'
        )}
      />

      <div className="mt-2 flex justify-between text-xs text-neutral-400">
        <span>{progress}%</span>
        {isActive && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Processing...
          </motion.span>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </motion.div>
  );
}
