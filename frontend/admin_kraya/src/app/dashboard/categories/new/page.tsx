"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCategoriesApi, type CategoryPayload } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { Layers, ChevronLeft, AlertCircle, Link as LinkIcon, Info } from "lucide-react";
import { toast } from "react-toastify";
import Checkbox from "@/components/ui/Checkbox";

export default function NewCategoryPage() {
  const router = useRouter();
  const [form, setForm] = useState<CategoryPayload>({ 
    name: "", 
    slug: "", 
    description: "", 
    parentId: null, 
    isFeatured: false, 
    isActive: true 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof CategoryPayload, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { 
      setError("Taxonomy Label is essential for classification establishment."); 
      toast.warning("Incomplete Data: Classification Label Required.");
      return; 
    }
    setLoading(true);
    try {
      await adminCategoriesApi.create(form);
      toast.success("Category created successfully");
      router.push("/dashboard/categories");
    } catch (err: any) {
      const msg = err?.message || "Failed to catalog new category.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 mx-auto pb-20">
      <ComponentCard
        title="ADD NEW CATEGORY"
        desc="Create a new category to organize your products"
        formIcon={<Layers size={20} className="text-brand-600" />}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-[10px] !py-2 !px-4">
            <ChevronLeft size={14} strokeWidth={3} />
            DISCARD CHANGES
          </Button>
        }
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-6">
          {error && (
            <div className="bg-error-50 border border-error-100 p-6 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-top duration-300">
               <AlertCircle className="text-error-600" size={24} />
               <span className="text-[11px] font-black text-error-600 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                id="cat-name" 
                label="Category Name *" 
                placeholder="e.g. PERFUMES" 
                value={form.name} 
                onChange={(e) => set("name", e.target.value)} 
              />
              <Input 
                id="cat-slug" 
                label="URL Slug" 
                placeholder="e.g. perfumes" 
                value={form.slug || ""} 
                onChange={(e) => set("slug", e.target.value)} 
              />
            </div>

            <div className="relative">
              <Info className="absolute right-4 top-10 text-text-body/30" size={16} />
              <Input 
                id="cat-parentId" 
                label="Parent Category (Optional)" 
                placeholder="PASTE PARENT ID HERE..." 
                value={form.parentId || ""} 
                onChange={(e) => set("parentId", e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-text-body/60 uppercase tracking-widest ml-1">Status</label>
              <div className="flex flex-col sm:flex-row gap-6 p-4 bg-bg-main/50 border border-border-light rounded-xl">
                 <Checkbox 
                   label="FEATURED?"
                   checked={!!form.isFeatured}
                   onChange={(val) => set("isFeatured", val)}
                   className="flex-1"
                 />
                 <Checkbox 
                   label="ACTIVE?"
                   checked={!!form.isActive}
                   onChange={(val) => set("isActive", val)}
                   className="flex-1"
                 />
              </div>
            </div>
          </div>

          <div className="flex gap-4 border-t border-border-light pt-6">
            <Button id="submit-cat-btn" type="submit" isLoading={loading} className="flex-1 h-14">
              CREATE CATEGORY
            </Button>
            <Button variant="ghost" type="button" onClick={() => router.back()} className="px-12 border border-border-light rounded-xl h-14 text-text-body/60">
              CANCEL
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
