import express from 'express';
import { createProject, getProjects, updateProject, deleteProject } from '../controllers/project.controller.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', authenticateUser, createProject);
router.get('/get/:organizationId', authenticateUser, getProjects);
router.put('/update/:projectId', authenticateUser, updateProject);
router.delete('/delete/:projectId', authenticateUser, deleteProject);   

export default router;