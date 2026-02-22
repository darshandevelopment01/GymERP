import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const fix = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const hash = await bcrypt.hash('admin123', 10);
    await mongoose.connection.collection('users').updateOne(
        { email: 'admin@muscletime.com' },
        { $set: { password: hash } }
    );
    console.log('Password fixed! It is now admin123');
    process.exit(0);
};

fix();
