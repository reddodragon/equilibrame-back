import Joi from 'joi';

const postgresUrlPattern = /^postgres(?:ql)?:\/\//i;

export interface AppEnvironment {
  PORT: number;
  DATABASE_URL: string;
  DATABASE_PASS: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FRONTEND_URL: string;
}

const envSchema = Joi.object<AppEnvironment>({
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  DATABASE_URL: Joi.string()
    .trim()
    .pattern(postgresUrlPattern)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL debe empezar con postgres:// o postgresql://',
    }),
  DATABASE_PASS: Joi.string().min(1).required(),
  JWT_SECRET: Joi.string().trim().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().trim().min(16).required(),
  GOOGLE_CLIENT_ID: Joi.string().trim().min(1).required(),
  GOOGLE_CLIENT_SECRET: Joi.string().trim().min(1).required(),
  GOOGLE_CALLBACK_URL: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  FRONTEND_URL: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .required(),
}).unknown(true);

export function validateEnv(config: Record<string, unknown>): AppEnvironment {
  const validationResult: Joi.ValidationResult<AppEnvironment> =
    envSchema.validate(config, {
      abortEarly: false,
      convert: true,
    });

  if (validationResult.error) {
    throw new Error(
      `Environment validation error: ${validationResult.error.message}`,
    );
  }

  return validationResult.value;
}
