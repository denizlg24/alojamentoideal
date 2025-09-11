"use client";

import { FeeType } from "@/schemas/price.schema";
import { isSameDay } from "date-fns";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type ECommerceItem = {
  type: "product";
  id: string;
  name: string;
  price: number;
  quantity: number;
  photo: string;
  description?: string;
  invoice?: string;
  disabled?: boolean;
};

export type TourItem = {
  id: number;
  type: "activity";
  name: string;
  price: number;
  selectedDate: Date;
  selectedRateId: number;
  selectedStartTimeId: number;
  guests: { [categoryId: number]: number };
  photo: string;
  invoice?: string;
  disabled?: boolean;
};

export type AccommodationItem = {
  type: "accommodation";
  property_id: number;
  name: string;
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  front_end_price: number;
  photo: string;
  fees: Partial<FeeType>[];
  invoice?: string;
  disabled?: boolean;
};

export type CartItem = ECommerceItem | AccommodationItem | TourItem;

type CartContextType = {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  updateQuantity: (idOrPropertyId: string | number, quantity: number) => void;
  getTotal: () => number;
  disableItem: (index: number) => void;
  cartLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  useEffect(() => {
    setCartLoading(true);
    const storedCart = localStorage.getItem("alojamentoideal.cart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
    setCartLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("alojamentoideal.cart", JSON.stringify(cart));
  }, [cart]);

  const addItem = (item: CartItem) => {
    setCart((prev) => {
      if (item.type === "product") {
        const existing = prev.find(
          (i) => i.type === "product" && i.id === item.id
        );
        if (existing && existing.type === "product") {
          return prev.map((i) =>
            i.type === "product" && i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
        return [...prev, { ...item, disabled: true }];
      } else if (item.type === "activity") {
        const exists = prev.find(
          (i) =>
            i.type === "activity" &&
            i.id === item.id &&
            isSameDay(i.selectedDate, item.selectedDate) &&
            i.selectedStartTimeId == item.selectedStartTimeId
        );
        return exists ? prev : [...prev, { ...item, disabled: false }];
      } else {
        const exists = prev.find(
          (i) =>
            i.type === "accommodation" &&
            i.property_id === item.property_id &&
            i.start_date === item.start_date &&
            i.end_date === item.end_date
        );
        return exists ? prev : [...prev, { ...item, disabled: false }];
      }
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => {
      const old = [...prev];
      old.splice(index, 1);
      return old;
    });
  };

  const disableItem = (index: number) => {
    setCart((prev) => {
      const old = [...prev];
      const removed = old[index];
      old.splice(index, 1);
      const disabledItem: CartItem = { ...removed, disabled: true };
      const updated = [...old, disabledItem];
      return updated;
    });
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (
    idOrPropertyId: string | number,
    quantity: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.type === "product" && item.id === idOrPropertyId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };
  const getTotal = () => {
    return cart.reduce((total, item) => {
      if (item.disabled) {
        return total;
      }
      if (item.type === "product") {
        return total + item.price * item.quantity;
      } else if (item.type === "activity") {
        return total + item.price;
      } else {
        return total + item.front_end_price;
      }
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        clearCart,
        updateQuantity,
        getTotal,
        cartLoading,
        disableItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
