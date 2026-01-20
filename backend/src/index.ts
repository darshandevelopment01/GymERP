// backend/src/index.ts
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

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Only start server in development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}/api`);
  });
}

// Export for Vercel serverless
export default app;
