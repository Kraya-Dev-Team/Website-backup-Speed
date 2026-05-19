"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminProductsApi, type ProductPayload } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/products/ProductForm";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import { PackagePlus, ChevronLeft, AlertCircle } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: ProductPayload) => {
    setLoading(true);
    setError("");
    try {
      await adminProductsApi.create(data);
      toast.success("Product added successfully.");
      router.push("/dashboard/products");
    } catch (err: any) {
      const msg = err?.message || "Failed to add product.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20">
      <ComponentCard
        title="Initialize Spectral Entity"
        desc="Engineer a fresh fragrance profile for your global storefront and inventory matrix"
        formIcon={<PackagePlus size={20} className="text-brand-600" />}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-[10px] !py-2 !px-4">
            <ChevronLeft size={14} strokeWidth={3} />
            BACK TO MATRIX
          </Button>
        }
      >
        <div className="p-8">
          {error && (
            <div className="bg-error-50 border border-error-100 p-6 rounded-[1.5rem] flex items-center gap-4 mb-10 animate-in slide-in-from-top duration-300">
               <AlertCircle className="text-error-600" size={24} />
               <span className="text-[11px] font-black text-error-600 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <ProductForm 
            onSubmit={handleSubmit} 
            isLoading={loading} 
            submitLabel="Add Product" 
          />
        </div>
      </ComponentCard>
    </div>
  );
}
