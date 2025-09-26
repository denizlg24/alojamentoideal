import amar from "@/public/amar-outside.webp";
import { StaticImageData } from "next/image";
import regras from "@/public/regras-espelho.webp"
import checkout from "@/public/home-bg.jpg"
import activity from "@/public/povoa-view.jpg"
import guestdata from "@/public/regras-livro.webp"

interface TextContent {
    type: "text",
    text: string,
}

interface UrlContent {
    type: "url",
    text: string,
    href: string
}

type Content = TextContent | UrlContent

export interface ArticleList {
    type: "list";
    items: { content: Content }[]
    style: "disc" | "number",
}

export interface WithImage {
    type: "with-img";
    items: { content: Content }[],
    img: StaticImageData
}

type HelpArticle = {
    id: number;
    title: string;
    slug: string;
    preview: string;
    photo: StaticImageData;
    content?: (ArticleList | WithImage | Content)[]
    tags: string[];
};

export const helpArticlesEn: HelpArticle[] = [
    {
        id: 1,
        title: "How to make a reservation",
        slug: "how-to-make-a-reservation",
        preview:
          "To book an apartment with Alojamento Ideal, start by visiting our apartments page",
        photo: amar,
        tags: ["booking", "reservation", "apartments"],
        content: [
          {
            type: "text",
            text: "Booking your stay with Alojamento Ideal is quick and convenient. Our platform allows you to browse available apartments, compare options, and confirm your reservation in just a few minutes.",
          },
          {
            type: "text",
            text: "To begin, navigate to the Apartments section where you will find a complete list of properties. Each listing includes photos, descriptions, amenities, and pricing details to help you make the right choice.",
          },
          {
            type: "list",
            style: "number",
            items: [
              { content: { type: "text", text: "Select the apartment that matches your preferences." } },
              { content: { type: "text", text: "Choose your check-in and check-out dates." } },
              { content: { type: "text", text: "Review the price breakdown, including any applicable fees." } },
              { content: { type: "text", text: "Click 'Reserve Now' to proceed with the booking." } },
            ],
          },
          {
            type: "text",
            text: "Once you confirm your choice, you’ll be redirected to a secure checkout page where you can provide guest details and payment information. A confirmation email will be sent immediately after the booking is finalized.",
          },
        ],
      },
      {
        id: 2,
        title: "Check-in and check-out times",
        slug: "check-in-check-out-times",
        preview:
          "Check-in is typically available from 3:00 PM, and check-out should be completed by 11:00 AM",
        photo: regras,
        tags: ["check-in", "check-out", "arrival"],
        content: [
          {
            type: "text",
            text: "To ensure a smooth experience for all our guests, Alojamento Ideal follows standard check-in and check-out procedures. These times are set to give our staff sufficient time to prepare each apartment properly between stays.",
          },
          {
            type: "list",
            style: "disc",
            items: [
              { content: { type: "text", text: "Check-in starts at 3:00 PM. Guests are welcome to arrive any time after this." } },
              { content: { type: "text", text: "Check-out must be completed by 11:00 AM on the day of departure." } },
            ],
          },
          {
            type: "text",
            text: "If you would like to check in earlier or leave later, please contact our team in advance. While we cannot always guarantee flexibility, we will do our best to accommodate your request depending on availability.",
          },
          {
            type: "text",
            text: "For late arrivals, we recommend notifying us beforehand so we can make suitable arrangements to welcome you outside regular hours.",
          },
        ],
      },
      {
        id: 3,
        title: "How to book an activity",
        slug: "how-to-book-an-activity",
        preview:
          "Choose your preferred activity, select the date and time, and confirm your reservation in just a few clicks.",
        photo: activity,
        tags: ["booking", "activities", "reservation"],
        content: [
          {
            type: "text",
            text: "In addition to comfortable apartments, Alojamento Ideal offers a range of activities that allow you to explore the local area and culture. From guided tours to hands-on workshops, there is something for every traveler.",
          },
          {
            type: "text",
            text: "Booking an activity is simple. All activities are listed in the Activities section of our website, complete with descriptions, schedules, and prices.",
          },
          {
            type: "list",
            style: "number",
            items: [
              { content: { type: "text", text: "Open the Activities page and browse the list of available experiences." } },
              { content: { type: "text", text: "Click on an activity to read the full description and requirements." } },
              { content: { type: "text", text: "Select your preferred date and time slot." } },
              { content: { type: "text", text: "Confirm the number of participants and click 'Book Now'." } },
            ],
          },
          {
            type: "text",
            text: "After booking, you will receive an email confirmation with all the necessary details. Some activities may ask for extra information, such as dietary preferences or clothing size, so please be ready to provide these if needed.",
          },
        ],
      },
      {
        id: 4,
        title: "How to complete checkout",
        slug: "how-to-complete-checkout",
        preview:
          "Review your booking details, add payment information, and confirm to finalize your stay securely.",
        photo: checkout,
        tags: ["checkout", "payment", "confirmation"],
        content: [
          {
            type: "text",
            text: "The checkout process is the final step to securing your stay with Alojamento Ideal. It has been designed to be safe, clear, and user-friendly.",
          },
          {
            type: "list",
            style: "number",
            items: [
              { content: { type: "text", text: "Carefully review the booking summary, including apartment details, stay dates, and the total cost." } },
              { content: { type: "text", text: "Provide guest data for all travelers as required by local regulations." } },
              { content: { type: "text", text: "Enter your payment details in our secure form. We accept major credit and debit cards." } },
              { content: { type: "text", text: "Click 'Confirm Booking' to finalize the checkout." } },
            ],
          },
          {
            type: "text",
            text: "Once payment is processed, a confirmation email will be sent immediately. This email includes your booking reference, apartment details, and receipt.",
          },
          {
            type: "text",
            text: "If you encounter any issues during checkout, please reach out to our support team for assistance.",
          },
        ],
      },
      {
        id: 5,
        title: "How to provide guest data",
        slug: "how-to-provide-guest-data",
        preview:
          "Enter guest names, contact details, and identification information to complete your reservation process.",
        photo: guestdata,
        tags: ["guest", "data", "information"],
        content: [
          {
            type: "text",
            text: "Providing accurate guest information is an essential part of the booking process. This ensures compliance with local laws and helps us prepare the best possible experience for you.",
          },
          {
            type: "list",
            style: "disc",
            items: [
              { content: { type: "text", text: "Full name of each guest staying at the property." } },
              { content: { type: "text", text: "Contact information, including phone number and email address." } },
              { content: { type: "text", text: "Identification details, such as a passport number or national ID card." } },
              { content: { type: "text", text: "Any additional notes or special requirements, such as accessibility needs." } },
            ],
          },
          {
            type: "text",
            text: "This data allows us to register your stay in line with legal obligations and to tailor your experience. For example, providing dietary information can help us prepare activities or amenities suited to your needs.",
          },
          {
            type: "text",
            text: "All guest data is stored securely and processed in accordance with data protection regulations.",
          },
        ],
      }
];

export const helpArticlesPt: HelpArticle[] = [
    {
        id: 1,
        title: "Como fazer uma reserva",
        slug: 'como-fazer-uma-reserva',
        preview: "Para reservar um apartamento no Alojamento Ideal, comece por visitar a nossa página de apartamentos",
        photo: amar,
        tags: ["reserva", "apartamento", "booking"]
    },
    {
        id: 2,
        title: "Horários de check-in e check-out",
        slug: 'horarios-check-in-check-out',
        preview: "O check-in está normalmente disponível a partir das 15:00, e o check-out deve ser concluído até às 11:00",
        tags: ["check-in", "check-out", "chegada"],
        photo: regras,
    }
];

export const helpArticlesEs: HelpArticle[] = [
    {
        id: 1,
        title: "Cómo hacer una reserva",
        slug: 'como-hacer-uma-reserva',
        preview: "Para reservar un apartamento en Alojamento Ideal, comience por visitar nuestra página de apartamentos",
        tags: ["reserva", "apartamento", "booking"],
        photo: amar,
    },
    {
        id: 2,
        title: "Horarios de check-in y check-out",
        slug: 'horarios-check-in-check-out',
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