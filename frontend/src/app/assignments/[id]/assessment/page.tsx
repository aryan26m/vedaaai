'use client';

import { useEffect, useState, use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api, type GenerationJob as GenerationJobType } from '@/lib/api';
import { getSocket, joinAssignment, leaveAssignment } from '@/lib/socket';
import { useGenerationStore } from '@/store/assignment.store';
import { GenerationProgress } from '@/components/features/generation-progress';
import { ExamPaper } from '@/components/features/exam-paper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, Copy, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { activeJobs, setJobStatus } = useGenerationStore();
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch generation status
  const { data: statusData } = useQuery({
    queryKey: ['generation-status', id],
    queryFn: () => api.getGenerationStatus(id),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status && !['completed', 'failed'].includes(status)) return 2000;
      return false;
    },
  });

  // Fetch generated assessment
  const {
    data: assessmentData,
    isLoading: isLoadingAssessment,
  } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api.getGeneratedAssessment(id),
    enabled: statusData?.data?.status === 'completed',
  });

  const job = activeJobs[id] || statusData?.data;
  const assessment = assessmentData?.data;
  const isCompleted = job?.status === 'completed';
  const isGenerating = job && !['completed', 'failed'].includes(job.status);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = getSocket();
    joinAssignment(id);

    socket.on('generation:progress', (data: GenerationJobType & { message: string }) => {
      if (data.assignmentId === id) {
        setJobStatus(id, {
          _id: data._id || '',
          assignmentId: id,
          status: data.status,
          progress: data.progress,
          statusMessage: data.message,
          error: data.error,
        });

        if (data.status === 'completed') {
          queryClient.invalidateQueries({ queryKey: ['assessment', id] });
          queryClient.invalidateQueries({ queryKey: ['generation-status', id] });
        }
      }
    });

    return () => {
      leaveAssignment(id);
      socket.off('generation:progress');
    };
  }, [id, setJobStatus, queryClient]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.downloadPDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assessment?.title || 'assessment'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!assessment) return;
    const text = assessment.sections
      .map(
        (s) =>
          `${s.title}\n${s.instruction}\n\n${s.questions
            .map((q) => `${q.questionNumber}. ${q.question} [${q.marks} Marks]`)
            .join('\n')}`
      )
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleRegenerate = async () => {
    try {
      await api.generateAssessment(id);
      queryClient.invalidateQueries({ queryKey: ['generation-status', id] });
      toast.success('Regeneration started!');
    } catch {
      toast.error('Failed to start regeneration');
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* AI Chat Bubble */}
      {isCompleted && assessment && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex gap-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-3">
            <p className="text-sm text-neutral-700">
              Here is your customized Question Paper for your{' '}
              <span className="font-medium">{assessment.subject}</span> class on the topics covered.
            </p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                {isDownloading ? 'Downloading...' : 'Download as PDF'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generation Progress */}
      <AnimatePresence>
        {isGenerating && job && (
          <div className="mb-6">
            <GenerationProgress
              status={job.status}
              progress={job.progress}
              message={job.statusMessage}
              error={job.error}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Action Toolbar */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center justify-end gap-2"
        >
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </motion.div>
      )}

      {/* Assessment Paper */}
      {isLoadingAssessment && isCompleted ? (
        <div className="space-y-4 rounded-2xl border bg-white p-8">
          <Skeleton className="mx-auto h-6 w-64" />
          <Skeleton className="mx-auto h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : assessment ? (
        <ExamPaper assessment={assessment} />
      ) : !isGenerating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-16">
          <p className="mb-4 text-neutral-500">No assessment generated yet.</p>
          <Button
            onClick={handleRegenerate}
            className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <RefreshCw className="h-4 w-4" />
            Generate Now
          </Button>
        </div>
      ) : null}
    </div>
  );
}
