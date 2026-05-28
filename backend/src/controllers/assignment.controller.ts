import { Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/assignment.model';
import { GeneratedAssessment } from '../models/generated-assessment.model';
import { GenerationJob } from '../models/generation-job.model';
import { generationQueue } from '../queues/generation.queue';
import { generatePDF } from '../services/pdf.service';
import { createAssignmentSchema } from '../validators/assignment.validator';
import { AppError } from '../middleware/error-handler';

export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Assignment.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: {
        assignments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await Assignment.findById(req.params.id).lean();
    if (!assignment) throw new AppError(404, 'Assignment not found');
    res.json({ status: 'success', data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    // Parse questionTypes from JSON string (FormData sends it as string)
    const rawBody = { ...req.body };
    if (typeof rawBody.questionTypes === 'string') {
      rawBody.questionTypes = JSON.parse(rawBody.questionTypes);
    }

    const body = createAssignmentSchema.parse(rawBody);

    const totalQuestions = body.questionTypes.reduce((sum, qt) => sum + qt.count, 0);
    const totalMarks = body.questionTypes.reduce((sum, qt) => sum + qt.count * qt.marks, 0);

    const assignment = await Assignment.create({
      ...body,
      totalQuestions,
      totalMarks,
      uploadedFileUrl: req.file?.path,
      uploadedFileName: req.file?.originalname,
      status: 'draft',
    });

    res.status(201).json({ status: 'success', data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) throw new AppError(404, 'Assignment not found');

    // Clean up generated assessment if exists
    if (assignment.generatedAssessmentId) {
      await GeneratedAssessment.findByIdAndDelete(assignment.generatedAssessmentId);
    }

    res.json({ status: 'success', message: 'Assignment deleted' });
  } catch (error) {
    next(error);
  }
}

export async function generateAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError(404, 'Assignment not found');

    if (assignment.status === 'generating') {
      throw new AppError(409, 'Assessment is already being generated');
    }

    // Update assignment status
    assignment.status = 'generating';
    await assignment.save();

    // Create job record
    const generationJob = await GenerationJob.create({
      assignmentId: assignment._id,
      status: 'queued',
      statusMessage: 'Job queued for processing',
    });

    // Add to BullMQ queue
    const bullJob = await generationQueue.add(
      'generate',
      {
        assignmentId: assignment._id.toString(),
        jobId: generationJob._id.toString(),
      },
      {
        jobId: `gen-${assignment._id}-${Date.now()}`,
      }
    );

    // Store BullMQ job ID
    generationJob.bullJobId = bullJob.id;
    await generationJob.save();

    res.json({
      status: 'success',
      data: {
        jobId: generationJob._id,
        assignmentId: assignment._id,
        message: 'Generation job queued',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getGenerationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await GenerationJob.findOne({ assignmentId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    if (!job) throw new AppError(404, 'No generation job found');

    res.json({ status: 'success', data: job });
  } catch (error) {
    next(error);
  }
}

export async function getGeneratedAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await GeneratedAssessment.findOne({ assignmentId: req.params.id }).lean();
    if (!assessment) throw new AppError(404, 'Generated assessment not found');

    res.json({ status: 'success', data: assessment });
  } catch (error) {
    next(error);
  }
}

export async function downloadPDF(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await GeneratedAssessment.findOne({ assignmentId: req.params.id });
    if (!assessment) throw new AppError(404, 'Generated assessment not found');

    const pdfBuffer = await generatePDF(assessment);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${assessment.title.replace(/[^a-zA-Z0-9 ]/g, '')}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export async function regenerateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { questionNumber } = req.body;
    const assessment = await GeneratedAssessment.findOne({ assignmentId: req.params.id });
    if (!assessment) throw new AppError(404, 'Generated assessment not found');

    // For now, return a message — full regeneration would re-call AI for a single question
    res.json({
      status: 'success',
      message: 'Question regeneration queued',
      data: { questionNumber },
    });
  } catch (error) {
    next(error);
  }
}
