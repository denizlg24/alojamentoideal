import { z } from "zod";

const envSchema = z.object({
    BASE_URL: z.string().nonempty(),
    HOSTIFY_API_KEY: z.string().nonempty(),
    STRIPE_SECRET_KEY: z.string().nonempty(),
    MONGODB_KEY: z.string().nonempty(),
    SITE_URL: z.string().nonempty(),
    SESSION_SECRET: z.string().nonempty(),
    STRIPE_WEBHOOK_SECRET: z.string().nonempty(),
    WEBMAIL_PASS: z.string().nonempty(),
    AUTH_SECRET: z.string().nonempty(),
    AUTH_URL: z.string().nonempty(),
    CRON_SECRET: z.string().nonempty(),
    BOKUN_ACCESS_KEY_PROD: z.string().nonempty(),
    BOKUN_SECRET_KEY_PROD: z.string().nonempty(),
    BOKUN_ACCESS_KEY: z.string().nonempty(),
    BOKUN_SECRET_KEY: z.string().nonempty(),
    DETOURS_STRIPE_ID: z.string().nonempty(),
    DETOURS_STRIPE_ID_PROD: z.string().nonempty(),
    BOKUN_PREFIX: z.string().nonempty(),
    BOKUN_PREFIX_PROD: z.string().nonempty(),
    BOKUN_ENVIRONMENT: z.string().nonempty(),
    DETOURS_CONTACTS: z.string().nonempty(),
    STRIPE_PROD_WEBHOOK_SECRET: z.string().nonempty(),
    STRIPE_PROD_SECRET: z.string().nonempty(),
});

export default envSchema.parse(process.env);