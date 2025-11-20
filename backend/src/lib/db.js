import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log('MongoDB connected successfully:', conn.connection.host);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); //1 status code means failure 0 means success

    }
}

export default connectDB;