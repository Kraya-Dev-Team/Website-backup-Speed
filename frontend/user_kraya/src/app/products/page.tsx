"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productsApi, type Product } from "@/lib/api/products";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, SlidersHorizontal, ArrowRight } from "lucide-react";
import SafeProductImage from "@/components/products/SafeProductImage";

/* ══════════════════════════════════════════════
   PRODUCTS PAGE
   ══════════════════════════════════════════════ */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "bestsellers" | "new">("all");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        let response;
        if (activeFilter === "bestsellers") {
          response = await productsApi.getBestsellers();
        } else if (activeFilter === "new") {
          response = await productsApi.getNewArrivals();
        } else {
          response = await productsApi.search({ limit: 20 });
        }
        if (response.success) {
          setProducts(response.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeFilter]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] pt-32 pb-20 px-6 sm:px-12 lg:px-20 text-[#2C1810]">
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-playfair text-5xl md:text-7xl font-light mb-6 tracking-tight"
        >
          The Collection
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-jakarta text-lg text-[#2C1810]/60 max-w-2xl leading-relaxed"
        >
          Discover our olfactory masterpieces. Each essence is a silent dialogue between tradition and transgression, crafted for those who define their own luxury.
        </motion.p>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-2 mt-8 flex-wrap"
        >
          {(["all", "bestsellers", "new"] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full font-jakarta font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-[#2C1810] text-[#FFF7EB] shadow-lg"
                  : "bg-[#2C1810]/5 text-[#2C1810]/50 hover:bg-[#2C1810]/10 hover:text-[#2C1810]"
              }`}
            >
              {filter === "all" ? "All Essences" : filter === "bestsellers" ? "Bestsellers" : "New Arrivals"}
            </button>
          ))}
        </motion.div>
      </header>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/5] bg-[#2C1810]/5 rounded-2xl" />
                <div className="h-4 bg-[#2C1810]/5 w-2/3 rounded-full" />
                <div className="h-4 bg-[#2C1810]/5 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
          >
            <AnimatePresence>
              {filteredProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <h3 className="font-playfair text-2xl mb-2 text-[#2C1810]/40">No essence found</h3>
            <p className="font-jakarta text-[#2C1810]/30">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

    const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
    const displayPrice = defaultVariant?.price || 0;
    const displayDiscount = defaultVariant?.discountPrice;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ 
          duration: 0.8, 
          delay: index * 0.05,
          ease: [0.16, 1, 0.3, 1] 
        }}
        className="group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#F4F3EF] mb-6 shadow-sm border border-[#2C1810]/5">
            <SafeProductImage
              src={product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || ""}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              productName={product.name}
            />
            
            {/* Quick Add Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-x-4 bottom-4"
            >
              <div className="w-full h-14 bg-white/90 backdrop-blur-md text-[#2C1810] rounded-xl font-jakarta font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#2C1810] hover:text-white transition-all duration-300 flex items-center justify-center cursor-pointer">
                Explore Essence
              </div>
            </motion.div>
  
            {/* New/Featured Badge */}
            {product.isNew && (
              <div className="absolute top-4 left-4 h-6 px-3 bg-[#2C1810] text-[#FFF7EB] rounded-full flex items-center justify-center">
                <span className="text-[9px] font-bold uppercase tracking-[0.1em]">New</span>
              </div>
            )}
          </div>
  
          <div className="space-y-2">
            {/* Top Row: Brand & Savings */}
            <div className="flex justify-between items-center">
              <p className="font-jakarta text-[10px] uppercase tracking-[0.25em] text-[#2C1810]/40 font-bold">
                {product.brand.name}
              </p>
              {displayDiscount && (
                <span className="font-jakarta text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">
                  Save ₹{displayPrice - displayDiscount}
                </span>
              )}
            </div>

            {/* Middle Row: Product Name & Prices */}
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-playfair text-xl font-medium tracking-tight">
                {product.name}
              </h3>
              <div className="flex items-center gap-3 pt-1 whitespace-nowrap">
                {displayDiscount ? (
                  <>
                    <span className="font-plus-jakarta font-medium text-lg text-[#2C1810]">
                      ₹{displayDiscount}
                    </span>
                    <span className="font-plus-jakarta font-light text-[#2C1810]/30 text-sm line-through decoration-1">
                      ₹{displayPrice}
                    </span>
                  </>
                ) : (
                  <span className="font-plus-jakarta font-medium text-lg text-[#2C1810]">
                    ₹{displayPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* <div className="pt-2 flex items-center gap-2 group/link">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#2C1810]/60 group-hover/link:text-[#2C1810] transition-colors">
              Explore Essence
            </span>
            <ArrowRight size={12} className="text-[#2C1810]/40 group-hover/link:text-[#2C1810] transition-all transform group-hover/link:translate-x-1" />
          </div> */}
      </Link>
    </motion.div>
  );
}
