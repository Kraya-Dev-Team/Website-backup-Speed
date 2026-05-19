"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, ordersApi, type Order } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  MapPin, 
  Save, 
  Loader2, 
  LogOut, 
  Package, 
  ArrowRight, 
  Edit3, 
  X 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import AnimatedBackgroundText from "@/components/ui/AnimatedBackgroundText";
import { addressesApi, type Address } from "@/lib/api";
import OrderHistory from "@/components/profile/OrderHistory";
import AddressBook from "@/components/profile/AddressBook";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

function ProfileContent() {
  const { user, isLoggedIn, isLoading: authLoading, logout, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<"profile" | "orders" | "addresses">("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    type: "home" as const,
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "orders") setActiveSection("orders");
    if (tab === "addresses") setActiveSection("addresses");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
      // Pre-fill address form with name/phone
      setAddressForm(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Fetch orders or addresses when section changes
  useEffect(() => {
    if (activeSection === "orders" && isLoggedIn && orders.length === 0) {
      setOrdersLoading(true);
      ordersApi.getMyOrders(1, 10)
        .then(res => {
          if (res.success) {
            const raw = res.data as any;
            const list = Array.isArray(raw) ? raw : raw?.orders ?? raw?.data ?? [];
            setOrders(list);
          }
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
    if (activeSection === "addresses" && isLoggedIn) {
      fetchAddresses();
    }
  }, [activeSection, isLoggedIn]);

  // Reference-counted body scroll lock; coordinates with all other modals.
  useBodyScrollLock(isAddingAddress);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await addressesApi.get();
      if (res.success) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAddress(true);
    try {
      const res = await addressesApi.create(addressForm);
      if (res.success) {
        fetchAddresses();
        setIsAddingAddress(false);
        setAddressForm(prev => ({
           ...prev,
           addressLine1: "",
           addressLine2: "",
           city: "",
           state: "",
           pincode: "",
        }));
        setMessage({ type: "success", text: "New Address Added." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to add address" });
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const res = await addressesApi.delete(id);
      if (res.success) {
        setAddresses(prev => prev.filter(a => (a.id || (a as any)._id) !== id));
        setMessage({ type: "success", text: "Sanctuary removed from your registry." });
      }
    } catch (err: any) {
       setMessage({ type: "error", text: err.message || "Failed to delete address" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await userApi.updateProfile(formData);
      if (res.success) {
        const u = res.data || res.user;
        if (u) setUser(u);
        setMessage({ type: "success", text: "Settings saved to your essence profile." });
        setIsEditing(false);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-charcoal/20 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-cream pt-32 pb-20 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full opacity-[0.03] pointer-events-none select-none">
        <AnimatedBackgroundText 
          text="         Profile" 
          className="text-[15rem] font-serif font-black leading-none uppercase"
        />
      </div>

      <div className="container mx-auto px-6 max-w-5xl relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-charcoal/40 uppercase tracking-[0.4em] text-[10px] font-bold mb-2 block">
              Member Profile
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-charcoal leading-tight">
              Welcome, <span className="italic">{formData.firstName || "Guest"}</span>
            </h1>
          </motion.div>

          {activeSection === "profile" && !isEditing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-charcoal/5 hover:bg-charcoal text-charcoal/60 hover:text-cream rounded-full transition-all text-[10px] font-bold uppercase tracking-widest border border-charcoal/10 shadow-sm"
            >
              <Edit3 size={14} /> Edit Identity
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Sidebar - Mobile: Top, Desktop: Right */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 lg:order-2 order-first lg:sticky lg:top-32"
          >
            <div className="space-y-4">
              <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold text-charcoal/30 px-2">Account Registry</h4>
              <div className="bg-charcoal/5 border border-charcoal/10 overflow-hidden rounded-[2rem] shadow-sm">
                <div 
                  onClick={() => { setActiveSection("profile"); setIsEditing(false); }}
                  className={`flex justify-between items-center p-5 transition-all cursor-pointer group border-b border-charcoal/5 ${
                    activeSection === "profile" ? "bg-charcoal text-cream" : "bg-cream hover:bg-cream-dark"
                  }`}
                >
                   <span className={`text-xs uppercase tracking-[0.15em] font-bold flex items-center gap-2 ${
                    activeSection === "profile" ? "text-cream" : "text-charcoal/60 group-hover:text-charcoal"
                  } transition-colors`}>
                    <User size={12} /> Profile Details
                  </span>
                  <ArrowRight size={12} className={`transition-all ${activeSection === "profile" ? "opacity-80 text-cream" : "opacity-20 group-hover:opacity-100 group-hover:translate-x-1"}`} />
                </div>
                <div 
                  onClick={() => { setActiveSection("orders"); setIsEditing(false); }}
                  className={`flex justify-between items-center p-5 transition-all cursor-pointer group border-b border-charcoal/5 ${
                    activeSection === "orders" ? "bg-charcoal text-cream" : "bg-cream hover:bg-cream-dark"
                  }`}
                >
                  <span className={`text-xs uppercase tracking-[0.15em] font-bold flex items-center gap-2 ${
                    activeSection === "orders" ? "text-cream" : "text-charcoal/60 group-hover:text-charcoal"
                  } transition-colors`}>
                    <Package size={12} /> Orders
                  </span>
                  <ArrowRight size={12} className={`transition-all ${activeSection === "orders" ? "opacity-80 text-cream" : "opacity-20 group-hover:opacity-100 group-hover:translate-x-1"}`} />
                </div>
                <div 
                  onClick={() => { setActiveSection("addresses"); setIsEditing(false); }}
                  className={`flex justify-between items-center p-5 transition-all cursor-pointer group border-b border-charcoal/5 ${
                    activeSection === "addresses" ? "bg-charcoal text-cream" : "bg-cream hover:bg-cream-dark"
                  }`}
                >
                  <span className={`text-xs uppercase tracking-[0.15em] font-bold flex items-center gap-2 ${
                    activeSection === "addresses" ? "text-cream" : "text-charcoal/60 group-hover:text-charcoal"
                  } transition-colors`}>
                    <MapPin size={12} /> Address Book
                  </span>
                  <ArrowRight size={12} className={`transition-all ${activeSection === "addresses" ? "opacity-80 text-cream" : "opacity-20 group-hover:opacity-100 group-hover:translate-x-1"}`} />
                </div>
                <div 
                  onClick={() => logout()}
                  className="flex justify-between items-center p-5 bg-cream hover:bg-red-50/50 transition-all cursor-pointer group text-red-400 hover:text-red-600"
                >
                  <span className="text-xs uppercase tracking-[0.15em] font-bold">Sign Out</span>
                  <LogOut size={14} className="opacity-40 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 lg:order-1">
            <AnimatePresence mode="wait">
              {activeSection === "profile" && (
                <motion.div
                  key="profile-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                      <div className="space-y-1.5 group">
                        <label className="block text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/40 group-focus-within:text-charcoal transition-colors">
                          Given Name
                        </label>
                        <input 
                          type="text" 
                          value={formData.firstName}
                          onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={!isEditing}
                          className={`w-full bg-transparent border-b py-2 text-charcoal text-base font-light focus:outline-none transition-all placeholder:text-charcoal/10 ${
                            isEditing ? "border-charcoal/30 focus:border-charcoal" : "border-transparent cursor-default"
                          }`}
                          placeholder="Enter first name"
                        />
                      </div>

                      <div className="space-y-1.5 group">
                        <label className="block text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/40 group-focus-within:text-charcoal transition-colors">
                          Surname
                        </label>
                        <input 
                          type="text" 
                          value={formData.lastName}
                          onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={!isEditing}
                          className={`w-full bg-transparent border-b py-2 text-charcoal text-base font-light focus:outline-none transition-all placeholder:text-charcoal/10 ${
                            isEditing ? "border-charcoal/30 focus:border-charcoal" : "border-transparent cursor-default"
                          }`}
                          placeholder="Enter last name"
                        />
                      </div>

                      <div className="space-y-1.5 group">
                        <label className="block text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/40 group-focus-within:text-charcoal transition-colors">
                          Registry Email
                        </label>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                          className={`w-full bg-transparent border-b py-2 text-charcoal text-base font-light focus:outline-none transition-all placeholder:text-charcoal/10 ${
                            isEditing ? "border-charcoal/30 focus:border-charcoal" : "border-transparent cursor-default"
                          }`}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="space-y-1.5 group">
                        <label className="block text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/40 group-focus-within:text-charcoal transition-colors">
                          Mobile Number
                        </label>
                        <input 
                          type="tel" 
                          value={user?.phone || ""}
                          disabled
                          className="w-full bg-transparent border-b border-transparent py-2 text-charcoal/40 text-base font-light focus:outline-none cursor-not-allowed opacity-60"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10"
                      >
                        <AnimatePresence mode="wait">
                          {message && (
                            <motion.div 
                              key={message.text}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`text-[10px] uppercase tracking-widest font-bold ${message.type === "success" ? "text-green-600" : "text-red-500"}`}
                            >
                              {message.text}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setFormData({
                                firstName: user?.firstName || "",
                                lastName: user?.lastName || "",
                                email: user?.email || "",
                              });
                            }}
                            className="flex-1 md:flex-none px-10 py-4 rounded-full border border-charcoal/10 text-[9px] font-bold uppercase tracking-[0.2em] text-charcoal/40 hover:bg-charcoal/5 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 md:flex-none bg-charcoal text-cream hover:opacity-90 disabled:opacity-50 px-10 py-4 rounded-full flex items-center justify-center gap-4 transition-all uppercase tracking-[0.2em] text-[9px] font-bold shadow-xl shadow-charcoal/10 active:scale-95"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin text-cream/50" /> : <Save size={14} />}
                            Save Changes
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </form>
                </motion.div>
              )}

              {activeSection === "addresses" && (
                <AddressBook 
                  addresses={addresses}
                  isLoading={addressesLoading}
                  onDelete={deleteAddress}
                  onAdd={handleAddAddress}
                  isAdding={isAddingAddress}
                  setIsAdding={setIsAddingAddress}
                  isSubmitting={isSubmittingAddress}
                  addressForm={addressForm}
                  setAddressForm={setAddressForm}
                />
              )}

              {activeSection === "orders" && (
                <OrderHistory orders={orders} isLoading={ordersLoading} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-charcoal/20 animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
