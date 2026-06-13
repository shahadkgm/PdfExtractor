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
const allowedOrigin = [
  process.env.LOCALHOST,
  process.env.LOCAL_HOST,
  process.env.VERCEL_LINK
]
  .filter((o): o is string => typeof o === 'string')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any in our allowedOrigin list or ends with .vercel.app
    const isAllowed = allowedOrigin.includes(origin) || origin.endsWith('.vercel.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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