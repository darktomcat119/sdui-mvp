export const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
});
