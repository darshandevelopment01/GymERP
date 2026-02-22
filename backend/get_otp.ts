import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const c = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOne({ email: 'admin@muscletime.com' });
    if (user && user.resetPasswordOtp) {
        console.log('=============');
        console.log('OTP IS:', user.resetPasswordOtp);
        console.log('=============');
    } else {
        console.log('No OTP found for user');
    }
    process.exit(0);
};

c();
