"use client";
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; 
  isFullscreen?: boolean; 
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true, 
  isFullscreen = false,
  title,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-border-light overflow-hidden";

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[999999]">
      {!isFullscreen && (
        <div
          className="fixed inset-0 h-full w-full bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={onClose}
        ></div>
      )}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className} animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all hover:bg-danger/10 hover:text-danger active:scale-95"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
        
        {title && (
          <div className="px-8 py-6 border-b border-border-light bg-gray-50/30">
            <h3 className="text-sm font-black text-text-heading uppercase tracking-widest">{title}</h3>
          </div>
        )}

        <div className="h-full overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
