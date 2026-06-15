import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const FRONTEND_URL = process.env.VERCEL_LINK;

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

console.log("[API URL]", FRONTEND_URL);

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

export default app;
