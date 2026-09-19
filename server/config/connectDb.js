import mongoose from "mongoose";

const connectDb = async () => {
    try {
        if (!process.env.MONGO_URL) return;
        await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 2500
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.warn("MongoDB connection warning (offline fallback active):", error.message);
    }
};

export default connectDb;