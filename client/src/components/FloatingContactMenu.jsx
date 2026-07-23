import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { MessageCircle, Phone, ArrowRight, ArrowLeft } from 'lucide-react';

const FloatingContactMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/enquiries', formData);
      if (res.data.success) {
        toast.success('Thank you for your enquiry. We will get back to you soon!');
        setFormData({ name: '', phone: '', email: '', message: '' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to send enquiry. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-[999999] flex flex-col items-end pointer-events-none">

      {/* Minimize Tab */}
      <div className="mb-[2px] pointer-events-auto">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-[50px] h-[40px] bg-brand-600 text-white flex justify-center items-center shadow-[-2px_2px_8px_rgba(0,0,0,0.1)] rounded-l-[5px] transition-opacity hover:opacity-90"
        >
          <span className="font-bold text-[20px]">{isMenuOpen ? '→' : '←'}</span>
        </button>
      </div>

      {/* Sticky Items Wrapper */}
      <div
        className={`flex flex-col items-end pointer-events-auto transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] origin-right ${isMenuOpen ? "transform translate-x-0 opacity-100 visible" : "transform translate-x-[100%] opacity-0 invisible"
          }`}
      >
        {/* Enquire Now Tab */}
        <div className="relative group block w-[50px]">

          {/* Sliding Form */}
          <div className="absolute right-[50px] top-1/2 -translate-y-1/2 transition-all duration-400 ease-in-out transform translate-x-[20px] opacity-0 invisible group-hover:translate-x-0 group-hover:opacity-100 group-hover:visible focus-within:translate-x-0 focus-within:opacity-100 focus-within:visible w-[320px] max-w-[calc(100vw-70px)] max-h-[75vh] overflow-y-auto bg-white shadow-[-5px_5px_20px_rgba(0,0,0,0.2)] rounded-l-[5px] pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto z-10 flex flex-col">

            <div className="bg-white text-brand-600 text-[18px] font-semibold py-[15px] px-[20px] border-b border-[#eeeeee] rounded-tl-[5px] sticky top-0 z-[20]">
              Write us!, Let's Talk!
            </div>
 
            <form onSubmit={handleSubmit} className="p-[20px] flex flex-col gap-[15px]">
              <input
                type="text" name="name" placeholder="Name*"
                value={formData.name} onChange={handleChange} required
                className="w-full px-[12px] py-[10px] bg-[#fcfcfc] border border-[#dddddd] rounded-[3px] focus:outline-none focus:border-brand-600 focus:bg-white text-[14px] text-[#4F4F4F] transition-colors"
              />
              <input
                type="tel" name="phone" placeholder="Phone*"
                value={formData.phone} onChange={handleChange} required
                className="w-full px-[12px] py-[10px] bg-[#fcfcfc] border border-[#dddddd] rounded-[3px] focus:outline-none focus:border-brand-600 focus:bg-white text-[14px] text-[#4F4F4F] transition-colors"
              />
              <input
                type="email" name="email" placeholder="Email"
                value={formData.email} onChange={handleChange}
                className="w-full px-[12px] py-[10px] bg-[#fcfcfc] border border-[#dddddd] rounded-[3px] focus:outline-none focus:border-brand-600 focus:bg-white text-[14px] text-[#4F4F4F] transition-colors"
              />
              <textarea
                name="message" placeholder="Message*" rows="4"
                value={formData.message} onChange={handleChange} required
                className="w-full min-h-[80px] px-[12px] py-[10px] bg-[#fcfcfc] border border-[#dddddd] rounded-[3px] focus:outline-none focus:border-brand-600 focus:bg-white text-[14px] text-[#4F4F4F] transition-colors resize-y"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:opacity-90 text-white font-semibold py-[12px] rounded-[3px] transition-opacity text-[15px] mt-[5px]"
              >
                Submit
              </button>
            </form>
          </div>

          {/* The Vertical Button */}
          <div className="bg-brand-600 text-white w-[50px] py-[15px] px-[12px] flex flex-col justify-center items-center shadow-[-2px_2px_8px_rgba(0,0,0,0.1)] rounded-l-[5px] border-b border-white/20 transition-opacity hover:opacity-90 cursor-pointer relative z-[2]">
            {/* Standard FontAwesome Envelope Icon replacement using Mail or just custom envelope shape if needed */}
            <svg viewBox="0 0 512 512" fill="currentColor" className="w-[20px] h-[20px] mb-[10px]">
              <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
            </svg>
            <span
              className="font-medium tracking-[1px] text-[16px] whitespace-nowrap rotate-180"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Enquire Now
            </span>
          </div>
        </div>

        {/* WhatsApp Icon */}
        <a
          href="https://wa.me/910000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="relative group block w-[50px] h-[50px] mt-[1px]"
        >
          {/* Separated Hover Text Box */}
          <div className="absolute right-[50px] top-0 h-[50px] leading-[50px] px-[15px] bg-[#26D367] text-white text-[14px] font-medium whitespace-nowrap rounded-l-[5px] transform translate-x-[10px] opacity-0 invisible transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:visible z-[1]">
            WhatsApp
          </div>
          <div className="bg-[#26D367] text-white w-[50px] h-[50px] flex justify-center items-center shadow-[-2px_2px_8px_rgba(0,0,0,0.1)] rounded-l-[5px] hover:opacity-90 relative z-[2] transition-opacity">
            {/* Custom FontAwesome Whatsapp styling */}
            <svg viewBox="0 0 32 32" className="w-[24px] h-[24px]" fill="currentColor">
              <path d="M16 .396C7.163.396 0 7.56 0 16.396c0 2.89.756 5.708 2.192 8.192L0 32l7.632-2.154a15.92 15.92 0 008.368 2.304h.001c8.837 0 16-7.163 16-16S24.837.396 16 .396zm0 29.204a13.2 13.2 0 01-6.72-1.848l-.48-.288-4.528 1.28 1.216-4.416-.312-.456A13.2 13.2 0 1129.2 16.396c0 7.28-5.92 13.2-13.2 13.2zm7.44-9.84c-.408-.204-2.424-1.2-2.8-1.344-.376-.144-.648-.204-.92.204-.272.408-1.048 1.344-1.288 1.62-.24.276-.48.312-.888.108-.408-.204-1.728-.636-3.288-2.028-1.212-1.08-2.028-2.412-2.268-2.82-.24-.408-.024-.624.18-.828.18-.18.408-.48.612-.72.204-.24.272-.408.408-.684.136-.276.068-.516-.034-.72-.102-.204-.92-2.22-1.26-3.036-.33-.792-.666-.684-.92-.696l-.784-.012c-.272 0-.72.102-1.096.516-.376.408-1.44 1.408-1.44 3.432s1.476 3.984 1.68 4.26c.204.276 2.904 4.44 7.032 6.216.984.424 1.752.676 2.352.864.988.312 1.888.268 2.6.164.792-.12 2.424-.99 2.768-1.944.34-.954.34-1.776.238-1.944-.102-.168-.374-.264-.782-.468z" />
            </svg>
          </div>
        </a>

        {/* Phone Icon */}
        <a
          href="tel:+910000000000"
          className="relative group block w-[50px] h-[50px] mt-[1px]"
        >
          {/* Separated Hover Text Box */}
          <div className="absolute right-[50px] top-0 h-[50px] leading-[50px] px-[15px] bg-brand-600 text-white text-[14px] font-medium whitespace-nowrap rounded-l-[5px] transform translate-x-[10px] opacity-0 invisible transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:visible z-[1]">
            Phone
          </div>
          <div className="bg-brand-600 text-white w-[50px] h-[50px] flex justify-center items-center shadow-[-2px_2px_8px_rgba(0,0,0,0.1)] rounded-l-[5px] hover:opacity-90 relative z-[2] transition-opacity">
            <Phone size={24} fill="currentColor" strokeWidth={0} />
          </div>
        </a>

      </div>
    </div>
  );
};

export default FloatingContactMenu;
