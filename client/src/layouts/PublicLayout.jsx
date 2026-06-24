import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X, Search, ChevronDown, Globe, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import logoHeader from "../assets/logo-3.jpeg";
import logoFooter from "../assets/logo-1.jpeg";
import medicalImg from "../assets/medical.png";
import hospitalityImg from "../assets/hospitality.png";
import vocationalImg from "../assets/vocational.png";
import campusImg from "../assets/campus.png";
import FloatingContactMenu from "../components/FloatingContactMenu";

const menuItems = [
  { title: "Home", to: "/" },
  {
    title: "About US",
    submenu: [
      { title: "About Us", to: "/about" },
      { title: "History", to: "/history" },
      { title: "Group Of Companies", to: "/group-of-companies" },
      { title: "Numbers Counter", to: "/numbers-counter" },
      { title: "Our Testimonials", to: "/testimonials" },
      { title: "Awards & Certified", to: "/awards-certificates" },
    ],
  },
  {
    title: "RG Academy",
    submenu: [
      { title: "Our Institutions", to: "/institutions" },
      { title: "Unicarewel Medical", to: "/unicarewel" },
      { title: "RGMTN Hospitality", to: "/rgmtn" },
      { title: "BGLRGM Vocational", to: "/bglrgm" },
    ],
  },
  {
    title: "Courses & Certifications",
    mega: [
      {
        title: "Diploma Programs (1-2 Years)",
        items: [
          "Medical & Paramedical Diploma",
          "Hospitality & Hotel Management",
          "Aviation & Cruise Ship Training",
          "Travel & Tourism Management",
          "Business & Vocational Tech",
          "Non-Medical Professional Tracks",
        ],
      },
      {
        title: "Degree Programs (3 Years)",
        items: [
          "Medical Science Degrees",
          "Hospitality Administration",
          "Aviation & Airport Management",
          "Global Tourism & Travel Degrees",
          "Business Management Studies",
          "Vocational Science Tracks",
        ],
      },
      {
        title: "Postgraduate Programs (2 Years)",
        items: [
          "Advanced Healthcare Studies",
          "Tourism & Hospitality Masters",
          "Hotel Administration Masters",
          "Aviation Operations Management",
          "Corporate Business Leadership",
          "Vocational Education Masters",
        ],
      },
      {
        title: "Short-Term/Vocational (6 Mo)",
        items: [
          "Patient Care & Nursing Asst",
          "Culinary Arts & Food Production",
          "Cabin Crew & Grooming",
          "Retail & Sales Management",
          "Information Technology Basics",
          "Professional Soft Skills",
        ],
      },
    ],
  },
  {
    title: "Coaching & Training",
    submenu: [
      { title: "Engineering (JEE)", to: "/coaching/jee" },
      { title: "Medical (NEET)", to: "/coaching/neet" },
      { title: "Civil services (UPSC/KPSC)", to: "/coaching/upsc" },
      { title: "Banking (IBPS/SBI)", to: "/coaching/banking" },
      { title: "Management (CAT/CET/MAT/GRE)", to: "/coaching/management" },
    ],
  },
  {
    title: "Placements",
    submenu: [
      { title: "Industry Internships", to: "/placements/internships" },
      { title: "Permanent Placements", to: "/placements/jobs" },
      { title: "Campus Recruitment", to: "/placements/campus-drive" },
      { title: "Our Global Partners", to: "/placements/partners" },
      { title: "Placement FAQs", to: "/placements/faqs" },
    ],
  },
  {
    title: "Examination",
    submenu: [
      { title: "Available Exams", to: "/exams" },
      { title: "Online Application", to: "/exams/apply" },
      { title: "Check Results", to: "/exams/results" },
      { title: "Download Entry Ticket", to: "/exams/entry-ticket" },
    ],
  },
  {
    title: "Our Industries",
    submenu: [
      { title: "Hospitality Industry", to: "/industries/hospitality" },
      { title: "Cruise & Aviation Sector", to: "/industries/cruise-aviation" },
      { title: "Medical & Healthcare", to: "/industries/medical" },
      { title: "Secondary Industries", to: "/industries/others" },
    ],
  },
  {
    title: "Partner With Us",
    submenu: [
      { title: "Franchise Partnerships", to: "/partner-with-us" },
    ],
  },
  {
    title: "Newsletter",
    submenu: [
      { title: "Latest News & Media", to: "/newsletter/news-media" },
      { title: "Educational Blogs", to: "/newsletter/blogs" },
      { title: "Social Feed Posts", to: "/newsletter/posts" },
      { title: "Media Gallery", to: "/newsletter/gallery" },
      { title: "Email Subscription", to: "/newsletter/subscribe" },
    ],
  },
  {
    title: "Contact Us",
    submenu: [
      { title: "Get In Touch", to: "/contact" },
      { title: "Our Local Presence", to: "/presence" },
      { title: "Join Our Team", to: "/careers" },
    ],
  },
  {
    title: "Student Portal",
    submenu: [
      { title: "Account Login", to: "/login" },
      { title: "New Registration", to: "/student-registration" },
    ],
  },
];

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const validMenuItems = menuItems.filter(item => item.submenu || item.mega);

  const [activeExploreCategory, setActiveExploreCategory] = useState(validMenuItems[0]);
  const [selectedExploreItem, setSelectedExploreItem] = useState(
    validMenuItems[0]?.submenu?.[0]?.title ||
    validMenuItems[0]?.mega?.[0]?.items?.[0]
  );
  const [openMegaGroup, setOpenMegaGroup] = useState(
    menuItems.find((item) => item.mega)?.mega?.[0]?.title || ""
  );
  const [expandedMobileCategory, setExpandedMobileCategory] = useState("");
  const [selectedMobileItem, setSelectedMobileItem] = useState("");
  const exploreRef = useRef(null);

  const exploreContent = {
    // Top Level / General
    "Home": "Dr.RG Academy stands as a beacon of excellence in professional education, offering a holistic environment where academic rigor meets practical industry experience. Our home portal provides a gateway to exploring our diverse range of campuses, innovative learning modules, and the vibrant life that defines our student community. We are committed to nurturing talent and providing the tools necessary for students to excel in their chosen fields, whether in the heart of our Bangalore facilities or through our global partner network.",

    // About Us Group
    "About Us": "At Dr.RG Academy, we are dedicated to empowering students with the knowledge, skills, and confidence needed to achieve their academic and career goals. Our mission is to provide high-quality education through a structured, student-focused approach that nurtures both understanding and performance. We specialize in delivering result-oriented coaching supported by experienced faculty, well-designed study materials, and practical teaching methods. At Dr.RG Academy, we believe that every student has the potential to succeed, and our role is to guide them with the right strategy, mentorship, and continuous support. Our learning environment is designed to encourage curiosity, discipline, and consistency. With a focus on conceptual clarity and real-world application, we prepare students not just for exams, but for long-term success in their chosen paths. Driven by excellence and innovation, Dr.RG Academy continues to build a strong foundation for students, helping them transform their ambitions into achievements.",
    "History": "Dr.RG Academy was founded with a simple yet powerful vision—to make quality education accessible and effective for every student. What started as a small initiative with a handful of learners has grown into a trusted institution known for its commitment to academic excellence and student success. In the early days, the academy focused on building a strong foundation by understanding students’ needs and creating a supportive learning environment. With dedication, consistent results, and positive student outcomes, Dr.RG Academy quickly gained recognition and expanded its programs and reach. Over the years, the academy has continuously evolved by adopting modern teaching methods, integrating practical learning approaches, and enhancing its curriculum to meet changing educational demands. Our journey has been driven by passionate educators, motivated students, and a shared goal of achieving excellence. Today, Dr.RG Academy stands as a growing center of learning, shaping the future of students and helping them turn their aspirations into achievements. As we move forward, we remain committed to innovation, quality education, and empowering the next generation.",
    "Group Of Companies": "Dr.RG Academy is a key pillar of the Dr.RG Group, a multi-faceted conglomerate with interests spanning education, consultancy, technology, and facility management. Our group synergy allows us to provide students with unparalleled opportunities for internships, real-world projects, and direct industry exposure. Each entity within the group operates with a shared philosophy of 'Growth through Excellence,' ensuring that the standards set at the top are reflected in every student's journey. From medical consultancy through Unicarewel to hospitality excellence via RGMTN, our group strength is your professional advantage.",
    "Numbers Counter": "Our impact is measured in the success of our learners. Over the past two decades, Dr.RG Academy has established a footprint that includes over 20 years of educational excellence and more than 50,000 successful alumni across the globe. We maintain strategic partnerships with 100+ industry leaders to ensure top-tier placement opportunities. With 15+ advanced training labs and 5 dedicated main campuses alongside multiple regional centers, our physical and intellectual infrastructure is designed for scale and quality, ensuring every student has the resources they need to thrive in a competitive global market.",
    "Our Testimonials": "The voices of our students and alumni tell the true story of Dr.RG Academy's impact. Rahul Sharma, a Hotel Management graduate, notes: 'The practical simulation labs were a game-changer for my career.' Priya Reddy, from our Medical Training program, shares: 'The mentorship from industry veterans helped me navigate complex requirements with ease.' These testimonials reflect our commitment to practical excellence and student-centric support. We take immense pride in every success story and continuously use student feedback to refine our teaching methodologies and campus facilities.",
    "Awards & Certified": "Quality and excellence are certified standards at Dr.RG Academy. We are proudly ISO 9001:2015 certified, ensuring our management and educational delivery systems meet the highest international benchmarks. Our list of accolades includes the 'Excellence in Vocational Training' award from the Regional Skill Council and being recognized for the 'Best Placement Record' in the hospitality and healthcare sectors for three consecutive years. These awards are a testament to our relentless pursuit of perfection in academic delivery and operational excellence.",

    // RG Academy Group
    "Our Institutions": "Our network of institutions serves as a dynamic ecosystem for specialized professional learning. Each campus is meticulously designed to mirror its respective industry, featuring state-of-the-art medical simulation wards, professional-grade culinary kitchens, and aviation training cabins. We believe that the environment is the 'third teacher,' which is why our facilities emphasize collaboration, discipline, and hands-on practice. From our flagship Bangalore campus to our specialized regional centers, we provide a consistent, high-quality educational experience that prepares students for the realities of the modern workplace.",
    "Unicarewel Medical": "Unicarewel Medical is our specialized wing dedicated to global medical education and healthcare consultancy. We bridge the gap for ambitious students seeking to pursue MBBS and advanced medical degrees in prestigious international universities across Europe, Asia, and beyond. Our expert consultants provide end-to-end support, including university selection, entrance exam preparation, visa processing, and post-arrival assistance. Through Unicarewel, we empower the next generation of healthcare leaders with global exposure and world-class academic foundations.",
    "RGMTN Hospitality": "The RG Management Training Network (RGMTN) is our flagship brand for hospitality and tourism excellence. Developed in close collaboration with international hotel chains, RGMTN offers a curriculum that is both academically rigorous and industry-relevant. Our students train in simulated high-pressure environments, mastering the arts of culinary production, front-office management, and guest relations. With a focus on the luxury service sector, RGMTN ensures that every graduate enters the workforce with the poise, skill, and certification required to succeed in 5-star environments worldwide.",
    "BGLRGM Vocational": "BGLRGM is dedicated to fundamental vocational excellence and technical skill-building for the modern labor market. We focus on 'learning-by-doing,' with centers organized around practical workshops and industry-standard technical labs. Our programs cater to a wide range of essential services and technical trades, providing students with immediate employability skills. By shortening the distance between education and the job market, BGLRGM serves as a vital catalyst for economic independence and professional growth for our students.",

    // Courses & Certifications (Detailed Category-wise lists)
    "Medical & Paramedical Diploma": "Our Medical Diploma programs provide intensive, 1-2 year technical training for essential healthcare support roles. \n\nCategory-wise Courses: \n• Diagnostic: Diploma in Medical Lab Technology (DMLT), X-Ray & Imaging Tech \n• Specialist Support: Diploma in Dialysis Technology, Operation Theatre Tech (DOTT) \n• Patient Care: Hospital Nursing Assistant, Patient Care Management \n• Administrative: Medical Record Management, Health Inspector Training \n\nThese programs include 6 months of mandatory clinical rotations in certified hospitals.",
    "Hospitality & Hotel Management": "The Hospitality track offers a path into the world's most dynamic service industries. \n\nCategory-wise Courses: \n• Operations: Diploma in Front Office, Food & Beverage Service \n• Culinary: Diploma in Food Production, Bakery & Confectionery \n• Management: Diploma in Hotel Management & Catering Technology \n• Specialized: Housekeeping Operations, Guest Relations Excellence \n\nTraining includes 100% internship placement in top-tier luxury hotel brands.",
    "Aviation & Cruise Ship Training": "Prepare for a career above the clouds or on the high seas with our specialized travel programs. \n\nCategory-wise Courses: \n• In-Flight: Cabin Crew & Air Hostess Training, Personality Development \n• Ground Ops: Airport Ground Handling, Baggage & Security Management \n• Sea Travel: Cruise Ship Hospitality, Marine Guest Services \n• Technical: Flight Dispatcher Assistant, Air Travel Operations \n\nStudents benefit from mock cabin drills and intensive grooming workshops.",
    "Travel & Tourism Management": "Explore the global tourism landscape with our comprehensive management and operations courses. \n\nCategory-wise Courses: \n• Travel Agency: Diploma in Travel & Tourism, IATA Foundation \n• Operations: Tour Guiding, Destination Marketing, Ticketing & GDS \n• Management: Event & MICE Management, Eco-Tourism Planning \n\nOur courses focus on international travel regulations, cultural sensitivity, and modern distribution systems.",
    "Business & Vocational Tech": "Equip yourself with the corporate and technical skills required for the modern business world. \n\nCategory-wise Courses: \n• Administration: Diploma in Business Management, HR Assistant \n• Technical: IT & Software Support, Computer-Aided Design (CAD) \n• Creative: Digital Media, Graphic Design, Web Development Fundamentals \n• Trade Skills: Mechanical & Electrical Maintenance Certifications \n\nFocus is on direct entry into corporate support and technical maintenance roles.",
    "Non-Medical Professional Tracks": "Diverse career paths for students looking for non-healthcare and non-service specialized roles. \n\nCategory-wise Courses: \n• Finance: Tally & Accounting Professional, Banking Operations \n• Digital: Digital Marketing & SEO, E-Commerce Operations \n• Logistics: Supply Chain Management, Retail Operations \n• Language: Professional English & Communication for Global Careers \n\nThese tracks are designed to fill specific skill gaps in the expanding service and retail sectors.",

    // Degree Programs
    "Medical Science Degrees": "Comprehensive 3-year undergraduate programs for in-depth healthcare expertise. \n\nCategory-wise Degrees: \n• B.Sc. Medical Lab Technology (BMLT) \n• B.Sc. Imaging & Radiography \n• B.Sc. Dialysis & Renal Technology \n• B.Sc. Operation Theatre & Anesthesia Tech \n• B.Sc. Physician Assistant \n\nOur degrees provide the academic foundation required for postgraduate specialization and research.",
    "Hospitality Administration": "3-year management programs focused on the leadership and strategic side of the service sector. \n\nCategory-wise Degrees: \n• B.Sc. Hospitality & Hotel Administration \n• Bachelor of Hotel Management (BHM) \n• BBA in Hospitality and Tourism \n• B.Sc. Culinary Arts & Management \n\nGraduates are prepared for Assistant Manager roles and management trainee programs in global chains.",
    "Aviation & Airport Management": "Strategic degree programs for those aiming for management roles in the aviation industry. \n\nCategory-wise Degrees: \n• BBA in Aviation & Airport Management \n• B.Sc. Aviation Science \n• Bachelor of Tourism & Travel Management \n\nFocus areas include aviation law, airline economics, safety management, and airport logistical planning.",
    "Global Tourism & Travel Degrees": "In-depth academic study of the global tourism economy and destination management. \n\nCategory-wise Degrees: \n• B.A. (Hons) Travel & Tourism Management \n• B.Sc. International Tourism \n• Bachelor of Tourism Studies (BTS) \n\nIncludes international field trips and research projects on sustainable tourism and global travel trends.",
    "Business Management Studies": "Broad-spectrum business degrees that open doors to any corporate industry. \n\nCategory-wise Degrees: \n• Bachelor of Business Administration (BBA) - General \n• BBA in Retail & Supply Chain \n• BBA in Digital Business \n• Bachelor of Commerce (B.Com) Professional \n\nOur management degrees emphasize entrepreneurship, financial literacy, and leadership skills.",
    "Vocational Science Tracks": "Technical degrees that bridge the gap between traditional science and industrial application. \n\nCategory-wise Degrees: \n• B.Voc (Bachelor of Vocation) in Software Development \n• B.Voc in Industrial Automation \n• B.Voc in Renewable Energy Management \n• B.Sc. Information Technology \n\nThese programs focus on high-growth technical sectors requiring specialized scientific knowledge.",

    // Postgraduate
    "Advanced Healthcare Studies": "Masters-level programs for specialization in clinical and healthcare management. \n\nCategory-wise Masters: \n• M.Sc. Medical Lab Technology \n• Masters in Hospital Administration (MHA) \n• M.Sc. Clinical Research \n• Postgraduate Diploma in Healthcare Management \n\nDesigned for professionals looking to move into senior clinical lead or hospital administrative roles.",
    "Tourism & Hospitality Masters": "Advanced management studies for the tourism and hospitality sectors. \n\nCategory-wise Masters: \n• Master of Tourism and Travel Management (MTTM) \n• MBA in Tourism & Hospitality \n• M.Sc. International Hospitality Management \n\nFocus on strategic marketing, global heritage management, and large-scale tourism planning.",
    "Hotel Administration Masters": "The pinnacle of hospitality leadership training. \n\nCategory-wise Masters: \n• Master of Hotel Management (MHM) \n• Executive MBA in Hospitality Administration \n• P.G. Diploma in Hotel Operations & Strategy \n\nIncludes advanced revenue management, HR development for hotels, and luxury lifestyle management.",
    "Aviation Operations Management": "Master-level expertise for the high-stakes world of airline and airport leadership. \n\nCategory-wise Masters: \n• MBA in Aviation Management \n• M.Sc. Airline & Airport Operations \n• P.G. Diploma in Aviation Safety & Security \n\nFocus on fleet management, international aviation policy, and enterprise-level risk assessment.",
    "Corporate Business Leadership": "Transforming graduates into visionary corporate leaders. \n\nCategory-wise Masters: \n• Master of Business Administration (MBA) \n• Master of Management Studies (MMS) \n• PGDM in Strategic Leadership \n• MBA in International Business \n\nEmphasis on global market analysis, corporate governance, and complex organizational transformation.",
    "Vocational Education Masters": "Advanced training for those looking to lead educational and vocational training institutions. \n\nCategory-wise Masters: \n• Master of Vocation (M.Voc) in Various Trades \n• MA in Vocational Education & Training \n• P.G. Diploma in Skills Development Management \n\nPrepares professionals for roles in academic administration and institutional leadership.",

    // Short Term
    "Patient Care & Nursing Asst": "Intensive 6-month training for immediate entry into healthcare support. Includes basic anatomy, patient hygiene, bedside assistance, and emergency protocols. Perfect for rapid career entry in hospitals and home-care services.",
    "Culinary Arts Foundations": "Fast-track 6-month certificate in professional cooking and kitchen operations. Focuses on knife skills, food safety, basic mother sauces, and multi-cuisine essentials for entry-level commis roles.",
    "Cabin Crew & Grooming": "A 6-month transformation program focusing on aviation personality development, etiquette, safety communication, and interview readiness for airline recruitment.",
    "Retail & Sales Management": "Short-term certificate focusing on customer service excellence, inventory management, and POS operations for the expanding retail and luxury brand markets.",
    "Information Technology Basics": "6-month crash course in essential IT skills, including MS Office proficiency, hardware troubleshooting, basic networking, and data entry excellence.",
    "Professional Soft Skills": "A comprehensive 6-month program dedicated to communication excellence, emotional intelligence, leadership basics, and workplace professionalism for any industry.",

    // Coaching & Training
    "Engineering (JEE)": "Our JEE coaching program is a rigorous system designed to help engineering aspirants crack the prestigious IIT-JEE (Main and Advanced) exams. We provide a balanced curriculum that emphasizes conceptual clarity in Physics, Chemistry, and Mathematics. With regular mock tests, performance analytics, and specialized doubt-clearing sessions, we ensure students are battle-ready for the most competitive exams in the country.",
    "Medical (NEET)": "Prepare for a career in medicine with our specialized NEET coaching. Our faculty focuses on the depth and breadth of the NCERT syllabus while introducing advanced problem-solving techniques for Biology, Physics, and Chemistry. Our comprehensive test series follows the exact pattern of the National Eligibility cum Entrance Test, helping students build accuracy and speed.",
    "Civil services (UPSC/KPSC)": "The path to becoming a civil servant requires discipline, strategy, and deep knowledge of public affairs. Our coaching for UPSC and KPSC offers a structured approach covering General Studies, Current Affairs, and Optional subjects. We provide expert mentorship, answer-writing workshops, and simulated interview panels to help candidates navigate all three stages of the examination.",
    "Banking (IBPS/SBI)": "Our banking exams coaching is focused on the core skills required for success in IBPS PO/Clerk and SBI recruitment exams. We provide intensive training in Quantitative Aptitude, Logical Reasoning, English Language, and General Banking Awareness. Short-cut techniques and speed-building drills are a staple of our classroom experience.",
    "Management (CAT/CET/MAT/GRE)": "Get into the world's top B-schools with our expert-led management entrance coaching. We cover all sections of CAT, MAT, XAT, and international exams like the GRE/GMAT. Our focus is on building logical thinking and verbal ability, complemented by personalized strategy sessions for Group Discussions and Personal Interviews.",

    // Placements
    "Industry Internships": "At Dr.RG Academy, internships are not just a requirement but a bridge to your professional future. We partner with over 100+ organizations to provide 3-6 month internships that offer real-world responsibility and mentorship. Many of our students receive Pre-Placement Offers (PPOs) directly from their internship providers due to the high standards of training we provide.",
    "Permanent Placements": "Our dedicated placement cell works year-round to connect our graduates with leading employers in India and abroad. We maintain a strong network across hospitality chains, hospitals, tech firms, and travel companies. Our focus is on long-term career stability, ensuring our students find roles that match their skills and ambitions.",
    "Campus Recruitment": "We host annual campus recruitment drives where top-tier companies visit our locations for direct hiring. These events provide students with the opportunity to showcase their technical skills and soft skills directly to HR managers. We provide pre-drive grooming and mock interview sessions to ensure our students stand out.",
    "Our Global Partners": "Our partners are the leaders of their respective industries. From luxury hospitality brands like Taj, Marriott, and Hilton to top healthcare providers and global airlines, our students are placed in the best environments worldwide. These partnerships also help us keep our curriculum aligned with the latest industry trends and recruitment standards.",
    "Placement FAQs": "Have questions about your placement journey? Our FAQ section covers everything from eligibility criteria and document preparation to salary packages and international job opportunities. We believe in transparency and want our students and parents to have a clear understanding of the transition from classroom to career.",

    // Examination
    "Available Exams": "Dr.RG Academy acts as a central hub for various academic and professional examinations. From internal assessments that track student progress to hosting regional and national certifications, we maintain a secure and professional testing environment. We ensure all candidates are well-informed about schedules and syllabus requirements.",
    "Online Application": "Our application process for exams and certifications is streamlined through a digital portal. We provide step-by-step guidance on filling out application forms, uploading necessary documents, and processing examination fees. Dedicated help-desks are available to assist students with any technical queries during the process.",
    "Check Results": "Celebrate your success through our real-time results portal. Students can access their detailed performance reports, download digital certificates, and track their academic trajectory. We provide comprehensive feedback along with results to help students identify areas for further improvement.",
    "Download Entry Ticket": "Your gateway to the examination hall. Our system provides easy downloads for hall tickets and entry passes. We also outline clear protocols for exam days, including reporting times, allowed materials, and code of conduct to ensure a smooth and fair testing experience for all.",

    // Industries
    "Hospitality Industry": "The hospitality industry is one of the fastest-growing global sectors. At Dr.RG Academy, we focus on the entire value chain—from luxury hotel management and fine dining to event planning and guest services. We prepare our students for roles that demand excellence in communication, problem-solving, and professional etiquette.",
    "Cruise & Aviation Sector": "The world of cruise and aviation offers a truly global career path. We train our students to handle the unique challenges of high-pressure environments, focusing on safety standards, guest relations, and operational efficiency. Whether on a luxury liner or an international flight, our graduates are known for their professionalism.",
    "Medical & Healthcare": "The healthcare support industry is the backbone of modern wellness. We train professionals for the vital 'allied health' roles that support doctors and nurses. From diagnostic labs to emergency rooms, our graduates play a critical role in patient care and medical operations.",
    "Secondary Industries": "Our 'Other Industries' vertical explores emerging opportunities in retail, logistics, digital media, and corporate services. We keep a close eye on market trends to ensure that our vocational training remains relevant to the needs of the modern, diversifying economy.",

    // Partner With Us
    "Franchise Partnerships": "Grow with a brand that is synonymous with educational excellence. Our franchise model is built on mutual success, providing partners with academic curriculum, staff training, and marketing support. Join us in our mission to bring quality vocational and professional education to every corner of the country.",

    // Newsletter
    "Latest News & Media": "Stay updated with the latest happenings at Dr.RG Academy. From new campus launches and industry MoU signings to student achievements and press releases, our news section is your primary source for academy-related updates.",
    "Educational Blogs": "Gain insights from our academic leaders and industry experts. Our blog features articles on career guidance, industry trends, and student success stories, providing a deeper look into the world of professional education.",
    "Social Feed Posts": "Catch the latest snapshots of campus life! Our social posts reflect the vibrant culture, cultural events, sports meets, and workshops that make life at Dr.RG Academy more than just studies.",
    "Media Gallery": "A visual journey through our campuses. Explore our facilities, view photos from our graduation ceremonies, and see our students in action in our high-tech labs and simulation rooms.",
    "Email Subscription": "Don't miss a beat. Subscribe to our newsletter to receive monthly updates, early alerts for admissions, and exclusive invitations to our webinars and campus events directly in your inbox.",

    // Contact
    "Get In Touch": "Your journey with Dr.RG Academy starts with a conversation. Reach out to our admissions team for course advice, or contact our administration for support. We are committed to providing timely and helpful responses to all inquiries.",
    "Our Local Presence": "With a strong presence across southern India and regional hubs worldwide, Dr.RG Academy is never too far away. Explore our office locations and training centers to find the campus that best fits your needs.",
    "Join Our Team": "Are you passionate about shaping the future? Dr.RG Academy offers a dynamic work environment for educators, administrators, and industry experts. Join our team and be a part of the leading name in professional education.",

    // Student Portal
    "Account Login": "Access your personalized learning dashboard. Our student portal provides secure access to course materials, schedules, attendance records, and faculty communication tools, keeping you connected throughout your academic journey.",
    "New Registration": "Ready to take the first step? Our registration portal is the beginning of your professional transformation. Fill out your details, choose your program, and join a community of learners dedicated to excellence.",
  };

  const getExploreContent = (key) => exploreContent[key] || "Select an item to read more about it.";

  const handleExploreItemClick = (category, itemTitle) => {
    setActiveExploreCategory(category);
    setSelectedExploreItem(itemTitle);
    if (category.mega) {
      setOpenMegaGroup("");
      setSelectedExploreItem("");
    } else {
      setOpenMegaGroup("");
    }
  };

  useEffect(() => {
    if (activeExploreCategory.mega) {
      setOpenMegaGroup("");
      setSelectedExploreItem("");
    } else if (activeExploreCategory.submenu) {
      setOpenMegaGroup("");
      setSelectedExploreItem(activeExploreCategory.submenu[0]?.title || "");
    }

    const handleClickOutside = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setIsExploreOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    if (!isMenuOpen) {
      setExpandedMobileCategory("");
      setSelectedMobileItem("");
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeExploreCategory, isMenuOpen]);

  // Handler for forced refresh navigation
  const handleForcedNavigation = (e, to) => {
    e.preventDefault();
    window.location.href = to;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">

      {/* Top Corporate Strip - Single Line forced */}
      <div className="bg-slate-900 text-slate-400 text-[10px] md:text-xs py-2.5 px-4 border-b border-slate-800 overflow-hidden whitespace-nowrap scrollbar-hide">
        <div className="max-w-7xl mx-auto flex md:justify-between items-center gap-6 min-w-max md:min-w-0">

          <div className="flex items-center gap-8 md:gap-6 md:w-full md:justify-between animate-marquee md:animate-none">
            {/* The set of links to repeat */}
            <div className="flex items-center gap-6 md:gap-5 md:w-full md:justify-between">
              {/* Left: Verticals */}
              <div className="flex items-center gap-3 md:gap-5 font-medium shrink-0">
                <a href="/" onClick={(e) => handleForcedNavigation(e, "/")} className="hover:text-white transition-colors">Dr R G Academy</a>
                <span className="text-slate-700">|</span>
                <a href="/unicarewel" onClick={(e) => handleForcedNavigation(e, "/unicarewel")} className="hover:text-white transition-colors">Unicarewel</a>
                <span className="text-slate-700">|</span>
                <a href="/rgmtn" onClick={(e) => handleForcedNavigation(e, "/rgmtn")} className="hover:text-white transition-colors">RGMTN</a>
                <span className="text-slate-700">|</span>
                <a href="/bglrgm" onClick={(e) => handleForcedNavigation(e, "/bglrgm")} className="hover:text-white transition-colors">BGLRGM</a>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4 md:gap-5 font-semibold shrink-0">
                <Link to="/?info=Admissions" className="hover:text-white transition-colors">Admissions</Link>
                <Link to="/student-registration" className="hover:text-white transition-colors">Apply Now</Link>
                <Link to="/?info=Scholarships" className="hover:text-white transition-colors">Scholarships</Link>
                <Link to="/?info=Resource+Supply" className="hover:text-white transition-colors">Resource Supply</Link>
                <Link to="/?info=Benefits" className="hover:text-white transition-colors">Benefits</Link>
              </div>
            </div>

            {/* Duplicate for Mobile Marquee (Hidden on md and up) */}
            <div className="flex md:hidden items-center gap-6 font-medium">
              <span className="text-slate-800">|</span>
              <div className="flex items-center gap-3 font-medium shrink-0">
                <a href="/" onClick={(e) => handleForcedNavigation(e, "/")} className="hover:text-white transition-colors">Dr R G Academy</a>
                <span className="text-slate-700">|</span>
                <a href="/unicarewel" onClick={(e) => handleForcedNavigation(e, "/unicarewel")} className="hover:text-white transition-colors">Unicarewel</a>
                <span className="text-slate-700">|</span>
                <a href="/rgmtn" onClick={(e) => handleForcedNavigation(e, "/rgmtn")} className="hover:text-white transition-colors">RGMTN</a>
                <span className="text-slate-700">|</span>
                <a href="/bglrgm" onClick={(e) => handleForcedNavigation(e, "/bglrgm")} className="hover:text-white transition-colors">BGLRGM</a>
              </div>
              <div className="flex items-center gap-4 font-semibold shrink-0">
                <Link to="/?info=Admissions" className="hover:text-white transition-colors">Admissions</Link>
                <Link to="/student-registration" className="hover:text-white transition-colors text-brand-400 font-bold">Apply Now</Link>
                <Link to="/?info=Scholarships" className="hover:text-white transition-colors">Scholarships</Link>
                <Link to="/?info=Resource+Supply" className="hover:text-white transition-colors">Resource Supply</Link>
                <Link to="/?info=Benefits" className="hover:text-white transition-colors">Benefits</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="relative border-b border-gray-200 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-8">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5">
              <div className="p-1 rounded bg-white">
                <img src={logoHeader} alt="DRRG Academy Logo" className="h-14 sm:h-18 object-contain" />
              </div>
            </Link>

            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden lg:flex items-center gap-4" ref={exploreRef}>
                <button
                  type="button"
                  onClick={() => setIsExploreOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-700 transition-colors"
                  aria-expanded={isExploreOpen}
                >
                  Explore
                  <ChevronDown size={14} />
                </button>

                {isExploreOpen && (
                  <div className="absolute inset-x-0 top-full z-50">
                    <div className="mx-auto w-full bg-white border-t border-slate-200 shadow-xl shadow-slate-200/50">
                      <div className="border-b border-slate-200 px-4 py-4 lg:px-6">
                        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6 overflow-x-auto">
                          {menuItems
                            .filter((item) => item.submenu || item.mega)
                            .map((item) => (
                              <button
                                key={item.title}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleExploreItemClick(
                                    item,
                                    item.submenu?.[0]?.title ||
                                    item.mega?.[0]?.items?.[0] ||
                                    item.title
                                  );
                                }}
                                className={`whitespace-nowrap text-sm font-semibold transition ${activeExploreCategory.title === item.title ? "text-slate-900 border-b-2 border-brand-600 pb-1" : "text-slate-600 hover:text-slate-900"}`}
                              >
                                {item.title}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="grid gap-6 px-4 py-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-6 lg:py-6 h-[70vh]">
                        <div className="overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <p className="text-sm font-semibold text-slate-900 mb-4">{activeExploreCategory.title}</p>
                          <div className="space-y-2">
                            {activeExploreCategory.submenu?.map((sub) => (
                              <button
                                key={sub.title}
                                type="button"
                                onClick={() => setSelectedExploreItem(sub.title)}
                                className={`block w-full text-left rounded-2xl px-4 py-3 text-sm transition ${selectedExploreItem === sub.title ? "border border-brand-200 bg-white text-brand-700 font-bold" : "text-slate-700 hover:bg-white hover:text-slate-900"}`}
                              >
                                {sub.title}
                              </button>
                            ))}

                            {activeExploreCategory.mega?.map((group) => (
                              <div key={group.title} className="rounded-3xl border border-slate-200 bg-white mb-2">
                                <button
                                  type="button"
                                  onClick={() => setOpenMegaGroup((prev) => (prev === group.title ? "" : group.title))}
                                  className="flex w-full items-center justify-between rounded-3xl px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                                >
                                  <span>{group.title}</span>
                                  <span className="text-slate-400">{openMegaGroup === group.title ? "-" : "+"}</span>
                                </button>
                                {openMegaGroup === group.title && (
                                  <div className="space-y-2 border-t border-slate-200 px-4 pb-4 pt-3">
                                    {group.items.map((sub) => (
                                      <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setSelectedExploreItem(sub)}
                                        className={`block w-full text-left rounded-2xl px-4 py-3 text-sm transition ${selectedExploreItem === sub ? "border border-brand-200 bg-white text-brand-700 font-bold" : "text-slate-700 hover:bg-slate-100"}`}
                                      >
                                        {sub}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedExploreItem}</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsExploreOpen(false)}
                              className="text-sm text-slate-500 hover:text-slate-900"
                            >
                              Close
                            </button>
                          </div>
                          <div className="mt-6 space-y-5 text-sm leading-7 text-slate-700">
                            <p>{getExploreContent(selectedExploreItem)}</p>

                            {/* Student Portal Logic: Show only relevant button */}
                            {activeExploreCategory.title === "Student Portal" && (
                              <div className="mt-4">
                                {selectedExploreItem === "Account Login" && (
                                  <Link
                                    to="/login"
                                    onClick={() => setIsExploreOpen(false)}
                                    className="block max-w-[200px] rounded-2xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 transition"
                                  >
                                    Go to Login
                                  </Link>
                                )}
                                {selectedExploreItem === "New Registration" && (
                                  <Link
                                    to="/student-registration"
                                    target="_blank"
                                    onClick={() => setIsExploreOpen(false)}
                                    className="block max-w-[200px] rounded-2xl bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700 transition"
                                  >
                                    Register Now
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-brand-700 font-bold hover:bg-brand-50 px-4 py-2 rounded transition-colors text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/student-registration"
                  target="_blank"
                  className="bg-white border border-brand-700 text-brand-700 px-5 py-2 rounded font-bold hover:bg-brand-50 transition-colors text-sm shadow-sm"
                >
                  Join for Free
                </Link>
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100]">
            {/* Backdrop - NO BLUR AS REQUESTED */}
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Menu Content */}
            <div className="absolute top-[80px] left-0 w-full max-h-[calc(100vh-80px)] bg-white border-b border-slate-200 shadow-2xl overflow-y-auto">
              <div className="px-5 py-8 space-y-4">
                {menuItems.map((item) => (
                  <div key={item.title} className="border-b border-slate-50 pb-4">
                    {item.submenu || item.mega ? (
                      <div>
                        <button
                          onClick={() => setExpandedMobileCategory(expandedMobileCategory === item.title ? "" : item.title)}
                          className="flex items-center justify-between w-full text-lg font-bold text-slate-900 py-2"
                        >
                          {item.title}
                          <ChevronDown size={20} className={`transition-transform duration-300 ${expandedMobileCategory === item.title ? "rotate-180" : ""}`} />
                        </button>

                        {expandedMobileCategory === item.title && (
                          <div className="mt-4 pl-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {item.submenu && item.submenu.map((sub) => (
                              <div key={sub.title}>
                                <button
                                  onClick={() => setSelectedMobileItem(selectedMobileItem === sub.title ? "" : sub.title)}
                                  className={`block w-full text-left text-base font-bold transition-colors ${selectedMobileItem === sub.title ? "text-brand-700" : "text-slate-700 hover:text-brand-600"}`}
                                >
                                  {sub.title}
                                </button>
                                {selectedMobileItem === sub.title && (
                                  <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in duration-500">
                                    <p className="text-sm leading-relaxed text-slate-600">
                                      {getExploreContent(sub.title)}
                                    </p>
                                    <Link
                                      to={sub.to}
                                      onClick={() => setIsMenuOpen(false)}
                                      className="inline-block mt-3 text-sm font-bold text-brand-700 hover:underline"
                                    >
                                      Go to Course Page →
                                    </Link>
                                  </div>
                                )}
                              </div>
                            ))}

                            {item.mega && item.mega.map((group) => (
                              <div key={group.title} className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{group.title}</p>
                                <div className="space-y-3 pl-2">
                                  {group.items.map((sub) => (
                                    <div key={sub}>
                                      <button
                                        onClick={() => setSelectedMobileItem(selectedMobileItem === sub ? "" : sub)}
                                        className={`block w-full text-left text-sm font-bold transition-colors ${selectedMobileItem === sub ? "text-brand-700" : "text-slate-600"}`}
                                      >
                                        {sub}
                                      </button>
                                      {selectedMobileItem === sub && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in duration-500 text-xs leading-relaxed text-slate-500">
                                          {getExploreContent(sub)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-bold text-slate-900 py-2 block"
                      >
                        {item.title}
                      </Link>
                    )}
                  </div>
                ))}

                <div className="pt-6 grid grid-cols-2 gap-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex justify-center items-center py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex justify-center items-center py-4 bg-brand-700 text-white rounded-xl font-bold"
                  >
                    Join Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Professional Footer */}
      <footer className="bg-brand-900 border-t border-brand-800 pt-16 pb-12 mt-20 text-brand-50 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 rounded-xl bg-white shadow-xl">
                  <img src={logoFooter} alt="DRRG Academy Logo" className="h-16 sm:h-20 object-contain" />
                </div>
              </div>
              <p className="mb-6 max-w-sm leading-relaxed text-brand-100/80">
                A premier group of institutions dedicated to excellence in professional education, vocational training, and global consultancy. Empowering the next generation of global leaders.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-11 h-11 flex items-center justify-center bg-white/10 border border-white/20 rounded-full hover:bg-white hover:text-brand-900 transition-all shadow-lg active:scale-95">
                  <Facebook size={20} />
                </a>
                <a href="#" className="w-11 h-11 flex items-center justify-center bg-white/10 border border-white/20 rounded-full hover:bg-white hover:text-brand-900 transition-all shadow-lg active:scale-95">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-11 h-11 flex items-center justify-center bg-white/10 border border-white/20 rounded-full hover:bg-white hover:text-brand-900 transition-all shadow-lg active:scale-95">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-[0.2em] opacity-80">
                Quick Links
              </h4>
              <ul className="space-y-4 font-medium text-brand-100">
                <li><Link to="/?info=Locate+Us" className="hover:text-white transition-colors text-left block">Locate Us</Link></li>
                <li><Link to="/?info=Privacy+Policy" className="hover:text-white transition-colors text-left block">Privacy Policy</Link></li>
                <li><Link to="/?info=Cancellation+%26+Refund+Policy" className="hover:text-white transition-colors text-left block">Cancellation & Refund Policy</Link></li>
                <li><Link to="/?info=Terms+%26+Condition" className="hover:text-white transition-colors text-left block">Terms & Condition</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-[0.2em] opacity-80">
                Programs
              </h4>
              <ul className="space-y-4 font-medium text-brand-100">
                <li><Link to="/?info=Master+Degree+Courses" className="hover:text-white transition-colors text-left block">Master Degree Courses</Link></li>
                <li><Link to="/?info=International+Degrees" className="hover:text-white transition-colors text-left block">International Courses & Degree</Link></li>
                <li><Link to="/?info=Onsite+Training" className="hover:text-white transition-colors text-left block">Onsite Opportunities</Link></li>
                <li><Link to="/?info=Vocational+Excellence" className="hover:text-white transition-colors text-left block">Vocational Excellence</Link></li>
              </ul>
            </div>

            <div className="col-span-2 space-y-8">
              <div>
                <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-[0.2em] opacity-80">
                  Resources
                </h4>
                <ul className="grid grid-cols-1 gap-4">
                  <li>
                    <Link to="/?info=Download+Section" className="w-full flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all group">
                      <span className="font-bold text-white text-left">Download Section</span>
                      <div className="p-2 bg-white/20 rounded-xl text-white group-hover:bg-white group-hover:text-brand-900 transition-colors">
                        <ChevronDown size={14} className="rotate-180" />
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/?info=Secure+Fee+Management" className="w-full flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-brand-50 shadow-2xl transition-all group">
                      <span className="font-bold text-brand-900 text-left">Pay Now Page</span>
                      <div className="p-2 bg-brand-600 rounded-xl text-white group-hover:bg-brand-700 transition-all">
                        <Globe size={14} />
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="p-5 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-brand-200 uppercase tracking-widest mb-2 italic">Main Office</p>
                <p className="text-brand-50 text-xs leading-relaxed">
                  Padmanabhanagar, Bangalore, Karnataka - 560070, India.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] md:text-xs text-brand-200/60 font-medium">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-center md:text-left items-center">
              <p>© 2024-2026 DR R G ACADEMY LLP. | ISO 9001:2015 Certified | All Rights Reserved.</p>
              <span className="hidden md:inline text-brand-200/30">|</span>
              <p>
                Designed and developed by{" "}
                <a 
                  href="https://sensitive.co.in/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors underline"
                >
                  sensitive technologies
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-4 md:gap-7 justify-center uppercase tracking-widest">
              <Link to="/?info=Privacy+Policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/?info=Terms+%26+Condition" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/?info=Cancellation+%26+Refund+Policy" className="hover:text-white transition-colors">Refund</Link>
              <Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link>
              <Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>
      <FloatingContactMenu />
    </div>
  );
};

export default PublicLayout;
