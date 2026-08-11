import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "student",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempUserId, setTempUserId] = useState(null);
  const { login, googleLogin, register, verifyTwoFactor, sendOtp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isGoogleSignup, setIsGoogleSignup] = useState(false);
  const [tempGoogleId, setTempGoogleId] = useState("");
  const navigate = useNavigate();
  
  const handleTwoFactorVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await verifyTwoFactor(tempUserId, twoFactorCode);
      if (result.success) {
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        if (result.action === 'REGISTER_GOOGLE') {
          toast.error("Account not found. Please complete registration.");
          setIsLogin(false);
          setIsGoogleSignup(true);
          setTempGoogleId(result.googleData?.googleId || "");
          setFormData(prev => ({
            ...prev,
            name: result.googleData?.name || "",
            email: result.googleData?.email || ""
          }));
        } else {
          toast.error(result.error);
        }
      }
    } catch (err) {
      toast.error("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (isLogin) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        if (result.requiresTwoFactor) {
          setTempUserId(result.userId);
          setShowTwoFactor(true);
          toast.success("Please enter your 2FA code");
        } else {
          toast.success("Login successful!");
          navigate("/dashboard");
        }
      } else {
        toast.error(result.error);
      }
    } else {
      // SIGN UP
      if (!isGoogleSignup && !showOtp) {
        // First step: Send OTP
        const result = await sendOtp(formData.email);
        if (result.success) {
          setShowOtp(true);
          toast.success("Verification OTP sent to your email!");
        } else {
          toast.error(result.error);
        }
      } else {
        // Second step: Verify OTP and Register (or direct register for Google)
        const result = await register(
          formData.name,
          formData.email,
          formData.mobile,
          formData.password,
          formData.role,
          showOtp ? otpCode : null,
          isGoogleSignup ? tempGoogleId : null
        );

        if (result.success) {
          toast.success("Account created successfully!");
          navigate("/dashboard");
        } else {
          toast.error(result.error);
        }
      }
    }
  } catch {
    toast.error("An unexpected error occurred.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-900 overflow-hidden font-sans">
      {/* Page Background Image with Blur */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-brand-900/80 mix-blend-multiply"></div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-[950px] bg-white rounded-[20px] shadow-2xl flex h-[600px] overflow-hidden">
        {/* LEFT SIDE (Image + Overlay) */}
        <div className="hidden md:block w-1/2 relative bg-brand-800">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Office"
            className="w-full h-full object-cover"
          />
          {/* Red Overlay */}
          <div className="absolute inset-0 bg-brand-900/80 mix-blend-multiply"></div>
        </div>

        {/* CURVE SEPARATOR (SVG) - Positioned absolutely to bridge the two sides */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-24 -ml-12 z-20 h-full pointer-events-none">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 C 40 10 60 50 20 100 L 100 100 L 100 0 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-8 md:p-12 relative z-30">
          <div className="w-full max-w-sm text-center overflow-y-auto max-h-full scrollbar-hidden">
            <h2 className="text-4xl font-normal text-gray-600 mb-2">Welcome</h2>
            <p className="text-gray-400 mb-6 font-light">
              {isLogin
                ? "Log in to your account to continue"
                : "Create an account to get started"}
            </p>

            <form
              onSubmit={showTwoFactor ? handleTwoFactorVerify : handleSubmit}
              className="space-y-4"
            >
              {showTwoFactor || showOtp ? (
                // OTP / 2FA Input View
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 text-brand-600 mb-4">
                      <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {showOtp ? "Email Verification" : "Two-Factor Auth"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {showOtp ? "Enter the OTP sent to your email" : "Enter the code from your app"}
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3 text-center border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all tracking-[0.5em] font-mono text-xl"
                      placeholder="000000"
                      maxLength={6}
                      value={showOtp ? otpCode : twoFactorCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (showOtp) setOtpCode(val);
                        else setTwoFactorCode(val);
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || (showOtp ? otpCode.length !== 6 : twoFactorCode.length !== 6)}
                    className="w-full block py-3 px-6 bg-gradient-to-r from-brand-400 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign Up"}
                  </button>

                  {showOtp && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={async () => {
                        const result = await sendOtp(formData.email);
                        if (result.success) toast.success("OTP Resent!");
                        else toast.error(result.error);
                      }}
                      className="w-full text-center text-sm text-brand-500 hover:text-brand-600 mt-2 font-medium"
                    >
                      Resend OTP
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowTwoFactor(false);
                      setShowOtp(false);
                      setTwoFactorCode("");
                      setOtpCode("");
                    }}
                    className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
                  >
                    Back to {isLogin ? "Login" : "Sign Up"}
                  </button>
                </div>
              ) : (
                // Normal Login/Register View
                <>
                  {!isLogin && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                      placeholder="awesome@user.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  {!isLogin && (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                        placeholder="Mobile Number"
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile: e.target.value })
                        }
                      />
                    </div>
                  )}


<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
    <Lock className="h-5 w-5 text-gray-400" />
  </div>

  <input
    type={showPassword ? "text" : "password"}
    required
    className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
    placeholder="••••••••••••"
    value={formData.password}
    onChange={(e) =>
      setFormData({ ...formData, password: e.target.value })
    }
  />

  {/* Eye Icon */}
  <div
    className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400"
    onClick={() => setShowPassword(!showPassword)}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </div>
</div>

                 {isLogin && (
                    <div className="text-right">
                      <Link
                        to="/forgot-password"
                        className="text-gray-400 text-xs hover:text-brand-500 underline decoration-gray-300"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-40 mx-auto block py-3 px-6 bg-gradient-to-r from-brand-400 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    {isLoading ? "..." : isLogin ? "Log In" : "Sign Up"}
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative w-full flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-xs uppercase tracking-widest">Or login with</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google Login Failed")}
                  useOneTap
                  theme="filled_blue"
                  shape="pill"
                  width="200"
                />
              </div>

              <p className="text-gray-400 text-sm">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setShowOtp(false);
                    setIsGoogleSignup(false);
                  }}
                  className="text-gray-400 font-bold hover:text-brand-500 ml-1 underline"
                >
                  {isLogin ? "Sign up!" : "Log In!"}
                </button>
              </p>

              <div className="flex justify-center gap-4 text-gray-300">
                <a href="#" className="hover:text-brand-500 transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  <Twitter size={18} />
                </a>
                <a href="#" className="hover:text-brand-500 transition-colors">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
