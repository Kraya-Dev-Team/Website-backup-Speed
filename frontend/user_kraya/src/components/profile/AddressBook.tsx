"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Home, 
  Briefcase, 
  Compass, 
  Phone, 
  Loader2 
} from "lucide-react";
import { type Address } from "@/lib/api";

interface AddressBookProps {
  addresses: Address[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onAdd: (form: any) => Promise<void>;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
  isSubmitting: boolean;
  addressForm: any;
  setAddressForm: (val: any) => void;
}

export default function AddressBook({
  addresses,
  isLoading,
  onDelete,
  onAdd,
  isAdding,
  setIsAdding,
  isSubmitting,
  addressForm,
  setAddressForm
}: AddressBookProps) {
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAdding) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isAdding]);

  return (
    <>
      <motion.div
        key="addresses"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-charcoal/5 flex items-center justify-center">
              <MapPin size={14} className="text-charcoal/60" />
            </div>
            <h3 className="font-serif text-2xl text-charcoal">My Addresses</h3>
          </div>
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-[10px] font-bold text-charcoal/50 hover:text-charcoal flex items-center gap-2 transition-all uppercase tracking-widest px-4 py-2 rounded-full border border-charcoal/30 hover:border-charcoal/20"
          >
            <Plus size={12} /> Add new adrress
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            [1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-charcoal/5 animate-pulse" />)
          ) : addresses.length === 0 ? (
            <div className="md:col-span-2 p-12 rounded-[2rem] border border-dashed border-charcoal/50 flex flex-col items-center justify-center text-center gap-4 bg-charcoal/[0.01]">
              <Compass size={32} strokeWidth={1} className="text-charcoal/60" />
              <p className="text-[11px] text-charcoal/60 uppercase tracking-[0.2em] font-bold">No saved addresses found.</p>
            </div>
          ) : (
            addresses.map(addr => {
              const id = addr.id || (addr as any)._id;
              const Icon = addr.type === 'home' ? Home : addr.type === 'work' ? Briefcase : Compass;
              return (
                <motion.div 
                  key={id} 
                  layout
                  className="p-6 rounded-[2rem] border border-charcoal/5 bg-cream-dark/10 group relative overflow-hidden hover:border-charcoal/20 transition-all"
                >
                   <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon size={12} className="text-charcoal/30" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/40">{addr.type}</span>
                        {addr.isDefault && <span className="text-[7px] font-black bg-charcoal text-cream px-2 py-0.5 rounded-full uppercase tracking-widest">Default</span>}
                      </div>
                      <button type="button" onClick={() => onDelete(id)} className="p-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all translate-x-2">
                        <Trash2 size={12} />
                      </button>
                   </div>
                   <h6 className="font-serif text-charcoal text-lg mb-1">{addr.firstName} {addr.lastName}</h6>
                   <p className="text-[11px] text-charcoal/50 leading-relaxed font-light">
                     {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                     {addr.city}, {addr.state} - {addr.pincode}
                   </p>
                   <div className="mt-4 pt-4 border-t border-charcoal/5 flex items-center gap-2">
                      <Phone size={10} className="text-charcoal/20" />
                      <p className="text-[10px] text-charcoal/40 font-bold tracking-tight">{addr.phone}</p>
                   </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Add Address Form Modal-style overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setIsAdding(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-cream w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
               <h3 className="font-serif text-3xl text-charcoal mb-2">Add <span className="italic">Haven</span></h3>
               <p className="text-[10px] text-charcoal/30 uppercase tracking-[0.2em] font-bold mb-8">Register a new delivery destination</p>
               
               <form onSubmit={(e) => { e.preventDefault(); onAdd(e); }} className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <input 
                    className="col-span-1 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="First Name"
                    value={addressForm.firstName}
                    onChange={e => setAddressForm({...addressForm, firstName: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-1 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Last Name"
                    value={addressForm.lastName}
                    onChange={e => setAddressForm({...addressForm, lastName: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-2 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Phone Number"
                    value={addressForm.phone}
                    onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-2 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Address Line 1 (Street, Area)"
                    value={addressForm.addressLine1}
                    onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-2 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.addressLine2}
                    onChange={e => setAddressForm({...addressForm, addressLine2: e.target.value})}
                  />
                  <input 
                    className="col-span-1 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-1 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                    required
                  />
                  <input 
                    className="col-span-1 bg-transparent border-b border-charcoal/10 py-2 text-sm focus:outline-none focus:border-charcoal transition-all"
                    placeholder="Pincode"
                    value={addressForm.pincode}
                    onChange={e => setAddressForm({...addressForm, pincode: e.target.value})}
                    required
                  />
                  <div className="col-span-1 flex items-center gap-3">
                     {(['home', 'work', 'other'] as const).map(t => (
                       <button 
                         key={t}
                         type="button"
                         onClick={() => setAddressForm({...addressForm, type: t})}
                         className={`px-3 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${addressForm.type === t ? 'bg-charcoal text-cream' : 'bg-charcoal/5 text-charcoal/40 hover:bg-charcoal/10'}`}
                       >
                         {t}
                       </button>
                     ))}
                  </div>

                  <div className="col-span-2 flex gap-4 pt-6">
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-charcoal text-cream py-4 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl shadow-charcoal/10 active:scale-95 transition-all">
                      {isSubmitting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Register Destination"}
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="px-8 border border-charcoal/10 py-4 rounded-full text-[9px] font-bold uppercase tracking-widest text-charcoal/40 hover:bg-charcoal/5 transition-all">Cancel</button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
