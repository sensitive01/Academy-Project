import React, { useState } from "react";
import {
  Shield,
  Smartphone,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const Settings = () => {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState(1);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating password");
    }
  };

  const checkStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setIsEnabled(data.isTwoFactorEnabled);
      if (data.isTwoFactorEnabled) setStep(3);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
      }
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setupTwoFactor = async () => {
    try {
      const { data } = await api.post("/auth/2fa/setup", {});
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error setting up 2FA");
    }
  };

  const verifyAndEnable = async () => {
    try {
      await api.post("/auth/2fa/enable", { token: verificationCode });
      toast.success("2FA Enabled Successfully!");
      setIsEnabled(true);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Code");
    }
  };

  const promptDisableTwoFactor = () => {
    setConfirmModal({ isOpen: true });
  };

  const executeDisableTwoFactor = async () => {
    try {
      await api.post("/auth/2fa/disable", {});
      setIsEnabled(false);
      setStep(1);
      toast.success("2FA Disabled");
    } catch {
      toast.error("Error disabling 2FA");
    } finally {
      setConfirmModal({ isOpen: false });
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        Security Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2FA Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-lg">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Add an extra layer of security to your account.
              </p>
            </div>
          </div>

          <div className="p-8">
            {step === 1 && !isEnabled && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Smartphone size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    Secure Your Account
                  </h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Protect your account from unauthorized access by enabling
                    2FA.
                  </p>
                </div>
                <button
                  onClick={setupTwoFactor}
                  className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                >
                  Enable 2FA
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-6 items-center justify-center">
                <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-inner">
                  {qrCode ? (
                    <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 bg-slate-100 animate-pulse rounded"></div>
                  )}
                </div>
                <div className="space-y-4 w-full">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      1. Scan QR Code
                    </h4>
                    <p className="text-xs text-slate-500">
                      Use Google Authenticator or Authy.
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs text-slate-400 font-mono mb-1">
                      Manual:
                    </p>
                    <code className="text-xs font-bold text-slate-700 select-all break-all">
                      {secret}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-2">
                      2. Verify Code
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                        placeholder="123456"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                      <button
                        onClick={verifyAndEnable}
                        disabled={verificationCode.length !== 6}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        Verify
                      </button>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="mt-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && isEnabled && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    2FA is Active
                  </h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    Your account is secure.
                  </p>
                </div>
                <button
                  onClick={promptDisableTwoFactor}
                  className="text-red-600 font-medium hover:text-red-700 hover:underline text-sm"
                >
                  Disable 2FA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 flex items-start gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Change Password
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Update your password periodically.
              </p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={executeDisableTwoFactor}
        title="Disable Two-Factor Authentication?"
        message="Are you sure you want to disable Two-Factor Authentication? This will make your account less secure."
      />
    </div>
  );
};

export default Settings;
