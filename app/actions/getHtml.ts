"use server"

import env from "@/utils/env";

export async function getHtml(url: string, replace: Record<string, string>[]) {
    const res = await fetch(`${env.SITE_URL || ""}/${url}`);
    if (!res.ok) {
        throw new Error(`Failed to load HTML template: ${url}`);
    }

    let html = await res.text();
    for (const map of replace) {
        for (const [key, value] of Object.entries(map)) {
            const regex = new RegExp(key, "g");
            html = html.replace(regex, value);
        }
    }

    return html;
}