import crypto from "crypto";

const BOKUN_BASE_URL = "https://api.bokun.io";

interface BokunRequestOptions {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string; // must start with "/"
    body?: any;
}

/**
 * Bokun API wrapper with typed responses
 */
export async function bokunRequest<T = unknown>({
    method,
    path,
    body,
}: BokunRequestOptions): Promise<{ success: true } & T | { success: false; status: number; message: string; }> {
    const accessKey = process.env.BOKUN_ACCESS_KEY;
    const secretKey = process.env.BOKUN_SECRET_KEY;

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

    return { success: true, ...((await res.json()) as T) };
}

export interface BokunProductResponse {
    baseLanguage: string;
    box: boolean;
    boxedProductId: number;
    boxedSupplierId: number;
    customFields: {
        type: string;
        flags: string[];
        code: string;
        title: string;
        inputFieldId: number;
        value: string;
    }[];
    excerpt: string;
    externalId: string;
    fields: Record<string, any>; // open object with dynamic keys
    flags: string[];
    id: string;
    keyPhoto: {
        id: number;
        originalUrl: string;
        description: string;
        alternateText: string;
        height: number;
        width: number;
        flags: string[];
        derived: {
            name: string;
            url: string;
            cleanUrl: string;
        }[];
        fileName: string;
    };
    keywords: string[];
    languages: string[];
    location: {
        address: string;
        city: string;
        countryCode: string;
        postCode: string;
        latitude: number;
        longitude: number;
        zoomLevel: number;
        origin: string; // e.g. "GOOGLE_PLACES"
        originId: string;
        wholeAddress: string;
    };
    locationCode: {
        coordinates: string;
        country: string;
        date: number;
        function: string;
        iata: string;
        id: number;
        location: string;
        name: string;
        nameWoDiacritics: string;
        recentChange: string;
        remarks: string;
        status: string;
        subdivision: string;
    };
    paymentCurrencies: string[];
    photos: {
        id: number;
        originalUrl: string;
        description: string;
        alternateText: string;
        height: number;
        width: number;
        flags: string[];
        derived: {
            name: string;
            url: string;
            cleanUrl: string;
        }[];
        fileName: string;
    }[];
    places: {
        id: number;
        location: {
            address: string;
            city: string;
            countryCode: string;
            postCode: string;
            latitude: number;
            longitude: number;
            zoomLevel: number;
            origin: string;
            originId: string;
            wholeAddress: string;
        };
        title: string;
    }[];
    price: number;
    productGroupId: number;
    slug: string;
    summary: string;
    title: string;
    vendor: {
        externalId: string;
        flags: string[];
        id: number;
        title: string;
    };
    videos: {
        id: number;
        title: string;
        sourceUrl: string;
        thumbnailUrl: string;
        previewUrl: string;
        html: string;
        providerName: string;
        cleanPreviewUrl: string;
        cleanThumbnailUrl: string;
    }[];
}
export interface ActivityPreviewResponse {
    id: number;
    title: string;
    shortDescription: string;
    minAge: number;
    photos: {
        id: number;
        originalUrl: string;
        url: string;
        caption: string;
    }[];
    duration: { minutes: number, hours: number, days: number, weeks: number };
    location: {
        id: number,
        countryCode: string,
        city: string,
        state: string,
        latitude: number,
        longitude: number
    };
    pricingCategories: { defaultId: number, ids: number[] }
    pricing: {
        experiencePriceRules: {
            id: number;
            rate: {
                id: number;
                externalId: string;
            };
            created: number; // timestamp in ms
            priceCatalogId: number;
            currency: string;
            amount: string; // values come as strings, not numbers
            pricingCategoryId: number;
            tierId: number;
        }[];
        extraPriceRules: any[];
        pickupPriceRules: any[];
        dropoffPriceRules: any[];
        priceCatalogCurrencies: {
            priceCatalogId: number;
            currencies: string[];
            defaultCurrency: string;
        }[];
    };
}
