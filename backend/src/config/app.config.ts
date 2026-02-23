export const getAppConfig = () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  environment: process.env.ENVIRONMENT || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '3', 10),
});
