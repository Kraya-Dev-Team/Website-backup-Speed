"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminProductsApi, type Product } from "@/lib/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { 
  Plus, 
  Package, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetch = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await adminProductsApi.list({ page: p, limit: LIMIT, search: q || undefined });
      setProducts(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetch(1, ""); }, [fetch]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-in fade-in duration-500">
      <ComponentCard 
        title="Product Inventory" 
        desc={`Curating ${total} luxury fragrance items in the global catalog`}
        formIcon={<Package size={20} className="text-brand-600" />}
        action={
          <Link href="/dashboard/products/new">
            <Button id="create-product-btn" className="gap-2 !py-2 !px-4 text-[10px]">
              <Plus size={14} strokeWidth={3} />
              CREATE NEW
            </Button>
          </Link>
        }
      >
        <div className="p-2 border-b border-border-light bg-bg-main/30 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border-light rounded-xl text-[10px] font-black text-text-body/60 uppercase tracking-widest">
              <Filter size={12} strokeWidth={3} />
              Items in one page: {LIMIT}
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-8">Product Name</TableCell>
                <TableCell isHeader>Category</TableCell>
                <TableCell isHeader>System Status</TableCell>
                <TableCell isHeader className="px-8 text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Syncing Matrix...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-32 text-center text-text-body/40 font-black uppercase tracking-widest">
                    No spectral matches found.
                  </TableCell>
                </TableRow>
              ) : products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                      <span className="font-black text-text-heading text-sm uppercase tracking-tight group-hover:text-brand-600 transition-colors">{p.name}</span>
                      <span className="text-[9px] font-black text-text-body/30 tracking-widest uppercase mt-1">ID: {p.id.slice(0, 12)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="brand">{p.type || "PERFUME"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive !== false ? "success" : "error"}>
                      {p.isActive !== false ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <Link href={`/dashboard/products/${p.id}`}>
                      <Button className="h-8 gap-3">
                        <ExternalLink size={18} strokeWidth={2.5} className="text-brand-900" />
                        See Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Card Footer with Pagination */}
        <div className="p-8 border-t border-border-light bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-[11px] font-black text-text-body/60 uppercase tracking-widest">
            Displaying {products.length} of {total} operational units
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-4">
              <Button 
                variant="outline"
                disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); fetch(p, search); }}
                className="!py-2 !px-4 !rounded-xl"
              >
                <ChevronLeft size={16} strokeWidth={3} className="mr-2" />
                PREV
              </Button>
              
              <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => { const p = i + 1; setPage(p); fetch(p, search); }}
                    className={`h-10 w-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white border border-border-light text-text-body hover:border-brand-500 hover:text-brand-600'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button 
                variant="outline"
                disabled={page === totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetch(p, search); }}
                className="!py-2 !px-4 !rounded-xl"
              >
                NEXT
                <ChevronRight size={16} strokeWidth={3} className="ml-2" />
              </Button>
            </div>
          )}
        </div>
      </ComponentCard>
    </div>
  );
}
