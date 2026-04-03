import { Router } from 'express';
import {
  startInterview,
  submitTextAnswer,
  submitVoiceAnswer,
  submitCode,
  endInterview,
  getInterview,
  transcribeOnly,
  speakText,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { uploadResume as multerUpload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/start', startInterview);
router.post('/answer', submitTextAnswer);
router.post('/answer/voice', multerUpload, submitVoiceAnswer);
router.post('/code', submitCode);
router.post('/end', endInterview);
router.get('/:id', getInterview);
router.post('/transcribe', multerUpload, transcribeOnly);
router.post('/speak', speakText);

export default router;
