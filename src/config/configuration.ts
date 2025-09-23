export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/makayla-jam',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'your-admin-jwt-secret',
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1h',
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
});