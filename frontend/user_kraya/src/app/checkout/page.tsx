"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { addressesApi, ordersApi, type Address, type AddressPayload } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  MapPin,
  Plus,
  Check,
  Loader2,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Home,
  Briefcase,
  Compass,
  Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SafeProductImage from "@/components/products/SafeProductImage";

// Helper to load the Razorpay SDK on-demand
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { cart, refreshCart, clearCart, isLoading: cartLoading } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState<"idle" | "success" | "error">("idle");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressPayload>({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "home",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/");
    }
  }, [authLoading, isLoggedIn, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!authLoading && !cartLoading && isLoggedIn && cart && cart.items.length === 0) {
      router.push("/products");
    }
  }, [authLoading, cartLoading, isLoggedIn, cart, router]);

  // Fetch addresses
  useEffect(() => {
    if (isLoggedIn) {
      fetchAddresses();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (user) {
      setAddressForm(prev => ({
        ...prev,
        firstName: (user as any).firstName || "",
        lastName: (user as any).lastName || "",
        phone: (user as any).phone || "",
      }));
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setIsAddressesLoading(true);
      const res = await addressesApi.get();
      if (res.success) {
        setAddresses(res.data);
        const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id || (defaultAddr as any)._id);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await addressesApi.create(addressForm);
      if (res.success) {
        setAddresses(prev => [...prev, res.data]);
        setSelectedAddressId(res.data.id || (res.data as any)._id);
        setIsAddingAddress(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add address");
    }
  };

  const handlePlaceOrder = async () => {
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Please login to secure your journey.");
      return;
    }

    if (!selectedAddressId) {
      setErrorMessage("Please select a delivery address before proceeding.");
      return;
    }

    if ((cart?.items?.length ?? 0) === 0) {
      router.push("/products");
      return;
    }

    setIsPlacingOrder(true);
    setErrorMessage("");

    try {
      const finalAddressId = selectedAddressId;

      if (!finalAddressId) throw new Error("Please select a shipping haven.");

      const res = await ordersApi.create({
        shippingAddressId: finalAddressId,
        phone: (user as any).phone || "",
        email: (user as any).email || "",
      });

      if (res.success) {
        const { order, razorpayOrder } = res.data;
        const orderId = (order as any)._id?.toString() || order.id;

        // If Razorpay payment is needed, launch the SDK
        if (razorpayOrder) {
          const sdkLoaded = await loadRazorpayScript();
          if (!sdkLoaded) throw new Error("Payment gateway could not be loaded. Please check your connectivity.");

          const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
          // console.log("razorpayKey", razorpayKey)
          if (!razorpayKey) throw new Error("Payment configuration error. Please contact support.");

          await new Promise<void>((resolve, reject) => {
            const options = {
              key: razorpayKey,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency || "INR",
              name: "Kraya Fragrance",
              description: `Order #${order.orderNumber}`,
              order_id: razorpayOrder.id,
              handler: async (response: any) => {
                try {
                  const verifyRes = await ordersApi.verifyPayment({
                    orderId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature,
                  });
                  if (verifyRes.success) {
                    resolve();
                  } else {
                    reject(new Error("Payment verification failed."));
                  }
                } catch (err) {
                  reject(new Error("Unable to verify payment securely. Please contact support."));
                }
              },
              prefill: {
                name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                contact: user.phone || "",
                email: user.email || "",
              },
              notes: {
                order_id: orderId,
                user_id: user.id
              },
              method: {
                upi: true,
                card: true,
                netbanking: true,
                wallet: true,
              },
              config: {
                display: {
                  blocks: {
                    upi: {
                      name: "Pay using UPI",
                      instruments: [{ method: "upi" }],
                    },
                  },
                  sequence: ["block.upi"],
                  preferences: { show_default_blocks: true },
                },
              },
              theme: { color: "#1a1410" },
              modal: {
                ondismiss: () => reject(new Error("Secure payment journey was paused. You can try again.")),
                escape: false,
              },
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
              reject(new Error(`Transaction failed: ${response.error.description}`));
            });
            rzp.open();
          });
        }

        setOrderStatus("success");
        clearCart();
        await refreshCart();

        setTimeout(() => {
          router.push("/profile");
        }, 5000);
      }
    } catch (err: any) {
      setOrderStatus("error");
      setErrorMessage(err.message || "Failed to place order. Please try again.");
      await refreshCart();
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream pt-32 pb-20 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-7xl mx-auto relative">
          {/* Header Skeleton */}
          <div className="mb-12 flex items-center justify-between">
            <div className="space-y-4">
              <div className="h-12 w-64 bg-charcoal/5 rounded-lg animate-pulse" />
              <div className="h-3 w-40 bg-charcoal/5 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block h-12 w-44 bg-charcoal/5 rounded-full animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
            {/* Left Content Skeleton */}
            <div className="lg:col-span-8 space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-charcoal/5 animate-pulse" />
                  <div className="h-6 w-32 bg-charcoal/5 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="h-44 rounded-3xl bg-charcoal/5 animate-pulse" />
                  <div className="h-44 rounded-3xl bg-charcoal/5 animate-pulse" />
                </div>
              </div>
              <div className="pt-8 border-t border-charcoal/5 grid grid-cols-2 gap-8">
                <div className="h-48 rounded-3xl bg-charcoal/5 animate-pulse" />
                <div className="h-48 rounded-3xl bg-charcoal/5 animate-pulse" />
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-4 space-y-8">
              <div className="h-[500px] rounded-[2.5rem] bg-charcoal/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orderStatus === "success") {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20"
        >
          <Check size={48} strokeWidth={1} className="text-green-600" />
        </motion.div>
        <h1 className="font-serif text-5xl text-charcoal mb-4">Essence Secured</h1>
        <p className="font-sans text-charcoal/60 max-w-md leading-relaxed mb-12 text-sm">
          Your journey begins. We have received your order and our alchemists are preparing your shipment.
        </p>
        <Link
          href="/products"
          className="px-12 py-5 bg-charcoal text-cream font-bold rounded-full uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl shadow-charcoal/20 active:scale-95"
        >
          Continue Exploring
        </Link>
        <p className="mt-12 text-[9px] text-charcoal/30 uppercase tracking-[0.3em] font-bold italic">Redirecting to your sanctuary in 5 seconds...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 px-6 sm:px-12 lg:px-20 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full opacity-[0.02] pointer-events-none select-none overflow-hidden">
        <div className="text-[10rem] sm:text-[20rem] font-serif font-black leading-none uppercase whitespace-nowrap">
          welcome
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-3">Quick <span className="italic">Checkout</span></h1>
            <p className="font-sans text-[10px] text-charcoal/40 uppercase tracking-[0.3em] font-bold">Secure your fragrance journey</p>
          </motion.div>
          <Link href="/products" className="hidden sm:flex items-center gap-3 text-charcoal text-[10px] font-bold uppercase tracking-[0.2em] hover:translate-x-1 transition-transform border border-charcoal/10 px-6 py-3 rounded-full">
            Continue Collection <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">

          {/* Main Content: Addresses */}
          <div className="lg:col-span-8 space-y-4">
            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-charcoal/5 flex items-center justify-center">
                    <MapPin size={24} strokeWidth={1} className="text-charcoal" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl text-charcoal">Select Shipping Details</h2>
                    <p className="text-[10px] text-charcoal/30 uppercase tracking-[0.1em] font-bold">Where your essence will be delivered</p>
                  </div>
                </div>
                <Link href="/profile" className="text-charcoal/40 hover:text-charcoal text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors border-b border-charcoal/10 pb-1">
                  <Plus size={12} /> Manage Profile
                </Link>
              </div>

              {isAddressesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="h-44 rounded-2xl bg-charcoal/5 animate-pulse" />
                  ))}
                </div>
              ) : (addresses.length === 0 && !(user as any)?.address) ? (
                <div className="p-16 rounded-3xl bg-charcoal/[0.02] border border-dashed border-charcoal/10 text-center space-y-6">
                  <MapPin size={40} strokeWidth={1} className="mx-auto text-charcoal/10" />
                  <p className="font-serif text-lg text-charcoal/40 italic">No shipping addresses found.</p>
                  <Link href="/profile" className="inline-block px-10 py-4 bg-charcoal text-cream font-bold rounded-full text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-charcoal/5">
                    Visit Profile to Add Address
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Actual Addresses */}
                  {addresses.map((addr) => {
                    const addressId = addr.id || (addr as any)._id;
                    const Icon = addr.type === 'home' ? Home : addr.type === 'work' ? Briefcase : Compass;
                    return (
                      <motion.div
                        key={addressId}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedAddressId(addressId)}
                        className={`cursor-pointer p-8 rounded-[2.5rem] border transition-all duration-500 relative group overflow-hidden ${selectedAddressId === addressId
                          ? "bg-cream-dark border-charcoal shadow-2xl shadow-charcoal/10"
                          : "bg-charcoal/[0.02] border-charcoal/5 hover:border-charcoal/20"
                          }`}
                      >
                        {/* Selection Badge */}
                        <div className={`absolute top-0 right-0 p-6 transition-all duration-500 ${selectedAddressId === addressId ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                          }`}>
                          <div className="bg-charcoal text-cream p-2 rounded-full">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>

                        {/* Hover Invite */}
                        {selectedAddressId !== addressId && (
                          <div className="absolute inset-0 bg-charcoal/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-charcoal text-cream text-[9px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full shadow-xl">
                              Deliver here
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col h-full relative z-10 transition-transform group-hover:scale-[0.98] duration-500">
                          <div className="flex items-center gap-2 mb-4">
                            <Icon size={12} className={selectedAddressId === addressId ? "text-charcoal" : "text-charcoal/30"} />
                            <span className={`font-sans text-[9px] uppercase tracking-[0.2em] font-bold transition-colors ${selectedAddressId === addressId ? "text-charcoal" : "text-charcoal/30"
                              }`}>{addr.type}</span>
                          </div>
                          <h3 className="font-serif text-charcoal text-xl mb-3">{addr.firstName} {addr.lastName}</h3>
                          <p className="font-sans text-xs text-charcoal/60 leading-relaxed mb-6 flex-1">
                            {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="font-sans text-[10px] text-charcoal/40 tracking-[0.1em] font-medium">{addr.phone}</p>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Add New Address Card */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => setIsAddingAddress(true)}
                    className="cursor-pointer p-8 rounded-[2.5rem] border border-dashed border-charcoal/10 hover:border-charcoal/30 bg-charcoal/[0.01] hover:bg-charcoal/[0.03] transition-all duration-500 flex flex-col items-center justify-center text-center group min-h-[220px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-charcoal/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus size={20} className="text-charcoal/40" />
                    </div>
                    <p className="font-serif text-lg text-charcoal/60 mb-1">New Destination</p>
                    <p className="text-[9px] text-charcoal/30 uppercase tracking-[0.2em] font-bold">Register a haven</p>
                  </motion.div>
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8  pt-2 border-t border-charcoal/5">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-charcoal/5 flex items-center justify-center">
                    <ShoppingCart size={18} strokeWidth={1} className="text-charcoal" />
                  </div>
                  <h3 className="font-serif text-xl text-charcoal">Delivery Strategy</h3>
                </div>
                <div className="p-8 rounded-3xl bg-charcoal/[0.03] border border-charcoal/5">
                  <p className="text-xs text-charcoal/60 leading-relaxed">
                    All collections are dispatched via <span className="text-charcoal font-bold italic">Complimentary Express</span>.
                    Estimated transit: 3-5 business days across India.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[8px] uppercase tracking-widest text-charcoal/40 font-black">
                    <ShieldCheck size={12} /> Carbon Neutral Shipping
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-charcoal/5 flex items-center justify-center">
                    <CreditCard size={18} strokeWidth={1} className="text-charcoal" />
                  </div>
                  <h3 className="font-serif text-xl text-charcoal">Payment Essence</h3>
                </div>
                <div className="p-8 rounded-3xl bg-charcoal/[0.03] border border-charcoal/5 flex flex-col justify-between aspect-video md:aspect-auto">
                  <div>
                    <h4 className="font-serif text-charcoal text-[base] mb-1">Razorpay Secure</h4>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest font-bold">UPI, Cards, Netbanking</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-charcoal/5">
                    <span className="text-[8px] uppercase tracking-widest text-charcoal/40 font-bold">Fully Encrypted</span>
                    <div className="flex gap-2 opacity-30">
                      <div className="w-6 h-4 bg-charcoal/20 rounded-sm" />
                      <div className="w-6 h-4 bg-charcoal/20 rounded-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar: Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-8">
            <div className="p-10 rounded-[2.5rem] bg-cream-dark/50 border border-charcoal/5 shadow-2xl backdrop-blur-sm">
              <h3 className="font-serif text-2xl text-charcoal mb-8 pb-4 border-b border-charcoal/5">Order Overview</h3>

              <div className="space-y-6 mb-10 max-h-[30vh] overflow-y-auto pr-4 custom-scrollbar">
                {cart?.items.map((item) => (
                  <div key={item.id || `${item.productId}-${item.variantId}`} className="flex gap-4 items-center group">
                    <div className="relative w-14 h-16 rounded-lg bg-charcoal/5 overflow-hidden border border-charcoal/5 shrink-0">
                      <SafeProductImage
                        src={item.image || item.product?.images?.find(i => i.isPrimary)?.url || ""}
                        alt={item.name || item.product?.name || "Product"}
                        fill
                        productName={item.name || item.product?.name}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-charcoal text-sm truncate uppercase tracking-tight">{item.name || item.product?.name}</h4>
                      <p className="font-sans text-[9px] text-charcoal/40 uppercase tracking-[0.15em] mt-1 font-bold">Qty: {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-serif text-sm text-charcoal">₹{item.totalPrice?.toLocaleString()}</span>
                      {((item as any).originalPrice || 0) > item.price && (
                        <span className="font-sans text-[9px] text-charcoal/30 line-through mt-0.5">
                          ₹{((item as any).originalPrice * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-charcoal/5">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">Subtotal</span>
                  <span className="font-serif text-charcoal text-base">₹{cart?.totalAmount?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 group relative">
                    <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">
                      GST (18%)
                    </span>

                    {/* Info Icon */}
                    <Info size={12} className="text-charcoal/40 cursor-pointer" />

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
                  <span className="font-sans text-[10px] text-charcoal/40 uppercase tracking-[0.2em] font-bold">Shipping</span>
                  <span className="font-sans text-green-600 text-[10px] uppercase tracking-[0.2em] font-black">Complimentary</span>
                </div>
                <div className="pt-6 flex justify-between items-end border-t border-charcoal/5">
                  <span className="font-sans text-[11px] text-charcoal font-black uppercase tracking-[0.3em]">Total</span>
                  <span className="font-serif text-3xl text-charcoal leading-none">
                    ₹{(
                      (cart?.totalAmount || 0) * 1.18
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>                </div>
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 flex gap-3 p-5 rounded-2xl bg-red-50 text-red-600 text-[10px] leading-relaxed font-bold uppercase tracking-wider"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="w-full mt-10 bg-charcoal text-cream hover:opacity-90 disabled:opacity-30 text-cream font-bold py-5 rounded-full flex items-center justify-center gap-4 transition-all shadow-2xl shadow-charcoal/10 active:scale-95 group"
              >
                {isPlacingOrder ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.3em] text-[10px]">Secure Scent Journey</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-8 flex items-center justify-center gap-3 text-[8px] uppercase tracking-[0.3em] text-charcoal/20 font-bold italic">
                <ShieldCheck size={14} strokeWidth={1} />
                Guaranteed safe checkout
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddingAddress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-charcoal/60 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setIsAddingAddress(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-cream w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-serif text-4xl text-charcoal mb-2">New <span className="italic">Haven</span></h3>
              <p className="text-[10px] text-charcoal/30 uppercase tracking-[0.2em] font-bold mb-10">Where should we send your essence?</p>

              <form onSubmit={handleAddAddress} className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">First Name</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.firstName}
                    onChange={e => setAddressForm({ ...addressForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Last Name</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.lastName}
                    onChange={e => setAddressForm({ ...addressForm, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Contact Number</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.phone}
                    onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Sanctuary Details</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Street, Area, Landmark"
                    value={addressForm.addressLine1}
                    onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">City</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.city}
                    onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">State</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.state}
                    onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Pincode</label>
                  <input
                    className="w-full bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    value={addressForm.pincode}
                    onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[8px] uppercase tracking-widest font-black text-charcoal/30">Type</label>
                  <div className="flex items-center gap-3">
                    {(['home', 'work', 'other'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, type: t })}
                        className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all ${addressForm.type === t ? 'bg-charcoal text-cream shadow-lg' : 'bg-charcoal/5 text-charcoal/40 hover:bg-charcoal/10'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 flex gap-6 pt-10">
                  <button type="submit" className="flex-1 bg-charcoal text-cream py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-charcoal/20 active:scale-95 transition-all">
                    Secure Destination
                  </button>
                  <button type="button" onClick={() => setIsAddingAddress(false)} className="px-10 border border-charcoal/10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-charcoal/40 hover:bg-charcoal/5 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
