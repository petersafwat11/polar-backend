const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const apiRouter = require("./app");

// Load environment variables
const configEnvPath = path.join(__dirname, "config.env");
const dotEnvPath = path.join(__dirname, ".env");

// Try config.env first, then fall back to .env
if (fs.existsSync(configEnvPath)) {
  dotenv.config({ path: configEnvPath });
  console.log("Loaded environment from config.env");
} else if (fs.existsSync(dotEnvPath)) {
  dotenv.config({ path: dotEnvPath });
  console.log("Loaded environment from .env");
} else {
  dotenv.config();
  console.log("No specific env file found, using default env variables");
}

// Global exception handlers
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// MongoDB connection
const connectDB = async () => {
  try {
    const DB = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    await mongoose.connect(DB);
    console.log("DB connection successful!");
    return true;
  } catch (err) {
    console.error("DB connection error:", err);
    // Don't exit process on connection error, allow retrying
    return false;
  }
};

// Express app setup
const app = express();

// Health check endpoint at root level
app.get("/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Root path response
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Mount API router
app.use("/api", apiRouter);

// Start server
const port = process.env.PORT || 8000;
let server;

const startServer = async () => {
  try {
    // Try to connect to DB
    const connected = await connectDB();

    if (!connected) {
      console.log("Retrying DB connection in 5 seconds...");
      setTimeout(startServer, 5000);
      return;
    }

    // Start the server only after successful DB connection
    server = app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });

    // Handle SIGTERM signal
    process.on("SIGTERM", async () => {
      console.log("SIGTERM received. Shutting down gracefully...");

      try {
        // Close the server with timeout
        await new Promise((resolve, reject) => {
          // Set a timeout of 10 seconds
          const timeout = setTimeout(() => {
            console.log("Server close timed out, forcing shutdown.");
            resolve();
          }, 10000);

          server.close(() => {
            clearTimeout(timeout);
            console.log("Server closed.");
            resolve();
          });
        });

        // Close DB connection (without callback - Mongoose 8.x style)
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");

        process.exit(0);
      } catch (err) {
        console.error("Error during graceful shutdown:", err);
        process.exit(1);
      }
    });

    // Keep-alive for Railway
    const interval = setInterval(() => {
      console.log("Keep-alive ping...");
    }, 240000); // 4 minutes

    // Clean up on exit
    process.on("exit", () => {
      clearInterval(interval);
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
};

// Start the application
startServer();
