import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './src/models/User';
dotenv.config();

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOne({ email: 'admin@muscletime.com' });
    console.log(user);
    //  const match = await bcrypt.compare('admin123', user.password);
    //  console.log('Password match:', match);
    process.exit(0);
};

check();
