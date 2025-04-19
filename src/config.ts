import 'dotenv/config';
import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('production'),
  PORT: z.coerce.number().default(8080),
  RECAPTCHA_SECRET_KEY: z.string({
    required_error: 'RECAPTCHA_SECRET_KEY is required',
  }),
  RECAPTCHA_SCORE_THRESHOLD: z.coerce
    .number()
    .min(0, { message: 'RECAPTCHA_SCORE_THRESHOLD must be at least 0' })
    .max(1, { message: 'RECAPTCHA_SCORE_THRESHOLD must be at most 1' })
    .default(0.5),
  RAGPI_BASE_URL: z.string({
    required_error: 'RAGPI_BASE_URL is required',
  }),
  RAGPI_API_KEY: z.string().optional(),
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((str) => {
      if (!str) return undefined;
      return str.split(',').filter(Boolean);
    }),
});

function validateConfig() {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Invalid configuration:\n${issues}`);
    }
    throw error;
  }
}

export const config = validateConfig();
