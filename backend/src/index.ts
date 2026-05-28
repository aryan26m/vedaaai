import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initializeSocket } from './sockets/socket';
import { startGenerationWorker } from './workers/generation.worker';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  const app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // API routes
  app.use('/api', routes);

  // Error handler
  app.use(errorHandler);

  // Initialize Socket.IO
  initializeSocket(httpServer);

  // Start BullMQ worker (in-process for simplicity)
  startGenerationWorker();

  // Start server
  httpServer.listen(env.port, () => {
    console.log(`\n🚀 VedaAI Backend running on port ${env.port}`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   Frontend URL: ${env.frontendUrl}\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
