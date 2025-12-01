import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
    
  const uri = process.env.DB_URI || "mongodb://127.0.0.1:27017/testdb";

  if (!uri) {
    console.error("MONGO_URI is not defined in environment variables.");
    process.exit(1); 
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, 
    });

    console.log("DB Conn..",process.env.DB_URI);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Retrying...");
    });

  } catch (error: any) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};
