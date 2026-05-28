import OpenAI from 'openai';
import { env } from '../config/env';
import { assessmentOutputSchema, type AssessmentOutput } from '../validators/assignment.validator';
import type { IAssignment } from '../models/assignment.model';

const openai = new OpenAI({ apiKey: env.openaiApiKey });

function buildPrompt(assignment: IAssignment): string {
  const questionBreakdown = assignment.questionTypes
    .map((qt) => `- ${qt.type}: ${qt.count} questions, ${qt.marks} marks each`)
    .join('\n');

  return `You are an expert exam paper generator. Create a structured examination paper based on the following requirements.

**Assignment Title:** ${assignment.title}
**Subject:** ${assignment.subject}
**Total Questions:** ${assignment.totalQuestions}
**Total Marks:** ${assignment.totalMarks}

**Question Breakdown:**
${questionBreakdown}

${assignment.additionalInstructions ? `**Additional Instructions:** ${assignment.additionalInstructions}` : ''}

Generate a complete, well-structured exam paper. Group questions into logical sections. Each question must have:
- A clear, well-written question text
- Difficulty level (easy, moderate, or challenging) — distribute difficulties evenly
- Marks allocation
- Question type

Also provide an answer key with concise answers for each question.

You MUST respond with valid JSON matching this exact structure:
{
  "title": "string - exam title",
  "instituteName": "Delhi Public School, Sector-4, Bokaro",
  "subject": "${assignment.subject}",
  "className": "5th",
  "duration": "45 minutes",
  "maxMarks": ${assignment.totalMarks},
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries N marks",
      "questions": [
        {
          "questionNumber": 1,
          "question": "Full question text here",
          "difficulty": "easy|moderate|challenging",
          "marks": 2,
          "type": "short-answer|mcq|numerical|diagram-based",
          "answer": "Concise answer"
        }
      ]
    }
  ],
  "answerKey": [
    { "questionNumber": 1, "answer": "Concise answer for question 1" }
  ]
}

IMPORTANT: Return ONLY valid JSON, no markdown code fences, no extra text.`;
}

export async function generateAssessment(
  assignment: IAssignment,
  onProgress?: (status: string) => void
): Promise<AssessmentOutput> {
  onProgress?.('Building AI prompt...');

  const prompt = buildPrompt(assignment);

  onProgress?.('Sending request to AI model...');

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational assessment creator. Always respond with valid JSON only. No markdown, no explanations, just pure JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      onProgress?.('Parsing AI response...');

      const parsed = JSON.parse(content);

      // Validate with Zod schema
      const validated = assessmentOutputSchema.parse(parsed);

      // Ensure question numbers are sequential
      let globalNum = 1;
      for (const section of validated.sections) {
        for (const question of section.questions) {
          question.questionNumber = globalNum++;
        }
      }

      return validated;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onProgress?.(`Attempt ${attempt} failed, ${attempt < maxRetries ? 'retrying...' : 'giving up'}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('AI generation failed after retries');
}
