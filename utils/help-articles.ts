import amar from "@/public/amar-outside.webp";
import { StaticImageData } from "next/image";
import regras from "@/public/regras-espelho.webp"
type HelpArticle = {
    id: number;
    title: string;
    preview: string;
    photo: StaticImageData;
    tags: string[];
};

export const helpArticlesEn: HelpArticle[] = [
    {
        id: 1,
        title: "How to make a reservation",
        preview: "To book an apartment with Alojamento Ideal, start by visiting our apartments page",
        photo: amar,
        tags: ["booking", "reservation", "apartments"]
    },
    {
        id: 2,
        title: "Check-in and check-out times",
        preview: "Check-in is typically available from 3:00 PM, and check-out should be completed by 11:00 AM",
        photo: regras,
        tags: ["check-in", "check-out", "arrival"]
    },
    // ...more
];

export const helpArticlesPt: HelpArticle[] = [
    {
        id: 1,
        title: "Como fazer uma reserva",
        preview: "Para reservar um apartamento no Alojamento Ideal, comece por visitar a nossa página de apartamentos",
        photo: amar,
        tags: ["reserva", "apartamento", "booking"]
    },
    {
        id: 2,
        title: "Horários de check-in e check-out",
        preview: "O check-in está normalmente disponível a partir das 15:00, e o check-out deve ser concluído até às 11:00",
        tags: ["check-in", "check-out", "chegada"],
        photo: regras,
    }
];

export const helpArticlesEs: HelpArticle[] = [
    {
        id: 1,
        title: "Cómo hacer una reserva",
        preview: "Para reservar un apartamento en Alojamento Ideal, comience por visitar nuestra página de apartamentos",
        tags: ["reserva", "apartamento", "booking"],
        photo: amar,
    },
    {
        id: 2,
        title: "Horarios de check-in y check-out",
        preview: "El check-in suele estar disponible a partir de las 15:00, y el check-out debe completarse antes de las 11:00",
        tags: ["check-in", "check-out", "llegada"],
        photo: regras,

    }
];

export function getArticlesByLocale(locale: string) {
    switch (locale) {
        case "pt":
            return helpArticlesPt;
        case "es":
            return helpArticlesEs;
        case "en":
        default:
            return helpArticlesEn;
    }
}


export function searchArticles(query: string, locale: string): HelpArticle[] {
    const helpArticles = getArticlesByLocale(locale);
    if (!query.trim()) return helpArticles;

    const q = query.toLowerCase();

    const scored = helpArticles
        .map((a) => {
            let score = 0;

            if (a.title.toLowerCase().includes(q)) score += 5;

            if (a.tags.some((t) => t.toLowerCase().includes(q))) score += 3;

            if (a.preview.toLowerCase().includes(q)) score += 1;

            return { ...a, score };
        })

        .filter((a) => a.score > 0)
        .sort((a, b) => b.score - a.score);

    return scored;
}