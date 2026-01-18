import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("Connected to MongoDB")
    }
    catch(error){
        logger.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
}