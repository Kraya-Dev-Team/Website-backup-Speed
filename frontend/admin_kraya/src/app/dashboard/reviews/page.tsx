"use client";

import { useEffect, useState } from "react";
import { adminReviewsApi, adminProductsApi, type Product } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import Select from "@/components/ui/Select";
import { ActionConfirmationModal } from "@/components/common/ActionConfirmationModal";
import { 
  MessageSquare, 
  Star, 
  Trash2, 
  RefreshCcw, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "react-toastify";

export default function ReviewsPage() {
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await adminProductsApi.list({ limit: 100 });
        setProducts(res.data.items || []);
      } catch (e) {
        console.error("Failed to fetch products:", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchAllProducts();
  }, []);

  const fetchReviews = async (id?: string) => {
    const targetId = id || productId;
    if (!targetId) { setMsg("SELECT A TARGET PRODUCT FOR AUDIT."); return; }
    setMsg(""); setLoading(true);
    try {
      const res = await adminReviewsApi.getProductReviews(targetId, { limit: 50 });
      const items = res?.data?.reviews || res?.data || [];
      setReviews(items);
      if (items.length === 0) setMsg("ZERO REVIEWS IDENTIFIED FOR THIS ENTITY.");
    } catch (e: any) {
      setMsg(e?.message || "FAILED TO ESTABLISH SECURE REVIEW SYNC.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (id: string) => {
    setProductId(id);
    if (id) {
      fetchReviews(id);
    } else {
      setReviews([]);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await adminReviewsApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("REVIEW PERMANENTLY PURGED FROM DATABASE");
    } catch (e: any) {
      toast.error(e?.message || "DATA DELETION PROTOCOL FAILED.");
    }
  };

  const renderStars = (n: number) => {
    const val = Math.round(n || 0);
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={12} 
            className={i < val ? "text-warning-500 fill-warning-500" : "text-gray-200"} 
            strokeWidth={2.5}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <ComponentCard 
        title="Review Moderation" 
        desc="Audit and manage customer feedback logs and sentiment matrix"
        formIcon={<MessageSquare size={20} className="text-brand-600" />}
      >
        {/* Selection Area */}
        <div className="p-3 border-b border-border-light bg-bg-main/30 flex flex-col sm:flex-row gap-6 items-end">
          <div className="w-full sm:max-w-md">
            <Select 
              label="Spectral Entity Targeter"
              placeholder="-- SELECT PERFUME ENTITY --"
              disabled={loadingProducts}
              value={productId}
              onChange={(val) => handleProductChange(val)}
              options={products.map(p => ({ 
                value: p.id, 
                label: `${p.name.toUpperCase()} (${p.brand?.name?.toUpperCase() || "N/A"})` 
              }))}
            />
          </div>

          <Button 
            id="fetch-reviews-btn" 
            isLoading={loading} 
            disabled={!productId}
            onClick={() => fetchReviews()}
            className="w-full sm:w-auto  px-10 gap-2"
          >
            <RefreshCcw size={16} strokeWidth={3} className={loading ? "animate-spin" : ""} />
            REFRESH DATA
          </Button>
          
          {loadingProducts && (
            <div className="mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
              <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Syncing Matrix...</span>
            </div>
          )}
        </div>

        {/* Messaging Area */}
        {msg && (
          <div className="m-3 p-6 rounded-xl bg-bg-main border border-border-light flex items-center gap-4 animate-in slide-in-from-top duration-300">
             <AlertCircle size={20} className="text-brand-600/60" />
             <span className="text-[11px] font-black text-text-body/60 uppercase tracking-widest">{msg}</span>
          </div>
        )}

        {/* Data Table */}
        {reviews.length > 0 && (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-8">Contributor</TableCell>
                  <TableCell isHeader>Rating Matrix</TableCell>
                  <TableCell isHeader>Content Audit</TableCell>
                  <TableCell isHeader className="text-center">Verification</TableCell>
                  <TableCell isHeader>Timeline</TableCell>
                  <TableCell isHeader className="px-8 text-right">Operations</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-brand-600 border border-border-light">
                          <UserIcon size={18} strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-text-heading text-xs uppercase tracking-tight">
                          {r.userName?.toUpperCase() || r.userId?.slice(0, 10)?.toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {renderStars(r.rating)}
                        <span className="text-[10px] font-black text-text-body/30 uppercase tracking-widest">{r.rating} / 5.0 INTENSITY</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-sm">
                        <span className="font-black text-text-heading text-[13px] uppercase tracking-tight">{r.title?.toUpperCase() || "UNTITLED LOG"}</span>
                        <p className="text-[11px] font-semibold text-text-body/70 leading-relaxed uppercase tracking-tight line-clamp-2">{r.comment}</p>
                      </div>
                    </TableCell>
                    <td className="py-6 px-6 text-center">
                      <Badge variant={r.isVerified ? "success" : "error"}>
                        {r.isVerified ? <CheckCircle2 size={10} className="mr-1.5" /> : null}
                        {r.isVerified ? "VERIFIED" : "UNVERIFIED"}
                      </Badge>
                    </td>
                    <TableCell>
                      <span className="text-[10px] font-black text-text-body/50 uppercase tracking-widest">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <Button
                        variant="ghost"
                        className="h-10 w-10 !p-0 rounded-xl hover:bg-error-50 hover:text-error-600"
                        onClick={() => setReviewToDelete(r.id)}
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>

      <ActionConfirmationModal 
        isOpen={!!reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={() => reviewToDelete && deleteReview(reviewToDelete)}
        title="Purge Review Data"
        description="Are you certain you wish to permanently erase this spectral user contribution from the master records?"
        variant="error"
        confirmText="Purge Record"
      />
    </div>
  );
}
