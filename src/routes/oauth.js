import { Router } from 'express';
import { googleOauth } from '../controllers/oauth.js';

const router = Router();

router.post('/google/token', googleOauth);

export default router;
