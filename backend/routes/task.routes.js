import express from 'express';
import { createTask, updateTaskStatus, getTasks, deleteTask } from '../controllers/task.controller.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authenticateUser, createTask);
router.put('/update-status/:taskId', authenticateUser, updateTaskStatus);
router.get('/get/:organizationId/:projectId', authenticateUser, getTasks);
router.delete('/delete/:taskId', authenticateUser, deleteTask);

export default router;

