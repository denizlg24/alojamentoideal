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
          "To book an apartment with Alojamento Ideal, start by visiting our homes page",
        photo: amar,
        tags: ["booking", "reservation", "apartments"],
        content: [
          {
            type: "text",
            text: "Booking your stay with Alojamento Ideal is quick and convenient. Our platform allows you to browse available apartments, compare options, and confirm your reservation in just a few minutes.",
          },
          {
            type: "text",
            text: "To begin, navigate to the Homes section where you will find a complete list of properties. Each listing includes photos, descriptions, amenities, and pricing details to help you make the right choice.",
          },
          {
            type: "list",
            style: "number",
            items: [
              { content: { type: "text", text: "Select the accommodation that matches your preferences." } },
              { content: { type: "text", text: "Choose your check-in and check-out dates, and how many guests." } },
              { content: { type: "text", text: "Press the 'Book Now' to be redirected to a secure checkout page where you can provide guest details and payment information." } },
              { content: { type: "text", text: "Review the price breakdown, including any applicable fees." } },
              { content: { type: "text", text: "Fill in your details, including your travel information to comply with local regulation." } },
              { content: { type: "text", text: "Fill in payment details and securely book the accommodation." } },
            ],
          },
          {
            type: "text",
            text: "Once your payment is processed you'll be redirected to an order page where your reservations will be displayed, along with and order summary, payment and billing information. A confirmation email will be sent immediately after the booking is finalized.",
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
          "Choose your preferred activity, select the date and time from the availability calendar and make sure to correctly select the number of travelers, and confirm your reservation in just a few clicks.",
        photo: activity,
        tags: ["booking", "activities", "reservation"],
        content: [
          {
            type: "text",
            text: "In addition to comfortable apartments, Alojamento Ideal offers a range of activities in partnership with detours.pt, that allow you to explore the local area and culture. From guided tours to hands-on workshops, there is something for every traveler.",
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
              { content: { type: "text", text: "Select your preferred date and time slot from the availability calendar." } },
              { content: { type: "text", text: "Confirm the number of participants and click 'Book Now'." } },
              { content: { type: "text", text: "After being redirected to a secure checkout page, you should fill in your contact and billing details and answer all the questions required before payment. These questions may vary from activity to activity." } },
            ],
          },
          {
            type: "text",
            text: "After booking, you will receive an email confirmation with all the necessary details, including tickets. Some activities may ask for extra information, after payment, such as dietary preferences or clothing size, so please be ready to provide these if needed.",
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
            text: "We also provide the ability to book multiple activities and accommodations at once.",
          },
          {
            type: "text",
            text: "The checkout process is the final step to securing your stay with Alojamento Ideal. It has been designed to be safe, clear, and user-friendly.",
          },
          {
            type: "list",
            style: "number",
            items: [
              { content: { type: "text", text: "Carefully review the booking summary, including apartment details, stay dates, eventual activities and the total cost." } },
              { content: { type: "text", text: "Provide guest data for all travelers as required by local regulations as well as fill in the mandatory booking questions for eventual activities." } },
              { content: { type: "text", text: "Enter your payment details in our secure form. We accept major credit and debit cards." } },
              { content: { type: "text", text: "Click 'Pay ___€' to finalize the checkout." } },
            ],
          },
          {
            type: "text",
            text: "Once payment is processed, a confirmation email will be sent immediately. This email includes your order summary and eventual activity tickets. Separate emails will be sent per reservation with their respective invoices.",
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
              { content: { type: "text", text: "Birthdate and residence information." } },
              { content: { type: "text", text: "Identification details, such as a passport number or national ID card." } },
              { content: { type: "text", text: "Any additional notes or special requirements, such as accessibility needs for experiences." } },
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
    slug: "como-fazer-uma-reserva",
    preview:
      "Para reservar um apartamento com a Alojamento Ideal, comece por visitar a nossa página de casas",
    photo: amar,
    tags: ["reserva", "apartamentos", "alojamento"],
    content: [
      {
        type: "text",
        text: "Reservar a sua estadia com a Alojamento Ideal é rápido e conveniente. A nossa plataforma permite-lhe explorar os apartamentos disponíveis, comparar opções e confirmar a sua reserva em apenas alguns minutos.",
      },
      {
        type: "text",
        text: "Para começar, navegue até à secção Casas, onde encontrará uma lista completa de propriedades. Cada anúncio inclui fotografias, descrições, comodidades e detalhes de preços para o ajudar a escolher a opção certa.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Selecione o alojamento que corresponde às suas preferências." } },
          { content: { type: "text", text: "Escolha as datas de check-in e check-out, bem como o número de hóspedes." } },
          { content: { type: "text", text: "Carregue em 'Reservar Agora' para ser redirecionado para uma página de pagamento seguro, onde poderá introduzir os dados dos hóspedes e as informações de pagamento." } },
          { content: { type: "text", text: "Revise o detalhe de preços, incluindo eventuais taxas aplicáveis." } },
          { content: { type: "text", text: "Preencha os seus dados, incluindo informações de viagem, de acordo com a legislação local." } },
          { content: { type: "text", text: "Introduza os dados de pagamento e reserve o alojamento de forma segura." } },
        ],
      },
      {
        type: "text",
        text: "Assim que o pagamento for processado, será redirecionado para uma página de encomenda onde as suas reservas serão exibidas, juntamente com o resumo da encomenda, informações de pagamento e faturação. Um e-mail de confirmação será enviado imediatamente após a finalização da reserva.",
      },
    ],
  },
  {
    id: 2,
    title: "Horários de check-in e check-out",
    slug: "horarios-check-in-check-out",
    preview:
      "O check-in está geralmente disponível a partir das 15h00 e o check-out deve ser concluído até às 11h00",
    photo: regras,
    tags: ["check-in", "check-out", "chegada"],
    content: [
      {
        type: "text",
        text: "Para garantir uma experiência tranquila para todos os nossos hóspedes, a Alojamento Ideal segue horários padrão de check-in e check-out. Estes horários permitem que a nossa equipa prepare adequadamente cada apartamento entre estadias.",
      },
      {
        type: "list",
        style: "disc",
        items: [
          { content: { type: "text", text: "O check-in começa às 15h00. Os hóspedes podem chegar a partir desta hora." } },
          { content: { type: "text", text: "O check-out deve ser concluído até às 11h00 do dia da partida." } },
        ],
      },
      {
        type: "text",
        text: "Se pretender efetuar o check-in mais cedo ou sair mais tarde, contacte a nossa equipa com antecedência. Embora não possamos garantir sempre flexibilidade, faremos o possível para atender ao seu pedido, dependendo da disponibilidade.",
      },
      {
        type: "text",
        text: "Para chegadas tardias, recomendamos avisar-nos previamente para que possamos organizar a sua receção fora do horário habitual.",
      },
    ],
  },
  {
    id: 3,
    title: "Como reservar uma atividade",
    slug: "como-reservar-uma-atividade",
    preview:
      "Escolha a sua atividade preferida, selecione a data e hora no calendário de disponibilidade, indique corretamente o número de participantes e confirme a sua reserva em apenas alguns cliques.",
    photo: activity,
    tags: ["reserva", "atividades", "experiências"],
    content: [
      {
        type: "text",
        text: "Para além de apartamentos confortáveis, a Alojamento Ideal oferece uma variedade de atividades em parceria com a detours.pt, que lhe permitem explorar a região e a cultura local. Desde visitas guiadas a workshops práticos, há opções para todos os viajantes.",
      },
      {
        type: "text",
        text: "Reservar uma atividade é simples. Todas as atividades estão listadas na secção Atividades do nosso site, com descrições, horários e preços.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Abra a página Atividades e explore a lista de experiências disponíveis." } },
          { content: { type: "text", text: "Clique numa atividade para ler a descrição completa e os requisitos." } },
          { content: { type: "text", text: "Selecione a data e hora pretendidas no calendário de disponibilidade." } },
          { content: { type: "text", text: "Confirme o número de participantes e clique em 'Reservar Agora'." } },
          { content: { type: "text", text: "Após ser redirecionado para uma página de pagamento seguro, preencha os seus dados de contacto e faturação, bem como as perguntas obrigatórias antes do pagamento. Estas podem variar conforme a atividade." } },
        ],
      },
      {
        type: "text",
        text: "Após a reserva, receberá um e-mail de confirmação com todos os detalhes necessários, incluindo bilhetes. Algumas atividades poderão solicitar informações adicionais após o pagamento, como preferências alimentares ou tamanho de roupa, por isso esteja preparado para fornecer estes dados, se necessário.",
      },
    ],
  },
  {
    id: 4,
    title: "Como concluir o checkout",
    slug: "como-concluir-checkout",
    preview:
      "Revise os detalhes da sua reserva, adicione as informações de pagamento e confirme para finalizar a sua estadia em segurança.",
    photo: checkout,
    tags: ["checkout", "pagamento", "confirmação"],
    content: [
      {
        type: "text",
        text: "Também é possível reservar várias atividades e alojamentos ao mesmo tempo.",
      },
      {
        type: "text",
        text: "O processo de checkout é a etapa final para garantir a sua estadia com a Alojamento Ideal. Foi concebido para ser seguro, claro e fácil de usar.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Revise cuidadosamente o resumo da reserva, incluindo detalhes do apartamento, datas da estadia, eventuais atividades e o custo total." } },
          { content: { type: "text", text: "Forneça os dados dos hóspedes exigidos pela legislação local, bem como responda às perguntas obrigatórias da reserva de atividades, se aplicável." } },
          { content: { type: "text", text: "Introduza os dados de pagamento no nosso formulário seguro. Aceitamos os principais cartões de crédito e débito." } },
          { content: { type: "text", text: "Clique em 'Pagar ___€' para finalizar o checkout." } },
        ],
      },
      {
        type: "text",
        text: "Assim que o pagamento for processado, receberá imediatamente um e-mail de confirmação. Este e-mail inclui o resumo da sua encomenda e eventuais bilhetes de atividades. Serão enviados e-mails separados por reserva com as respetivas faturas.",
      },
      {
        type: "text",
        text: "Se encontrar algum problema durante o checkout, entre em contacto com a nossa equipa de apoio.",
      },
    ],
  },
  {
    id: 5,
    title: "Como fornecer os dados dos hóspedes",
    slug: "como-fornecer-dados-hospedes",
    preview:
      "Introduza os nomes dos hóspedes, contactos e informações de identificação para concluir o processo de reserva.",
    photo: guestdata,
    tags: ["hóspede", "dados", "informações"],
    content: [
      {
        type: "text",
        text: "Fornecer informações corretas sobre os hóspedes é uma parte essencial do processo de reserva. Isto garante o cumprimento da legislação local e ajuda-nos a preparar a melhor experiência possível para si.",
      },
      {
        type: "list",
        style: "disc",
        items: [
          { content: { type: "text", text: "Nome completo de cada hóspede que ficará alojado na propriedade." } },
          { content: { type: "text", text: "Data de nascimento e informação de residência." } },
          { content: { type: "text", text: "Dados de identificação, como número de passaporte ou cartão de cidadão." } },
          { content: { type: "text", text: "Notas adicionais ou requisitos especiais, como necessidades de acessibilidade para determinadas experiências." } },
        ],
      },
      {
        type: "text",
        text: "Estes dados permitem-nos registar a sua estadia em conformidade com as obrigações legais e adaptar a sua experiência. Por exemplo, fornecer informação sobre restrições alimentares pode ajudar-nos a preparar atividades ou serviços adequados às suas necessidades.",
      },
      {
        type: "text",
        text: "Todos os dados dos hóspedes são armazenados de forma segura e processados de acordo com a legislação de proteção de dados.",
      },
    ],
  },
];


