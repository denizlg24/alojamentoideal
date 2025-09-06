"use client";

import { ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "./button";
import { useCart } from "@/hooks/cart-context";
import Image from "next/image";
import { Separator } from "./separator";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import React from "react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

export const Cart = () => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("cart");
  const { cart, clearCart, removeItem, getTotal } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="p-2! rounded-full aspect-square h-auto relative"
        >
          <ShoppingBasket className="w-full h-full" />
          {cart.length > 0 && (
            <div className="h-4 min-w-4 absolute -bottom-1 right-0 translate-x-1/2 rounded-full bg-card border p-1 flex items-center justify-center">
              <p className="text-xs">{cart.length}</p>
            </div>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col z-[99]! p-0 pb-4 w-[310px] sm:w-[540px]">
        <SheetHeader className="gap-0">
          <SheetTitle>{t("title", { cartLength: cart.length })}</SheetTitle>
          <SheetDescription>
            <Button
              variant="link"
              className="text-xs text-right p-0 h-fit!"
              onClick={() => {
                clearCart();
                setOpen(false);
              }}
            >
              {t("clear")}
            </Button>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 w-full items-center px-4">
          {cart.length == 0 && <p className="text-xs">{t("empty")}</p>}
          {cart.length > 0 &&
            cart.map((cartItem, index) => {
              if (cartItem.type == "accommodation") {
                return (
                  <React.Fragment
                    key={cartItem.property_id + "-index:" + index}
                  >
                    <Separator />
                    <div className="w-full flex flex-row items-start justify-between gap-2 relative">
                      <Image
                        src={cartItem.photo}
                        alt="cart-logo"
                        width={1080}
                        height={1080}
                        className="w-20! h-auto aspect-video! object-cover rounded"
                      />
                      <Button
                        onClick={() => {
                          removeItem(index);
                        }}
                        variant="destructive"
                        className="absolute w-4! h-auto aspect-square! rounded-full p-0 -top-2 -left-2 hover:scale-105 transition-transform"
                      >
                        <Trash2 className="w-full h-full" />
                      </Button>
                      <div className="w-full grow flex flex-col truncate">
                        <h1 className="w-full font-semibold text-xs truncate">
                          {cartItem.name}
                        </h1>
                        <p className="text-xs">
                          {t("nights_guests", {
                            nights: (
                              (new Date(cartItem.end_date).getTime() -
                                new Date(cartItem.start_date).getTime()) /
                              (1000 * 60 * 60 * 24)
                            ).toString(),
                            guests: cartItem.adults + cartItem.children,
                          })}
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">{t("total")}:</span>
                          {cartItem.front_end_price} €
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }
              if (cartItem.type == "activity") {
                return (
                  <React.Fragment key={cartItem.id + "-index:" + index}>
                    <Separator />
                    <div className="w-full flex flex-row items-start justify-between gap-2 relative">
                      <Image
                        src={cartItem.photo}
                        alt="cart-logo"
                        width={1080}
                        height={1080}
                        className="w-20! h-auto aspect-video! object-cover rounded"
                      />
                      <Button
                        onClick={() => {
                          removeItem(index);
                        }}
                        variant="destructive"
                        className="absolute w-4! h-auto aspect-square! rounded-full p-0 -top-2 -left-2 hover:scale-105 transition-transform"
                      >
                        <Trash2 className="w-full h-full" />
                      </Button>
                      <div className="w-full grow flex flex-col truncate">
                        <h1 className="w-full font-semibold text-xs truncate">
                          {cartItem.name}
                        </h1>
                        <p className="text-xs">
                          {t("group-of", {
                            count: Object.values(cartItem.guests).reduce(
                              (acc, c) => (acc += c),
                              0
                            ),
                          })}
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">{t("total")}:</span>
                          {cartItem.price} €
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }
            })}
        </div>
        <SheetFooter>
          {cart.length > 0 && (
            <Button
              onClick={() => {
                setOpen(false);
              }}
              asChild
              className="w-full"
            >
              <Link href={"/checkout"}>
                {t("checkout", { total: getTotal() })}
              </Link>
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
