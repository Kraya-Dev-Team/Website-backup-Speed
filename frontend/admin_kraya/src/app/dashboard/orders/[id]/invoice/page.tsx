"use client";

import { useEffect, useState, use } from "react";
import { adminOrdersApi, type Order } from "@/lib/api";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOrdersApi.getById(id)
      .then(res => setOrder(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (order) {
      // Small timeout to ensure images/fonts are loaded before print dialog
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [order]);

  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse">GENERATING SECURE PROFORMA...</div>;
  if (!order) return <div className="p-20 text-center text-danger font-bold">CRITICAL: ORDER PAYLOAD NOT FOUND</div>;

  return (
    <div className="min-h-screen bg-white p-0 md:p-10 flex justify-center print:p-0">
      <div className="w-full max-w-[800px] bg-white print:shadow-none shadow-2xl border border-border-subtle p-12 md:p-16 flex flex-col gap-12 relative overflow-hidden">
        
        {/* Aesthetic Background Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl print:hidden" />

        {/* Header */}
        <div className="flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary/20">K</div>
                <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">KRAYA <span className="text-primary">PARFUMS</span></h1>
             </div>
             <div className="flex flex-col text-[11px] font-bold text-text-muted uppercase tracking-widest leading-relaxed">
                <span>Luxury Perfumery & Scents</span>
                <span>GSTIN: 27AABCK1234F1Z5</span>
                <span>Mumbai, Maharashtra, India</span>
             </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
             <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Proforma Invoice</span>
             <h2 className="text-sm font-black text-text-main mt-2">#{order.orderNumber}</h2>
             <span className="text-[10px] font-bold text-text-muted uppercase">Issued: {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </div>
        </div>

        <div className="h-px bg-border-subtle w-full" />

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-20">
           <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Bill To / Ship To</h3>
              <div className="flex flex-col gap-1">
                 <span className="text-base font-black text-text-main">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</span>
                 <p className="text-xs text-text-muted leading-relaxed font-medium">
                    {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2 && order.shippingAddress.addressLine2 + ","}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                    {order.shippingAddress?.country}
                 </p>
                 <div className="mt-2 text-xs font-bold text-primary">
                    <span className="opacity-50">PHONE:</span> {order.phone}
                 </div>
                 <div className="text-xs font-bold text-primary">
                    <span className="opacity-50">EMAIL:</span> {order.email}
                 </div>
              </div>
           </div>
           <div className="flex flex-col gap-4 items-end text-right">
              <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Order Intel</h3>
              <div className="flex flex-col gap-3">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-text-muted uppercase">Method</span>
                    <span className="text-xs font-black text-text-main uppercase">{order.payment?.method || "Prepaid"} via {order.payment?.provider || "Razorpay"}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-text-muted uppercase">Transaction Ref</span>
                    <span className="text-[10px] font-medium text-text-muted">{order.payment?.razorpayPaymentId || "PENDING"}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Items Table */}
        <div className="flex flex-col border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-body-bg/50 border-b border-border-subtle">
                 <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted">Description</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted text-center">SKU</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted text-center">Qty</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted text-right">Rate</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase text-text-muted text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                 {order.items.map((item, i) => (
                    <tr key={i}>
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="font-black text-text-main text-sm">{item.productName}</span>
                             <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{item.variantSize} Luxury Collection</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center text-xs font-bold text-text-muted uppercase">{item.sku}</td>
                       <td className="px-8 py-6 text-center text-sm font-black text-text-main">{item.quantity}</td>
                       <td className="px-8 py-6 text-right text-sm font-medium text-text-muted">₹{item.price.toLocaleString()}</td>
                       <td className="px-8 py-6 text-right text-sm font-black text-text-main">₹{item.total.toLocaleString()}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
           <div className="w-full max-w-[300px] flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold text-text-muted uppercase">
                 <span>Gross Subtotal</span>
                 <span>₹{order.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-danger uppercase italic">
                 <span>Discount</span>
                 <span>-₹{order.discount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-text-muted uppercase">
                 <span>Logistics</span>
                 <span>₹{order.shippingCost?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-text-muted uppercase">
                 <span>GST (18%)</span>
                 <span>₹{order.tax?.toLocaleString() || 0}</span>
              </div>
              <div className="h-px bg-border-subtle my-2" />
              <div className="flex justify-between items-center">
                 <span className="text-xs font-black text-text-main uppercase tracking-widest">Total Amount</span>
                 <span className="text-2xl font-black text-primary">₹{order.total?.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Footer / Notes */}
        <div className="mt-auto flex flex-col gap-10">
           <div className="grid grid-cols-2 gap-10">
              <div className="flex flex-col gap-3 p-6 bg-body-bg/30 rounded-2xl border border-border-subtle">
                 <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest">Terms & Conditions</h4>
                 <p className="text-[9px] font-bold text-text-muted leading-relaxed uppercase opacity-60">
                    1. This is a computer generated proforma invoice and does not require a physical signature.<br />
                    2. Goods once sold will not be taken back or exchanged.<br />
                    3. Subject to Mumbai Jurisdiction only.
                 </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 border-b-2 border-border-subtle/50 pb-2">
                 <div className="h-16 w-32 bg-primary/5 rounded-xl border border-dashed border-primary/20 flex items-center justify-center italic text-primary/30 text-xs">AUTHORIZED SIGNATORY</div>
                 <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">For Kraya Parfums</span>
              </div>
           </div>
           
           <div className="text-center py-4 border-t border-border-subtle">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Thank you for choosing Kraya Luxury</p>
           </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .shadow-2xl { box-shadow: none !important; }
            .border { border-color: #eee !important; }
            @page { margin: 1cm; }
          }
        `}</style>
      </div>
    </div>
  );
}
