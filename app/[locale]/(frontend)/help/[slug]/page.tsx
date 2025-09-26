import { Link } from "@/i18n/navigation";
import { getArticlesByLocale } from "@/utils/help-articles";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { use } from "react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("contact.title"),
    description: t("contact.description"),
    keywords: t("contact.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("contact.title"),
      description: t("contact.description"),
      url: "https://alojamentoideal.pt/help",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("contact.title"),
      description: t("contact.description"),
    },
  };
}

export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale, slug } = use<{ locale: string; slug: string }>(params);
  setRequestLocale(locale);
  const foundArticle = getArticlesByLocale(locale).find(
    (article) => article.slug == slug
  );
  if (!foundArticle) {
    notFound();
  }
  const t = useTranslations("contact");

  return (
    <main className="flex flex-col items-stretch w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <article className="md:prose prose-sm w-full! max-w-5xl! mx-auto! flex flex-col px-4">
            <Image src={foundArticle.photo} alt={foundArticle.preview} className="w-full max-h-[250px] object-cover shadow rounded"/>
            <h1>{foundArticle.title}</h1>
            {foundArticle.content?.map((content,indx) => {
                switch (content.type){
                    case "list":
                        if(content.style == "disc"){
                            return <ul key={`list-${indx}`}>
                                {content.items.map((item,_indx) => {
                                    switch (item.content.type){
                                        case "text":
                                            return <li key={`list-${indx}-${_indx}`}>{item.content.text}</li>
                                        case "url":
                                            return <li key={`list-${indx}-${_indx}`}><Link href={item.content.href}>{item.content.text}</Link></li>
                                    }
                                })}
                            </ul>
                        }
                        return <ul key={`list-${indx}`} className="list-decimal!">
                                {content.items.map((item,_indx) => {
                                    switch (item.content.type){
                                        case "text":
                                            return <li key={`list-${indx}-${_indx}`} >{item.content.text}</li>
                                        case "url":
                                            return <li key={`list-${indx}-${_indx}`}><Link href={item.content.href}>{item.content.text}</Link></li>
                                    }
                                })}
                            </ul>
                    case "with-img":
                        return <div key={`with-img-${indx}`} className="w-full grid sm:grid-cols-3 grid-cols-1">
                            <div className="col-span-2">
                                {content.items.map((item,_indx) => {
                                    switch (item.content.type){
                                        case "text":
                                            return <p key={`with-img-${indx}-${_indx}`}>{item.content.text}</p>
                                        case "url":
                                            return <Link key={`with-img-${indx}-${_indx}`} href={item.content.href}>{item.content.text}</Link>
                                    }
                                })}
                            </div>
                            <div className="col-span-1 sm:max-h-[300px] max-h-[200px]">
                                <Image  src={content.img} alt={foundArticle.preview} className="w-full object-cover rounded shadow"/>
                            </div>
                        </div>
                    case "text":
                        return <p key={`text-${indx}`}>{content.text}</p>
                    case "url":
                        return <Link key={`url-${indx}`} href={content.href}>{content.text}</Link>
                }
            })}
      </article>
    </main>
  );
}
