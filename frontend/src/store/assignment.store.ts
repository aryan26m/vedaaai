import { create } from 'zustand';
import type { GenerationJob } from '@/lib/api';

interface GenerationState {
  activeJobs: Record<string, GenerationJob>;
  setJobStatus: (assignmentId: string, job: GenerationJob) => void;
  clearJob: (assignmentId: string) => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  activeJobs: {},
  setJobStatus: (assignmentId, job) =>
    set((state) => ({
      activeJobs: { ...state.activeJobs, [assignmentId]: job },
    })),
  clearJob: (assignmentId) =>
    set((state) => {
      const { [assignmentId]: _, ...rest } = state.activeJobs;
      return { activeJobs: rest };
    }),
}));
