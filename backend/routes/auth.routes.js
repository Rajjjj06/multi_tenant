import express from 'express';
import { verifyFirebaseToken, getCurrentUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/verify-token', verifyFirebaseToken);
router.get('/me', authenticateUser, getCurrentUser);

export default router;