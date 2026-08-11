import React, { useState, useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera, User, CheckCircle, ArrowRight, ShieldCheck, Clock, MapPin, X, RefreshCw, LogIn, MonitorCheck, FileCheck } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import logo from "../../assets/logo-3.jpeg";
import attendanceSidebar from "../../assets/attendance_sidebar.png";

const PublicAttendance = () => {
    const [identifier, setIdentifier] = useState("");
    const [person, setPerson] = useState(null);
    const [step, setStep] = useState("verify"); // verify, capture, submit
    const [capturedImage, setCapturedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState(null);
    const [snapInfo, setSnapInfo] = useState({ time: null, loc: null });
    const webcamRef = useRef(null);

    // Update time and fetch location
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const locStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        display: locStr
                    });
                },
                (err) => console.log("Location access denied", err),
                { enableHighAccuracy: true }
            );
        }

        return () => clearInterval(timer);
    }, []);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!identifier.trim()) return;

        setLoading(true);
        try {
            const { data } = await api.get(`/public-attendance/identify/${identifier.trim()}`);
            setPerson(data);
            setStep("capture");
            toast.success("Identity Verified!");
        } catch (err) {
            toast.error(err.response?.data?.message || "ID not found");
        } finally {
            setLoading(false);
        }
    };

    const handleCapture = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setSnapInfo({
                time: currentTime.toLocaleTimeString([], { hour12: true }),
                loc: location?.display || "Location Hidden"
            });
            setStep("submit");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setSnapInfo({ time: null, loc: null });
        setStep("capture");
    };

    const submitAttendance = async () => {
        if (!person || !capturedImage || marking) return;

        setMarking(true);
        try {
            const loginTime = currentTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            await api.post("/public-attendance/mark", {
                userId: person.userId,
                name: person.name,
                role: person.role,
                loginTime: loginTime,
                photo: capturedImage,
                location: location ? { lat: location.lat, lng: location.lng } : null
            });

            toast.success("Attendance marked successfully!", { duration: 5000 });

            // Reset to start
            setIdentifier("");
            setPerson(null);
            setCapturedImage(null);
            setSnapInfo({ time: null, loc: null });
            setStep("verify");

        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to mark attendance");
        } finally {
            setMarking(false);
        }
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    const placeholderImg = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
            {/* LEFT SECTION: STATIC CONTENT (Desktop Only) */}
            <div className="relative hidden md:flex md:w-[40%] lg:w-1/2 bg-slate-900 overflow-hidden select-none">
                <div 
                    className="absolute inset-0 opacity-30 transform scale-110"
                    style={{ 
                        backgroundImage: `url(${attendanceSidebar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/80 to-brand-900/40"></div>

                <div className="relative z-10 w-full flex flex-col justify-start gap-16 p-12 lg:p-20">
                    <div className="space-y-6">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl animate-in zoom-in-50 duration-700">
                            <img src={logo} alt="Dr.RG Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                Dr.RG <span className="text-brand-500">Academy</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 opacity-80">
                                Smart Attendance Systems
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="flex flex-col gap-8">
                            <StepIndicator 
                                icon={<LogIn className="text-brand-400" />} 
                                title="01. Verify Identity" 
                                desc="Quick authentication using your employee or student ID."
                                active={step === "verify"}
                            />
                            <StepIndicator 
                                icon={<MonitorCheck className="text-brand-400" />} 
                                title="02. Capture Biometric" 
                                desc="Secure face recognition to ensure authentic presence."
                                active={step === "capture"}
                            />
                            <StepIndicator 
                                icon={<FileCheck className="text-brand-400" />} 
                                title="03. Submit Record" 
                                desc="Instant synchronization with institutional attendance logs."
                                active={step === "submit"}
                            />
                        </div>
                        
                        <div className="pt-12 border-t border-white/10">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Trusted Verification Network • Academic Excellence • Secure Digital Infrastructure
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION / MOBILE CONTENT */}
            <div className="flex-1 flex flex-col bg-slate-50 md:bg-white relative">
                
                {/* Mobile Top bar */}
                <div className="md:hidden flex justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                    <div className="flex gap-1">
                        <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-md text-[10px] font-bold">English</div>
                        <div className="px-3 py-1 text-slate-400 rounded-md text-[10px] font-bold">ಕನ್ನಡ</div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Attendance</div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex items-start md:items-center justify-center p-4 sm:p-6 lg:p-12">
                    <div className="w-full max-w-[520px] pt-4 md:pt-0">
                        
                        {/* THE CONTENT AREA: Card on Mobile, Open on Desktop */}
                        <div className="bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-[0_15px_35px_-10px_rgba(0,0,0,0.1)] md:shadow-none border border-slate-100 md:border-none overflow-hidden transform-gpu">
                            <div className="p-8 md:p-0">
                                
                                {/* Mobile-only Header */}
                                <div className="md:hidden text-center mb-10">
                                    <div className="inline-block p-4 bg-white rounded-2xl shadow-sm mb-6 mx-auto border border-slate-50">
                                        <img src={logo} alt="Academy Logo" className="h-14 w-auto object-contain" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-none">Dr.RG Academy</h2>
                                    <p className="text-slate-400 text-[11px] font-medium mt-3">Please enter your Institutional ID to begin</p>
                                </div>

                                {/* Desktop-only Title Header */}
                                <div className="hidden md:block mb-10">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                                        {step === "verify" ? "Welcome Back." : step === "capture" ? "Biometric Verification" : "Review Record"}
                                    </h2>
                                    <p className="text-slate-400 text-sm font-medium">
                                        {step === "verify" ? "Please enter your Institutional ID to begin." : step === "capture" ? "Scan your face to mark presence." : "Ensure all details are correct before submission."}
                                    </p>
                                </div>
                        
                                {/* STEP 1: VERIFY */}
                                {step === "verify" && (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                        <form onSubmit={handleSearch} className="space-y-8">
                                            <div className="space-y-6 md:p-10 md:bg-slate-50 md:border-2 md:border-slate-100 md:rounded-3xl md:shadow-sm">
                                                <div className="relative">
                                                    <input 
                                                        type="text"
                                                        value={identifier}
                                                        onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                                                        placeholder="STU-20XX-XXXX"
                                                        className="w-full px-5 py-5 md:pl-16 md:pr-6 border-2 border-slate-100 md:border-transparent rounded-xl md:rounded-2xl text-base md:text-xl font-bold text-slate-800 outline-none focus:border-brand-600 transition-all placeholder:text-slate-200 bg-white md:shadow-xl md:shadow-slate-200/50"
                                                        autoFocus
                                                    />
                                                    <User className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-brand-600 transition-colors" size={28} />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={loading || !identifier}
                                                    className="w-full py-5 bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white rounded-xl md:rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-lg md:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
                                                >
                                                    {loading ? <RefreshCw size={20} className="animate-spin" /> : <>Verify Identity <ArrowRight className="hidden md:block" size={20} /></>}
                                                </button>
                                            </div>
                                        </form>
                                        
                                        <div className="md:flex items-center gap-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 hidden">
                                            <ShieldCheck className="text-blue-500 shrink-0" size={24} />
                                            <p className="text-[11px] font-semibold text-blue-800 leading-relaxed">
                                                Your identity is securely verified against institutional records.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: CAPTURE */}
                                {step === "capture" && person && (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between md:hidden">
                                            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                                                <span className="text-[10px] font-black uppercase tracking-widest">{person.name}</span>
                                            </div>
                                        </div>

                                        <div className="relative aspect-square md:aspect-[4/3] bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-50">
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={videoConstraints}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 pointer-events-none">
                                                <div className="absolute inset-0 border-[30px] lg:border-[60px] border-black/40"></div>
                                                <div className="absolute inset-[30px] lg:inset-[60px] border border-white/10 rounded-xl">
                                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-brand-500/50 animate-[scan_3s_ease-in-out_infinite]"></div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white">Focus Frame</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCapture}
                                            className="w-full py-5 md:py-7 bg-brand-700 hover:bg-brand-800 text-white rounded-xl md:rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-lg md:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <Camera size={20} /> Capture Biometric
                                        </button>
                                        
                                        <button onClick={() => setStep("verify")} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors">
                                            Go back
                                        </button>
                                    </div>
                                )}

                                {/* STEP 3: SUBMIT */}
                                {step === "submit" && person && (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        <div className="md:bg-slate-50 md:border-2 md:border-slate-100 md:rounded-3xl md:overflow-hidden">
                                            <div className="flex flex-col md:flex-row items-center gap-6 p-8 border-b border-slate-50 bg-white md:bg-transparent">
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-1 shadow-md border border-slate-50 shrink-0">
                                                    <img src={capturedImage || person.photo || placeholderImg} alt="" className="w-full h-full object-cover rounded-xl" />
                                                </div>
                                                <div className="text-center md:text-left min-w-0">
                                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-brand-700 text-white text-[8px] font-black uppercase tracking-widest rounded-md">{person.role}</span>
                                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{identifier}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 truncate">{person.name}</h3>
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 grid grid-cols-2 gap-4 bg-white/50 hidden md:grid">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Capture Time</p>
                                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Clock size={14} className="text-brand-600" /> {snapInfo.time}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Geolocation</p>
                                                    <p className="text-sm font-black text-slate-800 flex items-center gap-2"><MapPin size={14} className="text-brand-600" /> {location ? 'Authenticated' : 'Offline'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleRetake}
                                                className="py-5 md:py-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                                            >
                                                Retake
                                            </button>
                                            <button
                                                onClick={submitAttendance}
                                                disabled={marking}
                                                className="py-5 md:py-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white rounded-xl md:rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {marking ? "Saving..." : "Confirm"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* DESKTOP FOOTER */}
                        <div className="mt-12 pt-8 border-t border-slate-50 hidden md:flex items-center justify-between opacity-50">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">© 2024 Dr.RG Academy</p>
                            <div className="flex gap-4">
                                <ShieldCheck size={16} className="text-slate-200" />
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            </div>
                        </div>

                        <div className="md:hidden mt-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                            Dr.RG Academy Attendance Gateway
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; opacity: 0; }
                    50% { top: 100%; opacity: 1; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

const StepIndicator = ({ icon, title, desc, active }) => (
    <div className={`flex items-start gap-6 transition-all duration-500 ${active ? 'opacity-100 translate-x-2' : 'opacity-40 hover:opacity-60'}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-brand-700 shadow-xl shadow-brand-900/50 scale-110' : 'bg-white/5 border border-white/10'}`}>
            {React.cloneElement(icon, { size: 24, className: active ? 'text-white' : 'text-slate-400' })}
        </div>
        <div className="space-y-1">
            <h4 className={`text-sm font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-300'}`}>{title}</h4>
            <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-[200px]">{desc}</p>
        </div>
    </div>
);

export default PublicAttendance;
