import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle,
  Users,
  ArrowRight,
  ShieldCheck,
  X,
  Globe,
  Settings,
  Info,
  Clock,
  FileText,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Slider from "../../components/common/Slider";
import medicalImg from "../../assets/medical.png";
import hospitalityImg from "../../assets/hospitality.png";
import vocationalImg from "../../assets/vocational.png";
import campusImg from "../../assets/campus.png";

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const infoKey = searchParams.get("info");
  const infoRef = useRef(null);

  // Auto-scroll logic for infinite single-direction
  const [vIndex, setVIndex] = React.useState(0);
  const [dIndex, setDIndex] = React.useState(0);
  const [vTransition, setVTransition] = React.useState(true);
  const [dTransition, setDTransition] = React.useState(true);

  const verticals = [
    { title: "Medical Education", desc: "Global MBBS & Healthcare guidance via Unicarewel.", img: medicalImg, link: "/unicarewel" },
    { title: "Hospitality Academy", desc: "World-class tourism training at RGMTN campuses.", img: hospitalityImg, link: "/rgmtn" },
    { title: "Vocational Excellence", desc: "Industry-aligned skill building by BGLRGM experts.", img: vocationalImg, link: "/bglrgm" },
    { title: "Dr.RG Main Campus", desc: "Core academic programs and Montessori education.", img: campusImg, link: "/about-us" },
  ];

  const degrees = [
    { title: "Computer Science", univ: "University of Illinois", tag: "Master's", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80", time: "100% Online • 18-24 Months", color: "brand" },
    { title: "Master of Business Admin", univ: "Macquarie University", tag: "MBA", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1630&q=80", time: "100% Online • 1-2 Years", color: "amber" },
    { title: "Data Science", univ: "University of Colorado Boulder", tag: "Master's", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80", time: "100% Online • Performance Based", color: "brand" },
    { title: "Public Health", univ: "Imperial College London", tag: "Bachelor's", img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80", time: "100% Online • Global Health Focus", color: "green" },
  ];

  useEffect(() => {
    const vInterval = setInterval(() => {
      setVIndex((prev) => prev + 1);
    }, 4000);
    const dInterval = setInterval(() => {
      setDIndex((prev) => prev + 1);
    }, 4500);
    return () => {
      clearInterval(vInterval);
      clearInterval(dInterval);
    };
  }, []);

  useEffect(() => {
    if (vIndex === verticals.length) {
      setTimeout(() => {
        setVTransition(false);
        setVIndex(0);
        setTimeout(() => setVTransition(true), 50);
      }, 1000);
    }
  }, [vIndex, verticals.length]);

  // Handle seamless loop for Degrees
  useEffect(() => {
    if (dIndex === degrees.length) {
      setTimeout(() => {
        setDTransition(false);
        setDIndex(0);
        setTimeout(() => setDTransition(true), 50);
      }, 1000);
    }
  }, [dIndex, degrees.length]);

  useEffect(() => {
    if (infoKey && infoRef.current) {
      infoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [infoKey]);

  const industrialInsights = {
    "Locate Us": "Dr.RG Academy’s physical footprint is strategically distributed to align with India’s most critical industrial hubs. Our main corporate headquarters in Bangalore, the Silicon Valley of India, serves as the central nerve center for our technology and management programs. Our Mangalore and Hubli campuses are specialized training arenas for hospitality and paramedical sciences, featuring dedicated simulation wings that replicate actual 5-star hotel lobbies and surgical wards. Internationally, our network extends through accredited consultancy partners in Southeast Asia and Europe, facilitating a seamless pipeline for students pursuing international internships and global job placements.",
    "Privacy Policy": "In an era of digital-first education, Dr.RG Academy adheres to the most stringent global data sovereignty standards, including the General Data Protection Regulation (GDPR) and the Payment Card Industry Data Security Standard (PCI-DSS). Our data architecture is built on advanced end-to-end encryption protocols (AES-256), ensuring that all student records—from academic transcripts to financial transactions—are immunized against unauthorized access.",
    "Cancellation & Refund Policy": "Dr.RG Academy’s financial protocols are designed with absolute clarity and student-centric transparency. Our refund framework is structured to protect the interests of both the applicant and the institution. (1) Pre-Session Withdrawal: Candidates withdrawing their application at least 15 days prior to the commencement of the official academic term are eligible for a 100% tuition refund, processed within a standard 14-day window.",
    "Terms & Condition": "The Dr.RG Academic Excellence Framework (AEF) is a comprehensive set of terms designed to uphold the highest standards of professional conduct and academic rigor. Enrollment in any of our specialized programs implies a mutual commitment to excellence. These terms include a mandatory 80% attendance threshold for all technical and practical laboratory sessions, ensuring that students gain necessary hands-on competency.",
    "Master Degree Courses": "Our Postgraduate Management Programs (PGMP) represent the absolute zenith of vocational leadership training. Specifically engineered for graduates with high-management ambitions, these 2st-tier programs focus on 'Strategic Industrial Intelligence.' The curriculum is delivered through a high-intensity module-based system involving over 500 hours of live industry immersion and 200 hours of executive-led workshop sessions.",
    "International Degrees": "The Dr.RG Global Mobility Program (GMP) is an elite academic pathway specifically designed to provide students with a cross-continental educational experience. Through our unique 'Hybrid Residency' model, students spend the initial phases of their degree at our state-of-the-art Indian campuses, mastering foundational theories and technical skills, before transitioning to our partner universities.",
    "Onsite Training": "Our 'Real-World Immersion' (RWI) philosophy dictates that classrooms are secondary to actual industry environments. From the very first semester, students are integrated into the operations of our flagship partner institutions—from top tier luxury hotels to multi-specialty acute care hospitals.",
    "Vocational Excellence": "The Dr.RG 'Elite Skills' Vocational Framework is built on the pillars of 'Precision, Speed, and Technical Mastery.' Recognized under national and international skill development standards (NSDC), our vocational tracks are designed for individuals who demand high-velocity career entry.",
    "Download Section": "Our Digital Institutional Dossier is a comprehensive guide that provides a microscopic view into the educational ecosystem of Dr.RG Academy. This is not just a brochure; it is a repository of technical data, including: (1) Curriculum Blueprints (2) Infrastructure Audits (3) Faculty Matrix (4) Placement Analytics.",
    "Industry Intelligence": "The Dr.RG 'Career Command Center' (CCC) provides a transparent, real-time interface for tracking the professional trajectory of our alumni network. This tracker aggregates data from our 100+ global hiring partners across the aviation, hospitality, healthcare, and corporate sectors.",
    "Secure Fee Management": "Our 'Institutional Finance Portal' (IFP) is a high-security, fintech-integrated environment specifically designed to handle all student financial interactions with zero latency and maximum protection. Built on a PCI-DSS Level 1 compliant architecture.",
    "Admissions": "Dr.RG Academy’s admission process is rigorous, transparent, and merit-driven. Our dual-pathway intake system allows students to apply either via national-level entrance examinations scores or through our proprietary assessment tests. From initial counseling to seat allocation, our Admissions Board guarantees a process free from bias, ensuring only the most dedicated candidates enter our specialized programs.",
    "Scholarships": "Financial constraints should never be a barrier to world-class education. The Dr.RG EdFund provides up to 100% tuition waivers for exceptional students under several categories including Merit-Based Grants, Need-Based Aid, Elite Athlete Support, and the 'Women in STEM & Hospitality' special scholarship. Applicants are evaluated by an independent financial committee prior to semester commencement.",
    "Resource Supply": "The Dr.RG 'Integrated Resource Supply Chain' is a unique operational wing that acts as a bridge between academia and industry. Beyond education, we actively supply highly-trained tactical manpower, certified medical personnel, and elite hospitality staff directly to our corporate partners on a contract or project basis. This ensures a constant, real-time feedback loop between our curriculum and industry demands.",
    "Benefits": "Being part of the Dr.RG ecosystem comes with unparalleled long-term advantages. Students and alumni enjoy exclusive access to our Global Alumni Network, priority processing for international work visas through our consultancy partners, lifetime career guidance from the CCC, and heavily discounted rates for continued learning and executive certifications.",
  };

  return (
    <div className="bg-white">
      <Slider />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="relative z-10 text-center lg:text-left">
              <h1 className="text-5xl lg:text-7xl font-sans font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Learn without <br />
                <span className="text-brand-700">limits.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Build skills with courses, certificates, and degrees online from
                world-class universities and companies.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-brand-700 text-white rounded font-bold text-lg hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/10"
                >
                  Join for Free
                </Link>
                <a
                  href="/student-registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-orange-500 text-white rounded font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-900/10 flex items-center justify-center gap-2"
                >
                  <Users size={20} /> Student Register
                </a>
                <a
                  href="/public-attendance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-slate-900 text-white rounded font-bold text-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={20} /> Mark Attendance
                </a>
                <Link
                  to="/results"
                  className="px-8 py-4 bg-brand-500 text-white rounded font-bold text-lg hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                >
                  <FileText size={20} /> Exam Results
                </Link>
              </div>
            </div>

            <div className="relative lg:h-[500px]">
              <div className="absolute top-0 right-0 w-4/5 h-4/5 bg-brand-50 rounded-tr-[4rem] rounded-bl-[4rem] -z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80"
                alt="Students collaborating"
                className="rounded-lg shadow-2xl w-[90%] relative z-10 mx-auto lg:mx-0"
              />
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded shadow-xl border border-slate-100 max-w-xs z-20 hidden md:block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                      Success Rate
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      94% Employed
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  within 6 months of graduation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Logos Strip */}
      <section className="bg-red-600 py-10 border-y border-red-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-red-100 mb-6 uppercase tracking-wider">
            Collaborating with 275+ leading universities and companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-90 hover:opacity-100 transition-all duration-500">
            <span className="text-2xl font-serif font-bold text-white">Illinois</span>
            <span className="text-2xl font-sans font-extrabold text-white">Duke</span>
            <span className="text-2xl font-serif font-bold text-white">Google</span>
            <span className="text-2xl font-mono font-bold text-white">IBM</span>
            <span className="text-2xl font-sans font-bold text-white">Stanford</span>
            <span className="text-2xl font-serif font-bold text-white">Penn</span>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              The World's Learning Platform
            </h2>
            <p className="text-slate-600 text-lg">
              We offer a range of learning opportunities—from hands-on projects
              and courses to job-ready certificates and degree programs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="p-6">
              <div className="w-16 h-16 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Top Quality Content
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Learn from top universities and industry leaders. Earn
                recognized credentials.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0">
                <Briefcase size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Career Goals
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Build job-ready skills for high-demand fields like Data Science,
                AI, and Business.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Flexible Learning
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Study at your own pace. Balance your learning with work and
                life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academy Verticals Section - RED BACKGROUND AS REQUESTED */}
      <section className="py-16 bg-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-white">Our Academy Verticals</h2>
              <p className="text-brand-100 mt-2">Specialized institutions under the Dr.RG umbrella.</p>
            </div>
            <Link to="/courses" className="bg-white text-brand-700 px-6 py-2 rounded font-bold hover:bg-brand-50 transition-colors">Explore All Courses →</Link>
          </div>

          <div className="relative overflow-hidden">
            <div 
              className={`flex ${vTransition ? "transition-transform duration-1000 ease-in-out" : ""}`}
              style={{ transform: `translateX(-${vIndex * (100 / (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1))}%)` }}
            >
              {[...verticals, ...verticals].map((item, idx) => (
                <div 
                  key={idx} 
                  className="w-full md:w-1/2 lg:w-1/4 shrink-0 px-3"
                >
                  <Link to={item.link} className="block group overflow-hidden rounded-2xl bg-white border border-brand-800 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden text-slate-900">
                      <img src={item.img} alt={item.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <div className="p-6 text-center text-slate-900">
                      <h3 className="text-lg font-bold group-hover:text-brand-600 transition-colors mb-2 uppercase">{item.title}</h3>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {verticals.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${vIndex % verticals.length === idx ? "w-10 bg-white" : "w-2 bg-white/20"}`} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Degree Programs Highlight */}
      <section className="py-20 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Earn Your Degree
              </h2>
              <p className="text-slate-600">
                Breakthrough pricing on 100% online degrees from top
                universities.
              </p>
            </div>
            <Link
              to="/degrees"
              className="hidden md:flex items-center gap-1 font-bold text-brand-700 hover:text-brand-800"
            >
              View all degrees <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative overflow-hidden">
            <div 
              className={`flex ${dTransition ? "transition-transform duration-1000 ease-in-out" : ""}`}
              style={{ transform: `translateX(-${dIndex * (100 / (window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 2 : 1))}%)` }}
            >
              {[...degrees, ...degrees].map((degree, idx) => (
                <div 
                  key={idx} 
                  className="w-full md:w-1/2 lg:w-1/4 shrink-0 px-2"
                >
                  <div className="bg-white p-6 rounded shadow-sm border border-slate-200 hover:shadow-md transition-shadow group cursor-pointer h-full">
                    <div className="h-40 bg-gray-200 mb-4 rounded overflow-hidden">
                      <img src={degree.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={degree.title} />
                    </div>
                    <div className="mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        degree.color === "brand" ? "bg-brand-100 text-brand-700" : 
                        degree.color === "amber" ? "bg-amber-100 text-amber-700" : 
                        "bg-green-100 text-green-700"
                      }`}>
                        {degree.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{degree.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{degree.univ}</p>
                    <p className="text-xs text-slate-400">{degree.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {degrees.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${dIndex % degrees.length === idx ? "w-10 bg-brand-700" : "w-2 bg-slate-300"}`} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Outcome Stats */}
      <section 
        className="relative py-24 text-white overflow-hidden bg-fixed bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80")' }}
      >
        <div className="absolute inset-0 bg-slate-900/60 z-0"></div>
 
        <div className="relative z-10 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold mb-6">Learner Outcomes</h2>
            <p className="text-slate-200 text-lg mb-8 leading-relaxed">
              87% of people learning for professional development report career
              benefits like getting a promotion, a raise, or starting a new
              career.
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-slate-900 px-10 py-4 rounded font-bold hover:bg-slate-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
            >
              Join for Free
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
              <h3 className="text-5xl font-bold text-brand-400 mb-2">35%</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-white/80">Average Salary Increase</p>
            </div>
            <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl flex flex-col justify-center">
              <Users size={40} className="text-brand-400 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-white/80">
                Network with peers from 190+ countries
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Take the next step toward your goals with <span className="text-brand-700">Dr.RG Academy.</span>
          </h2>
          <p className="text-slate-500 mb-10 text-lg">
            Join now to receive personalized recommendations from the full
            catalog.
          </p>
          <Link
            to="/register"
            className="px-12 py-4 bg-brand-700 text-white rounded font-bold text-xl hover:bg-brand-800 transition-colors shadow-xl shadow-brand-900/20"
          >
            Join for Free
          </Link>
        </div>
      </section>

      {/* Dynamic Info Section */}
      {infoKey && industrialInsights[infoKey] && (
        <section 
          id="info-section" 
          ref={infoRef}
          className="bg-brand-50/50 border-t border-brand-100 py-10"
        >
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="bg-white shadow-xl overflow-hidden border border-brand-100 rounded-xl">
              <div className="p-8 md:p-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                  <div>
                    <h2 className="text-4xl font-bold text-slate-900">{infoKey}</h2>
                  </div>
                  <button 
                    onClick={() => setSearchParams({})}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded hover:bg-slate-200 transition-all active:scale-95"
                  >
                    <X size={18} /> Close Section
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                  <p className="text-slate-700 text-lg leading-relaxed">
                    {industrialInsights[infoKey]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
