import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const env = {
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret',
  DATABASE_URL: process.env.DATABASE_URL,
  SSL_REQUIRED:
    process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production',
};
