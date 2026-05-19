"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/dashboard", icon: "⊞", label: "Dashboard" },
  { href: "/dashboard/products", icon: "🛍", label: "Products" },
  { href: "/dashboard/orders", icon: "📦", label: "Orders" },
  { href: "/dashboard/brands", icon: "🏷", label: "Brands" },
  { href: "/dashboard/categories", icon: "🗂", label: "Categories" },
  { href: "/dashboard/reviews", icon: "⭐", label: "Reviews" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-white border-r border-border-subtle duration-300 lg:static lg:translate-x-0 -translate-x-full">
      {/* Branding */}
      <div className="flex items-center gap-3 px-8 py-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-black text-2xl">
          K
        </div>
        <span className="text-2xl font-black tracking-tight text-primary">KRAYA</span>
      </div>

      <nav className="flex-1 px-4">
        <ul className="flex flex-col gap-2">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 py-3.5 px-6 rounded-lg text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-text-main hover:bg-body-bg hover:text-primary"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Card at bottom */}
      <div className="mt-auto p-6">
        <div className="bg-body-bg rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary font-bold shadow-sm">
            {user?.firstName?.[0] || "A"}
          </div>
          <div className="overflow-hidden">
             <p className="text-xs font-bold text-text-main truncate">{user?.firstName} {user?.lastName}</p>
             <p className="text-[10px] font-medium text-text-muted mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
