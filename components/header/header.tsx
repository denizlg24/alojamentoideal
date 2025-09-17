"use client";
import { Link, usePathname } from "@/i18n/navigation";
import {
  NavigationMenu,
  //NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  //NavigationMenuTrigger,
} from "../ui/navigation-menu";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Hamburger from "hamburger-react";
import { motion, AnimatePresence } from "framer-motion";
//import { ChevronDown } from "lucide-react";
//import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
//import { Separator } from "../ui/separator";
import { LocaleSwitcher } from "../ui/locale-switcher";
import { Cart } from "../ui/cart";
/*import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";*/

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const t = useTranslations("header");

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const pathname = usePathname();
  if (pathname.startsWith("/admin/dashboard")) {
    return null;
  }
  return (
    <header
      className={cn(
        "fixed top-0 p-2 w-full md:h-16 h-12 bg-background backdrop-blur-3xl z-90 transition-shadow flex flex-row",
        isScrolled &&
          !location.pathname.match(/^\/[a-z]{2}\/rooms$/) &&
          "shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-row justify-between w-full">
        <Link href="/" className="h-full">
          <Image
            src="/alojamento-ideal-logo.png"
            width={256}
            height={256}
            priority
            alt="Alojamento ideal logo"
            className="w-auto h-full aspect-square rounded shadow"
          />
        </Link>
        <NavigationMenu className="w-full h-full md:flex hidden">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/rooms"
                  className="font-medium flex flex-row items-center gap-2"
                >
                  <Image
                    width={128}
                    height={128}
                    src={"/house_icon.png"}
                    alt="house icon"
                    priority
                    className="h-full max-h-6 w-auto aspect-square object-contain"
                  />
                  {t("homes")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/tours"
                  className="font-medium flex flex-row items-center gap-2"
                >
                  <Image
                    width={128}
                    height={128}
                    src={"/tour_icon.png"}
                    alt="house icon"
                    priority
                    className="h-full max-h-6 w-auto aspect-square object-contain"
                  />
                  {t("tours")}
                </Link>
              </NavigationMenuLink>
              {/*  <NavigationMenuTrigger className="w-fit px-0 pr-2">
                <NavigationMenuLink asChild>
                  <Link
                    className="font-medium flex flex-row items-center gap-2 w-full hover:bg-transparent"
                    href="/tours"
                  >
                    <Image
                      width={128}
                      height={128}
                      src={"/tour_icon.png"}
                      alt="house icon"
                      priority
                      className="h-full max-h-6 w-auto aspect-square object-contain"
                    />
                    {t("tours")}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/porto-city">
                        <div className="font-medium">{t("porto-exp")}</div>
                        <div className="text-muted-foreground">
                          {t("porto-desc")}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/douro">
                        <div className="font-medium">{t("douro-exp")}</div>
                        <div className="text-muted-foreground">
                          {t("douro-desc")}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/arouca">
                        <div className="font-medium">{t("arouca-exp")}</div>
                        <div className="text-muted-foreground">
                          {t("arouca-desc")}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/geres">
                        <div className="font-medium">{t("geres-exp")}</div>
                        <div className="text-muted-foreground">
                          {t("geres-desc")}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/others">
                        <div className="font-medium">{t("other-exp")}</div>
                        <div className="text-muted-foreground">
                          {t("other-desc")}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>*/}
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink className="font-medium" href="/about">
                {t("about")}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link className="font-medium" href="/faq">
                  FAQ
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link className="font-medium" href="/help">
                  {t("contact")}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <LocaleSwitcher />
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Cart />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="w-auto h-full aspect-square md:hidden flex items-center justify-center z-96">
          {!isOpen && <Cart />}
          <Hamburger size={16} toggled={isOpen} toggle={setOpen} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden block right-0 top-0 h-screen w-full max-w-[300px]! absolute border shadow p-4 bg-background z-95"
              initial={{ opacity: 1, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: 300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <NavigationMenu className="flex flex-col w-full max-w-full! px-4 py-4 items-center relative">
                <div className="absolute left-0 -top-2">
                  <LocaleSwitcher />
                </div>
                <NavigationMenuList className="flex flex-col w-full items-center">
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        onClick={() => {
                          setOpen(false);
                        }}
                        className="font-medium flex flex-row items-center gap-2"
                        href="/rooms"
                      >
                        <Image
                          width={128}
                          height={128}
                          src={"/house_icon.png"}
                          alt="house icon"
                          priority
                          className="h-full max-h-6 w-auto aspect-square object-contain"
                        />
                        {t("homes")}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                      <Link
                        onClick={() => {
                          setOpen(false);
                        }}
                        className="font-medium flex flex-row items-center gap-2"
                        href="/rooms"
                      >
                        <Image
                          width={128}
                          height={128}
                          src={"/tour_icon.png"}
                          alt="house icon"
                          priority
                          className="h-full max-h-6 w-auto aspect-square object-contain"
                        />
                        {t("tours")}
                      </Link>
                    </NavigationMenuLink>
                    {/* <Accordion className="py-0!" type="single" collapsible>
                      <AccordionItem value="tours">
                        <AccordionTrigger
                          asChild
                          className="w-full py-0! justify-center gap-2 items-center"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-full px-2"
                          >
                            <Image
                              width={128}
                              height={128}
                              src={"/tour_icon.png"}
                              alt="house icon"
                              priority
                              className="h-full max-h-6 w-auto aspect-square object-contain"
                            />
                            {t("tours")}
                            <ChevronDown
                              className={cn(
                                "rotate-0 transition-transform duration-300"
                              )}
                            />
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="grid w-full gap-2 text-center bg-accent rounded">
                            <li>
                              <NavigationMenuLink asChild>
                                <Link
                                  onClick={() => {
                                    setOpen(false);
                                  }}
                                  href="/tours/porto-city"
                                >
                                  <div className="font-medium">
                                    {t("porto-exp")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t("porto-desc")}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                              <Separator className="my-1" />
                              <NavigationMenuLink asChild>
                                <Link
                                  onClick={() => {
                                    setOpen(false);
                                  }}
                                  href="/tours/douro"
                                >
                                  <div className="font-medium">
                                    {t("douro-exp")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t("douro-desc")}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                              <Separator className="my-1" />
                              <NavigationMenuLink asChild>
                                <Link
                                  onClick={() => {
                                    setOpen(false);
                                  }}
                                  href="/tours/arouca"
                                >
                                  <div className="font-medium">
                                    {t("arouca-exp")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t("arouca-desc")}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                              <Separator className="my-1" />
                              <NavigationMenuLink asChild>
                                <Link
                                  onClick={() => {
                                    setOpen(false);
                                  }}
                                  href="/tours/geres"
                                >
                                  <div className="font-medium">
                                    {t("geres-exp")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t("geres-desc")}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                              <Separator className="my-1" />
                              <NavigationMenuLink asChild>
                                <Link
                                  onClick={() => {
                                    setOpen(false);
                                  }}
                                  href="/tours/others"
                                >
                                  <div className="font-medium">
                                    {t("other-exp")}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {t("other-desc")}
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>*/}
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        onClick={() => {
                          setOpen(false);
                        }}
                        className="font-medium"
                        href="/about"
                      >
                        {t("about")}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        onClick={() => {
                          setOpen(false);
                        }}
                        className="font-medium"
                        href="/faq"
                      >
                        FAQ
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        onClick={() => {
                          setOpen(false);
                        }}
                        className="font-medium"
                        href="/help"
                      >
                        {t("contact")}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-screen md:hidden block h-screen bg-black/25 absolute top-0 left-0 -z-10"
            ></motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
