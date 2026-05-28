import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { Assignment } from '../models/assignment.model';
import { GeneratedAssessment } from '../models/generated-assessment.model';
import { GenerationJob } from '../models/generation-job.model';
import { generateAssessment } from '../services/ai.service';
import type { GenerationJobData } from '../queues/generation.queue';
import { getIO } from '../sockets/socket';

async function updateJobStatus(
  jobId: string,
  assignmentId: string,
  status: string,
  progress: number,
  message: string,
  error?: string
) {
  await GenerationJob.findByIdAndUpdate(jobId, {
    status,
    progress,
    statusMessage: message,
    ...(error && { error }),
    ...(status === 'processing' && { startedAt: new Date() }),
    ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
  });

  // Emit WebSocket event
  try {
    const io = getIO();
    io.to(`assignment:${assignmentId}`).emit('generation:progress', {
      assignmentId,
      jobId,
      status,
      progress,
      message,
      error,
    });
  } catch {
    // Socket not initialized yet (worker mode)
  }
}

async function processGeneration(job: Job<GenerationJobData>) {
  const { assignmentId, jobId } = job.data;

  try {
    // Step 1: Processing
    await updateJobStatus(jobId, assignmentId, 'processing', 10, 'Processing assignment...');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    // Step 2: Generating
    await updateJobStatus(jobId, assignmentId, 'generating', 30, 'AI is generating questions...');

    const startTime = Date.now();
    const result = await generateAssessment(assignment, async (progressMsg) => {
      await updateJobStatus(jobId, assignmentId, 'generating', 50, progressMsg);
    });

    const generationTime = Date.now() - startTime;

    // Step 3: Parsing
    await updateJobStatus(jobId, assignmentId, 'parsing', 70, 'Validating and parsing output...');

    // Step 4: Saving
    await updateJobStatus(jobId, assignmentId, 'saving', 85, 'Saving assessment...');

    const generatedAssessment = await GeneratedAssessment.create({
      assignmentId,
      title: result.title || assignment.title,
      instituteName: result.instituteName || 'Delhi Public School, Sector-4, Bokaro',
      subject: result.subject || assignment.subject,
      className: result.className || '5th',
      duration: result.duration || '45 minutes',
      maxMarks: result.maxMarks || assignment.totalMarks,
      sections: result.sections,
      answerKey: result.answerKey || [],
      metadata: {
        model: 'gpt-4o-mini',
        tokensUsed: 0,
        generationTimeMs: generationTime,
      },
    });

    // Link to assignment
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      generatedAssessmentId: generatedAssessment._id,
    });

    // Step 5: Completed
    await updateJobStatus(jobId, assignmentId, 'completed', 100, 'Assessment generated successfully!');

    return { assessmentId: generatedAssessment._id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, assignmentId, 'failed', 0, `Generation failed: ${message}`, message);
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
    throw error;
  }
}

export function startGenerationWorker() {
  const worker = new Worker<GenerationJobData>('assessment-generation', processGeneration, {
    connection: { host: env.redis.host, port: env.redis.port },
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  });

  worker.on('completed', (job) => {
    console.log(`✓ Generation job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`✗ Generation job ${job?.id} failed:`, error.message);
  });

  console.log('✓ Generation worker started');
  return worker;
}
