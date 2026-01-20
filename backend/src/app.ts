import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import memberRoutes from './routes/member.routes';
import employeeRoutes from './routes/employee.routes';
import branchRoutes from './routes/branch.routes';

dotenv.config();

const app: Application = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://muscletime-backend.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check - FIRST
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root route - SECOND
app.get('/', (req, res) => {
  res.json({ 
    message: 'MuscleTime ERP API',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      members: '/api/members',
      employees: '/api/employees',
      branches: '/api/branches'
    }
  });
});

// API Routes - LAST
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);

export default app;
