"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { authApi, userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  onClose: () => void;
}

type Step = "phone" | "otp";

export default function LoginModal({ onClose }: Props) {
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);
  
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [phoneElement, setPhoneElement] = useState<HTMLDivElement | null>(null);
  const [otpElement, setOtpElement] = useState<HTMLDivElement | null>(null);

  // Reset captcha token on step transitions
  useEffect(() => {
    setCaptchaToken(undefined);
  }, [step]);

  // Cloudflare Turnstile Verification script and widget loading
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const activeRef = step === "phone" ? phoneElement : otpElement;
    
    if (!siteKey || !activeRef) return;

    let script = document.getElementById("cloudflare-turnstile-script") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "cloudflare-turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const renderWidget = () => {
      if ((window as any).turnstile && activeRef) {
        try {
          (window as any).turnstile.render(activeRef, {
            sitekey: siteKey,
            callback: (token: string) => {
              setCaptchaToken(token);
              setError(""); // Clear error when Turnstile succeeds
            },
            "expired-callback": () => {
              setCaptchaToken(undefined);
            },
            "error-callback": () => {
              setCaptchaToken(undefined);
            }
          });
        } catch (e) {
          console.warn("Turnstile render error", e);
        }
      }
    };

    if ((window as any).turnstile) {
      renderWidget();
    } else {
      script.onload = renderWidget;
    }

    return () => {
      if ((window as any).turnstile && activeRef) {
        try {
          (window as any).turnstile.remove(activeRef);
        } catch (e) {}
      }
    };
  }, [step, phoneElement, otpElement]);

  // Focus first OTP box when step changes
  useEffect(() => {
    if (step === "otp") otpRefs[0].current?.focus();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const countries = [
    { name: "India", code: "+91", flag: "🇮🇳" },
    { name: "USA", code: "+1", flag: "🇺🇸" },
    { name: "UK", code: "+44", flag: "🇬🇧" },
    { name: "UAE", code: "+971", flag: "🇦🇪" },
    { name: "Canada", code: "+1", flag: "🇨🇦" },
    { name: "Australia", code: "+61", flag: "🇦🇺" },
    { name: "Germany", code: "+49", flag: "🇩🇪" },
    { name: "France", code: "+33", flag: "🇫🇷" },
    { name: "Singapore", code: "+65", flag: "🇸🇬" },
  ];

  const countrySelectorRef = useRef<HTMLDivElement>(null);

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Only attach the document mousedown listener while the country selector is
  // actually open. Previously it ran for the entire LoginModal lifetime,
  // intercepting every click site-wide for no reason.
  useEffect(() => {
    if (!showCountrySelector) return;
    function handleClickOutside(event: MouseEvent) {
      if (countrySelectorRef.current && !countrySelectorRef.current.contains(event.target as Node)) {
        setShowCountrySelector(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountrySelector]);

  const fullPhoneNumber = `${selectedCountry.code}${phone}`;

  const handleSendOtp = async () => {
    if (!phone.trim()) return setError("Enter your phone number");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      return setError("Please complete the security check first");
    }
    setError("");
    setLoading(true);
    try {
      await authApi.sendOtp(fullPhoneNumber, captchaToken);
    } catch {
      // If send-otp endpoint is not yet live, proceed to OTP entry anyway
    } finally {
      setLoading(false);
      setStep("otp");
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 4) return setError("Enter the 4-digit OTP");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      return setError("Please complete the security check first");
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyOtp(fullPhoneNumber, code, captchaToken);

      // Successfully verified, now fetch profile
      userApi.getMe()
        .then(res => {
          const u = res.data || res.user;
          if (u) setUser(u);
        })
        .catch(() => {});

      onClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#f7f3ef] border border-[#e7dfd8] rounded-2xl p-8 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#4a2a20]/60 hover:text-[#4a2a20] transition-colors"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-serif text-2xl font-semibold text-[#2c1810] mb-1">
                Welcome to Kraya
              </h2>
              <p className="text-sm text-[#887f6b] mb-8 tracking-wide">
                Enter your phone number to continue
              </p>

              <label className="block text-xs font-bold uppercase tracking-widest text-[#4a2a20] mb-2">
                Phone Number
              </label>
              
              <div className="flex gap-2">
                {/* Country Selector */}
                <div className="relative" ref={countrySelectorRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                    className="h-full px-3 border border-[#e7dfd8] bg-white rounded-lg text-[#2c1810] flex items-center gap-2 text-sm hover:border-[#4a2a20] transition-colors whitespace-nowrap min-w-[80px]"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                  </button>

                  <AnimatePresence>
                    {showCountrySelector && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute left-0 top-full mt-2 w-48 bg-white border border-[#e7dfd8] rounded-xl shadow-2xl z-[100] py-2 max-h-60 overflow-y-auto overscroll-contain touch-pan-y select-auto"
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        {countries.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c);
                              setShowCountrySelector(false);
                            }}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#f7f3ef] transition-colors text-sm"
                          >
                            <span>{c.flag}</span>
                            <span className="flex-1 text-[#2c1810] font-medium">{c.name}</span>
                            <span className="text-[#887f6b] text-xs">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone Input */}
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="flex-1 border border-[#e7dfd8] bg-white rounded-lg px-4 py-3 text-[#2c1810] placeholder-[#b8a99a] focus:outline-none focus:border-[#4a2a20] transition-colors text-sm"
                />
              </div>

              {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
              )}

              {/* Conditional Cloudflare Turnstile Container */}
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <div ref={setPhoneElement} className="mt-4 flex justify-center min-h-[65px]" />
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken)}
                className="mt-6 w-full bg-[#2c1810] text-[#f7f3ef] text-sm font-bold uppercase tracking-widest py-3.5 rounded-lg hover:bg-[#4a2a20] transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-serif text-2xl font-semibold text-[#2c1810] mb-1">
                Verify OTP
              </h2>
              <p className="text-sm text-[#887f6b] mb-8 tracking-wide">
                Sent to{" "}
                <span className="font-medium text-[#4a2a20]">{phone}</span>
                &nbsp;·&nbsp;
                <button
                  onClick={() => { setStep("phone"); setOtp(["", "", "", ""]); setError(""); }}
                  className="underline hover:text-[#2c1810] transition-colors"
                >
                  Change
                </button>
              </p>

              <div className="flex gap-3 justify-center mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 h-14 text-center text-xl font-bold border border-[#e7dfd8] bg-white rounded-lg text-[#2c1810] focus:outline-none focus:border-[#4a2a20] transition-colors"
                  />
                ))}
              </div>

              {error && (
                <p className="mb-4 text-xs text-red-500 text-center">{error}</p>
              )}

              {/* Conditional Cloudflare Turnstile Container */}
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <div ref={setOtpElement} className="mt-4 flex justify-center min-h-[65px]" />
              )}

              <button
                onClick={handleVerify}
                disabled={loading || (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken)}
                className="w-full bg-[#2c1810] text-[#f7f3ef] text-sm font-bold uppercase tracking-widest py-3.5 rounded-lg hover:bg-[#4a2a20] transition-colors disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify & Login"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
