import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(24).required(),
  JWT_REFRESH_SECRET: Joi.string().min(24).optional(),
  JWT_TTL: Joi.number().integer().min(1).default(15),
  JWT_REFRESH_TTL: Joi.number().integer().min(1).default(10080),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
});
