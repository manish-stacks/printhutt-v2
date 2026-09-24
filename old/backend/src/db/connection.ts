import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';

mongoose.set('strictQuery', true);

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;
  try {
    await mongoose.connect(env.MONGO_URL, {
      bufferCommands: false,
      // ✅ FIX: Proper connection pool settings for production
      maxPoolSize: 10,        // Max concurrent connections
      minPoolSize: 2,         // Keep at least 2 alive
      socketTimeoutMS: 45000, // 45s socket timeout
      serverSelectionTimeoutMS: 10000, // 10s to find server
      heartbeatFrequencyMS: 10000,     // Check server health every 10s
    });
    isConnected = true;
    logger.info('MongoDB connected');
    return mongoose;
  } catch (err) {
    logger.error('MongoDB connection error', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}
