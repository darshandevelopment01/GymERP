import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const c = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOne({ email: 'admin@muscletime.com' });
    console.log('OTP:', user?.resetPasswordOtp);
    console.log('Expires:', user?.resetOtpExpires);
    console.log('Server Now:', new Date());
    if (user?.resetOtpExpires) {
        console.log('Is Expired?', new Date() > user.resetOtpExpires);
    }
    process.exit(0);
};

c();
