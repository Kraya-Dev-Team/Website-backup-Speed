"use client";

import { useEffect, useState, useCallback } from "react";
import { adminOrdersApi, adminDeliveryApi, type Order } from "@/lib/api";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { 
  ShoppingCart, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RotateCcw,
  CreditCard,
  Package,
  FileText,
  MapPin,
  Loader2,
  X
} from "lucide-react";

const STATUS_CONFIG: Record<string, { variant: "warning" | "brand" | "success" | "error" | "gray", icon: any }> = {
  pending: { variant: "warning", icon: Clock },
  confirmed: { variant: "brand", icon: CheckCircle2 },
  processing: { variant: "brand", icon: RotateCcw },
  shipped: { variant: "success", icon: Truck },
  delivered: { variant: "success", icon: CheckCircle2 },
  cancelled: { variant: "error", icon: XCircle },
  returned: { variant: "gray", icon: RotateCcw },
};

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [availableCouriers, setAvailableCouriers] = useState<{ orderId: string, shipmentId: string, couriers: any[] } | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<Record<string, string>>({});
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const LIMIT = 20;

  const handleTrackShipment = async (awb: string) => {
    try {
      const res = await adminDeliveryApi.trackShipment(awb);
      if (res.success) {
        setTrackingData(res.data);
        setIsTrackModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch tracking data");
    }
  };

  const fetchOrders = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await adminOrdersApi.list({ page: p, limit: LIMIT, status: s || undefined });
      const data = res?.data;
      setOrders(data?.orders || []);
      setTotal(data?.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(1, ""); }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminOrdersApi.updateStatus(orderId, newStatus, `Status updated to ${newStatus}`);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order moved to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err?.message || "Status update failed.");
    }
  };

  const handleAssignAWBStart = async (order: Order) => {
    if (!order.shippingAddress?.pincode) {
      toast.error("Customer pincode is missing");
      return;
    }
    
    setProcessingId(order._id);
    try {
      const res = await adminDeliveryApi.checkServiceability({
        pickup_postcode: "395004", 
        delivery_postcode: order.shippingAddress.pincode,
        weight: 0.5,
        cod: order.payment?.method === "COD" ? 1 : 0
      });

      if (res.success && res.data?.data?.available_courier_companies?.length > 0) {
        setAvailableCouriers({ 
          orderId: order._id, 
          shipmentId: order.shipment!.shipmentId!,
          couriers: res.data.data.available_courier_companies 
        });
      } else {
        toast.warning("No couriers available for this pincode.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to check serviceability");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateShipment = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await adminOrdersApi.createShipment(orderId);
      if (res.success) {
        toast.success("Shipment created successfully");
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...res.data } : o));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create shipment");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateAWB = async (orderId: string, shipmentId: string, courierId: string | number) => {
    setProcessingId(orderId);
    try {
      const res = await adminDeliveryApi.generateAwb(orderId, shipmentId, courierId);
      
      if (res.success) {
        if (res.data?.awb_assign_status === 0 || res.data?.status_code === 350 || res.data?.status_code === 422) {
          const errorMsg = res.data?.message || res.data?.response?.data?.awb_assign_error || "";
          
          // If already assigned, try to extract AWB from message and sync state
          if (errorMsg.toLowerCase().includes("already assigned")) {
            const match = errorMsg.match(/awb\s*-\s*(\d+)/i);
            const awbCode = match ? match[1] : null;
            
            if (awbCode) {
              toast.info(`Syncing existing AWB: ${awbCode}`);
              setOrders(prev => prev.map(o => o._id === orderId ? { 
                ...o, 
                shipment: { ...o.shipment!, awb: awbCode } 
              } : o));
              return;
            }
          }

          toast.error(`Shiprocket: ${errorMsg || "AWB assignment failed"}`);
          return;
        }

        toast.success("AWB generated successfully");
        const awbCode = res.data?.response?.data?.awb_code;
        if (awbCode) {
          setOrders(prev => prev.map(o => o._id === orderId ? { 
            ...o, 
            shipment: { ...o.shipment!, awb: awbCode } 
          } : o));
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate AWB");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestPickup = async (orderId: string, shipmentId: string) => {
    setProcessingId(orderId);
    try {
      const res = await adminDeliveryApi.requestPickup(orderId, [shipmentId]);
      if (res.success) {
        if (res.data?.pickup_status === 0 && !res.synced) {
          const errorMsg = res.data?.response?.pickup_error || res.data?.message || "Pickup request failed";
          toast.error(`Shiprocket: ${errorMsg}`);
          return;
        }
        
        toast.success(res.message || "Pickup requested successfully");
        
        // Update local state to show Track button
        setOrders(prev => prev.map(o => o._id === orderId ? { 
          ...o, 
          shipment: { ...o.shipment!, pickupScheduledDate: new Date().toISOString() } 
        } : o));
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to request pickup");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateLabel = async (orderId: string, shipmentId: string) => {
    setProcessingId(orderId);
    try {
      const res = await adminDeliveryApi.generateLabel(orderId, [shipmentId]);
      if (res.success) {
        if (res.data?.label_created === 0) {
          const errorMsg = res.data?.response || "Label creation failed";
          toast.error(`Shiprocket: ${errorMsg}`);
          return;
        }

        const labelUrl = res.data?.label_url;
        if (labelUrl) window.open(labelUrl, "_blank");
        toast.success("Label generated successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate label");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelShipment = async (orderId: string, shipmentId: string, awb?: string, shiprocketOrderId?: string) => {
    if (!window.confirm("Are you sure you want to cancel this shipment?")) return;
    
    setProcessingId(orderId);
    try {
      await adminDeliveryApi.cancelOrder(orderId, [shipmentId], awb, shiprocketOrderId);
      toast.success("Shipment canceled successfully");
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled", shipment: o.shipment ? { ...o.shipment, status: "cancelled" } : undefined } : o));
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel shipment");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="animate-in fade-in duration-500">
      <ComponentCard 
        title="Order Management" 
        desc={`Tracking and processing ${total} historical purchase cycles`}
        showHideSelection={false}
        formIcon={<ShoppingCart size={20} className="text-brand-600" />}
      >
        {/* Status Filters */}
        <div className="p-3 border-b border-border-light bg-bg-main/30 flex items-center gap-3 overflow-x-auto custom-scrollbar no-scrollbar">
          <button
            onClick={() => { setStatus(""); setPage(1); fetchOrders(1, ""); }}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest border whitespace-nowrap ${
              status === "" 
                ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20" 
                : "bg-white text-text-body border-border-light hover:border-brand-500/30"
            }`}
          >
            All Orders
          </button>
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); fetchOrders(1, s); }}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest border whitespace-nowrap ${
                status === s 
                  ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20" 
                  : "bg-white text-text-body border-border-light hover:border-brand-500/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className="px-8">Order Reference</TableCell>
                <TableCell isHeader>Customer Detail</TableCell>
                <TableCell isHeader className="text-right">Amount</TableCell>
                <TableCell isHeader className="text-center">Current State</TableCell>
                <TableCell isHeader className="text-center">Logistics</TableCell>
                <TableCell isHeader>Purchase Date</TableCell>
                <TableCell isHeader className="px-8 text-right">Operations</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-32 text-center text-text-body/40 font-black uppercase tracking-widest">
                    No order cycles detected.
                  </TableCell>
                </TableRow>
              ) : orders.map((o) => {
                const statusInfo = STATUS_CONFIG[o.status] || { variant: "gray", icon: Clock };
                const isProcessing = processingId === o._id;
                
                return (
                  <TableRow key={o._id}>
                    <TableCell className="px-8">
                      <div className="flex flex-col">
                         <span className="font-black text-text-heading text-sm tracking-tight">{o.orderNumber || "ORD-UNK"}</span>
                         <span className="text-[9px] font-black text-text-body/30 tracking-widest uppercase mt-1">REF: #{o._id.slice(-8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                         <span className="font-black text-text-heading text-[13px] uppercase tracking-tight">{o.shippingAddress?.firstName} {o.shippingAddress?.lastName}</span>
                         <span className="text-[10px] text-text-body/60 font-bold mt-1 tracking-tight">{o.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                         <span className="font-black text-brand-600 text-sm tracking-tight">₹{o.total?.toLocaleString()}</span>
                         <span className="text-[9px] font-black text-text-body/40 uppercase tracking-widest mt-1">{o.itemCount} Units</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusInfo.variant}>
                        <statusInfo.icon size={10} className="mr-1.5" strokeWidth={3} />
                        {o.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        {isProcessing ? (
                          <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-brand-50 border border-brand-100">
                            <Loader2 size={12} className="animate-spin text-brand-600" />
                            <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Processing...</span>
                          </div>
                        ) : (!o.shipment?.shipmentId || o.shipment?.status === "cancelled") ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="!h-8 !px-3 !rounded-lg border-brand-200 hover:bg-brand-50 hover:text-brand-700 group transition-all"
                            onClick={() => handleCreateShipment(o._id)}
                          >
                            <Package size={12} className="mr-1.5 text-brand-500 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-black tracking-widest uppercase">Create Shipment</span>
                          </Button>
                         ) : (o.shipment?.status !== "cancelled" && !o.shipment?.awb) ? (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="!h-8 !px-3 !rounded-lg border-warning-200 hover:bg-warning-50 hover:text-warning-700 group transition-all"
                              onClick={() => handleAssignAWBStart(o)}
                            >
                              <FileText size={12} className="mr-1.5 text-warning-500 group-hover:scale-110 transition-transform" />
                              <span className="text-[9px] font-black tracking-widest uppercase">Assign AWB</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="!h-8 !w-8 !p-0 !rounded-lg hover:bg-error-50 hover:text-error-600 transition-all"
                              onClick={() => handleCancelShipment(o._id, o.shipment!.shipmentId!, o.shipment?.awb, o.shipment?.shiprocketOrderId)}
                              title="Cancel Shipment"
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="!h-8 !px-3 !rounded-lg border-gray-200 hover:bg-gray-50 group transition-all"
                              onClick={() => handleGenerateLabel(o._id, o.shipment!.shipmentId!)}
                              title="Download Label"
                            >
                              <FileText size={12} className="mr-1.5 text-gray-500 group-hover:text-brand-600" />
                              <span className="text-[9px] font-black tracking-widest uppercase">Label</span>
                            </Button>
                            {!o.shipment.pickupScheduledDate ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="!h-8 !px-3 !rounded-lg border-gray-200 hover:bg-gray-50 group transition-all"
                                onClick={() => handleRequestPickup(o._id, o.shipment!.shipmentId!)}
                                title="Request Pickup"
                              >
                                <Truck size={12} className="mr-1.5 text-gray-500 group-hover:text-brand-600" />
                                <span className="text-[9px] font-black tracking-widest uppercase">Request Pickup</span>
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="!h-8 !px-3 !rounded-lg border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 group transition-all"
                                onClick={() => handleTrackShipment(o.shipment!.awb!)}
                                title="Track Order"
                              >
                                <MapPin size={12} className="mr-1.5 text-brand-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black tracking-widest uppercase">Track</span>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="!h-8 !w-8 !p-0 !rounded-lg hover:bg-error-50 hover:text-error-600 transition-all"
                              onClick={() => handleCancelShipment(o._id, o.shipment!.shipmentId!, o.shipment?.awb, o.shipment?.shiprocketOrderId)}
                              title="Cancel Shipment"
                            >
                              <X size={14} />
                            </Button>
                            <div className="flex flex-col items-start ml-2 pl-2 border-l border-gray-100">
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AWB</span>
                              <span className="text-[10px] font-bold text-gray-900 font-mono">{o.shipment.awb}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-black text-text-body/60 uppercase tracking-widest">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric'
                          }) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <Button 
                        variant="ghost"
                        onClick={() => setSelectedOrder(o)}
                        className="h-10 w-10 !p-0 rounded-xl"
                      >
                        <Eye size={18} strokeWidth={2.5} className="text-brand-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Card Footer */}
        <div className="p-8 border-t border-border-light bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-[11px] font-black text-text-body/60 uppercase tracking-widest">
              Processing {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} of {total} logistics threads
           </p>
           {totalPages > 1 && (
              <div className="flex gap-4">
                 <Button 
                   variant="outline"
                   disabled={page === 1}
                   onClick={() => { const p = page - 1; setPage(p); fetchOrders(p, status); }}
                   className="!py-2 !px-4 !rounded-xl"
                 >
                   <ChevronLeft size={16} strokeWidth={3} className="mr-2" />
                   PREV
                 </Button>
                 <Button 
                   variant="outline"
                   disabled={page === totalPages}
                   onClick={() => { const p = page + 1; setPage(p); fetchOrders(p, status); }}
                   className="!py-2 !px-4 !rounded-xl"
                 >
                   NEXT
                   <ChevronRight size={16} strokeWidth={3} className="ml-2" />
                 </Button>
              </div>
           )}
        </div>
      </ComponentCard>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusUpdate={async (id, s) => {
            await handleStatusChange(id, s);
            setSelectedOrder(prev => prev ? { ...prev, status: s } : null);
          }}
        />
      )}

      {availableCouriers && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div>
                 <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Courier</h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Available logistics partners for this zone</p>
               </div>
               <Button variant="ghost" size="sm" onClick={() => setAvailableCouriers(null)} className="h-10 w-10 !p-0 rounded-xl">
                 <XCircle size={20} className="text-gray-400" />
               </Button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid gap-3">
                {availableCouriers.couriers.map((c: any) => (
                  <button
                    key={c.courier_company_id}
                    onClick={() => {
                      setAvailableCouriers(null);
                      handleGenerateAWB(availableCouriers.orderId, availableCouriers.shipmentId, c.courier_company_id);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedCourierId[availableCouriers.orderId] === c.courier_company_id
                        ? "border-brand-500 bg-brand-50/50 shadow-lg shadow-brand-500/10"
                        : "border-gray-100 hover:border-brand-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Truck size={20} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{c.courier_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-success-600 uppercase bg-success-50 px-1.5 py-0.5 rounded">ETD: {c.etd || "N/A"}</span>
                          <span className="text-[9px] font-black text-brand-600 uppercase bg-brand-50 px-1.5 py-0.5 rounded">Rating: {c.rating || "4.5"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-600 text-sm tracking-tight">₹{c.rate}</p>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">EST. COST</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tracking Modal */}
      <Modal 
        isOpen={isTrackModalOpen} 
        onClose={() => setIsTrackModalOpen(false)}
        title="Live Tracking Status"
      >
        <div className="space-y-6 h-auto max-h-[85vh] w-full max-w-2xl mx-auto px-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {trackingData?.tracking_data?.shipment_track?.[0] ? (
            <div className="flex flex-col min-h-0">
              {/* Summary Card */}
              <div className="p-5 bg-brand-50 rounded-xl border border-brand-100 pr-12 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-200/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative z-10 space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Current Status</p>
                      <h3 className="text-2xl font-black text-brand-900 leading-tight">
                        {trackingData.tracking_data.shipment_track[0].current_status}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">AWB Number</p>
                      <p className="font-mono font-bold text-brand-900 bg-white/60 px-2 py-0.5 rounded border border-brand-200 inline-block">{trackingData.tracking_data.shipment_track[0].awb_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4 px-4 bg-white/40 rounded-lg border border-brand-200/50">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Origin</p>
                      <p className="text-sm font-black text-brand-900">{trackingData.tracking_data.shipment_track[0].origin}</p>
                    </div>
                    <div className="flex flex-col items-center px-2">
                      <div className="w-12 h-0.5 bg-brand-200 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(var(--brand-600-rgb),0.5)]" />
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Destination</p>
                      <p className="text-sm font-black text-brand-900">{trackingData.tracking_data.shipment_track[0].destination}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Expected Delivery</p>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-brand-600" />
                        <p className="text-sm font-bold text-gray-900">
                          {trackingData.tracking_data.shipment_track[0].edd ? 
                            new Date(trackingData.tracking_data.shipment_track[0].edd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                            : 'To be updated'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Courier Partner</p>
                      <p className="text-sm font-bold text-gray-900">{trackingData.tracking_data.shipment_track[0].courier_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Section - Now Flexible */}
              <div className="space-y-4 py-2 px-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tracking History</p>
                  <p className="text-[10px] font-bold text-gray-400">
                    Last update: {trackingData.tracking_data.shipment_track[0].current_timestamp || 'Just now'}
                  </p>
                </div>
                
                <div className="space-y-4 relative py-2 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm bg-brand-600 ring-4 ring-brand-50">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-900">
                        {trackingData.tracking_data.shipment_track[0].current_status}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {trackingData.tracking_data.shipment_track[0].origin} • {trackingData.tracking_data.shipment_track[0].current_timestamp || 'Just now'}
                      </p>
                    </div>
                  </div>

                  {trackingData.tracking_data.shipment_track_activities?.map((activity: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm bg-gray-200" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {activity.activity}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {activity.location} • {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}

                  {(!trackingData.tracking_data.shipment_track_activities || trackingData.tracking_data.shipment_track_activities.length === 0) && (
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm bg-gray-200" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 italic">
                          Waiting for courier scan...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="animate-spin text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Fetching live tracking info...</p>
            </div>
          )}
          
          <div className="flex gap-3 p-3 shrink-0 border-t border-gray-100 bg-white">
            <Button 
              variant="outline"
              className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold tracking-widest uppercase text-xs"
              onClick={() => setIsTrackModalOpen(false)}
            >
              Close
            </Button>
            {trackingData?.tracking_data?.track_url && (
              <Button 
                className="flex-[2] h-12 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2"
                onClick={() => window.open(trackingData.tracking_data.track_url, "_blank")}
              >
                Full Tracking Page
                <Eye size={16} />
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
