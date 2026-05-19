"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { cartApi, productsApi, type Cart, type CartItem } from "@/lib/api";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  changeVariant: (itemId: string, newVariantId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Per-session product cache: avoid re-fetching the same product on every
  // cart mutation. enrichCartData previously fired N parallel GETs every time
  // the user adjusted quantity / variant / etc.
  const productCacheRef = useRef<Map<string, any>>(new Map());

  const enrichCartData = useCallback(async (cartData: Cart): Promise<Cart> => {
    try {
      const cache = productCacheRef.current;
      // Only fetch products we haven't already loaded this session.
      const allProductIds = Array.from(new Set(cartData.items.map(i => i.productId)));
      const missingIds = allProductIds.filter(id => !cache.has(id));

      if (missingIds.length > 0) {
        const fetched = await Promise.all(
          missingIds.map(id =>
            productsApi.getById(id)
              .then(r => r.success ? r.data : null)
              .catch(() => null)
          )
        );
        fetched.forEach(p => {
          if (p) cache.set(p.id, p);
        });
      }

      const productMap = allProductIds.reduce((acc, id) => {
        const p = cache.get(id);
        if (p) acc[id] = p;
        return acc;
      }, {} as Record<string, any>);

      const enrichedItems = cartData.items.map(item => {
        const product = productMap[item.productId] || item.product;
        
        let price = item.price;
        let originalPrice = item.price;

        if (product) {
          const variant = product.variants.find((v: any) => v.id === item.variantId);
          if (variant) {
            price = variant.discountPrice || variant.price;
            originalPrice = variant.price;
          }
        }

        return {
          ...item,
          product,
          price: price || 0,
          originalPrice: originalPrice || 0,
          totalPrice: (price || 0) * item.quantity
        };
      });

      const totalAmount = enrichedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const totalQuantity = enrichedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        ...cartData,
        items: enrichedItems,
        totalAmount: totalAmount || cartData.totalAmount,
        totalQuantity: totalQuantity || cartData.totalQuantity
      };
    } catch (err) {
      console.error("Enrichment failed:", err);
      return cartData;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await cartApi.get();
      if (res.success) {
        const enriched = await enrichCartData(res.data);
        setCart(enriched);
      }
    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, enrichCartData]);

  // Sync cart from server on login (POST /cart/sync) then refresh
  const syncCartOnLogin = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const currentRes = await cartApi.get();
      if (currentRes.success && currentRes.data.items.length > 0) {
        const itemsPayload = currentRes.data.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        }));
        await cartApi.sync({ items: itemsPayload });
      }
    } catch {
      // Sync is best-effort; ignore errors
    } finally {
      refreshCart();
    }
  }, [isLoggedIn, refreshCart]);
  
  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  useEffect(() => {
    syncCartOnLogin();
  }, [syncCartOnLogin]);

  const addToCart = useCallback(async (productId: string, variantId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const currentItems = cart?.items || [];
      const existingItemIndex = currentItems.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );

      let newItems = [...currentItems];
      if (existingItemIndex > -1) {
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        };
      } else {
        newItems.push({ productId, variantId, quantity, price: 0 } as any);
      }

      const itemsPayload = newItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price || 0,
      }));

      const res = await cartApi.update({ items: itemsPayload });
      if (res.success) {
        const enriched = await enrichCartData(res.data);
        setCart(enriched);
        setIsOpen(true);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cart, enrichCartData]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!itemId) return;
    setIsLoading(true);
    try {
      const currentItems = cart?.items || [];
      const newItems = currentItems.map((i) =>
        (i.id === itemId || i.variantId === itemId)
          ? { ...i, quantity }
          : i
      );

      const itemsPayload = newItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price || 0,
      }));

      const res = await cartApi.update({ items: itemsPayload });
      if (res.success) {
        const enriched = await enrichCartData(res.data);
        setCart(enriched);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cart, enrichCartData]);

  const changeVariant = useCallback(async (itemId: string, newVariantId: string) => {
    if (!itemId || !newVariantId) return;
    setIsLoading(true);
    try {
      const currentItems = cart?.items || [];
      const itemToChange = currentItems.find(i => i.id === itemId || i.variantId === itemId);
      
      if (!itemToChange || !itemToChange.product) return;

      const newWeight = itemToChange.product.variants.find(v => v.id === newVariantId);
      if (!newWeight) return;

      // Check if another item with newVariantId already exists
      const existingSameVariant = currentItems.find(i => 
        (i.id !== itemId && i.variantId !== itemId) && 
        (i.variantId === newVariantId || i.id === newVariantId)
      );

      let newItems: any[];
      if (existingSameVariant) {
        // Merge with existing
        newItems = currentItems
          .filter(i => i.id !== itemId && i.variantId !== itemId)
          .map(i => {
            if (i.id === existingSameVariant.id || i.variantId === existingSameVariant.variantId) {
              return { ...i, quantity: i.quantity + itemToChange.quantity };
            }
            return i;
          });
      } else {
        // Update current item
        newItems = currentItems.map(i => {
          if (i.id === itemId || i.variantId === itemId) {
            return { 
              ...i, 
              variantId: newVariantId,
              price: newWeight.price,
              variantSize: newWeight.size,
              variantUnit: newWeight.unit
            };
          }
          return i;
        });
      }

      const itemsPayload = newItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price || 0,
      }));

      const res = await cartApi.update({ items: itemsPayload });
      if (res.success) {
        const enriched = await enrichCartData(res.data);
        setCart(enriched);
      }
    } catch (err) {
      console.error("Failed to change variant:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cart, enrichCartData]);

  const removeFromCart = useCallback(async (itemId: string) => {
    if (!itemId) return;
    setIsLoading(true);
    try {
      const currentItems = cart?.items || [];
      const newItems = currentItems.filter((i) => i.id !== itemId && i.variantId !== itemId);

      const itemsPayload = newItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price || 0,
      }));

      const res = await cartApi.update({ items: itemsPayload });
      if (res.success) {
        const enriched = await enrichCartData(res.data);
        setCart(enriched);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cart, enrichCartData]);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    isLoading,
    refreshCart,
    addToCart,
    updateQuantity,
    changeVariant,
    removeFromCart,
    isOpen,
    setIsOpen,
    clearCart,
  }), [cart, isLoading, refreshCart, addToCart, updateQuantity, changeVariant, removeFromCart, isOpen, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
