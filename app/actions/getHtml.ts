"use server"

import { readFileSync } from "fs";
import path from "path";

export async function getHtml(url: string, replace: Record<string, string>[]) {
    const htmlPath = path.join(
        process.cwd(),
        url
    );
    let html = readFileSync(htmlPath, "utf8");
    for (const map of replace) {
        for (const [key, value] of Object.entries(map)) {
            const regex = new RegExp(key, "g");
            html = html.replace(regex, value);
        }
    }

    return html;
}