"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import LoginModal from "@/components/auth/LoginModal";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { scrollY } = useScroll();
  const [atTop, setAtTop] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { isLoggedIn, isLoading, logout, showLogin, setShowLogin } = useAuth();
  const { cart, setIsOpen: setIsCartOpen } = useCart();

  // Latch state so we only call setState on threshold crossings, not on every
  // scroll frame. Previously this fired setAtTop + setIsHidden 60+ times per
  // second, re-rendering the entire Navbar tree (with a motion.div layoutId)
  // on every frame of scroll.
  useMotionValueEvent(scrollY, "change", (latest: number) => {
    const nextAtTop = latest <= 50;
    if (nextAtTop !== atTop) {
      setAtTop(nextAtTop);
    }

    const previous = scrollY.getPrevious();
    const threshold = typeof window !== "undefined" ? window.innerHeight * 0.8 : 500;
    const nextHidden = previous !== undefined && latest > previous && latest > threshold;
    if (nextHidden !== isHidden) {
      setIsHidden(nextHidden);
    }
  });

  // Reference-counted scroll lock — coexists safely with CartOverlay,
  // LoginModal, profile/checkout modals.
  useBodyScrollLock(isMenuOpen);

  const navLinks = [
    { label: "Products", href: "/products" },
    { label: "About", href: "/about" },
    ...(isLoggedIn ? [{ label: "Profile", href: "/profile" }] : []),
  ];

  // Determine if we should use dark text/logo (on light pages when at top)
  const isLightPage = pathname.startsWith("/products") || pathname === "/about" || pathname === "/profile" || pathname === "/checkout";
  const useDarkTheme = atTop && isLightPage;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: isHidden ? "-100%" : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-[60] h-14 md:h-20 transition-all duration-500 border-b ${
          atTop 
            ? "bg-transparent border-black/5 backdrop-blur-none" 
            : "bg-[#1e1e1e]/30 backdrop-blur-xl border-white/10"
        }`}
      >
        <div className="relative w-full h-full flex items-center px-6 sm:px-12 lg:px-16">
          {/* Left: Logo */}
          <div className="flex-1 flex items-center">
            {isHome && atTop ? (
              <div className="relative left-0 lg:left-10 w-[100px] sm:w-[140px] md:w-[160px] aspect-[15/4]" />
            ) : (
              <Link href="/">
                <motion.div
                  layoutId={isHome ? "brand-logo-transition" : "navbar-logo-static"}
                  className="relative left-0 lg:left-10 w-[100px] sm:w-[140px] md:w-[160px] aspect-[15/4] cursor-pointer"
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.4, 0, 0.2, 1],
                    type: "tween" 
                  }}
                >
                  <Image
                    src="/logo-landscape.svg"
                    alt="KRAYA"
                    fill
                    className={`object-contain object-left transition-all duration-500 ${useDarkTheme ? "brightness-0 opacity-70" : "brightness-0 invert opacity-100"}`}
                    priority
                  />
                </motion.div>
              </Link>
            )}
          </div>

          {/* Center: Nav links */}
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-auto">
            <div className="flex items-center gap-2 lg:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`group relative text-[15px] uppercase tracking-[0.2em] font-extrabold transition-colors whitespace-nowrap py-6 px-4 ${
                    useDarkTheme ? "text-black/80 hover:text-black" : "text-[#FFF7EB]/90 hover:text-[#FFF7EB]"
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-4 left-1/2 w-0 h-[1.5px] transition-all duration-300 ease-out -translate-x-1/2 group-hover:w-[80%] ${
                    useDarkTheme ? "bg-black" : "bg-[#FFF7EB]"
                  }`} />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Auth / Cart & Mobile Toggle (NORMAL BLEND) */}
          <div className="flex justify-end items-center h-full gap-4 sm:gap-6 lg:gap-8">
            {/* Vertical Separator */}
            <div className={`hidden sm:block w-[1px] h-1/2 transition-colors duration-500 ${useDarkTheme ? "bg-black/10" : "bg-white/10"}`} />

            {!isLoading && (
              isLoggedIn ? (
                /* ── Logged-in: show Cart + Profile + Logout ── */
                <div className="flex items-center gap-5">
                  {/* Cart */}
                  <div 
                    onClick={() => setIsCartOpen(true)}
                    className="flex items-center gap-2 group cursor-pointer h-full relative"
                  >
                    <span 
                      className={`hidden sm:inline relative text-[14px] uppercase tracking-[0.25em] font-extrabold transition-all duration-500 ${
                        useDarkTheme ? "text-black/80 group-hover:text-black" : "text-white/90 group-hover:text-white"
                      }`}
                    >
                      {cart && cart.totalQuantity > 0 ? `CART (${cart.totalQuantity})` : "CART"}
                      <span className={`absolute -bottom-1 left-1/2 w-0 h-[1.5px] transition-all duration-300 ease-out -translate-x-1/2 group-hover:w-[120%] ${useDarkTheme ? 'bg-black' : 'bg-white'}`} />
                    </span>
                    <div className="relative w-6 h-6 opacity-70 group-hover:opacity-100 transition-all duration-500">
                      <Image 
                        src="/ic_cart.svg" 
                        alt="Cart" 
                        fill 
                        className={`object-contain transition-all duration-500 ${useDarkTheme ? "brightness-0" : "invert brightness-0 invert"}`} 
                      />
                    </div>
                  </div>

                  {/* Profile */}
                  {/* <Link href="/profile" className="flex items-center gap-2 group cursor-pointer relative">
                    <div className={`w-9 h-9 rounded-full border transition-all duration-500 flex items-center justify-center hover:bg-white/10 ${
                      useDarkTheme ? "border-black/20 text-black/80 hover:bg-black/5" : "border-white/20 text-[#FFF7EB]/90 hover:bg-white/10"
                    }`}>
                      <User size={18} />
                    </div>
                  </Link> */}

                  {/* Logout */}
                  {/* <button 
                    onClick={() => logout()}
                    className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-500 hover:bg-red-500/20 hover:border-red-500/40 ${
                      useDarkTheme ? "border-black/20 text-black/80" : "border-white/20 text-[#FFF7EB]/90"
                    }`}
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button> */}
                </div>
              ) : (
                /* ── Logged-out: show Login / Sign Up ── */
                <div className="flex items-center gap-3 sm:gap-5">
                  <button
                    onClick={() => setShowLogin(true)}
                    className={`hidden sm:block relative text-[14px] uppercase tracking-[0.25em] font-extrabold transition-all duration-500 group ${
                      useDarkTheme ? "text-black/80 hover:text-black" : "text-white/80 hover:text-white"
                    }`}
                  >
                    Login
                    <span className={`absolute -bottom-1 left-1/2 w-0 h-[1.5px] transition-all duration-300 ease-out -translate-x-1/2 group-hover:w-full ${useDarkTheme ? 'bg-black' : 'bg-white'}`} />
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className={`hidden sm:block text-[14px] uppercase tracking-[0.25em] font-extrabold hover:scale-[1.05] active:scale-[0.98] transition-all duration-500 px-8 py-3 rounded-full shadow-lg ${
                      useDarkTheme
                        ? "bg-black text-white hover:bg-black/90 shadow-black/5"
                        : (atTop 
                            ? "bg-white text-black hover:bg-white/90 shadow-white/5" 
                            : "bg-[#FFF7EB] text-black hover:bg-white shadow-black/10")
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              )
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden relative z-[70] p-2 transition-colors duration-500 ${
                isMenuOpen 
                  ? (useDarkTheme ? "text-charcoal" : "text-cream") 
                  : (useDarkTheme ? "text-charcoal" : "text-cream")
              }`}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 z-[55] backdrop-blur-2xl pt-32 px-10 flex flex-col items-start gap-8 ${
              useDarkTheme ? "bg-cream/98 text-charcoal" : "bg-charcoal/98 text-cream"
            }`}
          >
            {navLinks.map((link, idx) => (
              <div key={link.label} className="w-full">
                <Link
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block"
                >
                  <motion.span
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                    className={`text-[20px] sm:text-[24px] uppercase tracking-[0.25em] font-extrabold pb-2 block ${
                      useDarkTheme ? "text-charcoal" : "text-cream"
                    }`}
                  >
                    {link.label}
                  </motion.span>
                </Link>
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                  className={`w-full h-[1px] origin-left ${
                    useDarkTheme ? "bg-charcoal/10" : "bg-cream/10"
                  }`}
                />
              </div>
            ))}

            {/* Mobile auth actions */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 flex flex-col gap-8 w-full"
            >
              {isLoggedIn ? (
                <>
                  <div className="flex flex-col gap-6">
                    <button 
                      onClick={() => { setIsCartOpen(true); setIsMenuOpen(false); }}
                      className={`flex items-center gap-4 font-bold uppercase tracking-widest text-sm ${
                        useDarkTheme ? "text-charcoal/60" : "text-cream/60"
                      }`}
                    >
                      <ShoppingCart size={20} /> Cart {cart && cart.totalQuantity > 0 && `(${cart.totalQuantity})`}
                    </button>
                    {/* <Link 
                      href="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-4 font-bold uppercase tracking-widest text-sm ${
                        useDarkTheme ? "text-charcoal/60" : "text-cream/60"
                      }`}
                    >
                      <User size={20} /> Profile
                    </Link> */}
                  </div>
                  {/* <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="flex items-center gap-4 text-red-500 font-bold uppercase tracking-widest text-xs pt-4 border-t border-charcoal/5"
                  >
                    <LogOut size={16} /> Logout
                  </button> */}
                </>
              ) : (
                <button
                  onClick={() => { setShowLogin(true); setIsMenuOpen(false); }}
                  className={`text-[12px] uppercase tracking-[0.3em] font-extrabold px-12 py-5 rounded-full w-fit transition-all active:scale-95 ${
                    useDarkTheme 
                      ? "bg-charcoal text-cream shadow-xl shadow-charcoal/20" 
                      : "bg-cream text-charcoal shadow-xl shadow-white/5"
                  }`}
                >
                  Login / Sign Up
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </>
  );
}
