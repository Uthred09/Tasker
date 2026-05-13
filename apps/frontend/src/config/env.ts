import { z } from "zod";

const envVarsSchema = z.object({
  VITE_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "VITE_CLERK_PUBLISHABLE_KEY is required"),
  VITE_API_URL: z.string().url().default("http://localhost:3000"),
  VITE_ENV: z.enum(["production", "development", "local"]).default("local"),
});

const parseResult = envVarsSchema.safeParse(import.meta.env);

if (!parseResult.success) {
  console.error(
    "❌ Invalid environment variables:",
    parseResult.error.format(),
  );
  throw new Error("Invalid environment variables");
}

const envVars = parseResult.data;

// export individual variables
export const ENV = envVars.VITE_ENV;
export const API_URL = envVars.VITE_API_URL;
export const CLERK_PUBLISHABLE_KEY = envVars.VITE_CLERK_PUBLISHABLE_KEY;
