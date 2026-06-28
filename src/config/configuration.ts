export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? '',
  jwtTtl: `${process.env.JWT_TTL ?? '15'}m`,
  jwtRefreshTtl: `${process.env.JWT_REFRESH_TTL ?? '10080'}m`,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
});
