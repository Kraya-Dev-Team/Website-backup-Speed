import React from "react";
import { Order } from "@/lib/api";

interface InvoiceTemplateProps {
   order: Order;
}

const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order }, ref) => {
   if (!order) return null;

   return (
      <div ref={ref} className="p-12 bg-white text-slate-900 font-sans max-w-[800px] mx-auto print:p-8">
         {/* Header */}
         <div className="flex justify-between items-start mb-12">
            <div>
               <img src="/logo-landscape-dark.svg" alt="Kraya" className="h-12 mb-4" />
               <p className="text-xs text-slate-500 max-w-[200px]">
                  Kraya Luxury Essences<br />
                  123 Fragrance Avenue, Suite 456<br />
                  Grasse, France / Mumbai, India
               </p>
            </div>
            <div className="text-right">
               <h1 className="text-4xl font-serif uppercase tracking-widest mb-2">Invoice</h1>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order #{order.orderNumber}</p>
               <p className="text-xs text-slate-500 mt-1">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { 
                     month: "long", 
                     day: "numeric", 
                     year: "numeric" 
                  })}
               </p>
            </div>
         </div>

         {/* Addresses */}
         <div className="grid grid-cols-2 gap-12 mb-12 border-t border-b border-slate-100 py-8">
            <div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Bill To</h2>
               <div className="text-sm">
                  <p className="font-bold text-slate-800">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p className="text-slate-600 mt-1">
                     {order.shippingAddress.addressLine1}<br />
                     {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                     {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                     {order.shippingAddress.country}
                  </p>
                  <p className="text-slate-600 mt-2">{order.shippingAddress.phone}</p>
               </div>
            </div>
            <div>
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Ship To</h2>
               <div className="text-sm">
                  <p className="font-bold text-slate-800">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p className="text-slate-600 mt-1">
                     {order.shippingAddress.addressLine1}<br />
                     {order.shippingAddress.addressLine2 && <>{order.shippingAddress.addressLine2}<br /></>}
                     {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                     {order.shippingAddress.country}
                  </p>
               </div>
            </div>
         </div>

         {/* Items Table */}
         <div className="mb-12">
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b-2 border-slate-900">
                     <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                     <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
                     <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Price</th>
                     <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                     <tr key={idx}>
                        <td className="py-6">
                           <p className="font-serif text-base text-slate-800">{item.productName}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Size: {item.variantSize} | SKU: {item.sku}</p>
                        </td>
                        <td className="py-6 text-center text-sm text-slate-600">{item.quantity}</td>
                        <td className="py-6 text-right text-sm text-slate-600">₹{item.price.toLocaleString()}</td>
                        <td className="py-6 text-right text-sm font-bold text-slate-800">₹{item.total.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Totals */}
         <div className="flex justify-end">
            <div className="w-64 space-y-3">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-800">₹{order.subtotal.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="text-slate-800">₹{order.shippingCost.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="text-slate-800">₹{order.tax.toLocaleString()}</span>
               </div>
               {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                     <span>Discount</span>
                     <span>-₹{order.discount.toLocaleString()}</span>
                  </div>
               )}
               <div className="flex justify-between pt-4 border-t border-slate-900">
                  <span className="font-serif text-lg uppercase tracking-widest">Total</span>
                  <span className="font-serif text-xl font-bold">₹{order.total.toLocaleString()}</span>
               </div>
            </div>
         </div>

         {/* Footer / Notes */}
         <div className="mt-24 grid grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Support & Returns</h4>
               <p className="text-[10px] text-slate-500 leading-relaxed">
                  For any queries regarding your order, please contact us at support@kraya.com or call +91 98765 43210. 
                  Items can be returned within 14 days of delivery if they are in original packaging.
               </p>
            </div>
            <div className="text-right flex flex-col justify-end">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-1">KRAYA LUXURY</p>
               <p className="text-[9px] text-slate-400 uppercase tracking-widest">The Art of Invisible Luxury</p>
            </div>
         </div>

         <div className="mt-12 text-center">
            <p className="text-[9px] text-slate-300">
               This is a computer generated invoice and does not require a physical signature.
            </p>
         </div>
      </div>
   );
});

InvoiceTemplate.displayName = "InvoiceTemplate";

export default InvoiceTemplate;
