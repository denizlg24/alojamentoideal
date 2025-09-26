import amar from "@/public/amar-outside.webp";
import { StaticImageData } from "next/image";
import regras from "@/public/regras-espelho.webp"
import checkout from "@/public/home-bg.jpg"
import activity from "@/public/povoa-view.jpg"
import guestdata from "@/public/regras-livro.webp"

interface TextContent {
    type:"text",
    text:string,
}

interface UrlContent {
    type:"url",
    text:string,
    href:string
}

type Content = TextContent|UrlContent

export interface ArticleList {
    type:"list";
    items:{content:Content}[]
    style:"disc"|"number",
}

export interface WithImage {
    type:"with-img";
    items:{content:Content}[],
    img:StaticImageData
}

type HelpArticle = {
    id: number;
    title: string;
    slug:string;
    preview: string;
    photo: StaticImageData;
    content?: (ArticleList|WithImage|Content)[] 
    tags: string[];
};

export const helpArticlesEn: HelpArticle[] = [
    {
        id: 1,
        title: "How to make a reservation",
        slug:"how-to-make-a-reservation",
        preview: "To book an apartment with Alojamento Ideal, start by visiting our apartments page",
        photo: amar,
        tags: ["booking", "reservation", "apartments"]
    },
    {
        id: 2,
        title: "Check-in and check-out times",
        slug:'check-in-check-out-times',
        preview: "Check-in is typically available from 3:00 PM, and check-out should be completed by 11:00 AM",
        photo: regras,
        tags: ["check-in", "check-out", "arrival"]
    },
    {
        id: 3,
        title: "How to book an activity",
        slug: "how-to-book-an-activity",
        preview: "Choose your preferred activity, select the date and time, and confirm your reservation in just a few clicks.",
        photo: activity,
        tags: ["booking", "activities", "reservation"]
    },
    {
        id: 4,
        title: "How to complete checkout",
        slug: "how-to-complete-checkout",
        preview: "Review your booking details, add payment information, and confirm to finalize your stay securely.",
        photo: checkout,
        tags: ["checkout", "payment", "confirmation"]
    },
    {
        id: 5,
        title: "How to provide guest data",
        slug: "how-to-provide-guest-data",
        preview: "Enter guest names, contact details, and identification information to complete your reservation process.",
        photo: guestdata,
        tags: ["guest", "data", "information"]
    }
    // ...more
];

export const helpArticlesPt: HelpArticle[] = [
    {
        id: 1,
        title: "Como fazer uma reserva",
        slug:'como-fazer-uma-reserva',
        preview: "Para reservar um apartamento no Alojamento Ideal, comece por visitar a nossa página de apartamentos",
        photo: amar,
        tags: ["reserva", "apartamento", "booking"]
    },
    {
        id: 2,
        title: "Horários de check-in e check-out",
        slug:'horarios-check-in-check-out',
        preview: "O check-in está normalmente disponível a partir das 15:00, e o check-out deve ser concluído até às 11:00",
        tags: ["check-in", "check-out", "chegada"],
        photo: regras,
    }
];

export const helpArticlesEs: HelpArticle[] = [
    {
        id: 1,
        title: "Cómo hacer una reserva",
        slug:'como-hacer-uma-reserva',
        preview: "Para reservar un apartamento en Alojamento Ideal, comience por visitar nuestra página de apartamentos",
        tags: ["reserva", "apartamento", "booking"],
        photo: amar,
    },
    {
        id: 2,
        title: "Horarios de check-in y check-out",
        slug:'horarios-check-in-check-out',
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