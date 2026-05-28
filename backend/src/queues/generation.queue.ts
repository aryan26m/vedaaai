import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface GenerationJobData {
  assignmentId: string;
  jobId: string;
}

export const generationQueue = new Queue<GenerationJobData>('assessment-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('✓ BullMQ generation queue initialized');
