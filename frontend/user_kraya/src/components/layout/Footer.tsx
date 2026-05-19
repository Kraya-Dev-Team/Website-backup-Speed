"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { fadeUp } from "@/lib/animations";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const FooterLink = ({ 
  href, 
  children, 
  icon, 
  onClick 
}: { 
  href?: string; 
  children: React.ReactNode; 
  icon?: string;
  onClick?: (e: React.MouseEvent) => void;
}) => {
  const content = (
    <motion.span 
      whileHover={{ x: 8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative text-base md:text-xl tracking-wide font-medium text-charcoal/70 hover:text-charcoal transition-colors inline-flex items-center gap-2 md:gap-4 cursor-pointer"
    >
      <span className="w-0 h-[1.5px] bg-charcoal/30 transition-all duration-500 group-hover:w-8 origin-left hidden md:block" />
      {icon && (
        <img 
          src={icon} 
          alt="" 
          className="w-5 h-5 md:w-6 md:h-6 object-contain opacity-70 group-hover:opacity-100 transition-opacity" 
        />
      )}
      <span>{children}</span>
    </motion.span>
  );

  return (
    <li>
      {onClick ? (
        <div onClick={onClick}>{content}</div>
      ) : href ? (
        <Link href={href}>{content}</Link>
      ) : (
        content
      )}
    </li>
  );
};

export default function Footer() {
  const { isLoggedIn, setShowLogin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Pause the infinite blob animations when the footer is offscreen — the
  // animation choreography is identical when in view, but we stop paying GPU
  // + main-thread cost on every page above the footer.
  const blobAreaRef = useRef<HTMLDivElement>(null);
  const blobInView = useInView(blobAreaRef, { amount: 0 });

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  const handleDiscoverClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === "/") {
      const el = document.getElementById("discover");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#discover");
    }
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/profile");
    } else {
      setShowLogin(true);
    }
  };

  const handleTrackingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push("/profile?tab=orders");
    } else {
      setShowLogin(true);
    }
  };

  return (
    <footer className="relative z-0 w-full h-auto md:h-[100vh] bg-white overflow-hidden border-t border-neutral-100 flex flex-col">
      {/* Background Animated Elements */}
      <div ref={blobAreaRef} className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div
          animate={blobInView ? {
            x: [0, 30, -30, 0],
            y: [0, 20, -20, 0],
          } : { x: 0, y: 0 }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-cream-dark/40 blur-[120px] rounded-full"
        />
        <motion.div
          animate={blobInView ? {
            x: [0, -40, 40, 0],
            y: [0, -30, 30, 0],
          } : { x: 0, y: 0 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-cream-dark/30 blur-[120px] rounded-full"
        />
      </div>

      <div className="relative z-0 flex flex-col h-full">
        {/* Top Section - Tagline & Branding (Branding pushed to bottom) */}
        <div className="flex-1 flex flex-col items-center justify-end px-6 space-y-auto">
          <motion.div
            variants={fadeUp}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-auto py-20 md:py-0 mb-12 md:mb-24 px-6"
          >
            <p className="font-serif text-2xl md:text-[44px] leading-tight opacity-90 decoration-charcoal">
              Not Just A Fragrance,<br />
              <span className="font-bold text-charcoal tracking-tight">A Memory In Motion.</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 0.4, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true }}
            className="w-full flex items-center justify-center select-none mb-[-5px]"
          >
            <img 
              src="/footer_kraya.svg" 
              alt="KRAYA" 
              className="w-full h-auto max-w-[1200px]"
            />
          </motion.div>
        </div>

        {/* Bottom Section - Links - Flush with Bottom Border */}
        <motion.div 
          variants={fadeUp}
          custom={4}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="w-full border-t border-neutral-200 bg-white/50 backdrop-blur-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 border-l border-neutral-200">
            {/* Collections */}
            <motion.div 
              variants={fadeUp}
              custom={5}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 md:p-8 border-r border-b border-neutral-200 flex flex-col items-center md:items-start justify-start text-center md:text-left"
            >
              <h4 className="text-[14px] md:text-[18px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-extrabold mb-6 md:mb-8 text-charcoal">Collections</h4>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink href="/products">KARMA</FooterLink>
                <FooterLink href="/products">MOKSHA</FooterLink>
              </ul>
            </motion.div>

            {/* Explore */}
            <motion.div 
              variants={fadeUp}
              custom={6}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 md:p-8 border-r border-b border-neutral-200 flex flex-col items-center md:items-start justify-start text-center md:text-left"
            >
              <h4 className="text-[14px] md:text-[18px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-extrabold mb-6 md:mb-8 text-charcoal">Explore</h4>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink onClick={handleHomeClick}>Home</FooterLink>
                <FooterLink href="/products">Products</FooterLink>
                <FooterLink href="/about">About</FooterLink>
              </ul>
            </motion.div>

            {/* Customer Care */}
            <motion.div 
              variants={fadeUp}
              custom={7}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 md:p-8 border-r border-b md:border-b-0 border-neutral-200 flex flex-col items-center md:items-start justify-start text-center md:text-left"
            >
              <h4 className="text-[14px] md:text-[18px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-extrabold mb-6 md:mb-8 text-charcoal text-center">Care</h4>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink onClick={handleAccountClick}>Account</FooterLink>
                <FooterLink onClick={handleTrackingClick}>Tracking</FooterLink>
              </ul>
            </motion.div>

            {/* Contact Us */}
            <motion.div 
              variants={fadeUp}
              custom={8}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="p-6 md:p-8 border-r border-neutral-200 flex flex-col items-center md:items-start justify-start text-center md:text-left"
            >
              <h4 className="text-[14px] md:text-[18px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-extrabold mb-6 md:mb-8 text-charcoal">Follow</h4>
              <ul className="space-y-3 md:space-y-4">
                <FooterLink href="https://instagram.com" icon="/svg/AiOutlineInstagram.svg">Instagram</FooterLink>
                <FooterLink href="https://threads.net" icon="/svg/BsThreads.svg">Threads</FooterLink>
                <FooterLink href="https://youtube.com" icon="/svg/AiOutlineYoutube.svg">Youtube</FooterLink>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}