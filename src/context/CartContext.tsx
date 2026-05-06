'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Product, CartItem, DEFAULT_SETTINGS } from '@/types';
import { getSiteSettings } from '@/lib/services/firestoreService';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_TO_CART'; product: Product; quantity?: number }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.items.find(item => item.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map(item =>
            item.product.id === action.product.id
              ? { ...item, quantity: item.quantity + (action.quantity || 1) }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { product: action.product, quantity: action.quantity || 1 }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        items: state.items.filter(item => item.product.id !== action.productId),
      };
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return {
          items: state.items.filter(item => item.product.id !== action.productId),
        };
      }
      return {
        items: state.items.map(item =>
          item.product.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    case 'HYDRATE':
      return { items: action.items };
    default:
      return state;
  }
}

// These will be overridden by Firestore settings on load

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotal: number;
  shippingCost: number;
  cartTotal: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isHydrated, setIsHydrated] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(DEFAULT_SETTINGS.freeShippingThreshold);
  const [flatShippingCost, setFlatShippingCost] = useState(DEFAULT_SETTINGS.shippingCost);

  // Fetch shipping settings from Firestore
  useEffect(() => {
    getSiteSettings().then(s => {
      if (s) {
        setFreeShippingThreshold(s.freeShippingThreshold);
        setFlatShippingCost(s.shippingCost);
      }
    }).catch(() => {});
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('uj_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch (e) {
      console.error('Failed to hydrate cart:', e);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('uj_cart', JSON.stringify(state.items));
    }
  }, [state.items, isHydrated]);

  const addToCart = (product: Product, quantity?: number) => {
    dispatch({ type: 'ADD_TO_CART', product, quantity });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const cartItemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = state.items.reduce((sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity, 0);
  const shippingCost = cartSubtotal >= freeShippingThreshold || cartSubtotal === 0 ? 0 : flatShippingCost;
  const cartTotal = cartSubtotal + shippingCost;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItemCount,
        cartSubtotal,
        shippingCost,
        cartTotal,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
