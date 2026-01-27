"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { CartItem, CartState } from "./cart.types";
import { loadCart, saveCart, clearCartStorage } from "./cart.storage";

type CartAction =
  | { type: "INIT"; state: CartState }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "INC"; productId: number }
  | { type: "DEC"; productId: number }
  | { type: "SET_QTY"; productId: number; qty: number }
  | { type: "REMOVE"; productId: number }
  | { type: "CLEAR" };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  inc: (productId: number) => void;
  dec: (productId: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  subtotalCents: number;
}>({
  state: { items: [] },
  addItem: () => {},
  inc: () => {},
  dec: () => {},
  setQty: () => {},
  remove: () => {},
  clear: () => {},
  subtotalCents: 0,
});

function clampQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.floor(qty));
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "INIT":
      return action.state;

    case "ADD_ITEM": {
      const qty = clampQty(action.qty ?? 1);
      const existing = state.items.find((i) => i.productId === action.item.productId);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }

      return { items: [...state.items, { ...action.item, qty }] };
    }

    case "INC":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty: i.qty + 1 } : i
        ),
      };

    case "DEC":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty: Math.max(1, i.qty - 1) } : i
        ),
      };

    case "SET_QTY":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, qty: clampQty(action.qty) } : i
        ),
      };

    case "REMOVE":
      return { items: state.items.filter((i) => i.productId !== action.productId) };

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  // init from localStorage
  useEffect(() => {
    dispatch({ type: "INIT", state: loadCart() });
  }, []);

  useEffect(() => {
    saveCart(state);
  }, [state]);

  const api = useMemo(() => {
    const subtotalCents = state.items.reduce((sum, i) => sum + i.unitPriceCents * i.qty, 0);

    return {
      state,
      addItem: (item: Omit<CartItem, "qty">, qty?: number) =>
        dispatch({ type: "ADD_ITEM", item, qty }),
      inc: (productId: number) => dispatch({ type: "INC", productId }),
      dec: (productId: number) => dispatch({ type: "DEC", productId }),
      setQty: (productId: number, qty: number) => dispatch({ type: "SET_QTY", productId, qty }),
      remove: (productId: number) => dispatch({ type: "REMOVE", productId }),
      clear: () => {
        dispatch({ type: "CLEAR" });
        clearCartStorage();
      },
      subtotalCents,
    };
  }, [state]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}