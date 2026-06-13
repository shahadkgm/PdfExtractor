import 'dotenv/config';
import express from 'express'
import cors from "cors"
import pdfRoutes from "./routes/pdfRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import { connectDatabase } from './config/mongodb.js'
import { PORT, API_ROUTES } from './static/api.js'

// Connect to MongoDB database
connectDatabase();

const app = express()

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Prevent browser caching for all API responses (secures back/forward navigation)
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(API_ROUTES.PDF, pdfRoutes);
app.use(API_ROUTES.AUTH, authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});