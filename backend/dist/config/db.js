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
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose_1.default.connect(mongoUri, {
            // Vercel serverless: these settings prevent buffering timeouts
            serverSelectionTimeoutMS: 30000, // Wait up to 30s for server selection
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            bufferCommands: false, // Disable mongoose buffering
            maxPoolSize: 10, // Max 10 connections in pool
        });
        isConnected = true;
        console.log(`MongoDB Connected: ${mongoose_1.default.connection.host}`);
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error}`);
        // Reset so next call can retry
        isConnected = false;
        throw error;
    }
};
exports.default = connectDB;
