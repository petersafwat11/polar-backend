# Trading Backend

A Node.js backend for the Trading application.

## Deployment to Railway

1. Push your code to a GitHub repository.
2. Connect your GitHub repository to Railway.
3. Set the following environment variables in Railway:
   - `NODE_ENV`: production
   - `PORT`: 8080
   - `DATABASE`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret
   - `JWT_EXPIRES_IN`: 1d
   - `JWT_COOKIE_EXPIRES_IN`: 1
   - `EMAIL_USERNAME`: Your email username
   - `EMAIL_PASSWORD`: Your email password
   - `EMAIL_HOST`: Your email host
   - `EMAIL_PORT`: Your email port

## Local Development

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables.
4. Start the development server: `npm run dev`

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/users`: Get all users
- `GET /api/courses`: Get all courses
- `GET /api/social`: Get all social media links
- `GET /api/testimonials`: Get all testimonials
