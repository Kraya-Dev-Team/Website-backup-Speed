"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminBrandsApi, type Brand } from "@/lib/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Tag, Plus, Globe, Calendar } from "lucide-react";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminBrandsApi.list().then(res => setBrands(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <ComponentCard 
        title="Brand Authority" 
        desc={`Managing ${brands.length} luxury perfume houses and global registries`}
        formIcon={<Tag size={20} className="text-brand-600" />}
        action={
          <Link href="/dashboard/brands/new">
            <Button id="create-brand-btn" className="gap-2 !py-2 !px-4 text-[10px]">
              <Plus size={14} strokeWidth={3} />
              REGISTER BRAND
            </Button>
          </Link>
        }
      >
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-8">Brand Identity</TableCell>
                <TableCell isHeader>Origin</TableCell>
                <TableCell isHeader>Founded</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader className="px-8 text-right">Visibility</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Syncing Registry...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center text-text-body/40 font-black uppercase tracking-widest">
                    No brand records detected.
                  </TableCell>
                </TableRow>
              ) : brands.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                       <span className="font-black text-text-heading text-sm uppercase tracking-tight group-hover:text-brand-600 transition-colors">{b.name}</span>
                       <span className="text-[9px] font-black text-text-body/30 tracking-widest uppercase mt-1">ID: {b.id.slice(0, 12)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Globe size={14} className="text-text-body/40" />
                       <span className="text-xs font-black text-text-heading uppercase tracking-tight">{b.country || "GLOBAL"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-text-body/40" />
                       <span className="text-xs font-black text-text-heading uppercase tracking-tight">{b.founded || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.isActive !== false ? "success" : "error"}>
                      {b.isActive !== false ? "ACTIVE" : "DISABLED"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    {b.isFeatured ? (
                       <Badge variant="warning">★ FEATURED</Badge>
                    ) : (
                       <span className="text-text-body/20 font-black text-[10px] uppercase">Standard</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-8 border-t border-border-light bg-gray-50/50 flex justify-between items-center">
           <span className="text-[11px] font-black text-text-body/60 uppercase tracking-widest">Showing {brands.length} results</span>
           <div className="flex gap-2">
              <button className="h-10 w-10 rounded-xl bg-white border border-border-light text-brand-600 text-[10px] font-black shadow-sm transition-all">1</button>
           </div>
        </div>
      </ComponentCard>
    </div>
  );
}
