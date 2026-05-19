"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import ComponentCard from "@/components/common/ComponentCard";
import { 
  adminBrandsApi, 
  adminCategoriesApi, 
  adminMediaApi, 
  type ProductPayload, 
  type ProductVariant, 
  type ProductImage, 
  type Brand, 
  type Category 
} from "@/lib/api";
import { toast } from "react-toastify";
import { 
  Info, 
  Layers, 
  Box, 
  Image as ImageIcon, 
  Wind, 
  Eye, 
  Truck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Upload,
  Star,
  AlertCircle,
  Loader2
} from "lucide-react";

const TYPES = ["perfume", "attar", "oil", "body-spray", "deodorant", "gift-set", "other"];
const GENDERS = ["men", "women", "unisex"];
const SEASONS = ["spring", "summer", "fall", "winter", "all-season"];
const CONCENTRATIONS = ["eau-de-parfum", "eau-de-toilette", "eau-de-cologne", "parfum", "extraits", "body-mist"];

interface ProductFormProps {
  initialData?: Partial<ProductPayload>;
  onSubmit: (data: ProductPayload) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProductForm({ initialData, onSubmit, isLoading, submitLabel = "Save Product" }: ProductFormProps) {
  const [form, setForm] = useState<ProductPayload>({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    basePrice: 0,
    type: "perfume",
    gender: "unisex",
    concentration: "eau-de-parfum",
    season: "all-season",
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    isActive: true,
    isArchived: false,
    tags: [],
    mood: [],
    perfumeNotes: { top: [], heart: [], base: [] },
    brand: { id: "", name: "" },
    category: { id: "", name: "" },
    variants: [],
    images: [],
    shipping: { weight: 0, freeShipping: false, shippingTime: "" },
    ...initialData,
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      adminBrandsApi.list({ active: true }),
      adminCategoriesApi.list(),
    ]).then(([brandsRes, catsRes]) => {
      setBrands(brandsRes.data);
      setCategories(catsRes.data);
    }).catch(err => {
      console.error("Failed to fetch catalog data", err);
    });
  }, []);

  useEffect(() => {
    if (form.variants && form.variants.length > 0) {
      const hasDefault = form.variants.some(v => v.isDefault);
      if (!hasDefault) {
        const vs = [...form.variants];
        vs[0].isDefault = true;
        setForm(prev => ({ ...prev, variants: vs, basePrice: vs[0].price, discountPrice: vs[0].discountPrice || null }));
      }
    }
  }, [form.variants?.length]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name) return setError("Product name is required.");
    if (!form.brand?.id) return setError("Brand is required.");
    if (!form.category?.id) return setError("Category is required.");
    if (!form.variants || form.variants.length === 0) return setError("At least one variant is required.");
    
    await onSubmit(form);
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    let vs = [...(form.variants || [])];
    if (updates.isDefault) {
      vs = vs.map((v, i) => i === index ? { ...v, ...updates } : { ...v, isDefault: false });
      const target = vs[index];
      setForm(prev => ({ ...prev, variants: vs, basePrice: target.price, discountPrice: target.discountPrice || null }));
    } else {
      vs[index] = { ...vs[index], ...updates };
      if (vs[index].isDefault) {
        setForm(prev => ({ ...prev, variants: vs, basePrice: vs[index].price, discountPrice: vs[index].discountPrice || null }));
      } else {
        set("variants", vs);
      }
    }
  };

  const addVariant = () => {
    const isFirst = (form.variants || []).length === 0;
    set("variants", [
      ...(form.variants || []),
      { id: `v-${Date.now()}`, size: "", unit: "ml", price: form.basePrice || 0, stock: 0, sku: "", isAvailable: true, isDefault: isFirst }
    ]);
  };

  const removeVariant = (index: number) => {
    set("variants", (form.variants || []).filter((_, i) => i !== index));
  };

  const updateImage = (index: number, updates: Partial<ProductImage>) => {
    const imgs = [...(form.images || [])];
    imgs[index] = { ...imgs[index], ...updates };
    set("images", imgs);
  };

  const addImage = () => {
    set("images", [...(form.images || []), { url: "", alt: "", isPrimary: (form.images || []).length === 0 }]);
  };

  const removeImage = (index: number) => {
    set("images", (form.images || []).filter((_, i) => i !== index));
  };

  const handleUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const res = await adminMediaApi.upload(file);
      updateImage(index, { url: res.data.url });
      toast.success("Image uploaded");
    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err?.data?.message || err?.message || "Upload failed.";
      toast.error(`Upload Failure: ${msg}`);
      setError(msg);
    } finally {
      setUploadingIndex(null);
    }
  };

  const updateNotes = (type: 'top' | 'heart' | 'base', val: string) => {
    const notes = val.split(",").map(n => n.trim()).filter(Boolean);
    set("perfumeNotes", { ...form.perfumeNotes, [type]: notes });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="bg-error-50 border border-error-100 p-6 rounded-[1.5rem] flex items-center gap-4 animate-in slide-in-from-top duration-300">
           <AlertCircle className="text-error-600" size={24} />
           <span className="text-[11px] font-black text-error-600 uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <ComponentCard 
        title="Product Primary Details" 
        desc="Core product metadata and brand alignment"
        formIcon={<Info size={20} className="text-brand-600" />}
      >
        <div className="p-5 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Product Name *" 
              value={form.name} 
              onChange={(e) => set("name", e.target.value)} 
              placeholder="e.g. MIDNIGHT OUD"
            />
            <Input 
              label="URL Slug" 
              value={form.slug || ""} 
              onChange={(e) => set("slug", e.target.value)} 
              placeholder="midnight-oud"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              label="Brand *"
              options={brands.map(b => ({ value: b.id, label: b.name.toUpperCase() }))}
              value={form.brand?.id || ""}
              placeholder="SELECT BRAND"
              onChange={(val) => {
                const b = brands.find(x => x.id === val);
                set("brand", b ? { id: b.id, name: b.name } : { id: "", name: "" });
              }}
            />
            <Select 
              label="Category *"
              options={categories.map(c => ({ value: c.id, label: c.name.toUpperCase() }))}
              value={form.category?.id || ""}
              placeholder="SELECT CATEGORY"
              onChange={(val) => {
                const c = categories.find(x => x.id === val);
                set("category", c ? { id: c.id, name: c.name } : { id: "", name: "" });
              }}
            />
          </div>
          <Input 
            label="Brief Description" 
            value={form.shortDescription || ""} 
            onChange={(e) => set("shortDescription", e.target.value)} 
            placeholder="BRIEF HIGH-IMPACT DESCRIPTION..."
          />
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-text-body/60 uppercase tracking-widest ml-1">Full Description</label>
            <textarea 
              className="w-full bg-white border border-border-light rounded-2xl py-4 px-5 text-sm font-semibold text-text-heading min-h-[160px] outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all placeholder:text-gray-300"
              value={form.description || ""} 
              onChange={(e) => set("description", e.target.value)} 
              placeholder="NARRATE THE STORY AND NOTES OF THIS FRAGRANCE..."
            />
          </div>
        </div>
      </ComponentCard>

      {/* Classification */}
      <ComponentCard 
        title="Spectral Classification" 
        desc="Technical categorization and olfactory positioning"
        formIcon={<Layers size={20} className="text-brand-600" />}
      >
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Type", key: "type", options: TYPES },
            { label: "Gender", key: "gender", options: GENDERS },
            { label: "Concentration", key: "concentration", options: CONCENTRATIONS },
            { label: "Seasonal", key: "season", options: SEASONS }
          ].map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-text-body/60 uppercase tracking-widest ml-1">{field.label}</label>
              <select 
                className="w-full bg-white border border-border-light rounded-2xl py-3.5 px-5 text-sm font-black uppercase tracking-tight appearance-none cursor-pointer focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none" 
                value={(form as any)[field.key]} 
                onChange={(e) => set(field.key, e.target.value)}
              >
                {field.options.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
          ))}
        </div>
      </ComponentCard>

      {/* Variants */}
      <ComponentCard 
        title="Inventory Matrix (SKUs)" 
        desc="Management of spectral variants and stock availability"
        formIcon={<Box size={20} className="text-brand-600" />}
        action={
          <Button type="button" variant="secondary" onClick={addVariant} className="!py-2 !px-4 text-[10px] gap-2">
            <Plus size={14} strokeWidth={3} />
            ADD VARIANT
          </Button>
        }
      >
        <div className="p-2 flex flex-col gap-3">
          {(form.variants || []).map((v, i) => (
            <div key={i} className={`grid grid-cols-1 md:grid-cols-7 gap-3 p-3 border rounded-lg bg-bg-main/30 relative group transition-all ${v.isDefault ? 'border-brand-500/30 shadow-lg shadow-brand-500/5 bg-white' : 'border-border-light'}`}>
              <Input label="Size" placeholder="50" value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })} />
              <Input label="Unit" placeholder="ML" value={v.unit} onChange={(e) => updateVariant(i, { unit: e.target.value })} />
              <Input label="Base Rate" type="number" value={v.price} onChange={(e) => updateVariant(i, { price: Number(e.target.value) })} />
              <Input label="Promo Rate" type="number" value={v.discountPrice || ""} onChange={(e) => updateVariant(i, { discountPrice: e.target.value ? Number(e.target.value) : undefined })} />
              <Input label="Availability" type="number" value={v.stock} onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })} />
              <Input label="ID SKU" placeholder="SKU-XXX" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
              
              <div className="flex items-center justify-between md:flex-col md:justify-end md:items-start gap-4">
                <div className="flex flex-col gap-3">
                   <label className="flex items-center gap-3 cursor-pointer group/radio">
                      <div className="relative flex items-center">
                        <input 
                          type="radio" 
                          name={`default_variant_${form.slug || 'new'}`} 
                          checked={!!v.isDefault} 
                          onChange={() => updateVariant(i, { isDefault: true })} 
                          className="w-5 h-5 border-2 border-border-light rounded-full accent-brand-500 cursor-pointer appearance-none checked:bg-brand-500 checked:border-brand-500 transition-all" 
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">Default</span>
                   </label>
                    <Checkbox 
                      label="Live"
                      checked={!!v.isAvailable} 
                      onChange={(checked) => updateVariant(i, { isAvailable: checked })} 
                    />
                </div>
                <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={() => removeVariant(i)} 
                  className="!h-10 !w-10 !p-0 rounded-xl hover:bg-error-50 hover:text-error-600 md:absolute md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          ))}
          {(form.variants || []).length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border-light rounded-[2.5rem] bg-bg-main/20 gap-4">
              <Box size={40} className="text-text-body/20" />
              <p className="text-[11px] font-black text-text-body/40 uppercase tracking-widest">No variants added.</p>
              <Button type="button" variant="outline" onClick={addVariant} className="rounded-xl">Add VARIANT</Button>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Visuals */}
      <ComponentCard 
        title="Product Visual" 
        desc="Visuals of product"
        formIcon={<ImageIcon size={20} className="text-brand-600" />}
        action={
          <Button type="button" variant="secondary" onClick={addImage} className="!py-2 !px-4 text-[10px] gap-2">
            <Plus size={14} strokeWidth={3} />
            Add Visual
          </Button>
        }
      >
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(form.images || []).map((img, i) => (
            <div key={i} className="group flex flex-col bg-white rounded-lg border border-border-light overflow-hidden transition-all hover:shadow-2xl hover:border-brand-500/20">
              <div className="aspect-square w-full bg-bg-main relative flex items-center justify-center overflow-hidden border-b border-border-light">
                {uploadingIndex === i ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Loader2 size={32} className="text-brand-600 animate-spin" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">Uploading...</span>
                  </div>
                ) : img.url ? (
                  <>
                    <img src={img.url} alt={img.alt || "Preview"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                       <label className="w-12 h-12 rounded-2xl bg-white text-brand-600 flex items-center justify-center cursor-pointer hover:bg-brand-500 hover:text-white transition-all shadow-xl">
                        <Upload size={20} strokeWidth={2.5} />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(i, e.target.files[0])} />
                      </label>
                      <Button variant="ghost" type="button" onClick={() => removeImage(i)} className="w-12 h-12 !p-0 rounded-2xl bg-error-600 text-white hover:bg-error-700 shadow-xl">
                        <Trash2 size={20} strokeWidth={2.5} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-4 cursor-pointer group/upload w-full h-full justify-center bg-brand-500/5 hover:bg-brand-500/10 transition-colors">
                    <Upload size={32} className="text-brand-600 group-hover/upload:scale-110 transition-transform" strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-600 text-center px-2">Sync Asset</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(i, e.target.files[0])} />
                  </label>
                )}
                
                {img.isPrimary && (
                  <div className="absolute top-4 left-4 bg-brand-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-[0.2em] border border-white/20">
                    Primary
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col gap-2">
                <Input 
                  label="ALT TEXT"
                  value={img.alt} 
                  onChange={(e) => updateImage(i, { alt: e.target.value })} 
                  placeholder="DESCRIBE..." 
                  className="!py-2 !px-3 !text-[11px]"
                />
                
                <div className="flex items-center justify-between pt-2 border-t border-border-light">
                  <label className="flex items-center gap-3 cursor-pointer group/label">
                    <input 
                      type="radio" 
                      name="primary-image"
                      checked={img.isPrimary} 
                      onChange={() => {
                        const imgs = (form.images || []).map((x, idx) => ({ ...x, isPrimary: idx === i }));
                        set("images", imgs);
                      }} 
                      className="w-4 h-4 border-2 border-border-light rounded-full accent-brand-500 cursor-pointer appearance-none checked:bg-brand-500 checked:border-brand-500 transition-all" 
                    />
                    <span className="text-[9px] font-black uppercase text-text-body/60 group-hover/label:text-brand-600 transition-colors tracking-widest">Primary</span>
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addImage}
            className="flex flex-col items-center justify-center gap-4 bg-bg-main border-2 border-dashed border-border-light rounded-xl group hover:border-brand-500/40 hover:bg-brand-500/5 transition-all min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-border-light flex items-center justify-center text-brand-600 group-hover:scale-110 group-hover:shadow-xl transition-all">
              <Plus size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-text-heading uppercase tracking-widest">Add Product Visual</span>
            </div>
          </button>
        </div>
      </ComponentCard>

      {/* Fragrance Architecture */}
      <ComponentCard 
        title="Perfume Notes" 
        desc="Technical composition and mood"
        formIcon={<Wind size={20} className="text-brand-600" />}
      >
        <div className="p-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Input 
              label="Top Spectrum (Notes)" 
              value={(form.perfumeNotes?.top || []).join(", ")} 
              onChange={(e) => updateNotes('top', e.target.value)} 
              placeholder="BERGAMOT, LEMON, PEPPER..."
            />
            <Input 
              label="Heart Core (Notes)" 
              value={(form.perfumeNotes?.heart || []).join(", ")} 
              onChange={(e) => updateNotes('heart', e.target.value)} 
              placeholder="ROSE, JASMINE, SAFFRON..."
            />
            <Input 
              label="Base Foundation (Notes)" 
              value={(form.perfumeNotes?.base || []).join(", ")} 
              onChange={(e) => updateNotes('base', e.target.value)} 
              placeholder="OUD, AMBER, MUSK..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input 
              label="Emotional Mood Matrix" 
              value={(form.mood || []).join(", ")} 
              onChange={(e) => set("mood", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} 
              placeholder="ROMANTIC, CALM, BOLD..."
            />
            <Input 
              label="Intelligence Tags" 
              value={(form.tags || []).join(", ")} 
              onChange={(e) => set("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} 
              placeholder="LUXURY, EVENING, SIGNATURE..."
            />
          </div>
        </div>
      </ComponentCard>

      {/* Settings & Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ComponentCard title="Visibility Control" desc="Operational lifecycle management" formIcon={<Eye size={20} className="text-brand-600" />}>
          <div className="p-3 grid grid-cols-2 gap-2">
            {/* Visibility Options */}
            {[
              { key: "isActive", label: "Active", icon: CheckCircle2 },
              { key: "isFeatured", label: "Featured", icon: Star },
              { key: "isNew", label: "New", icon: Info },
              { key: "isBestseller", label: "Bestseller", icon: TrendingUp },
              { key: "isArchived", label: "Archived", icon: Archive }
            ].map((flag) => (
              <div key={flag.key} className="flex items-center gap-3 p-3 bg-white border border-border-light rounded-xl hover:border-brand-500/20 transition-all">
                <Checkbox 
                  label={flag.label}
                  checked={!!(form as any)[flag.key]}
                  onChange={(checked) => set(flag.key, checked)}
                />
              </div>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Shipping & Logistics" desc="Weight and delivery details" formIcon={<Truck size={20} className="text-brand-600" />}>
          <div className="p-3 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Weight (grams)" type="number" value={form.shipping?.weight || ""} onChange={(e) => set("shipping", { ...form.shipping, weight: Number(e.target.value) })} className="!py-2 !px-3 !text-[11px]" />
              <Input label="Delivery Time" value={form.shipping?.shippingTime || ""} onChange={(e) => set("shipping", { ...form.shipping, shippingTime: e.target.value })} placeholder="3-5 DAYS" className="!py-2 !px-3 !text-[11px]" />
            </div>
            <div className="p-3 bg-white border border-border-light rounded-xl hover:border-brand-500/20 transition-all">
              <Checkbox 
                label="Free Shipping?"
                checked={!!form.shipping?.freeShipping}
                onChange={(checked) => set("shipping", { ...form.shipping, freeShipping: checked })}
              />
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Form Submission */}
      <div className="flex gap-3 m-2 sticky bottom-8 p-2 bg-brand-500 max-w-[500px] border-2 border-gray-300 rounded-xl shadow-lg z-50">
        <Button type="submit"  variant="secondary" isLoading={isLoading} className="flex-1 h-10 text-[11px]">
          {submitLabel.toUpperCase()}
        </Button>
        <Button variant="ghost" type="button" onClick={() => window.history.back()} className="px-12 h-10 border border-border-light rounded-[1.5rem] text-[11px] text-text-body/60 hover:text-error-600 hover:bg-error-50">
          DISCARD CHANGES
        </Button>
      </div>
    </form>
  );
}

// Add missing Lucide imports used in the flags
import { TrendingUp, Archive } from "lucide-react";import Select from "../ui/Select";

