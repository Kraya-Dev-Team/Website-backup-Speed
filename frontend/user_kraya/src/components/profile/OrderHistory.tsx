"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   Package,
   ArrowRight,
   ShoppingBag,
   ShieldCheck,
   Truck,
   PackageCheck,
   ExternalLink,
   MapPin,
   CreditCard,
   Plus,
   Calendar,
   Clock,
   Droplets,
   Download
} from "lucide-react";
import { type Order } from "@/lib/api";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import InvoiceTemplate from "./InvoiceTemplate";

interface OrderHistoryProps {
   orders: Order[];
   isLoading: boolean;
}

export default function OrderHistory({ orders, isLoading }: OrderHistoryProps) {
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const invoiceRef = useRef<HTMLDivElement>(null);

   const handlePrint = useReactToPrint({
      contentRef: invoiceRef,
      documentTitle: selectedOrder ? `Invoice-${selectedOrder.orderNumber}` : 'Invoice',
   });

   // Lock body scroll when modal is open
   useEffect(() => {
      if (selectedOrder) {
         const scrollY = window.scrollY;
         document.body.style.position = 'fixed';
         document.body.style.top = `-${scrollY}px`;
         document.body.style.width = '100%';
      } else {
         const scrollY = document.body.style.top;
         document.body.style.position = '';
         document.body.style.top = '';
         document.body.style.width = '';
         window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      return () => {
         document.body.style.position = '';
         document.body.style.top = '';
         document.body.style.width = '';
      };
   }, [selectedOrder]);

   return (
      <>
         <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center">
                  <Package size={14} className="text-charcoal/60" />
               </div>
               <h3 className="font-serif text-2xl text-charcoal">Order History</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-charcoal/5 animate-pulse" />)
               ) : orders.length === 0 ? (
                  <div className="p-16 rounded-[2rem] border border-dashed border-charcoal/10 flex flex-col items-center justify-center text-center gap-4 bg-charcoal/[0.01]">
                     <Package size={32} strokeWidth={1} className="text-charcoal/10" />
                     <p className="text-[11px] text-charcoal/30 uppercase tracking-[0.2em] font-bold">No orders found in your scent journey.</p>
                  </div>
               ) : (
                  orders.map(order => {
                     const orderId = order.id || (order as any)._id || "";
                     const displayId = order.orderNumber || (orderId ? orderId.slice(-8).toUpperCase() : "N/A");
                     const amount = order.total || 0;
                     const itemsCount = order.itemCount || order.items?.length || 0;

                     return (
                        <motion.div
                           key={orderId}
                           layout
                           onClick={() => setSelectedOrder(order)}
                           className="p-6 rounded-[2rem] border border-charcoal/5 bg-cream-dark/10 group relative overflow-hidden hover:border-charcoal transition-all duration-500 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                        >
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-charcoal flex items-center justify-center overflow-hidden shadow-sm">
                                 <img
                                    src={order.items[0].image}
                                    alt="Product"
                                    className="w-full h-full object-cover"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <h6 className="text-[11px] font-black uppercase tracking-widest text-charcoal/80">Order {displayId}</h6>
                                 <p className="text-[10px] text-charcoal/60 uppercase tracking-widest font-medium">
                                    {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                 </p>
                              </div>
                           </div>

                           <div className="flex flex-wrap items-center gap-3 sm:gap-8">
                              <div className="text-right sm:text-left">
                                 <p className="text-[9px] uppercase tracking-widest text-charcoal/50 font-bold mb-0.5">Essences</p>
                                 <p className="text-xs font-bold text-charcoal/70">{itemsCount} Items</p>
                              </div>
                              <div className="text-right sm:text-left">
                                 <p className="text-[9px] uppercase tracking-widest text-charcoal/50 font-bold mb-0.5">Investment</p>
                                 <p className="text-xs font-serif font-bold text-charcoal">₹{amount.toLocaleString()}</p>
                              </div>
                              <div className="flex-1 sm:flex-none text-right">
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${order.status === "delivered" ? "bg-green-500/10 text-green-700" :
                                    order.status === "shipped" ? "bg-blue-500/10 text-blue-700" :
                                       order.status === "cancelled" ? "bg-red-500/10 text-red-600" :
                                          "bg-charcoal/10 text-charcoal/60"
                                    }`}>{order.status}</span>
                              </div>
                           </div>

                           <div className="w-10 h-10 rounded-full border border-charcoal/5 flex items-center justify-center shrink-0 group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-cream transition-all duration-500">
                              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform duration-500" />
                           </div>
                        </motion.div>
                     );
                  })
               )}
            </div>
         </motion.div>

         <AnimatePresence>
            {selectedOrder && (
               <>
                  {/* Real Backdrop */}
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.4 }}
                     onClick={() => setSelectedOrder(null)}
                     className="fixed inset-0 z-[9998] bg-charcoal/60 backdrop-blur-md cursor-pointer"
                  />

                  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 pointer-events-none overflow-hidden">
                     {/* Modal Container */}
                     <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-cream w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col md:flex-row pointer-events-auto border border-charcoal/5"
                     >
                        {/* Left Sidebar - Order Summary (Fixed on Desktop) */}
                        <div className="w-full md:w-[280px] bg-charcoal text-cream-dark p-4 flex flex-col justify-between border-r border-cream/5 relative overflow-hidden shrink-0">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                           <div className="relative z-10">
                              <button
                                 onClick={() => setSelectedOrder(null)}
                                 className="mb-4 w-10 h-10 rounded-lg border border-cream/10 flex items-center justify-center text-cream/40 hover:bg-cream hover:text-charcoal transition-all group"
                              >
                                 <Plus size={18} className="rotate-45 group-hover:rotate-[135deg] transition-transform duration-500" />
                              </button>

                              <div className="space-y-2 mb-8">
                                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-400">Order Identity</span>
                                 <h2 className="font-serif text-2xl text-cream leading-tight break-all uppercase">#{(selectedOrder as any).orderNumber}</h2>
                                 <p className="text-xs text-cream/60 uppercase tracking-widest font-medium mt-1">
                                    {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}
                                 </p>
                              </div>

                              <div className="space-y-4 pt-6 border-t border-cream/10">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-cream/50">Status</span>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg ${selectedOrder.status === 'delivered' ? 'bg-success-500/20 text-success-400' :
                                       selectedOrder.status === 'cancelled' ? 'bg-error-500/20 text-error-400' :
                                          'bg-brand-500/20 text-brand-400'
                                       }`}>
                                       {selectedOrder.status}
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center pt-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-cream/50">Investment</span>
                                    <span className="text-xl font-serif text-cream">₹{(selectedOrder as any).total.toLocaleString()}</span>
                                 </div>
                              </div>
                           </div>

                            <div className="relative z-10 pt-4">
                               <button
                                  onClick={() => handlePrint()}
                                  className="w-full bg-cream text-charcoal py-4 rounded-lg text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-400 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-black/20"
                               >
                                  <Download size={14} />
                                  Download Invoice
                               </button>
                            </div>
                        </div>

                        {/* Right Area - Scrollable Content */}
                        <div className="flex-1 flex flex-col min-h-0 bg-cream relative">
                           <div
                              className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar scroll-smooth"
                              data-lenis-prevent
                           >
                              <div className="mb-10">
                                 <div className="flex items-center gap-3 mb-8">
                                    <div className="h-[1px] flex-1 bg-charcoal/5" />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/50">Journey Status</h5>
                                    <div className="h-[1px] flex-1 bg-charcoal/5" />
                                 </div>

                                 <div className="relative px-2">
                                    <div className="flex justify-between relative z-10">
                                       {[
                                          { label: 'Initiated', status: 'pending', icon: ShoppingBag },
                                          { label: 'Validated', status: 'confirmed', icon: ShieldCheck },
                                          { label: 'En Route', status: 'shipped', icon: Truck },
                                          { label: 'Arrived', status: 'delivered', icon: PackageCheck }
                                       ].map((step, idx) => {
                                          const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                          const currentIdx = statuses.indexOf(selectedOrder.status);
                                          const stepIdx = statuses.indexOf(step.status);
                                          const isCompleted = currentIdx >= stepIdx;
                                          const isCurrent = currentIdx === stepIdx || (step.status === 'shipped' && selectedOrder.status === 'processing');

                                          return (
                                             <div key={step.label} className="flex flex-col items-center gap-2 group">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-700 relative ${isCompleted ? 'bg-charcoal text-cream shadow-lg shadow-charcoal/20' : 'bg-charcoal/[0.03] text-charcoal/10 border border-charcoal/5'
                                                   }`}>
                                                   {isCurrent && (
                                                      <div className="absolute inset-0 rounded-lg border border-brand-500 animate-ping opacity-20" />
                                                   )}
                                                   <step.icon size={14} strokeWidth={1.5} />
                                                </div>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-charcoal' : 'text-charcoal/40'}`}>{step.label}</p>
                                             </div>
                                          );
                                       })}
                                    </div>
                                    <div className="absolute top-4.5 left-10 right-10 h-[1px] bg-charcoal/5 -z-0">
                                       <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${Math.min(100, (['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(selectedOrder.status) / 4) * 100)}%` }}
                                          className="h-full bg-brand-500"
                                       />
                                    </div>
                                 </div>
                              </div>

                              {(selectedOrder as any).shipment && (
                                 <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl bg-charcoal text-cream-dark relative overflow-hidden group shadow-lg shadow-charcoal/5">
                                       <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                          <Truck size={60} />
                                       </div>
                                       <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-cream/60 mb-6">Intelligence</h4>
                                       <div className="space-y-4 relative z-10">
                                          <div>
                                             <p className="text-[9px] uppercase tracking-widest text-cream/40 mb-1.5">Carrier</p>
                                             <p className="text-sm font-serif">{(selectedOrder as any).shipment.courierName || 'Partner Selection'}</p>
                                          </div>
                                          <div>
                                             <p className="text-[9px] uppercase tracking-widest text-cream/40 mb-1.5">Tracking Registry</p>
                                             <p className="text-sm font-mono tracking-tighter">{(selectedOrder as any).shipment.awb || 'Allocating...'}</p>
                                          </div>
                                          {(selectedOrder as any).shipment.trackingUrl && (
                                             <div className="pt-2">
                                                <a
                                                   href={(selectedOrder as any).shipment.trackingUrl}
                                                   target="_blank"
                                                   rel="noopener noreferrer"
                                                   className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] bg-brand-500 text-charcoal px-6 py-3 rounded-lg hover:opacity-90 transition-all active:scale-95"
                                                >
                                                   Track Live <ExternalLink size={10} />
                                                </a>
                                             </div>
                                          )}
                                       </div>
                                    </div>

                                    <div className="p-6 rounded-2xl border border-charcoal/10 bg-white shadow-sm">
                                       <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/50 mb-6">Destination</h4>
                                       <div className="space-y-5">
                                          <div className="flex items-start gap-4">
                                             <div className="w-9 h-9 rounded-full bg-charcoal/5 flex items-center justify-center shrink-0">
                                                <MapPin size={14} className="text-charcoal/70" />
                                             </div>
                                             <div>
                                                <p className="text-sm font-serif text-charcoal mb-1">{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                                                <p className="text-xs text-charcoal/70 leading-relaxed font-light">
                                                   {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.addressLine2 && `${selectedOrder.shippingAddress.addressLine2}, `}
                                                   {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                                                </p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              )}

                              <div className="mb-10">
                                 <div className="flex items-center justify-between mb-8">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/50">Essence Registry</h5>
                                    <span className="h-[1px] flex-1 mx-4 bg-charcoal/5" />
                                    <span className="text-[10px] text-charcoal/60 font-black uppercase tracking-widest">{selectedOrder.items.length} Units</span>
                                 </div>

                                 <div className="grid gap-3">
                                    {selectedOrder.items.map((item, idx) => (
                                       <div key={idx} className="flex gap-4 group items-center p-2 rounded-xl hover:bg-charcoal/[0.02] transition-all border border-transparent hover:border-charcoal/5">
                                          <div className="w-20 h-20 rounded-lg bg-charcoal/[0.03] border border-charcoal/5 p-2 overflow-hidden shrink-0">
                                             {item.image ? (
                                                <img
                                                   src={item.image}
                                                   alt={item.productName}
                                                   className="w-full h-full object-cover rounded mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                                                />
                                             ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-charcoal/5">
                                                   <ShoppingBag size={24} className="text-charcoal/10" />
                                                </div>
                                             )}
                                          </div>
                                          <div className="flex-1">
                                             <div className="flex justify-between items-start mb-2">
                                                <div>
                                                   <h6 className="font-serif text-base text-charcoal leading-tight mb-1">{item.productName}</h6>
                                                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-600 bg-brand-50 px-2 py-0.5 rounded w-fit">{item.variantSize}</p>
                                                </div>
                                                <p className="text-sm font-serif text-charcoal">₹{item.total.toLocaleString()}</p>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-charcoal/40">Qty: <span className="text-charcoal/80 font-bold">{item.quantity}</span></span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-charcoal/10" />
                                                <span className="text-[9px] font-mono text-charcoal/50 uppercase tracking-tighter">{item.sku}</span>
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              <div>
                                 <div className="flex items-center gap-3 mb-8">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-charcoal/50">History Registry</h5>
                                    <div className="h-[1px] flex-1 bg-charcoal/5" />
                                 </div>
                                 <div className="space-y-6 pl-5 border-l border-charcoal/5 ml-2">
                                    {(selectedOrder as any).timeline?.slice().reverse().map((event: any, idx: number) => (
                                       <div key={idx} className="relative">
                                          <div className="absolute -left-[24.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-charcoal/10 border-2 border-cream transition-colors group-hover:bg-brand-500" />
                                          <div className="space-y-1">
                                             <div className="flex flex-wrap items-center gap-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal">{event.status}</p>
                                                <div className="flex items-center gap-2 text-[8px] text-charcoal/50 font-black uppercase tracking-widest">
                                                   <Calendar size={10} /> {new Date(event.timestamp).toLocaleDateString()}
                                                   <Clock size={10} className="ml-2" /> {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                             </div>
                                             <p className="text-xs text-charcoal/70 leading-relaxed font-light max-w-md">{event.description}</p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  </div>
               </>
            )}
         </AnimatePresence>

          {/* Hidden Invoice Template for Printing */}
          <div style={{ display: "none" }}>
             {selectedOrder && (
                <InvoiceTemplate 
                   ref={invoiceRef} 
                   order={selectedOrder} 
                />
             )}
          </div>
      </>
   );
}
