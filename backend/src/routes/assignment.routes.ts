import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  deleteAssignment,
  generateAssessment,
  getGenerationStatus,
  getGeneratedAssessment,
  downloadPDF,
  regenerateQuestion,
} from '../controllers/assignment.controller';

const router = Router();

// Assignment CRUD
router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', upload.single('file'), createAssignment);
router.delete('/:id', deleteAssignment);

// AI Generation
router.post('/:id/generate', generateAssessment);
router.get('/:id/generation-status', getGenerationStatus);
router.get('/:id/assessment', getGeneratedAssessment);

// PDF
router.get('/:id/pdf', downloadPDF);

// Question operations
router.post('/:id/regenerate-question', regenerateQuestion);

export default router;
