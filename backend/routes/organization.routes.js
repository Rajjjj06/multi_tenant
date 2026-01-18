import {Router} from 'express';
import { createOrganization, currentOrganization, updateOrganization } from '../controllers/organization.controller.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = Router();

router.post('/create', authenticateUser, createOrganization);
router.get('/current', authenticateUser, currentOrganization);
router.put('/update/:id', authenticateUser, updateOrganization);

export default router;