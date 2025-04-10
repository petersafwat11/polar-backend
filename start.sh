#!/bin/bash
set -e

echo "Starting application..."
node --max-old-space-size=512 index.js &
APP_PID=$!

# Give the app some time to initialize
sleep 5

# Function to check if the app is healthy
check_health() {
  curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health
}

# Wait for the app to be healthy or fail after 60 seconds
TIMEOUT=60
while [ $TIMEOUT -gt 0 ]; do
  HTTP_STATUS=$(check_health)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "App is healthy!"
    break
  fi
  echo "Waiting for app to become healthy... ($TIMEOUT seconds left)"
  sleep 5
  TIMEOUT=$((TIMEOUT-5))
done

if [ $TIMEOUT -le 0 ]; then
  echo "Timeout waiting for app to become healthy"
  kill $APP_PID
  exit 1
fi

# Keep the script running to keep the container alive
wait $APP_PID 