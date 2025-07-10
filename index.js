const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
//trading-backend/index.js
// Error handling
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Routes
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminsRoutes");
const courseRoutes = require("./routes/coursesRoutes");
const socialRoutes = require("./routes/socialRoutes");
const testimonialRoutes = require("./routes/testimonialsRoutes");

// Use absolute path to config.env
dotenv.config({ path: path.join(__dirname, "config.env") });

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

const app = express();
const apiRouter = express.Router();

// Security middleware
apiRouter.use(helmet());
apiRouter.use(mongoSanitize()); // NoSQL injection protection
apiRouter.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://polar-dashboard.vercel.app",
      "https://polar-vert.vercel.app",
    ],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // This allows credentials to be sent with cross-origin requests
  })
);

// Body parsing
apiRouter.use(express.json({ limit: "10000kb" }));
apiRouter.use(express.urlencoded({ extended: false }));
apiRouter.use(bodyParser.json());
apiRouter.use(cookieParser());

// Static files
apiRouter.use(express.static(`${__dirname}/public`));

// Development logging
if (process.env.NODE_ENV === "development") {
  apiRouter.use(morgan("dev"));
}

// Request timestamp middleware
apiRouter.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes
apiRouter.use("/users", userRoutes);
apiRouter.use("/admins", adminRoutes);
apiRouter.use("/courses", courseRoutes);
apiRouter.use("/social", socialRoutes);
apiRouter.use("/testimonials", testimonialRoutes);

// Handle unmatched routes
apiRouter.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
apiRouter.use(globalErrorHandler);

// Mount API router
app.use("/api", apiRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
