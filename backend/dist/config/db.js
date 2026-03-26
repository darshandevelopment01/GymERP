"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        return;
    }
    // If already connected, reuse
    if (mongoose_1.default.connection.readyState === 1) {
        isConnected = true;
        return;
    }
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        throw new Error('MONGODB_URI environment variable is not set');
    }
    try {
        // Basic sanitization for logging
        const host = mongoUri.split('@')[1]?.split('/')[0] || 'hidden-host';
        console.log(`📡 Attempting to connect to MongoDB: ${host}`);
        await mongoose_1.default.connect(mongoUri, {
            // Vercel serverless: these settings prevent buffering timeouts
            serverSelectionTimeoutMS: 15000, // Reduced for faster failure detection
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            bufferCommands: false, // Disable mongoose buffering
            maxPoolSize: 10, // Max 10 connections in pool
        });
        isConnected = true;
        console.log(`✅ MongoDB Connected: ${mongoose_1.default.connection.host}`);
    }
    catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        // Check if it's a whitelist issue (common on Vercel)
        if (error.message.includes('MongooseServerSelectionError') || error.message.includes('ECONNREFUSED')) {
            console.error('💡 TIP: Check if your IP (or 0.0.0.0/0 for Vercel) is whitelisted in MongoDB Atlas.');
        }
        // Reset so next call can retry
        isConnected = false;
        throw error;
    }
};
exports.default = connectDB;
