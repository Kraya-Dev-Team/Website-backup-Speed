"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminProductsApi, type Product, type ProductPayload } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "@/components/products/ProductForm";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import { Package, ChevronLeft, AlertCircle } from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminProductsApi.getById(id)
      .then((res) => {
        setProduct(res.data);
      })
      .catch(() => setError("Product not found in current inventory scope."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: ProductPayload) => {
    setError(""); 
    setSaving(true);
    try {
      await adminProductsApi.update(id, data);
      toast.success("Product updated successfully");
    } catch (err: any) {
      const msg = err?.message || "Failed to update products.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Syncing Entity Detail...</span>
    </div>
  );

  if (!product) return (
    <div className="max-w-xl mx-auto mt-20 p-10 bg-error-50 border border-error-100 rounded-[2.5rem] flex flex-col items-center text-center gap-6">
      <AlertCircle size={48} className="text-error-600" />
      <div className="flex flex-col gap-2">
         <h3 className="text-xl font-black text-error-600 uppercase tracking-tight">Access Denial: Entity Not Found</h3>
         <p className="text-[11px] font-black text-error-600/60 uppercase tracking-widest">{error || "The requested product ID does not exist in the master inventory."}</p>
      </div>
      <Button variant="outline" onClick={() => router.back()} className="border-error-200 text-error-600 hover:bg-error-100">
        RETURN TO INVENTORY
      </Button>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 w-full mx-auto pb-20">
      <ComponentCard
        title="Modify Spectral Entity"
        desc={`Refining: ${product.name.toUpperCase()} • System ID: ${id.slice(0, 12)}...`}
        formIcon={<Package size={20} className="text-brand-600" />}
        action={
          <Button variant="primary" onClick={() => router.back()} className="gap-2 text-[11px] !py-3 !px-4">
            <ChevronLeft size={14} strokeWidth={3} />
            BACK TO ALL PRODUCTS
          </Button>
        }
      >
        <div className="p-2">
          <ProductForm 
            initialData={product} 
            onSubmit={handleSubmit} 
            isLoading={saving} 
            submitLabel="Save All Changes" 
          />
        </div>
      </ComponentCard>
    </div>
  );
}
