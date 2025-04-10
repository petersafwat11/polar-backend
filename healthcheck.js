const http = require("http");

const PORT = process.env.PORT || 8000;
const HOST = "localhost";

const options = {
  timeout: 2000,
  host: HOST,
  port: PORT,
  path: "/health",
};

const request = http.request(options, (res) => {
  console.info(`STATUS: ${res.statusCode}`);
  process.exitCode = res.statusCode === 200 ? 0 : 1;
  process.exit();
});

request.on("error", (err) => {
  console.error("ERROR", err);
  process.exit(1);
});

request.end();
