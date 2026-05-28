import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  questionNumber: number;
  question: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  marks: number;
  type: string;
  answer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedAssessment extends Document {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  instituteName: string;
  subject: string;
  className: string;
  duration: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: Array<{ questionNumber: number; answer: string }>;
  metadata: {
    model: string;
    tokensUsed: number;
    generationTimeMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionNumber: { type: Number, required: true },
    question: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'moderate', 'challenging'], required: true },
    marks: { type: Number, required: true, min: 1 },
    type: { type: String, required: true },
    answer: { type: String },
  },
  { _id: false }
);

const SectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true },
  },
  { _id: false }
);

const GeneratedAssessmentSchema = new Schema<IGeneratedAssessment>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    title: { type: String, required: true },
    instituteName: { type: String, default: 'Delhi Public School, Sector-4, Bokaro' },
    subject: { type: String, required: true },
    className: { type: String, default: '5th' },
    duration: { type: String, default: '45 minutes' },
    maxMarks: { type: Number, required: true },
    sections: { type: [SectionSchema], required: true },
    answerKey: [
      {
        questionNumber: { type: Number, required: true },
        answer: { type: String, required: true },
      },
    ],
    metadata: {
      model: { type: String, default: 'gpt-4o-mini' },
      tokensUsed: { type: Number, default: 0 },
      generationTimeMs: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const GeneratedAssessment = mongoose.model<IGeneratedAssessment>(
  'GeneratedAssessment',
  GeneratedAssessmentSchema
);
