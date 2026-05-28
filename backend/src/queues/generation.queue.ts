import { Queue } from 'bullmq';
import { env } from '../config/env';

export interface GenerationJobData {
  assignmentId: string;
  jobId: string;
}

export const generationQueue = new Queue<GenerationJobData, unknown, string>('assessment-generation', {
  connection: { host: env.redis.host, port: env.redis.port },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

console.log('✓ BullMQ generation queue initialized');
