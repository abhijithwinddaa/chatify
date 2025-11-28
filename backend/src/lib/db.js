import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async () => {
    try {
        const { MONGO_URL } = ENV;
        if (!MONGO_URL) throw new Error('MONGO_URL is not set');


        const conn = await mongoose.connect(ENV.MONGO_URL)
        console.log('MongoDB connected successfully:', conn.connection.host);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); //1 status code means failure 0 means success

    }
}

export default connectDB;