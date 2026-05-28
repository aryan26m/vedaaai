'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/features/file-upload';
import { QuestionTypeRow } from '@/components/features/question-type-row';
import { Plus, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z
    .array(
      z.object({
        type: z.string().min(1, 'Select a question type'),
        count: z.number().min(1),
        marks: z.number().min(1),
      })
    )
    .min(1, 'Add at least one question type'),
  additionalInstructions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subject: '',
      dueDate: '',
      questionTypes: [
        { type: 'Multiple Choice Questions', count: 4, marks: 1 },
        { type: 'Short Questions', count: 3, marks: 2 },
      ],
      additionalInstructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questionTypes',
  });

  const questionTypes = watch('questionTypes');
  const totalQuestions = questionTypes.reduce((sum, qt) => sum + (qt.count || 0), 0);
  const totalMarks = questionTypes.reduce((sum, qt) => sum + (qt.count || 0) * (qt.marks || 0), 0);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('subject', values.subject);
      formData.append('dueDate', values.dueDate);
      formData.append('questionTypes', JSON.stringify(values.questionTypes));
      if (values.additionalInstructions) {
        formData.append('additionalInstructions', values.additionalInstructions);
      }
      if (file) {
        formData.append('file', file);
      }
      return api.createAssignment(formData);
    },
    onSuccess: async (data) => {
      toast.success('Assignment created!');
      // Auto-trigger generation
      try {
        await api.generateAssessment(data.data._id);
        router.push(`/assignments/${data.data._id}/assessment`);
      } catch {
        router.push(`/assignments/${data.data._id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });

  const handleNext = async () => {
    const valid = await trigger(['title', 'subject']);
    if (valid) setStep(2);
  };

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h1 className="text-2xl font-bold text-neutral-900">Create Assignment</h1>
        </div>
        <p className="text-sm text-neutral-500">Set up a new assignment for your students.</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Basic Information</h2>
                <p className="text-sm text-neutral-500">Enter the assignment details.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Assignment Title
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="e.g. Mid Semester Examination"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Subject
                  </label>
                  <Input
                    {...register('subject')}
                    placeholder="e.g. Science, Mathematics, English"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Assignment Details</h2>
                <p className="text-sm text-neutral-500">
                  Basic information about your assignment.
                </p>
              </div>

              {/* File Upload */}
              <FileUpload onFileSelect={setFile} />

              {/* Due Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Due Date
                </label>
                <Input type="date" {...register('dueDate')} />
                {errors.dueDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>
                )}
              </div>

              {/* Question Types */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-700">
                    Question Type
                  </label>
                  <div className="flex gap-12 text-xs font-medium text-neutral-500">
                    <span>No. of Questions</span>
                    <span>Marks</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {fields.map((field, index) => (
                      <QuestionTypeRow
                        key={field.id}
                        index={index}
                        type={questionTypes[index]?.type || ''}
                        count={questionTypes[index]?.count || 1}
                        marks={questionTypes[index]?.marks || 1}
                        onTypeChange={(type) => setValue(`questionTypes.${index}.type`, type)}
                        onCountChange={(count) => setValue(`questionTypes.${index}.count`, count)}
                        onMarksChange={(marks) => setValue(`questionTypes.${index}.marks`, marks)}
                        onRemove={() => remove(index)}
                        canRemove={fields.length > 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => append({ type: '', count: 1, marks: 1 })}
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Question Type
                </button>

                {errors.questionTypes && (
                  <p className="mt-1 text-xs text-red-500">
                    {typeof errors.questionTypes.message === 'string'
                      ? errors.questionTypes.message
                      : 'Please fill all question types'}
                  </p>
                )}

                <div className="mt-3 flex justify-end gap-6 text-sm text-neutral-600">
                  <span>
                    Total Questions :{' '}
                    <span className="font-semibold text-neutral-900">{totalQuestions}</span>
                  </span>
                  <span>
                    Total Marks :{' '}
                    <span className="font-semibold text-neutral-900">{totalMarks}</span>
                  </span>
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Additional Information (For better output)
                </label>
                <Textarea
                  {...register('additionalInstructions')}
                  placeholder="e.g. Generate a question paper for 3 hour exam duration..."
                  rows={3}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>

          <div>
            {step === 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
