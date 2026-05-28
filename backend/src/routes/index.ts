import { Router } from 'express';
import assignmentRoutes from './assignment.routes';

const router = Router();

router.use('/assignments', assignmentRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
