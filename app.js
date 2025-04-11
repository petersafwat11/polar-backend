const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const bodyParser = require("body-parser");

// Error handling
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Routes
const userRouter = require("./routes/userRoutes");
const coursesRouter = require("./routes/coursesRoutes");
const socialRouter = require("./routes/socialRoutes");
const testimonialsRouter = require("./routes/testimonialsRoutes");

const apiRouter = express.Router();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://trading-dashboard-ebon.vercel.app",
  ],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours in seconds
};

// Apply CORS middleware
apiRouter.use(cors(corsOptions));

// Handle OPTIONS preflight requests
apiRouter.options("*", cors(corsOptions));

// Security middleware
apiRouter.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
apiRouter.use(mongoSanitize()); // NoSQL injection protection

// Body parsing middleware
apiRouter.use(express.json({ limit: "10000kb" }));
apiRouter.use(express.urlencoded({ extended: false }));
apiRouter.use(bodyParser.json());

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

// Health check endpoint
apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API router is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Main routes
apiRouter.use("/users", userRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/social", socialRouter);
apiRouter.use("/testimonials", testimonialsRouter);

// Handle unmatched routes
apiRouter.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
apiRouter.use(globalErrorHandler);

module.exports = apiRouter;
