import mongoose from 'mongoose';
import { env } from './env';

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function connectDB(): Promise<void> {
  const maxRetries = env.nodeEnv === 'development' ? 3 : 10;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await mongoose.connect(env.mongoUri);
      console.log('✓ MongoDB connected');
      return;
    } catch (error) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed:`,
        (error as Error).message ?? error
      );

      if (attempt >= maxRetries) {
        console.error('✗ MongoDB connection error: giving up after retries.');
        if (env.nodeEnv === 'production') {
          process.exit(1);
        }

        console.warn('Continuing without MongoDB (development mode). Will retry in background.');

        // Background retry loop (non-blocking)
        setInterval(async () => {
          try {
            await mongoose.connect(env.mongoUri);
            console.log('✓ MongoDB connected (background retry)');
          } catch {
            // ignore background failures
          }
        }, 30000);

        return;
      }

      // exponential backoff
      await delay(2000 * attempt);
    }
  }
}
