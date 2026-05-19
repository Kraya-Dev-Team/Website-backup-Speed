"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminCategoriesApi, type Category } from "@/lib/api";
import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Layers, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "react-toastify";
import Checkbox from "@/components/ui/Checkbox";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminCategoriesApi.list();
      setCategories(res.data || []);
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <ComponentCard 
        title="CATEGORIES" 
        desc={`Manage and organize your ${categories.length} product categories`}
        formIcon={<Layers size={20} className="text-brand-600" />}
        action={
          <Link href="/dashboard/categories/new">
            <Button id="create-cat-btn" className="gap-2 !py-2 !px-4 text-[10px]">
              <Plus size={14} strokeWidth={3} />
              ADD CATEGORY
            </Button>
          </Link>
        }
      >
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-8">Name</TableCell>
                <TableCell isHeader>Parent</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Featured</TableCell>
                <TableCell isHeader className="px-8 text-right">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                       <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center text-text-body/40 font-black uppercase tracking-widest">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-8">
                    <div className="flex flex-col">
                       <span className="font-black text-text-heading text-sm uppercase tracking-tight group-hover:text-brand-600 transition-colors">{c.name}</span>
                       <span className="text-[9px] font-black text-text-body/30 tracking-widest uppercase mt-1">ID: {c.id.slice(0, 12)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-black text-text-body/60 bg-bg-main border border-border-light px-3 py-1.5 rounded-lg uppercase tracking-widest">
                      {c.parentId || "NONE"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isActive !== false ? "success" : "error"}>
                      {c.isActive !== false ? "ACTIVE" : "ARCHIVED"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.isFeatured ? (
                       <Badge variant="warning">★ FEATURED</Badge>
                    ) : (
                       <span className="text-text-body/20 font-black text-[10px] uppercase">Standard</span>
                    )}
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost"
                        onClick={() => setEditingCategory(c)}
                        className="h-9 w-9 !p-0 rounded-xl hover:bg-brand-50"
                      >
                        <Edit size={16} strokeWidth={2.5} className="text-brand-600" />
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={async () => {
                          if (confirm("Permanently delete this category?")) {
                            try {
                              await adminCategoriesApi.delete(c.id);
                              toast.success("Category deleted");
                              fetchCategories();
                            } catch (e: any) {
                              toast.error(e.message || "Failed to delete");
                            }
                          }
                        }}
                        className="h-9 w-9 !p-0 rounded-xl hover:bg-error-50"
                      >
                        <Trash2 size={16} strokeWidth={2.5} className="text-error-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* Edit Modal */}
      {editingCategory && (
        <EditCategoryModal 
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onUpdate={() => {
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}

function EditCategoryModal({ category, onClose, onUpdate }: { category: Category, onClose: () => void, onUpdate: () => void }) {
  const [fields, setFields] = useState({ 
    isFeatured: category.isFeatured || false, 
    isActive: category.isActive !== false 
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await adminCategoriesApi.update(category.id, fields);
      toast.success("Category updated");
      onUpdate();
    } catch (e: any) {
      toast.error(e?.message || "Error updating category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit: ${category.name}`}>
      <div className="p-6 flex flex-col gap-8">
         <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-text-body/40 uppercase tracking-widest ml-1">Unique Identifier</span>
            <div className="bg-bg-main p-4 rounded-xl border border-border-light font-mono text-xs text-text-body/60">
              {category.id}
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <Checkbox 
              label="FEATURE AS PRIMARY?"
              checked={fields.isFeatured}
              onChange={(val) => setFields(f => ({ ...f, isFeatured: val }))}
            />
            <Checkbox 
              label="SET AS ACTIVE?"
              checked={fields.isActive}
              onChange={(val) => setFields(f => ({ ...f, isActive: val }))}
            />
         </div>

         <div className="pt-6 border-t border-border-light flex gap-4">
            <Button 
              className="flex-1 h-14" 
              isLoading={loading} 
              onClick={handleUpdate}
            >
              SAVE CHANGES
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="px-8 border border-border-light rounded-xl h-14 text-text-body/60"
            >
              CANCEL
            </Button>
         </div>
      </div>
    </Modal>
  );
}
