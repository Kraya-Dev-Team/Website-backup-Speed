"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import * as LucideIcons from "lucide-react";
import { KrayaLogo } from "@/components/common/Logo";

interface NavItem {
  name: string;
  path?: string;
  icon: keyof typeof LucideIcons;
  children?: NavItem[];
}

const NAVIGATION: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  { name: "Products", path: "/dashboard/products", icon: "Package" },
  { name: "Brands", path: "/dashboard/brands", icon: "Tag" },
  { name: "Categories", path: "/dashboard/categories", icon: "Layers" },
  { name: "Orders", path: "/dashboard/orders", icon: "ShoppingCart" },
  { name: "Reviews", path: "/dashboard/reviews", icon: "MessageSquare" },
];

const SETTINGS: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) ? [] : [menuName]
    );
  };

  const isActive = useCallback(
    (path: string) => {
      if (path === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname]
  );

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1 px-3">
      {items.map((nav) => {
        const LucideIcon = (LucideIcons as any)[nav.icon] || LucideIcons.Circle;
        const showText = isExpanded || isHovered || isMobileOpen;
        const isExpanded_m = expandedMenus.includes(nav.name);
        const active = isActive(nav.path || "");

        return (
          <li key={nav.name} className="relative">
            {active && (
              <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <div className="w-1.5 h-8 bg-brand-500 rounded-r-full shadow-[0_0_15px_rgba(20,184,166,0.4)]" />
              </div>
            )}

            <Link
              href={nav.path || "#"}
              className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all duration-200 group ${active
                ? "bg-brand-50 text-brand-600"
                : "text-text-body hover:bg-gray-100/80 hover:text-text-heading"
                } ${!showText ? "justify-center px-0" : ""}`}
            >
              <div className={`transition-colors duration-200 ${active ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                <LucideIcon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>

              {showText && (
                <span className={`flex-1 font-bold text-sm tracking-tight ${active ? "text-brand-600" : ""}`}>
                  {nav.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 z-60 h-[100dvh] bg-bg-card transition-all duration-300 ease-in-out border-r border-border-light flex flex-col
        ${isExpanded || isHovered
          ? "w-[240px]"
          : "w-[88px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center px-6 py-10 transition-all duration-300">
        <Link href="/dashboard" className={!showText ? "mx-auto" : ""}>
          <KrayaLogo isCollapsed={!showText} />
        </Link>

        {showText && (
          <div className="absolute right-[-18px] top-[40px] z-50 lg:flex hidden">
            <button
              onClick={toggleSidebar}
              className="relative flex items-center justify-center w-9 h-9 group"
            >
              <div className="absolute inset-0 rounded-full bg-brand-500/[0.08] scale-110 group-hover:bg-brand-500/[0.12] transition-all duration-300" />
              <div className="relative flex items-center justify-center w-full h-full bg-white border border-border-light rounded-full shadow-theme-xs text-brand-600">
                <div className={`transition-transform duration-300 ${!isExpanded ? "rotate-180" : ""}`}>
                  <LucideIcons.ChevronLeft size={16} strokeWidth={3} />
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        <div className="mb-4 px-6">
           <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${!showText ? 'hidden' : 'block'}`}>Main Menu</span>
        </div>
        {renderMenuItems(NAVIGATION)}
      </div>

      <div className="border-t border-border-light py-4">
         {renderMenuItems(SETTINGS)}
         <button
          className={`flex items-center gap-3 px-6 py-3 w-full transition-all duration-200 group text-text-body hover:bg-gray-100/80 hover:text-danger mt-2 ${!showText ? "justify-center px-0" : ""}`}
        >
          <div className="text-gray-400 group-hover:text-danger transition-colors">
            <LucideIcons.LogOut size={20} strokeWidth={2} />
          </div>
          {showText && (
            <span className="flex-1 font-bold text-sm text-left">Log out</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
