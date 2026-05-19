"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { productsApi, type Product, type ProductVariant } from "@/lib/api/products";
import { reviewsApi, type Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Clock,
  ShoppingBag,
  Share2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Sparkles,
  Plus,
  Minus,
  Loader2,
} from "lucide-react";
import { ProductSkeleton } from "./loading";
import SafeProductImage from "@/components/products/SafeProductImage";


/* ──────────────────────────────────────────────────────────────────
   PRODUCT DETAIL PAGE
────────────────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { slug } = useParams() as { slug: string };
  const id = slug; // The URL contains the ID, but Nex.js expects the folder name 'slug'
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [shared, setShared] = useState(false);
  const { isLoggedIn, setShowLogin } = useAuth();
  const { addToCart } = useCart();

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", title: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* scroll parallax */
  const { scrollY } = useScroll();
  const imgParallax = useTransform(scrollY, [0, 600], ["0%", "6%"]);

  /* Fetch with ID */
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await productsApi.getById(id);
        if (res.success && res.data) {
          setProduct(res.data);
          const primaryIdx = res.data.images.findIndex(img => img.isPrimary);
          if (primaryIdx !== -1) setSelectedImage(primaryIdx);
        } else {
          router.push("/products");
        }
      } catch {
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  // Fetch reviews when product ID is available
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await reviewsApi.getByProduct(id, { limit: 6 });
        if (res.success) setReviews(res.data.reviews);
      } catch { /* silent */ } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { setShowLogin(true); return; }
    if (!reviewForm.comment.trim()) return;
    setIsSubmittingReview(true);
    setReviewMessage(null);
    try {
      const res = await reviewsApi.create({
        productId: id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      });
      if (res.success) {
        setReviews(prev => [res.data, ...prev]);
        setReviewForm({ rating: 5, comment: "", title: "" });
        setReviewMessage({ type: "success", text: "Review submitted successfully!" });
      }
    } catch (err: any) {
      setReviewMessage({ type: "error", text: err.message || "Failed to submit review." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const prevImage = useCallback(() => {
    setSelectedImage((i) => (i - 1 + (product?.images.length ?? 1)) % (product?.images.length ?? 1));
  }, [product]);

  const nextImage = useCallback(() => {
    setSelectedImage((i) => (i + 1) % (product?.images.length ?? 1));
  }, [product]);

  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (!product) return null;

  const currentVariant: ProductVariant | undefined = product.variants?.[selectedVariant];
  const originalPrice = currentVariant?.price ?? product.basePrice;
  const discountedPrice = currentVariant?.discountPrice ?? product.discountPrice;
  const images = product.images ?? [];
  const hasMultipleImages = images.length > 1;
  const currentImageUrl = images[selectedImage]?.url ?? "";

  const handleAddToBag = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    setIsAdding(true);
    try {
      const variantId = product.variants?.[selectedVariant]?.id || "";
      await addToCart(product.id, variantId, quantity);
      setAddedToBag(true);
      setTimeout(() => setAddedToBag(false), 2200);
    } catch (err) {
      console.error("Failed to add to bag:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Experience ${product.name} | Kraya`,
      text: `Discover this amazing fragrance: ${product.name}. Check it out at Kraya.`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal">

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 lg:px-20 pt-28 pb-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 group font-jakarta text-[10px] uppercase tracking-[0.25em] font-bold transition-all text-charcoal/50"
        >
          <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="group-hover:opacity-100 opacity-80 transition-opacity">Collection</span>
          <span className="text-charcoal/30">/</span>
          <span className="text-charcoal/60 max-w-[14ch] truncate">{product.name}</span>
        </Link>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 lg:px-20 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">

          {/* GALLERY */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse md:flex-row gap-5">
              {hasMultipleImages && (
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className="relative shrink-0 rounded-xl overflow-hidden transition-all duration-300"
                      style={{
                        width: 72,
                        height: 90,
                        border: `2px solid ${selectedImage === idx ? "#D4A373" : "rgba(212,163,115,0.1)"}`,
                        opacity: selectedImage === idx ? 1 : 0.5,
                        background: "#1A1410",
                      }}
                    >
                      <SafeProductImage
                        src={img.url}
                        alt={`${product.name} view ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="72px"
                        productName={product.name}
                      />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-5">
                <div
                  className="relative rounded-3xl overflow-hidden"
                  style={{
                    aspectRatio: "4/5",
                    background: "#1A1410",
                    border: "1px solid rgba(212,163,115,0.1)",
                  }}
                >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0"
                    style={{ translateY: imgParallax }}
                  >
                    <SafeProductImage
                      src={currentImageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width:1024px) 100vw, 58vw"
                      priority
                      productName={product.name}
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(13,10,8,0.45) 100%)" }} />
                
                {/* Badges */}
                <div className="absolute top-5 left-5 flex flex-col gap-2 z-20">
                  {product.isNew && (
                    <span className="h-6 px-3 rounded-full font-jakarta text-[9px] font-bold uppercase tracking-[0.15em] flex items-center" style={{ background: "#1a1410", color: "#f7f3e8" }}>
                      New Arrival
                    </span>
                  )}
                  {product.isBestseller && (
                    <span className="h-6 px-3 rounded-full font-jakarta text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1" style={{ background: "rgba(26,20,16,0.05)", color: "#1a1410", border: "1px solid rgba(26,20,16,0.1)", backdropFilter: "blur(8px)" }}>
                      <BadgeCheck size={10} />
                      Bestseller
                    </span>
                  )}
                </div>

                {hasMultipleImages && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(247,243,232,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(26,20,16,0.1)" }}>
                      <ChevronLeft size={16} style={{ color: "#1a1410" }} />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(247,243,232,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(26,20,16,0.1)" }}>
                      <ChevronRight size={16} style={{ color: "#1a1410" }} />
                    </button>
                  </>
                )}
              </div>
                {/* Info Bar */}
                {/* <div className="px-6 py-4 rounded-2xl flex items-center justify-between gap-4" style={{ background: "rgba(26,20,16,0.02)", border: "1px solid rgba(26,20,16,0.05)" }}>
                  {[{ l: "Season", v: product.season }, { l: "Gender", v: product.gender }, { l: "Type", v: product.type }].map(x => (
                    <div key={x.l} className="text-center">
                      <p className="font-jakarta text-[8px] uppercase tracking-[0.25em] mb-1" style={{ color: "rgba(26,20,16,0.5)" }}>{x.l}</p>
                      <p className="font-jakarta text-xs capitalize" style={{ color: "rgba(26,20,16,0.7)" }}>{x.v}</p>
                    </div>
                  ))}
                </div> */}
              </div>
            </div>
          </div>

          {/* INFO */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="space-y-7">
              <div>
                <p className="font-jakarta text-[10px] uppercase tracking-[0.35em] font-bold mb-2 text-charcoal/60">
                  {product.brand?.name} 
                  {/* { product.category?.name && `· ${product.category.name}`} */}
                </p>
                <h1 className="font-playfair font-light leading-[1.05] tracking-tight text-charcoal" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
                  {product.name}
                </h1>
                {/* {product.shortDescription && <p className="mt-3 font-jakarta text-sm leading-relaxed text-charcoal/60">{product.shortDescription}</p>} */}
              </div>

              {/* <div className="flex items-center gap-5 pb-6 border-b border-charcoal/10">
                <div className="flex items-center gap-2">
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.rating ?? 0) ? "#1a1410" : "transparent"} color={i < Math.round(product.rating ?? 0) ? "#1a1410" : "rgba(26,20,16,0.15)"} />)}</div>
                  <span className="font-jakarta font-bold text-sm" style={{ color: "#1a1410" }}>{product.rating?.toFixed(1) ?? "—"}</span>
                </div>
                <div className="w-px h-4 bg-charcoal/15" />
                <span className="font-jakarta text-[11px] uppercase tracking-[0.2em] text-charcoal/40">{product.reviewCount ?? 0} Reviews</span>
              </div> */}

              {product.variants && product.variants.length > 0 && (
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-4 flex-1">
                    <p className="font-jakarta text-[10px] uppercase tracking-[0.25em] font-bold text-charcoal/50">Select Size</p>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((v, idx) => (
                        <button key={idx} onClick={() => setSelectedVariant(idx)} disabled={!v.isAvailable} className="h-12 px-6 rounded-xl font-jakarta text-xs font-bold uppercase tracking-widest transition-all duration-300" style={{ background: selectedVariant === idx ? "#1a1410" : "rgba(26,20,16,0.03)", color: selectedVariant === idx ? "#f7f3e8" : "rgba(26,20,16,0.6)", border: `1px solid ${selectedVariant === idx ? "#1a1410" : "rgba(26,20,16,0.1)"}`, opacity: v.isAvailable ? 1 : 0.35, cursor: v.isAvailable ? "pointer" : "not-allowed" }}>
                          {v.size} {v.unit}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end pt-1 shrink-0">
                    {discountedPrice ? (
                      <>
                        <p className="font-playfair text-4xl text-charcoal">₹{discountedPrice}</p>
                        <p className="font-jakarta text-sm text-charcoal/30 line-through mt-1">₹{originalPrice}</p>
                      </>
                    ) : (
                      <p className="font-playfair text-4xl text-charcoal">₹{originalPrice}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between p-2 px-4 rounded-xl bg-charcoal/5 border border-charcoal/10">
                  <span className="font-jakarta text-[10px] uppercase tracking-[0.25em] font-bold text-charcoal/50">Quantity</span>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 text-charcoal/40 hover:text-charcoal transition-colors"
                      disabled={isAdding}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-jakarta text-sm font-bold w-4 text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-1 text-charcoal/40 hover:text-charcoal transition-colors"
                      disabled={isAdding}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleAddToBag} 
                  disabled={(currentVariant !== undefined && !currentVariant.isAvailable) || isAdding} 
                  className="w-full h-16 rounded-2xl font-jakarta font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden" 
                  style={{ 
                    background: addedToBag ? "rgba(26,20,16,0.05)" : "#1a1410", 
                    color: addedToBag ? "#1a1410" : "#f7f3e8", 
                    border: addedToBag ? "1px solid rgba(26,20,16,0.2)" : "1px solid transparent",
                    opacity: (currentVariant !== undefined && !currentVariant.isAvailable) ? 0.5 : 1
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isAdding ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3"
                      >
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </motion.div>
                    ) : addedToBag ? (
                      <motion.div
                        key="added"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3"
                      >
                        <Sparkles size={16} /> Added to Bag
                      </motion.div>
                    ) : (
                      <motion.div
                        key="add"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3"
                      >
                        <ShoppingBag size={16} /> Add to Bag
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <div className="pt-2">
                  <button 
                    onClick={handleShare}
                    className="w-full h-12 rounded-xl border border-charcoal/10 font-jakarta text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-charcoal/5 transition-all text-charcoal/60"
                  >
                    <Share2 size={14} className={shared ? "text-green-600" : ""} /> 
                    {shared ? "Link Copied" : "Share with others"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                {[{ i: Truck, l: "Delivery", s: product.shipping?.shippingTime || "3-5 days" }, { i: ShieldCheck, l: "Authentic", s: "100% genuine" }, { i: Clock, l: "Support", s: "24/7" }].map(t => (
                  <div key={t.l} className="flex flex-col items-center justify-center p-4 rounded-2xl text-center gap-2" style={{ background: "rgba(26,20,16,0.02)", border: "1px solid rgba(26,20,16,0.05)" }}>
                    <t.i size={16} style={{ color: "rgba(26,20,16,0.5)" }} />
                    <div><p className="font-jakarta text-[9px] font-bold uppercase tracking-[0.1em] text-charcoal/60">{t.l}</p><p className="font-jakarta text-[8px] mt-0.5 text-charcoal/40">{t.s}</p></div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-charcoal/10">
                <div className="font-jakarta text-sm leading-relaxed text-charcoal/60">
                  {product.description || "A masterpiece of modern olfaction."}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── REVIEWS SECTION ── */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-12 lg:px-20 py-20 border-t border-charcoal/10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="font-jakarta text-[10px] uppercase tracking-[0.35em] font-bold mb-2" style={{ color: "rgba(26,20,16,0.5)" }}>Customer Reviews</p>
            <h2 className="font-playfair text-3xl text-charcoal">Voices of the Collectors</h2>
          </div>
          <span className="font-jakarta text-[11px] uppercase tracking-[0.2em] text-charcoal/40">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Review List */}
          <div className="lg:col-span-7 space-y-6">
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse bg-charcoal/5" />
              ))
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-charcoal/20 rounded-[1.5rem]">
                <p className="font-jakarta text-sm text-charcoal/50">Be the first to share your experience.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl"
                  style={{ background: "rgba(26,20,16,0.02)", border: "1px solid rgba(26,20,16,0.05)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-jakarta text-sm font-bold text-charcoal">{review.userName || "Verified Collector"}</p>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} fill={i < review.rating ? "#1a1410" : "transparent"} color={i < review.rating ? "#1a1410" : "rgba(26,20,16,0.15)"} />
                        ))}
                      </div>
                    </div>
                    <span className="font-jakarta text-[10px] text-charcoal/40">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {review.title && <p className="font-jakarta text-xs font-bold mb-1 text-charcoal/80">{review.title}</p>}
                  <p className="font-jakarta text-sm leading-relaxed text-charcoal/60">{review.comment}</p>
                  {review.isVerified && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <BadgeCheck size={11} style={{ color: "#1a1410" }} />
                      <span className="font-jakarta text-[9px] uppercase tracking-[0.2em] font-bold text-charcoal/60">Verified Purchase</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl bg-charcoal/[0.03] border border-charcoal/10">
              <h3 className="font-playfair text-xl mb-6 text-charcoal">Share Your Experience</h3>
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* Star Rating */}
                <div>
                  <p className="font-jakarta text-[9px] uppercase tracking-[0.3em] font-bold mb-3 text-charcoal/60">Your Rating</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReviewForm(f => ({ ...f, rating: i + 1 }))}
                        className="transition-transform hover:scale-125"
                      >
                        <Star size={22} fill={i < reviewForm.rating ? "#1a1410" : "transparent"} color={i < reviewForm.rating ? "#1a1410" : "rgba(26,20,16,0.15)"} />
                      </button>
                    ))}
                  </div>
                </div>
                {/* Title */}
                <div>
                  <p className="font-jakarta text-[9px] uppercase tracking-[0.3em] font-bold mb-2 text-charcoal/60">Review Title</p>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Summarise your experience..."
                    className="w-full bg-transparent px-0 py-2 font-jakarta text-sm outline-none placeholder:text-charcoal/30 text-charcoal"
                    style={{ borderBottom: "1px solid rgba(26,20,16,0.2)" }}
                  />
                </div>
                {/* Comment */}
                <div>
                  <p className="font-jakarta text-[9px] uppercase tracking-[0.3em] font-bold mb-2 text-charcoal/60">Your Review</p>
                  <textarea
                    required
                    rows={4}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Tell us what you love about this fragrance..."
                    className="w-full bg-transparent px-0 py-2 font-jakarta text-sm outline-none resize-none placeholder:text-charcoal/30 text-charcoal"
                    style={{ borderBottom: "1px solid rgba(26,20,16,0.2)" }}
                  />
                </div>

                <AnimatePresence>
                  {reviewMessage && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="font-jakarta text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: reviewMessage.type === "success" ? "#4ade80" : "#f87171" }}
                    >
                      {reviewMessage.text}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full h-14 rounded-2xl font-jakarta font-bold text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all bg-charcoal text-cream hover:opacity-90"
                  style={{ opacity: isSubmittingReview ? 0.6 : 1 }}
                >
                  {isSubmittingReview ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isLoggedIn ? (isSubmittingReview ? "Submitting..." : "Submit Review") : "Sign in to Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