export const helpArticlesEs: HelpArticle[] = [
  {
    id: 1,
    title: "Cómo hacer una reserva",
    slug: "como-hacer-una-reserva",
    preview:
      "Para reservar un apartamento con Alojamiento Ideal, comience visitando nuestra página de casas",
    photo: amar,
    tags: ["reserva", "apartamentos", "alojamiento"],
    content: [
      {
        type: "text",
        text: "Reservar su estancia con Alojamiento Ideal es rápido y cómodo. Nuestra plataforma le permite explorar los apartamentos disponibles, comparar opciones y confirmar su reserva en solo unos minutos.",
      },
      {
        type: "text",
        text: "Para comenzar, vaya a la sección Casas donde encontrará una lista completa de propiedades. Cada anuncio incluye fotos, descripciones, servicios y detalles de precios para ayudarle a tomar la mejor decisión.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Seleccione el alojamiento que se ajuste a sus preferencias." } },
          { content: { type: "text", text: "Elija las fechas de check-in y check-out, y el número de huéspedes." } },
          { content: { type: "text", text: "Pulse en 'Reservar ahora' para ser redirigido a una página de pago seguro donde podrá introducir los datos de los huéspedes y la información de pago." } },
          { content: { type: "text", text: "Revise el desglose del precio, incluidas las posibles tasas aplicables." } },
          { content: { type: "text", text: "Complete sus datos, incluida la información de viaje para cumplir con la normativa local." } },
          { content: { type: "text", text: "Introduzca los datos de pago y reserve el alojamiento de forma segura." } },
        ],
      },
      {
        type: "text",
        text: "Una vez procesado el pago, será redirigido a una página de pedido donde se mostrarán sus reservas junto con el resumen, la información de pago y de facturación. Se enviará un correo electrónico de confirmación inmediatamente después de finalizar la reserva.",
      },
    ],
  },
  {
    id: 2,
    title: "Horarios de check-in y check-out",
    slug: "horarios-check-in-check-out",
    preview:
      "El check-in está normalmente disponible a partir de las 15:00, y el check-out debe completarse antes de las 11:00",
    photo: regras,
    tags: ["check-in", "check-out", "llegada"],
    content: [
      {
        type: "text",
        text: "Para garantizar una experiencia fluida a todos nuestros huéspedes, Alojamiento Ideal sigue horarios estándar de check-in y check-out. Estos horarios permiten a nuestro personal preparar adecuadamente cada apartamento entre estancias.",
      },
      {
        type: "list",
        style: "disc",
        items: [
          { content: { type: "text", text: "El check-in comienza a las 15:00. Los huéspedes pueden llegar en cualquier momento después de esa hora." } },
          { content: { type: "text", text: "El check-out debe completarse antes de las 11:00 del día de salida." } },
        ],
      },
      {
        type: "text",
        text: "Si desea hacer el check-in antes o salir más tarde, póngase en contacto con nuestro equipo con antelación. Aunque no siempre podemos garantizar flexibilidad, haremos lo posible por atender su solicitud según la disponibilidad.",
      },
      {
        type: "text",
        text: "Para llegadas tardías, le recomendamos avisarnos con antelación para poder organizar su recepción fuera del horario habitual.",
      },
    ],
  },
  {
    id: 3,
    title: "Cómo reservar una actividad",
    slug: "como-reservar-una-actividad",
    preview:
      "Elija su actividad preferida, seleccione la fecha y hora en el calendario de disponibilidad, indique correctamente el número de participantes y confirme su reserva en solo unos clics.",
    photo: activity,
    tags: ["reserva", "actividades", "experiencias"],
    content: [
      {
        type: "text",
        text: "Además de apartamentos cómodos, Alojamiento Ideal ofrece una variedad de actividades en colaboración con detours.pt, que le permiten descubrir la zona y la cultura local. Desde visitas guiadas hasta talleres prácticos, hay opciones para todos los viajeros.",
      },
      {
        type: "text",
        text: "Reservar una actividad es muy sencillo. Todas las actividades están disponibles en la sección Actividades de nuestra web, con descripciones, horarios y precios.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Abra la página Actividades y explore la lista de experiencias disponibles." } },
          { content: { type: "text", text: "Haga clic en una actividad para leer la descripción completa y los requisitos." } },
          { content: { type: "text", text: "Seleccione la fecha y hora preferidas en el calendario de disponibilidad." } },
          { content: { type: "text", text: "Confirme el número de participantes y pulse en 'Reservar ahora'." } },
          { content: { type: "text", text: "Tras ser redirigido a una página de pago seguro, complete sus datos de contacto y facturación y responda a las preguntas requeridas antes del pago. Estas pueden variar según la actividad." } },
        ],
      },
      {
        type: "text",
        text: "Después de reservar, recibirá un correo electrónico de confirmación con todos los detalles, incluidos los billetes. Algunas actividades pueden solicitar información adicional tras el pago, como preferencias alimenticias o talla de ropa, por lo que debe estar preparado para proporcionarla si es necesario.",
      },
    ],
  },
  {
    id: 4,
    title: "Cómo completar el checkout",
    slug: "como-completar-checkout",
    preview:
      "Revise los detalles de su reserva, introduzca la información de pago y confirme para finalizar su estancia de forma segura.",
    photo: checkout,
    tags: ["checkout", "pago", "confirmación"],
    content: [
      {
        type: "text",
        text: "También ofrecemos la posibilidad de reservar varias actividades y alojamientos al mismo tiempo.",
      },
      {
        type: "text",
        text: "El proceso de checkout es el paso final para asegurar su estancia con Alojamiento Ideal. Está diseñado para ser seguro, claro y fácil de usar.",
      },
      {
        type: "list",
        style: "number",
        items: [
          { content: { type: "text", text: "Revise cuidadosamente el resumen de la reserva, incluyendo los detalles del apartamento, las fechas de la estancia, posibles actividades y el coste total." } },
          { content: { type: "text", text: "Proporcione los datos de los huéspedes requeridos por la normativa local, así como complete las preguntas obligatorias para las actividades, en caso de que las haya." } },
          { content: { type: "text", text: "Introduzca los datos de pago en nuestro formulario seguro. Aceptamos las principales tarjetas de crédito y débito." } },
          { content: { type: "text", text: "Pulse 'Pagar ___€' para finalizar el checkout." } },
        ],
      },
      {
        type: "text",
        text: "Una vez procesado el pago, recibirá un correo electrónico de confirmación de inmediato. Este correo incluye el resumen de su pedido y, en su caso, las entradas de actividades. Se enviarán correos electrónicos separados por reserva con sus respectivas facturas.",
      },
      {
        type: "text",
        text: "Si tiene algún problema durante el checkout, póngase en contacto con nuestro equipo de soporte.",
      },
    ],
  },
  {
    id: 5,
    title: "Cómo proporcionar los datos de los huéspedes",
    slug: "como-proporcionar-datos-huespedes",
    preview:
      "Introduzca los nombres de los huéspedes, datos de contacto e información de identificación para completar el proceso de reserva.",
    photo: guestdata,
    tags: ["huésped", "datos", "información"],
    content: [
      {
        type: "text",
        text: "Proporcionar información precisa de los huéspedes es una parte esencial del proceso de reserva. Esto garantiza el cumplimiento de la normativa local y nos ayuda a preparar la mejor experiencia posible para usted.",
      },
      {
        type: "list",
        style: "disc",
        items: [
          { content: { type: "text", text: "Nombre completo de cada huésped que se alojará en la propiedad." } },
          { content: { type: "text", text: "Fecha de nacimiento e información de residencia." } },
          { content: { type: "text", text: "Datos de identificación, como número de pasaporte o documento nacional de identidad." } },
          { content: { type: "text", text: "Notas adicionales o requisitos especiales, como necesidades de accesibilidad para ciertas experiencias." } },
        ],
      },
      {
        type: "text",
        text: "Estos datos nos permiten registrar su estancia de acuerdo con las obligaciones legales y personalizar su experiencia. Por ejemplo, indicar información sobre alimentación puede ayudarnos a preparar actividades o servicios adecuados a sus necesidades.",
      },
      {
        type: "text",
        text: "Todos los datos de los huéspedes se almacenan de forma segura y se procesan conforme a la normativa de protección de datos.",
      },
    ],
  },
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