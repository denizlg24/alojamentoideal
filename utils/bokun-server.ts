import crypto from "crypto";
import env from "./env";

const BOKUN_BASE_URL = "https://api.bokun.io";
//const BOKUN_BASE_URL = "https://api.bokuntest.com";
interface BokunRequestOptions {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string; // must start with "/"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
}

export async function bokunRequest<T = unknown>({
    method,
    path,
    body,
}: BokunRequestOptions): Promise<{ success: true } & T | { success: false; status: number; message: string; }> {
    const accessKey = env.BOKUN_ENVIRONMENT == 'ENV' ? env.BOKUN_ACCESS_KEY : env.BOKUN_ACCESS_KEY_PROD ;
    const secretKey =  env.BOKUN_ENVIRONMENT == 'ENV' ? env.BOKUN_SECRET_KEY : env.BOKUN_SECRET_KEY_PROD ;

    if (!accessKey || !secretKey) {
        throw new Error("Missing BOKUN_ACCESS_KEY or BOKUN_SECRET_KEY in env");
    }

    // 1. Format UTC date as "yyyy-MM-dd HH:mm:ss"
    const date = new Date()
        .toISOString()
        .replace("T", " ")
        .replace(/\..+/, "");

    // 2. Build signature string
    const signatureString = `${date}${accessKey}${method}${path}`;

    // 3. Create HMAC-SHA1 signature (Base64 encoded)
    const signature = crypto
        .createHmac("sha1", secretKey)
        .update(signatureString, "utf8")
        .digest("base64");

    // 4. Prepare headers
    const headers: Record<string, string> = {
        "X-Bokun-Date": date,
        "X-Bokun-AccessKey": accessKey,
        "X-Bokun-Signature": signature,
    };

    if (method !== "GET") {
        headers["Content-Type"] = "application/json;charset=UTF-8";
    }

    // 5. Make the request
    const res = await fetch(`${BOKUN_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        return { success: false, status: res.status, message: await res.text() };
    }

    const contentType = res.headers.get("content-type");

    if (contentType?.includes("application/pdf")) {
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: true, data: base64 } as any;
    }
    try {
        //const clone = res.clone();
        const json = ((await res.json()) as T);
        return { success: true, ...json };
    } catch (error) {
        console.log(error);
        return { success: false, message: 'Error parsing', status: 403 }
    }


}
