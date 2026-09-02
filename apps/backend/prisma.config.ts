import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile?.();
} catch {
  // Ignored in environments where environment variables are injected via platform environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

