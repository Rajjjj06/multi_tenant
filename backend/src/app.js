import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';

import {logger, morganStream} from "../config/logger.js";
import {connectDB} from "../config/db.js";
import authRoutes from '../routes/auth.routes.js';
import organizationRoutes from '../routes/organization.routes.js';
import projectRoutes from '../routes/project.routes.js';
import memberRoutes from '../routes/member.routes.js';
import taskRoutes from '../routes/task.routes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined',{stream:morganStream}))

app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/task', taskRoutes);

connectDB();



export default app;