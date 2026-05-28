import mongoose, { Schema, Document } from 'mongoose';

export type JobStatus = 'queued' | 'processing' | 'generating' | 'parsing' | 'saving' | 'completed' | 'failed';

export interface IGenerationJob extends Document {
  assignmentId: mongoose.Types.ObjectId;
  status: JobStatus;
  progress: number;
  statusMessage: string;
  bullJobId?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'generating', 'parsing', 'saving', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    statusMessage: { type: String, default: 'Job queued' },
    bullJobId: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const GenerationJob = mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);
