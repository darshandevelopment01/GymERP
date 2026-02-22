import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const verifyLogin = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOne({ email: 'admin@muscletime.com' });
    console.log('User found:', !!user);
    if (user) {
        console.log('Hash in DB:', user.password);
        const match = await bcrypt.compare('admin123', user.password);
        console.log('Password match:', match);
    }
    process.exit(0);
};

verifyLogin();
