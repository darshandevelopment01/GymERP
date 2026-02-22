import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const c = async () => {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const user = await User.findOne({});
    console.log('First User:', user ? user.email : 'None');
    console.log('first user has password?', user ? !!user.password : 'No user');
    process.exit(0);
};

c();
