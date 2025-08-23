import { z } from "zod";

const envSchema = z.object({
    BASE_URL: z.string().url(),
    HOSTIFY_API_KEY: z.string().nonempty(),
    STRIPE_SECRET_KEY: z.string().nonempty(),
    MONGODB_KEY: z.string().nonempty(),
    SITE_URL: z.string().nonempty(),
    SESSION_SECRET: z.string().nonempty(),
    STRIPE_WEBHOOK_SECRET: z.string().nonempty(),
    WEBMAIL_PASS: z.string().nonempty(),
    AUTH_SECRET: z.string().nonempty()

});

export default envSchema.parse(process.env);