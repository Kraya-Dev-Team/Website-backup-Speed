"use client";
import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2, Info } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import SafeProductImage from "@/components/products/SafeProductImage";

export default function CartOverlay() {
  const { cart, isOpen, setIsOpen, updateQuantity, changeVariant, removeFromCart, isLoading } = useCart();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVariantChange = async (itemId: string, newVariantId: string) => {
    setUpdatingId(itemId);
    try {
      await changeVariant(itemId, newVariantId);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuantityUpdate = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    try {
      await updateQuantity(itemId, newQty);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await removeFromCart(itemId);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-cream border-l border-charcoal/5 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-charcoal/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingBag size={24} strokeWidth={1} className="text-charcoal" />
              <h2 className="font-serif text-2xl text-charcoal">Cart</h2>
              {cart && cart.totalQuantity > 0 && (
                <span className="font-sans text-[10px] font-bold text-charcoal/30 tracking-widest mt-1">
                  ({cart.totalQuantity} ITEMS)
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-charcoal/5 rounded-full transition-colors text-charcoal/30 hover:text-charcoal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                  <ShoppingBag size={64} strokeWidth={0.5} className="text-charcoal/10" />
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-1 h-1 bg-charcoal/20 rounded-full" />
                  </motion.div>
                </div>
                <p className="font-serif text-3xl text-charcoal mb-2">Your Bag is Empty</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-charcoal/40 mb-10">
                  Discover something extraordinary
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="px-12 py-4 rounded-full bg-charcoal text-cream text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-charcoal/90 transition-all shadow-xl shadow-charcoal/20 hover:shadow-charcoal/30 active:scale-[0.98]"
                >
                  Browse Collection
                </Link>
              </div>
            ) : (
              cart.items.map((item) => {
                const itemId = item.id || item.variantId;
                const isItemUpdating = updatingId === itemId;

                return (
                  <div key={itemId} className={`flex gap-6 group relative transition-opacity duration-300 ${isItemUpdating ? "opacity-50" : "opacity-100"}`}>
                    {/* Image */}
                    <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-cream-dark/50 shrink-0 border border-charcoal/5">
                      <SafeProductImage
                        src={item.image || item.product?.images?.find(i => i.isPrimary)?.url || ""}
                        alt={item.name || item.product?.name || "Product"}
                        fill
                        productName={item.name || item.product?.name}
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-serif text-charcoal text-lg leading-tight uppercase tracking-tight">
                            {item.name || item.product?.name}
                          </h3>
                          <button
                            onClick={() => handleRemove(itemId)}
                            disabled={isItemUpdating}
                            className="text-charcoal/20 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-lg disabled:opacity-0"
                            title="Remove Essence"
                          >
                            <Trash2 size={16} strokeWidth={1.5} />
                          </button>
                        </div>

                        {/* Dynamic Variant Selection */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.product?.variants && item.product.variants.length > 1 ? (
                            item.product.variants.map((v) => (
                              <button
                                key={v.id}
                                onClick={() => handleVariantChange(itemId, v.id)}
                                disabled={isItemUpdating}
                                className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all border ${v.id === item.variantId
                                  ? "bg-charcoal text-cream border-charcoal"
                                  : "bg-transparent text-charcoal/40 border-charcoal/10 hover:border-charcoal/30"
                                  }`}
                              >
                                {v.size} {v.unit}
                              </button>
                            ))
                          ) : (
                            <p className="font-sans text-[10px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">
                              {item.variantSize && item.variantUnit
                                ? `${item.variantSize} ${item.variantUnit}`
                                : (item.product?.concentration || "Eau de Parfum")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity Controls - Minimalist */}
                        <div className="flex items-center gap-4 border border-charcoal/10 rounded-full py-1.5 px-4 bg-transparent shadow-sm">
                          <button
                            onClick={() => handleQuantityUpdate(itemId, Math.max(1, item.quantity - 1))}
                            disabled={isItemUpdating || item.quantity <= 1}
                            className="text-charcoal/50 hover:text-charcoal transition-colors disabled:opacity-30"
                          >
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          <div className="font-sans text-[11px] font-bold text-charcoal min-w-[12px] text-center flex items-center justify-center">
                            {isItemUpdating ? (
                              <Loader2 size={10} className="animate-spin text-charcoal" />
                            ) : (
                              item.quantity
                            )}
                          </div>
                          <button
                            onClick={() => handleQuantityUpdate(itemId, item.quantity + 1)}
                            disabled={isItemUpdating}
                            className="text-charcoal/50 hover:text-charcoal transition-colors disabled:opacity-30"
                          >
                            <Plus size={10} strokeWidth={3} />
                          </button>
                        </div>

                        <div className="flex flex-col items-end">
                          <p className="font-serif text-charcoal text-base font-medium leading-none">
                            ₹{item.totalPrice?.toLocaleString() || (item.price * item.quantity).toLocaleString()}
                          </p>
                          {((item as any).originalPrice || 0) > item.price && (
                            <p className="font-sans text-[10px] text-charcoal/30 line-through mt-1">
                              ₹{((item as any).originalPrice * item.quantity).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && (
            <div className="p-8 border-t border-charcoal/5 bg-cream-dark/20 space-y-6">
              <div className="space-y-4 px-1">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">Subtotal</span>
                  <span className="font-serif text-charcoal text-base">₹{cart.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 group relative">
                    <span className="font-sans text-[10px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">
                      GST (18%)
                    </span>

                    {/* Info Icon */}
                    <Info size={12} className="text-charcoal/60 cursor-pointer" />

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                      Includes 18% GST on your order
                    </div>
                  </div>

                  <span className="font-serif text-charcoal text-base">
                    ₹{((cart?.totalAmount || 0) * 0.18).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">Shipping</span>
                  <span className="font-sans text-green-700 text-[9px] uppercase tracking-[0.2em] font-black italic">Complimentary</span>
                </div>
                <div className="pt-4 flex justify-between items-end border-t border-charcoal/5">
                  <span className="font-sans text-[11px] text-charcoal font-black uppercase tracking-[0.3em]">Total</span>
                  <span className="font-serif text-3xl text-charcoal leading-none">
                    ₹{(
                      (cart?.totalAmount || 0) * 1.18
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsOpen(false)}
                className="w-full bg-charcoal text-cream hover:bg-charcoal/90 py-5 rounded-full flex items-center justify-center gap-4 transition-all shadow-xl shadow-charcoal/10 active:scale-[0.98] group"
              >
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold">Proceed to Checkout</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center justify-center gap-2 opacity-30">
                <div className="h-px w-8 bg-charcoal" />
                <p className="text-[9px] text-charcoal font-sans uppercase tracking-[0.2em] font-bold">
                  Complimentary Shipping
                </p>
                <div className="h-px w-8 bg-charcoal" />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
