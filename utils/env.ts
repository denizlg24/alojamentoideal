import { z } from "zod";

const envSchema = z.object({
    BASE_URL: z.string().url(),
    HOSTIFY_API_KEY: z.string().nonempty(),
});

export default envSchema.parse(process.env);