'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { Zap, Calendar, FileText, Hash, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => api.getAssignment(id),
  });

  const assignment = data?.data;

  const handleGenerate = async () => {
    try {
      await api.generateAssessment(id);
      router.push(`/assignments/${id}/assessment`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-neutral-500">Assignment not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{assignment.title}</h1>
            <p className="text-sm text-neutral-500 mt-1">Created {formatDate(assignment.createdAt)}</p>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              getStatusColor(assignment.status)
            )}
          >
            {assignment.status}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border bg-white p-6 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <FileText className="h-4 w-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Subject</p>
              <p className="text-sm font-medium">{assignment.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Calendar className="h-4 w-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Due Date</p>
              <p className="text-sm font-medium">{formatDate(assignment.dueDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Hash className="h-4 w-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Questions</p>
              <p className="text-sm font-medium">{assignment.totalQuestions}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Award className="h-4 w-4 text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Marks</p>
              <p className="text-sm font-medium">{assignment.totalMarks}</p>
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">Question Types</p>
          <div className="flex flex-wrap gap-2">
            {assignment.questionTypes.map((qt, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {qt.type}: {qt.count} × {qt.marks}m
              </Badge>
            ))}
          </div>
        </div>

        {assignment.additionalInstructions && (
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1">Additional Instructions</p>
            <p className="text-sm text-neutral-600">{assignment.additionalInstructions}</p>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex justify-end gap-3"
      >
        {assignment.status === 'completed' ? (
          <Button
            onClick={() => router.push(`/assignments/${id}/assessment`)}
            className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <FileText className="h-4 w-4" />
            View Assessment
          </Button>
        ) : assignment.status !== 'generating' ? (
          <Button
            onClick={handleGenerate}
            className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Zap className="h-4 w-4" />
            Generate Assessment
          </Button>
        ) : (
          <Button
            onClick={() => router.push(`/assignments/${id}/assessment`)}
            className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            View Progress
          </Button>
        )}
      </motion.div>
    </div>
  );
}
