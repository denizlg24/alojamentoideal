"use client";
import { Search, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState, useEffect } from "react";
import { searchArticles } from "@/utils/help-articles";
import { Link, useRouter } from "@/i18n/navigation";
import { Card } from "../ui/card";
import Image from "next/image";
import { useLocale } from "next-intl";

export const ContactSearchBar = ({
  placeholder,
  readMore,
}: {
  placeholder: string;
  readMore: string;
}) => {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [canOpen, setCanOpen] = useState(true);
  const router = useRouter();

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setCanOpen(true);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const results = searchArticles(debouncedQuery, locale);

  return (
    <div
      onBlur={() => {
        setCanOpen(false);
      }}
      onFocus={() => {
        setCanOpen(true);
      }}
      className="w-full relative flex-col items-center"
    >
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (debouncedQuery.trim()) {
              const _results = searchArticles(debouncedQuery, locale);
              if (_results.length > 0) {
                router.push(`/help/${_results[0].slug}`);
              }
            }
          }
        }}
        className="w-full rounded-full! p-6!"
        placeholder={placeholder}
      />
      <Button
      onClick={()=>{
        if (debouncedQuery.trim()) {
          const _results = searchArticles(debouncedQuery, locale);
          if (_results.length > 0) {
            router.push(`/help/${_results[0].slug}`);
          }
        }
      }}
        className="absolute rounded-full! h-10! w-auto! aspect-square! p-0! right-1.5 top-1/2 -translate-y-1/2 z-10 hover:cursor-pointer"
        size={"lg"}
      >
        <Search />
      </Button>
      {canOpen && debouncedQuery && results.length > 0 && (
        <Card className="absolute left-0 mt-1 w-full max-h-[250px] overflow-y-auto p-4! rounded-md! z-95">
          {results.map((res) => {
            return (
              <div
                className="w-full pb-2 border-b-2 border-b-muted border-dashed flex flex-row items-stretch gap-2"
                key={res.id}
              >
                <Image unoptimized 
                  src={res.photo}
                  alt={res.title}
                  className="w-[20%] min-[420px]:block hidden aspect-video h-auto object-cover"
                />
                <div className="flex flex-col justify-between gap-2 text-sm min-[420px]:w-[75%] w-full h-full">
                  <h1 className="font-bold truncate">{res.title}</h1>
                  <p className="text-xs truncate font-normal">
                    {res.preview}...
                  </p>

                  <Button
                    className="w-fit! justify-self-end mt-auto! h-fit! rounded! p-1.5!"
                    asChild
                  >
                    <Link href={`/help/${res.slug}`}>
                      {readMore} <SquareArrowOutUpRight />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
};
