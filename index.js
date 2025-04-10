const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const apiRouter = require("./app");

// Load environment variables from .env file
dotenv.config();

// Log environment variables (excluding sensitive ones)
console.log("Environment:", process.env.NODE_ENV);
console.log("Port:", process.env.PORT);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

// Handle SIGINT signal (Ctrl+C)
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  console.log("Attempting to connect to MongoDB...");
  mongoose
    .connect(process.env.DATABASE)
    .then(() => {
      console.log("DB connection successful!");
    })
    .catch((err) => {
      console.error("DB connection error:", err);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

const port = process.env.PORT || 8000;
const app = express();

// Add a basic route for the root path
app.get("/", (req, res) => {
  res.send("Trading Backend API is running");
});

app.use("/api", apiRouter);

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handle SIGTERM signal gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
