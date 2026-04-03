import { Router } from 'express';
import {
  getInterviewHistory,
  getInterviewDetailHistory,
  deleteInterviewHistory,
  getInterviewStats,
} from '../controllers/history.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getInterviewHistory);
router.get('/stats', getInterviewStats);
router.get('/:id', getInterviewDetailHistory);
router.delete('/:id', deleteInterviewHistory);

export default router;
