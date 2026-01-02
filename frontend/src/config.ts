// Configuration for API endpoints
// In development, uses local backend
// In production with AWS, uses API Gateway

export const config = {
  // Set this to your API Gateway URL after deploying
  // Example: https://abc123.execute-api.us-east-1.amazonaws.com/dev
  apiEndpoint: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001',

  // Use AWS mode (presigned URLs) or local mode (direct upload)
  useAws: import.meta.env.VITE_USE_AWS === 'true',
};
