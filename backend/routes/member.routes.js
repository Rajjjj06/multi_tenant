import express from 'express';
import { addMember, getMembers, deleteMember, updateMember, getOrganizationMembers } from '../controllers/member.controller.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = express.Router();

router.post('/add/:organizationId/:projectId', authenticateUser, addMember);
router.get('/get/:organizationId/:projectId', authenticateUser, getMembers);
router.get('/organization/:organizationId', authenticateUser, getOrganizationMembers);
router.delete('/delete/:organizationId/:projectId/:memberId', authenticateUser, deleteMember);
router.put('/update/:organizationId/:projectId/:memberId', authenticateUser, updateMember);

export default router