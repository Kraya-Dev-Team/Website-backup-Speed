"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminBrandsApi, type BrandPayload } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

import ComponentCard from "@/components/common/ComponentCard";
import { Tag, ChevronLeft, AlertCircle, CheckCircle2, Globe, Calendar, Info, Link as LinkIcon } from "lucide-react";
import { toast } from "react-toastify";
import Checkbox from "@/components/ui/Checkbox";

export default function NewBrandPage() {
  const router = useRouter();
  const [form, setForm] = useState<BrandPayload>({ 
    name: "", 
    slug: "", 
    description: "", 
    logo:"", 
    country:"", 
    website:"", 
    isFeatured: false, 
    isActive: true 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof BrandPayload, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { 
      setError("Formal Brand Name is essential for system registration."); 
      toast.warning("Incomplete Data: Formal Designation Required.");
      return; 
    }
    setLoading(true);
    try {
      await adminBrandsApi.create(form);
      toast.success("BRAND AUTHORITY ESTABLISHED SUCCESSFULLY");
      router.push("/dashboard/brands");
    } catch (err: any) {
      const msg = err?.message || "Failed to establish brand record.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 mx-auto pb-20">
      <ComponentCard
        title="Register Brand Authority"
        desc="Register a fresh fragrance house in your global catalog and authority registry"
        formIcon={<Tag size={20} className="text-brand-600" />}
        action={
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-[10px] !py-2 !px-4">
            <ChevronLeft size={14} strokeWidth={3} />
            DISCARD CHANGES
          </Button>
        }
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="bg-error-50 border border-error-100 p-6 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-top duration-300">
              <AlertCircle className="text-error-600" size={24} />
              <span className="text-[11px] font-black text-error-600 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                id="brand-name" 
                label="Formal Designation *" 
                placeholder="e.g. DIOR" 
                value={form.name} 
                onChange={(e) => set("name", e.target.value)} 
              />
              <Input 
                id="brand-slug" 
                label="Intelligence URL Slug" 
                placeholder="e.g. dior" 
                value={form.slug || ""} 
                onChange={(e) => set("slug", e.target.value)} 
              />
              <div className="relative">
                <Globe className="absolute right-4 top-10 text-text-body/30" size={16} />
                <Input 
                  id="brand-country" 
                  label="Country of Origin" 
                  placeholder="e.g. FRANCE" 
                  value={form.country || ""} 
                  onChange={(e) => set("country", e.target.value)} 
                />
              </div>
              <div className="relative">
                <Calendar className="absolute right-4 top-10 text-text-body/30" size={16} />
                <Input 
                  id="brand-founded" 
                  label="Legacy Commencement (Year)" 
                  type="number" 
                  placeholder="e.g. 1946" 
                  value={form.founded || ""} 
                  onChange={(e) => set("founded", Number(e.target.value))} 
                />
              </div>
            </div>
            
            <div className="relative">
              <LinkIcon className="absolute right-4 top-10 text-text-body/30" size={16} />
              <Input 
                id="brand-website" 
                label="Brand Website URL" 
                placeholder="https://www.brand.com" 
                value={form.website || ""} 
                onChange={(e) => set("website", e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-text-body/60 uppercase tracking-widest ml-1">Historical Narrative (Description)</label>
              <textarea 
                className="w-full bg-white border border-border-light rounded-2xl py-4 px-5 text-sm font-semibold text-text-heading min-h-[140px] outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all placeholder:text-gray-300" 
                placeholder="NARRATE THE HISTORY AND PHILOSOPHY OF THIS BRAND..."
                value={form.description || ""} 
                onChange={(e) => set("description", e.target.value)} 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 p-4 bg-bg-main/50 border border-border-light rounded-xl">
               <Checkbox 
                 label="IS FEATURED?"
                 checked={!!form.isFeatured}
                 onChange={(val) => set("isFeatured", val)}
                 className="flex-1"
               />
               <Checkbox 
                 label="IS ACTIVE?"
                 checked={!!form.isActive}
                 onChange={(val) => set("isActive", val)}
                 className="flex-1"
               />
            </div>
          </div>

          <div className="flex gap-6  border-t border-border-light">
            <Button id="submit-brand-btn" type="submit" isLoading={loading} className="flex-1 h-14 text-[11px]">
             ADD BRAND
            </Button>
            <Button variant="ghost" type="button" onClick={() => router.back()} className="px-12 h-14 border border-border-light rounded-[1.5rem] text-[11px] text-text-body/60 hover:text-error-600 hover:bg-error-50">
              DISCARD CHANGES
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
