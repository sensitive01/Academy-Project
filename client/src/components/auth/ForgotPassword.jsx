import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  Mail, 
  Key, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCcw,
  Fingerprint
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const API_BASE = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===============================
  // SEND OTP
  // ===============================
  const sendOtp = async () => {
    if (!formData.email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/password/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      toast.success("Verification code sent to your email!");
      setStep(2);
      setTimer(30);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // VERIFY OTP
  // ===============================
  const verifyOtp = async () => {
    if (!formData.otp) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code");

      toast.success("Code verified successfully!");
      setStep(3);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // RESET PASSWORD
  // ===============================
  const resetPassword = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      toast.success("Security updated! Password reset successful.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // OTP TIMER
  // ===============================
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-900 font-sans overflow-hidden">
      
      {/* Background with Brand Elements/Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1557683311-eac922347aa1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Abstract Background"
          className="w-full h-full object-cover opacity-30 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900/90 to-black/80"></div>
        
        {/* Decorative Circles */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 w-full max-w-[500px] backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Progress Header */}
        <div className="p-8 pb-0 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner">
            {step === 1 && <Mail className="text-brand-400 w-8 h-8" />}
            {step === 2 && <ShieldCheck className="text-brand-400 w-8 h-8" />}
            {step === 3 && <Lock className="text-brand-400 w-8 h-8" />}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {step === 1 && "Reset Password"}
            {step === 2 && "Verification"}
            {step === 3 && "Secure Account"}
          </h2>
          <p className="text-gray-400 text-center text-sm px-4">
            {step === 1 && "Enter your registered email to receive a secure recovery code."}
            {step === 2 && `We've sent a code to your email. Enter it below to proceed.`}
            {step === 3 && "Create a strong password to protect your account security."}
          </p>

          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-3 mt-8 w-full">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div 
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                    step >= s ? "bg-brand-500 shadow-[0_0_10px_#ef4444]" : "bg-white/20"
                  }`} 
                />
                {s < 3 && <div className={`w-12 h-[1px] ${step > s ? "bg-brand-500" : "bg-white/10"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 pt-10">
          
          {/* STEP 1: Email Input */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-400 text-gray-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all font-light"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <button
                onClick={sendOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-brand-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <ArrowLeft className="rotate-180 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: OTP Input */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-400 text-gray-500 transition-colors">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="otp"
                  maxLength="6"
                  placeholder="Enter 6-digit code"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all font-mono tracking-[0.4em] text-center"
                  value={formData.otp}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify and Continue"}
                </button>
                
                <button
                  onClick={sendOtp}
                  disabled={timer > 0 || loading}
                  className="w-full text-xs text-center flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCcw className={`h-3 w-3 ${timer > 0 ? "" : "animate-spin-slow"}`} />
                  {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code? Resend now"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Reset Password */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all font-light"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all font-light"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                onClick={resetPassword}
                disabled={loading}
                className="w-full bg-white text-brand-950 font-bold py-4 rounded-xl shadow-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Reset"}
              </button>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>
          </div>
        </div>

      </div>

      {/* Aesthetic Accents */}
      <div className="absolute bottom-10 left-10 text-white/10 text-9xl font-black pointer-events-none select-none">
        SECURITY
      </div>
      <div className="absolute top-10 right-10 text-white/5 text-8xl font-black rotate-90 pointer-events-none select-none">
        DR ACADEMY
      </div>
    </div>
  );
};

export default ForgotPassword;