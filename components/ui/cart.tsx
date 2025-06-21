"use client";

import { ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { useCart } from "@/hooks/cart-context";
import Image from "next/image";
import { Separator } from "./separator";
import { Link } from "@/i18n/navigation";

export const Cart = () => {
  const { cart, clearCart, removeItem, getTotal } = useCart();
  return (
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-[320px] flex flex-col z-99 sm:max-h-[calc(100vh-64px)] max-h-[calc(100vh-48px)] overflow-y-auto p-0 pb-4">
        <div className="w-full flex flex-row items-center sticky top-0 justify-between bg-card p-4 pb-2">
          <p className="font-semibold text-sm">My Cart ({cart.length})</p>
          <Button
            variant="link"
            className="text-xs text-right"
            onClick={() => {
              clearCart();
            }}
          >
            Clear Cart
          </Button>
        </div>
        <div className="flex flex-col gap-4 w-full items-center px-4">
          {cart.length == 0 && <p className="text-xs">Your Cart is empty.</p>}
          {cart.length > 0 &&
            cart.map((cartItem) => {
              if (cartItem.type == "accommodation") {
                return (
                  <>
                    <Separator key={cartItem.property_id + "separator"} />
                    <div
                      key={cartItem.property_id}
                      className="w-full flex flex-row items-start justify-between gap-2 relative"
                    >
                      <Image
                        src={cartItem.photo}
                        alt="cart-logo"
                        width={1080}
                        height={1080}
                        className="w-20! h-auto aspect-video! object-cover rounded"
                      />
                      <Button
                        onClick={() => {
                          removeItem(cartItem.property_id);
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
                          {(new Date(cartItem.end_date).getTime() -
                            new Date(cartItem.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)}{" "}
                          nights - {cartItem.adults + cartItem.children} guests
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">Total:</span>{" "}
                          {cartItem.front_end_price} €
                        </p>
                      </div>
                    </div>
                  </>
                );
              }
            })}
          {cart.length > 0 && (
            <Button asChild className="w-full">
              <Link href={"/checkout"}>Checkout - {getTotal()} €</Link>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
