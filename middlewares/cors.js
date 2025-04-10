// CORS middleware for handling Cross-Origin Resource Sharing
const allowedOrigins = [
  "https://trading-dashboard-ebon.vercel.app",
  "http://localhost:3000",
];

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Check if the request origin is in our allowed list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Essential CORS headers
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
}

module.exports = corsMiddleware;
