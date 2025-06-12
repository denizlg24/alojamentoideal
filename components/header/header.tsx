"use client";
import { Link } from "@/i18n/navigation";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Hamburger from "hamburger-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [isToursBurgerOpen, setToursBurgerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={cn(
        "fixed top-0 p-2 w-full sm:h-16 h-12 bg-background backdrop-blur-3xl z-99 transition-shadow flex flex-row",
        isScrolled && "shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-row justify-between w-full">
        <Link href="/" className="h-full">
          <Image
            src="/alojamento-ideal-logo.png"
            width={256}
            height={256}
            alt="Alojamento ideal logo"
            className="w-full h-full rounded shadow"
          />
        </Link>
        <NavigationMenu className="w-full h-full sm:flex hidden">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/rooms">Homes</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Tours</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[300px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/porto-city">
                        <div className="font-medium">
                          Porto City Experiences
                        </div>
                        <div className="text-muted-foreground">
                          Taste, ride, and explore the heart of Porto
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/douro">
                        <div className="font-medium">
                          Douro Valley Wine Tours
                        </div>
                        <div className="text-muted-foreground">
                          Scenic drives and world-class wine tastings
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/arouca">
                        <div className="font-medium">
                          Arouca & Paiva Walkways
                        </div>
                        <div className="text-muted-foreground">
                          Suspension bridges and breathtaking trails
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/geres">
                        <div className="font-medium">
                          Peneda-Gerês National Park
                        </div>
                        <div className="text-muted-foreground">
                          Discover Portugal’s wild and protected nature
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/tours/others">
                        <div className="font-medium">
                          Other Unique Experiences
                        </div>
                        <div className="text-muted-foreground">
                          Hidden gems and adventures coming soon
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/about">About Us</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/faq">FAQ</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/contact">
                Contact Us
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div
          onBlur={() => {
            ///setOpen(false);
          }}
          className="w-auto h-full aspect-square sm:hidden flex items-center justify-center z-99"
        >
          <Hamburger size={16} toggled={isOpen} toggle={setOpen} />
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="right-0 top-0 h-screen w-full max-w-[300px]! absolute border shadow p-4 bg-background"
              initial={{ opacity: 1, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: 300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <NavigationMenu className="flex flex-col w-full max-w-full! px-4 py-4 items-center">
                <NavigationMenuList className="flex flex-col w-full items-center">
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/rooms">Homes</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Collapsible
                      open={isToursBurgerOpen}
                      onOpenChange={setToursBurgerOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full">
                          Tours
                          <ChevronDown
                            className={cn(
                              "rotate-0 transition-transform duration-300",
                              isToursBurgerOpen ? "rotate-180" : ""
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="grid w-full gap-2 text-center bg-accent rounded">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/tours/porto-city">
                                <div className="font-medium">
                                  Porto City Experiences
                                </div>
                                <div className="text-muted-foreground">
                                  Taste, ride, and explore the heart of Porto
                                </div>
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link href="/tours/douro">
                                <div className="font-medium">
                                  Douro Valley Wine Tours
                                </div>
                                <div className="text-muted-foreground">
                                  Scenic drives and world-class wine tastings
                                </div>
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link href="/tours/arouca">
                                <div className="font-medium">
                                  Arouca & Paiva Walkways
                                </div>
                                <div className="text-muted-foreground">
                                  Suspension bridges and breathtaking trails
                                </div>
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link href="/tours/geres">
                                <div className="font-medium">
                                  Peneda-Gerês National Park
                                </div>
                                <div className="text-muted-foreground">
                                  Discover Portugal’s wild and protected nature
                                </div>
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link href="/tours/others">
                                <div className="font-medium">
                                  Other Unique Experiences
                                </div>
                                <div className="text-muted-foreground">
                                  Hidden gems and adventures coming soon
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/about">
                      About Us
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/about">FAQ</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/about">
                      Contact Us
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
              className="w-screen h-screen bg-black/25 absolute top-0 left-0 -z-10"
            ></motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
