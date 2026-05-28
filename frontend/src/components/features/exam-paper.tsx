'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn, getDifficultyColor } from '@/lib/utils';
import type { GeneratedAssessment } from '@/lib/api';

interface ExamPaperProps {
  assessment: GeneratedAssessment;
}

export function ExamPaper({ assessment }: ExamPaperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white shadow-sm overflow-hidden"
    >
      {/* Paper Content */}
      <div className="p-8 md:p-12 max-w-4xl mx-auto">
        {/* Institute Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-neutral-900">
            {assessment.instituteName || 'Delhi Public School, Sector-4, Bokaro'}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Subject: {assessment.subject}
          </p>
          <p className="text-sm text-neutral-600">
            Class: {assessment.className || '5th'}
          </p>
        </div>

        {/* Time & Marks */}
        <div className="flex items-center justify-between mb-4 text-sm text-neutral-600">
          <span>Time Allowed: {assessment.duration || '45 minutes'}</span>
          <span>Maximum Marks: {assessment.maxMarks}</span>
        </div>

        <hr className="mb-4 border-neutral-200" />

        {/* General Instructions */}
        <p className="mb-4 text-sm italic text-neutral-500">
          All questions are compulsory unless stated otherwise.
        </p>

        {/* Student Info Fields */}
        <div className="mb-6 space-y-2 text-sm text-neutral-700">
          <p>Name: ____________________</p>
          <p>Roll Number: ______________</p>
          <p>Class: {assessment.className || '5th'} Section: ________</p>
        </div>

        <hr className="mb-8 border-neutral-200" />

        {/* Sections */}
        {assessment.sections.map((section, sectionIdx) => (
          <motion.div
            key={sectionIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIdx * 0.15 }}
            className="mb-8"
          >
            <h2 className="mb-1 text-center text-lg font-bold text-neutral-900">
              {section.title}
            </h2>
            <p className="mb-6 text-center text-sm italic text-neutral-500">
              {section.instruction}
            </p>

            <div className="space-y-4">
              {section.questions.map((q, qIdx) => (
                <motion.div
                  key={qIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIdx * 0.1 + qIdx * 0.05 }}
                  className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-50"
                >
                  <span className="mt-0.5 text-sm font-semibold text-neutral-400 tabular-nums min-w-[24px]">
                    {q.questionNumber}.
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                          getDifficultyColor(q.difficulty)
                        )}
                      >
                        {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                      </span>
                      <p className="flex-1 text-sm text-neutral-700 leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0 text-[10px] h-5">
                    {q.marks} Mark{q.marks > 1 ? 's' : ''}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* End of Paper */}
        <div className="mt-8 border-t pt-4 text-center">
          <p className="text-sm font-semibold text-neutral-600">End of Question Paper</p>
        </div>

        {/* Answer Key */}
        {assessment.answerKey && assessment.answerKey.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="mb-4 text-center text-lg font-bold text-neutral-900">
              Answer Key:
            </h3>
            <div className="space-y-3">
              {assessment.answerKey.map((ak, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.03 }}
                  className="flex gap-2 text-sm text-neutral-600"
                >
                  <span className="font-semibold tabular-nums min-w-[24px]">
                    {ak.questionNumber}.
                  </span>
                  <p className="leading-relaxed">{ak.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
