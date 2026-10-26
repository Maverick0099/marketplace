const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "0.0.0.0"]);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection failed", err);
  }
}

module.exports = connectDB;
