"use server";
import { connectDB } from "@/lib/mongodb";
import HostkitApiKeyModel from "@/models/HostkitApiKey";

export async function callHostkitAPI<T = unknown>({
    listingId,
    endpoint,
    query = {},
}: {
    listingId: string;
    endpoint: string;
    query?: Record<string, string | number>;
}): Promise<T> {
    await connectDB();

    const apiKeyDoc = await HostkitApiKeyModel.findOne({ listingId }).lean();
    if (!apiKeyDoc) {
        throw new Error(`No API key found for listing ${listingId}`);
    }

    const apiKey = apiKeyDoc.hostkitApiKey;

    const baseUrl = "https://app.hostkit.pt/api";
    const params = new URLSearchParams({
        APIKEY: apiKey,
        ...Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)])),
    });
    const url = `${baseUrl}/${endpoint}?${params.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Hostkit API error ${response.status}: ${text}`);
    }

    return (await response.json()) as T;
}