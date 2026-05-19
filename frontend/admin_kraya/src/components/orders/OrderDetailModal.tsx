"use client";

import { Order, OrderTimeline, adminOrdersApi } from "@/lib/api/orders";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import Select from "@/components/ui/Select";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { pdf } from "@react-pdf/renderer";
import { ProformaInvoicePDF } from "./ProformaInvoicePDF";
import { 
  FileText, 
  MapPin, 
  Truck, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Activity,
  ChevronRight,
  Printer
} from "lucide-react";

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>;
}

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

const STATUS_CONFIG: Record<string, { variant: "warning" | "brand" | "success" | "error" | "gray", icon: any }> = {
  pending: { variant: "warning", icon: Clock },
  confirmed: { variant: "brand", icon: CheckCircle2 },
  processing: { variant: "brand", icon: Activity },
  shipped: { variant: "success", icon: Truck },
  delivered: { variant: "success", icon: CheckCircle2 },
  cancelled: { variant: "error", icon: AlertCircle },
  returned: { variant: "gray", icon: Activity },
};

export function OrderDetailModal({ order, onClose, onStatusUpdate }: OrderDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [timeline, setTimeline] = useState<OrderTimeline[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoadingTimeline(true);
    try {
      const res = await adminOrdersApi.getTimeline(order._id);
      setTimeline(res.data || []);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setLoadingTimeline(false);
    }
  }, [order._id]);

  const generatePDF = async () => {
    try {
      toast.info("SYNTHESIZING PROFORMA INVOICE...");
      const blob = await pdf(<ProformaInvoicePDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("PDF Generation error:", error);
      toast.error("FAILED TO GENERATE PDF DOCUMENT.");
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      await onStatusUpdate(order._id, newStatus);
      await fetchTimeline();
    } finally {
      setUpdating(false);
    }
  };

  const statusInfo = STATUS_CONFIG[order.status] || { variant: "gray", icon: Clock };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className="max-w-5xl  overflow-hidden"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border-light bg-white/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-brand-500/10 rounded-xl text-brand-600">
                  <FileText size={20} strokeWidth={2.5} />
               </div>
               <h2 className="text-xl font-black text-text-heading tracking-tight uppercase">Order Logistics Intelligence</h2>
            </div>
            <div className="flex items-center gap-2 ml-11">
              <span className="text-[12px] font-bold text-brand-600 uppercase tracking-widest">
                REF: {order.orderNumber}
              </span>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest select-all">
                UID: {order._id}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content (Left 8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            {/* Inventory Breakdown */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 ml-2">
                <Truck size={16} className="text-brand-600" strokeWidth={3} />
                <h3 className="text-[11px] font-black text-text-heading uppercase tracking-[0.2em]">Inventory Payload Snapshot</h3>
              </div>
              <div className="border border-border-light rounded-xl overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableCell isHeader className="">Product Name</TableCell>
                      <TableCell isHeader className="">Qty</TableCell>
                      <TableCell isHeader className="">Unit Rate</TableCell>
                      <TableCell isHeader className="">Extension</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="">
                          <div className="flex flex-col">
                            <span className="font-black text-text-heading text-[13px] uppercase tracking-tight">{item.productName}</span>
                            <span className="text-[9px] font-black text-text-body/30 uppercase tracking-widest mt-1.5">SKU: {item.sku} • {item.variantSize}</span>
                          </div>
                        </TableCell>
                        <TableCell >{item.quantity}</TableCell>
                        <TableCell >₹{item.price.toLocaleString()}</TableCell>
                        <TableCell >₹{item.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Financial & Logistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {/* Shipping Info */}
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 ml-2">
                    <MapPin size={16} className="text-brand-600" strokeWidth={3} />
                    <h3 className="text-[11px] font-black text-text-heading uppercase tracking-[0.2em]">Target Destination</h3>
                  </div>
                  <div className="bg-white border border-border-light rounded-xl p-3 shadow-sm flex flex-col h-full group hover:border-brand-500/20 transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-text-heading uppercase tracking-tight">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</span>
                      <p className="text-[11px] font-semibold text-text-body/70 leading-relaxed uppercase tracking-tight">
                        {order.shippingAddress?.addressLine1}, {order.shippingAddress?.addressLine2 && order.shippingAddress.addressLine2 + ","}<br />
                        {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                        {order.shippingAddress?.country}
                      </p>
                    </div>
                    <div className=" flex flex-col gap-2 pt-2 border-t border-border-light/50">
                       <div className="flex items-center gap-3 text-brand-600">
                          <Phone size={14} strokeWidth={3} />
                          <span className="text-[11px] font-black tracking-widest">{order.shippingAddress?.phone}</span>
                       </div>
                       <div className="flex items-center gap-3 text-text-body/50">
                          <Mail size={14} strokeWidth={3} />
                          <span className="text-[11px] font-bold tracking-tight lowercase">{order.email}</span>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Pricing Detail */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 ml-2">
                    <CreditCard size={16} className="text-brand-600" strokeWidth={3} />
                    <h3 className="text-[11px] font-black text-text-heading uppercase tracking-[0.2em]">Financial Summary</h3>
                  </div>
                  <div className="bg-bg-main/50 border border-border-light rounded-xl p-3 shadow-sm flex flex-col h-full">
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-body/50 uppercase tracking-widest">Gross Subtotal</span>
                        <span className="text-sm font-black text-text-heading tracking-tight">₹{order.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-error-600">
                        <span className="text-[10px] font-black uppercase tracking-widest">Discount</span>
                        <span className="text-sm font-black tracking-tight">-₹{order.discount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-body/50 uppercase tracking-widest">Logistics Fee</span>
                        <span className="text-sm font-black text-text-heading tracking-tight">₹{order.shippingCost?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-text-body/50 uppercase tracking-widest">Tax Provision</span>
                        <span className="text-sm font-black text-text-heading tracking-tight">₹{order.tax?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                    <div className="pt-2 mt-6 border-t-2 border-dashed border-border-light flex items-end justify-between">
                       <span className="text-[12px] font-black text-brand-600 uppercase tracking-wide">Final Amount</span>
                       <span className="text-3xl font-black text-brand-600 tracking-wide leading-none">₹{order.total?.toLocaleString()}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar (Right 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
             {/* Status Control */}
             <div className="bg-white border border-brand-500/10 rounded-xl p-3 shadow-sm flex flex-col gap-3">
                <div className="flex flex-col gap-3">
                   <span className="text-[10px] font-black text-text-body/40 uppercase tracking-[0.2em] ml-1">Lifecycle State</span>
                   <Badge variant={statusInfo.variant} className="w-fit !px-4 !py-1.5 !text-[11px]">
                     <statusInfo.icon size={12} className="mr-2" strokeWidth={3} />
                     {order.status.toUpperCase()}
                   </Badge>
                </div>
                <div className="flex flex-col gap-3">
                   <Select 
                     label="Update Status To"
                     disabled={updating}
                     value={order.status}
                     onChange={(val) => handleStatusChange(val)}
                     options={ORDER_STATUSES.map(s => ({ value: s, label: s.toUpperCase() }))}
                   />
                   {updating && (
                     <div className="flex items-center gap-2 mt-1 justify-center">
                        <div className="w-1 h-1 rounded-full bg-brand-500 animate-ping" />
                        <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Synchronizing state...</span>
                     </div>
                   )}
                </div>

                <div className="pt-2 border-t border-border-light">
                   <span className="text-[9px] font-black text-black uppercase tracking-[0.2em] mb-3 block ml-1">Operational Notes</span>
                   <div className="bg-bg-main rounded-xl p-3 text-[11px] font-semibold text-text-body/60 leading-relaxed italic border border-border-light/50">
                     {order.notes || "No operational notes provided for this purchase cycle."}
                   </div>
                </div>
             </div>

             {/* Timeline Audit */}
             <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3 ml-2">
                  <Activity size={16} className="text-brand-600" strokeWidth={3} />
                  <h3 className="text-[11px] font-black text-text-heading uppercase tracking-[0.2em]">Audit Traceability</h3>
                </div>
                <div className="flex flex-col gap-0 px-2">
                  {loadingTimeline ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {timeline.slice().reverse().map((entry, idx) => {
                        const isLatest = idx === 0;
                        return (
                          <div key={idx} className="relative pl-8 pb-6 group">
                            {/* Line */}
                            {idx !== timeline.length - 1 && (
                              <div className={`absolute left-[4px] top-2 bottom-0 w-1 bg-border-light transition-colors ${isLatest ? 'bg-brand-500/20' : ''}`} />
                            )}
                            {/* Dot */}
                            <div className={`absolute left-0 top-1.5 h-2 w-2 rounded-full border-2 z-10 transition-all ${isLatest ? 'bg-brand-600 border-brand-200 scale-125 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-white border-border-light group-hover:border-brand-500'}`} />
                            
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLatest ? 'text-brand-600' : 'text-text-body/60'}`}>
                                  {entry.status}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                  {new Date(entry.timestamp).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className={`text-[11px] font-semibold leading-tight uppercase tracking-tight ${isLatest ? 'text-text-heading' : 'text-text-body/60'}`}>
                                {entry.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {timeline.length === 0 && (
                        <div className="py-12 flex flex-col items-center gap-3 opacity-30">
                           <Activity size={24} />
                           <p className="text-[10px] font-black uppercase tracking-widest">No audit trails identified</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-3 py-3 border-t border-border-light bg-white flex items-center justify-between sticky bottom-0 z-10">
           <Button variant="ghost" onClick={onClose} className="!px-8 border border-border-light rounded-xl">
             CLOSE
           </Button>
           <div className="flex items-center gap-4">
              <Button 
                onClick={generatePDF}
                variant="outline"
                className="gap-2 !px-8 border-brand-500/20 text-brand-600 hover:bg-brand-50 rounded-xl"
              >
                <Printer size={16} strokeWidth={3} />
                Generate Invoice
              </Button>
           </div>
        </div>
      </div>
    </Modal>
  );
}
