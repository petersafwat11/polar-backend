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

// Security middleware
apiRouter.use(helmet());
apiRouter.use(mongoSanitize()); // NoSQL injection protection

// Enhanced CORS handling with preflight support
apiRouter.use(
  cors({
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
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle OPTIONS requests explicitly for preflight
apiRouter.options("*", cors());

// Body parsing
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
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
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
