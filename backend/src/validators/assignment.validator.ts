import { z } from 'zod';

const questionTypeSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  count: z.number().int().min(1, 'At least 1 question required'),
  marks: z.number().int().min(1, 'Marks must be at least 1'),
});

export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(100),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  questionTypes: z
    .array(questionTypeSchema)
    .min(1, 'At least one question type required')
    .max(10, 'Maximum 10 question types'),
  additionalInstructions: z.string().max(2000).optional(),
});

export const assessmentOutputSchema = z.object({
  title: z.string(),
  instituteName: z.string().optional(),
  subject: z.string().optional(),
  className: z.string().optional(),
  duration: z.string().optional(),
  maxMarks: z.number().optional(),
  sections: z.array(
    z.object({
      title: z.string(),
      instruction: z.string(),
      questions: z.array(
        z.object({
          questionNumber: z.number().optional(),
          question: z.string(),
          difficulty: z.enum(['easy', 'moderate', 'challenging']),
          marks: z.number(),
          type: z.string(),
          answer: z.string().optional(),
        })
      ),
    })
  ),
  answerKey: z
    .array(
      z.object({
        questionNumber: z.number(),
        answer: z.string(),
      })
    )
    .optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type AssessmentOutput = z.infer<typeof assessmentOutputSchema>;
