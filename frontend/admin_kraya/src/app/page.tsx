"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi, userApi, tokenStorage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, ArrowRight, Edit2, RotateCcw, Lock } from "lucide-react";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isLoggedIn, isLoading } = useAuth();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace("/dashboard");
  }, [isLoggedIn, isLoading, router]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.match(/^\+?[0-9]{10,15}$/)) {
      setError("Enter a valid phone number (e.g. +919876543210)");
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 3) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 4) { setError("Enter all 4 digits"); return; }
    setError("");
    setLoading(true);
    try {
      const loginRes = await authApi.verifyOtp(phone, code);
      let u = loginRes.user || loginRes.data?.user;
      if (!u) {
        const meRes = await userApi.getMe() as any;
        u = meRes.data || meRes.user;
      }
      if (!u || typeof u !== 'object') {
        throw new Error("Could not retrieve user profile data.");
      }
      if (u.role !== "admin") {
        tokenStorage.clear();
        setError("Access denied. This panel is for admins only.");
        setStep("phone");
        return;
      }
      setUser(u);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setCountdown(60);
      setOtp(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-main">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-400/10 blur-[120px] rounded-full animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-[480px] z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[40px] p-8 md:p-12 shadow-theme-xl animate-in fade-in zoom-in-95 duration-700">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto text-4xl font-black text-white shadow-2xl shadow-brand-500/40 rotate-3 hover:rotate-0 transition-all duration-500">
                K
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-border-light">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-text-heading tracking-tight mb-2 uppercase">
              Kraya <span className="text-brand-500">Admin</span>
            </h1>
            <p className="text-sm font-semibold text-text-body/60 px-4">
              {step === "phone" ? "Enter your registered phone number to access the command center" : `We've sent a secure code to ${phone}`}
            </p>
          </div>

          {error && (
            <div className="bg-error-50 border border-error-500/20 rounded-2xl py-4 px-5 mb-8 text-[11px] font-black text-error-600 uppercase tracking-wide animate-in fade-in slide-in-from-top flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-error-500 animate-ping" />
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-8">
              <div className="space-y-4">
                <Input
                  label="Secure Phone Number"
                  id="phone-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                  className="h-14 text-lg"
                />
              </div>
              <Button
                id="send-otp-btn"
                className="w-full h-14 rounded-2xl group"
                type="submit"
                isLoading={loading}
              >
                Continue to Verification
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-10">
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-[.3em] text-text-body/40 text-center block">
                  Verify Identity
                </label>
                <div className="flex gap-4 justify-center">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      className="w-14 h-16 bg-gray-50/50 border-2 border-border-light focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 rounded-2xl text-3xl font-black text-center text-text-heading transition-all outline-none"
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      id={`otp-digit-${i}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <Button
                  id="verify-otp-btn"
                  className="w-full h-14 rounded-2xl group"
                  type="submit"
                  isLoading={loading}
                >
                  Secure Access Grant
                  <Lock className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
                </Button>

                <div className="flex items-center justify-between px-2">
                  <button
                    id="back-btn"
                    type="button"
                    className="flex items-center gap-2 text-[10px] font-black text-text-body/60 hover:text-brand-600 transition-colors uppercase tracking-widest"
                    onClick={() => { setStep("phone"); setError(""); setOtp(["", "", "", ""]); }}
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit Number
                  </button>
                  {countdown > 0 ? (
                    <span className="text-[10px] font-black text-text-body/30 uppercase tracking-widest">
                      New code in {countdown}s
                    </span>
                  ) : (
                    <button
                      id="resend-btn"
                      type="button"
                      className="flex items-center gap-2 text-[10px] font-black text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-widest"
                      onClick={handleResend}
                      disabled={loading}
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:0.3s]">
          <p className="text-[10px] font-black text-text-body/30 uppercase tracking-[.4em]">
            &copy; 2026 Kraya Enterprise System
          </p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-[10px] font-bold text-text-body/40 hover:text-brand-500 transition-colors uppercase tracking-widest">Privacy Policy</a>
            <div className="w-1 h-1 rounded-full bg-border-light self-center" />
            <a href="#" className="text-[10px] font-bold text-text-body/40 hover:text-brand-500 transition-colors uppercase tracking-widest">System Status</a>
          </div>
        </div>
      </div>
    </div>
  );
}
