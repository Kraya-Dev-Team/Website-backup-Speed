"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import { 
  Package, 
  ShoppingCart, 
  Tag, 
  Layers, 
  Plus, 
  ArrowRight, 
  Activity, 
  User as UserIcon,
  TrendingUp,
  TrendingDown
} from "lucide-react";

const STATS = [
  { label: "Total Products", value: "24", icon: Package, color: "text-brand-600", bg: "bg-brand-500/10", trend: "+12%", up: true },
  { label: "Total Orders", value: "12", icon: ShoppingCart, color: "text-brand-600", bg: "bg-brand-500/10", trend: "+6.5%", up: true },
  { label: "Active Brands", value: "8", icon: Tag, color: "text-warning-600", bg: "bg-warning-500/10", trend: "0%", up: null },
  { label: "Categories", value: "5", icon: Layers, color: "text-error-600", bg: "bg-error-500/10", trend: "-2.4%", up: false },
];

const QUICK_ACTIONS = [
  { label: "Add Product", href: "/dashboard/products/new", icon: Plus, desc: "List a new fragrance" },
  { label: "Create Brand", href: "/dashboard/brands/new", icon: Tag, desc: "Register a new luxury brand" },
  { label: "Manage Orders", href: "/dashboard/orders", icon: ShoppingCart, desc: "Process pending shipments" },
  { label: "View Reviews", href: "/dashboard/reviews", icon: Activity, desc: "Moderate customer feedback" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ComponentCard
      title="OPERATIONAL COMMAND"
      desc="Monitoring the KRAYA Luxury ecosystem performance"
      formIcon={<Activity size={20} className="text-brand-600" />}
    >
      <div className="p-3 flex flex-col gap-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="group p-5 bg-white border border-border-light rounded-2xl shadow-sm hover:shadow-xl hover:border-brand-500/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 ${s.bg} rounded-xl transition-transform group-hover:scale-110 duration-500`}>
                  <s.icon className={s.color} size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  {s.up !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${s.up ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'}`}>
                      {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {s.trend}
                    </div>
                  )}
                  <span className="text-[10px] font-black text-text-body/40 uppercase tracking-widest mt-1">vs last week</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-text-body/60 uppercase tracking-[0.2em] mb-1">{s.label}</span>
                <h4 className="text-3xl font-black text-text-heading tracking-tighter">{s.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Areas */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8 flex flex-col gap-6">
             <ComponentCard 
               title="Advanced Management" 
               desc="Rapid deployment of store data and operational tasks"
             >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                  {QUICK_ACTIONS.map((q) => (
                    <Link key={q.label} href={q.href} className="flex items-center justify-between p-4 rounded-2xl bg-bg-main hover:bg-white border border-transparent hover:border-brand-500/10 hover:shadow-lg group transition-all duration-300 active:scale-95">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                          <q.icon size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-text-heading tracking-tight group-hover:text-brand-600 transition-colors">{q.label}</span>
                          <span className="text-[10px] font-bold text-text-body/60 uppercase tracking-widest">{q.desc}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-border-light flex items-center justify-center text-text-body/30 group-hover:bg-brand-500 group-hover:text-white group-hover:border-transparent transition-all">
                         <ArrowRight size={14} strokeWidth={3} />
                      </div>
                    </Link>
                  ))}
                </div>
             </ComponentCard>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-6">
             {/* System Connectivity */}
             <div className="p-6 bg-brand-500 rounded-2xl text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-black uppercase tracking-tight">System Status</h3>
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase">
                      v2.4 stable
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 block">Environment Target</label>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 font-mono text-[10px] break-all border border-white/20 tracking-tight">
                           {process.env.NEXT_PUBLIC_API_URL || "kraya-production-node-24"}
                        </div>
                     </div>
                     <div className="flex items-center justify-between bg-white text-brand-600 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center gap-3">
                           <span className="flex h-2 w-2 rounded-full bg-success-500 animate-pulse"></span>
                           <span className="text-[10px] font-black uppercase tracking-widest">Active Connectivity</span>
                        </div>
                        <ArrowRight size={14} strokeWidth={3} />
                     </div>
                  </div>
                </div>
             </div>

             {/* Profile Widget */}
             <ComponentCard title="Admin Identity">
                <div className="flex items-center gap-4 p-4">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center text-brand-600 text-2xl font-black">
                         {user?.firstName?.[0] || "A"}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success-500 border-2 border-white rounded-full" />
                   </div>
                   <div className="flex flex-col">
                      <h5 className="text-base font-black text-text-heading leading-tight uppercase tracking-tighter">
                        {user?.firstName} {user?.lastName}
                      </h5>
                      <div className="mt-1 flex">
                         <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                           {user?.role} AUTHORITY
                         </span>
                      </div>
                   </div>
                </div>
             </ComponentCard>
          </div>
        </div>
      </div>
    </ComponentCard>
  );
}
