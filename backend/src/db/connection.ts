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
