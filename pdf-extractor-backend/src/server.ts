import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/mongodb.js';
import { PORT } from './static/api.js';

const bootstrap = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to bootstrap application:", error);
    process.exit(1);
  }
};

bootstrap();
