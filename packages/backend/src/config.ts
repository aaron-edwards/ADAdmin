import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  SATISFACTORY_API_TOKEN: z
    .string()
    .optional()
    .transform((token) => token || undefined),
  IDLE_SHUTDOWN_MINUTES: z.coerce.number().nonnegative().default(2),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error(`Invalid configuration:\n${z.prettifyError(result.error)}`);
  process.exit(1);
}

export const config = {
  server: {
    host: result.data.HOST,
    port: result.data.PORT,
  },
  satisfactory: {
    apiToken: result.data.SATISFACTORY_API_TOKEN,
    idleShutdownMinutes: result.data.IDLE_SHUTDOWN_MINUTES,
  },
} as const;
