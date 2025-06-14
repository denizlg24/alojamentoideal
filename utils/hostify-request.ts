'use server';

import env from "./env";

const BASE_URL = env.BASE_URL;

const HOSTIFY_API_KEY = env.HOSTIFY_API_KEY;

type Filter = {
    field: string;
    operator: string;
    value: string | number;
};

export async function hostifyRequest<T = unknown>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" = "GET",
    params?: { key: string, value: unknown }[],
    body?: object,
    filters?: Filter[],
    options: { includeRelated?: 1 | 0; page?: number; perPage?: number } = {}
): Promise<T> {
    const url = new URL(BASE_URL + endpoint);
    if (filters?.length) {
        url.searchParams.set("filters", JSON.stringify(filters));
    }
    if (params?.length) {
        for (const p of params) {
            url.searchParams.set(p.key, JSON.stringify(p.value));
        }
    }
    if (options.includeRelated) url.searchParams.set("include_related_objects", "1");
    if (options.page) url.searchParams.set("page", options.page.toString());
    if (options.perPage) url.searchParams.set("per_page", options.perPage.toString());





    const res = await fetch(url.toString(), {
        method,
        headers: {
            "x-api-key": HOSTIFY_API_KEY,
            "Content-Type": "application/json",
        },
        body: method !== "GET" && body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!json.success) {
        console.log(json.error || "Unknown Hostify API error");
    }

    const { ...data } = json;
    return data as T;
}