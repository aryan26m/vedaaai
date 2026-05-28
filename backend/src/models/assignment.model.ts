import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  dueDate: Date;
  questionTypes: IQuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  generatedAssessmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>(
  {
    type: { type: String, required: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    questionTypes: {
      type: [QuestionTypeConfigSchema],
      required: true,
      validate: [(v: IQuestionTypeConfig[]) => v.length > 0, 'At least one question type required'],
    },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    additionalInstructions: { type: String, trim: true },
    uploadedFileUrl: { type: String },
    uploadedFileName: { type: String },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed', 'failed'],
      default: 'draft',
      index: true,
    },
    generatedAssessmentId: { type: Schema.Types.ObjectId, ref: 'GeneratedAssessment' },
  },
  { timestamps: true }
);

AssignmentSchema.index({ createdAt: -1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
