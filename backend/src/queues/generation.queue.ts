import { Queue } from 'bullmq';
import { env } from '../config/env';

export interface GenerationJobData {
  assignmentId: string;
  jobId: string;
}

let _generationQueue: Queue<GenerationJobData, unknown, string> | null = null;

try {
  _generationQueue = new Queue<GenerationJobData, unknown, string>('assessment-generation', {
    connection: { host: env.redis.host, port: env.redis.port, maxRetriesPerRequest: 1, enableOfflineQueue: false },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });

  console.log('✓ BullMQ generation queue initialized');
} catch (err) {
  console.warn('⚠ BullMQ generation queue not initialized (Redis unavailable). Falling back to local stub.');
}

// Export a queue-like object. Controllers only call `add(...)`, so provide a minimal stub
export const generationQueue: any =
  _generationQueue ?? {
    add: async (_name: string, _data: GenerationJobData, _opts?: any) => {
      // Return a fake job-like object so callers can store `bullJobId` safely
      return { id: `local-${Date.now()}` };
    },
  };
