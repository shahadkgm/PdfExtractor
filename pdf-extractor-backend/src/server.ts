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

console.log("CORS Allowed Origins initialized:", allowedOrigin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigin.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: "${origin}". Allowed origins are:`, allowedOrigin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

app.use(API_ROUTES.PDF, pdfRoutes);
app.use(API_ROUTES.AUTH, authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});