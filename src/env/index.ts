import { config } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV === "test") {
    config({ path: ".env.test" });
} else {
    config();
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(["production", "stagging", "development", "test"])
        .default("stagging"),
    DATABASE_CLIENT: z.enum(["sqlite"]),
    DATABASE_URL: z.string(),
    PORT: z.coerce.number().default(3001),
    TOKEN_SECRET: z.string(),
    TOKEN_EXPIRATION: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
    console.error("Invalid environment variable!", _env.error.format());
    throw new Error("Invalid environment variable!");
}

export const env = _env.data;
