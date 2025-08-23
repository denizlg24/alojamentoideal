"use server"

import { readFileSync } from "fs";

export async function getHtml(url: string, replace: Record<string, string>[]) {
    let html = readFileSync(url, "utf8");
    for (const map of replace) {
        for (const [key, value] of Object.entries(map)) {
            const regex = new RegExp(key, "g");
            html = html.replace(regex, value);
        }
    }

    return html;
}