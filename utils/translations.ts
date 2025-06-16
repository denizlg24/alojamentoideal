import { TranslationResponse } from "@/schemas/translation.schema";

export async function getTranslatedSummary(
    listingTranslations: TranslationResponse,
    locale: string
): Promise<string[] | null> {
    if (!listingTranslations?.translation) return null;

    const availableTranslations = listingTranslations.translation;

    const target = availableTranslations.find((t) => t.language === locale);
    if (target?.summary) {
        return target.summary.split("\n");
    }

    const fallback = availableTranslations.find((t) => t.summary);
    if (!fallback?.summary || !fallback.language) return null;

    if (fallback.language === locale) {
        return fallback.summary.split("\n");
    }

    const translated = await translateText(fallback.summary, fallback.language, locale);
    return translated.split("\n");
}

async function translateText(text: string, from: string, to: string): Promise<string> {
    const res = await fetch("https://libretranslate.de/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            q: text,
            source: from,
            target: to,
            format: "text",
        }),
    });

    const data = await res.json();
    return data.translatedText;
}