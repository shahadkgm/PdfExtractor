import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { connectDatabase } from './config/mongodb.js';
import { PORT } from './static/api.js';

// Connect to MongoDB
connectDatabase();

const app = express();

// Simple, permissive CORS configuration
app.use(cors({
  origin: true, // Allow all origins for now to prevent any blocking
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Express 5 preflight handler
app.options('/{*path}', cors());

// Middleware
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Standard API Routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/auth', authRoutes);

// Fallback routes in case Render strips the /api prefix
app.use('/pdf', pdfRoutes);
app.use('/auth', authRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
