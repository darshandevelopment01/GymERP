import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  // If already connected, reuse
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI as string;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      // Vercel serverless: these settings prevent buffering timeouts
      serverSelectionTimeoutMS: 30000, // Wait up to 30s for server selection
      socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
      bufferCommands: false,           // Disable mongoose buffering
      maxPoolSize: 10,                 // Max 10 connections in pool
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    // Reset so next call can retry
    isConnected = false;
    throw error;
  }
};

export default connectDB;
