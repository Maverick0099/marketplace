const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "0.0.0.0"]);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to the database");
  } catch (err) {
    console.error("Error connecting to the database", err);
  }
}

module.exports = connectDB;
