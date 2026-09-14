const mongoose = require("mongoose");

const connectDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/caresprint";
    const connection = await mongoose.connect(uri);

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;