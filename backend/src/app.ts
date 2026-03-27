import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars BEFORE local imports with explicit path
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  // On Vercel, variables are injected directly; dotenv handles this automatically if no path is given
  dotenv.config();
}

import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import memberRoutes from './routes/member.routes';
import employeeRoutes from './routes/employee.routes';
import branchRoutes from './routes/branch.routes';
import mastersRoutes from './routes/masters.routes';
import enquiryRoutes from './routes/enquiry.routes';
import followupRoutes from './routes/followup.routes';
import uploadRoutes from './routes/upload.routes';
import activityLogRoutes from './routes/activityLog.routes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: [
    'https://muscletime.net',
    'https://www.muscletime.net',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit OPTIONS handler for preflight
app.options('*', cors());
app.use(express.json());

// Debug middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check - doesn't need DB
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route - doesn't need DB
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'MuscleTime ERP API',
    status: 'running',
  });
});

// ✅ DB Connection Middleware - runs BEFORE all API routes
// This ensures MongoDB is connected before any DB query is attempted
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error: any) {
    console.error('DB Connection middleware caught error:', error.message);
    res.status(503).json({
      message: 'Database connection failed. Please try again.',
      error: error.message,
      suggestion: error.message.includes('MONGODB_URI environment variable is not set')
        ? 'Check your environment variables (Vercel Settings).'
        : 'Check your MongoDB Atlas IP whitelist (0.0.0.0/0).'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activity-logs', activityLogRoutes);

export default app;
