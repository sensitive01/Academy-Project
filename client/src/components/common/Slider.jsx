import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import medicalHero from '../../assets/medical_hero.png';
import hospitalityHero from '../../assets/hospitality_hero.png';
import techHero from '../../assets/tech_hero.png';

const slides = [
  {
    image: medicalHero,
    title: 'Global Excellence in Medical Education',
    description: 'Empowering the next generation of healthcare leaders with world-class training and international opportunities.',
    cta: 'Explore Medical Programs',
    link: '/unicarewel',
    color: 'brand'
  },
  {
    image: hospitalityHero,
    title: 'Mastering Hospitality & Luxury Services',
    description: 'Transform your passion for service into a rewarding career with our industry-aligned hospitality tracks.',
    cta: 'View Hospitality Courses',
    link: '/rgmtn',
    color: 'amber'
  },
  {
    image: techHero,
    title: 'Vibrant Campus Life & Innovation',
    description: 'Experience a dynamic learning environment designed to foster creativity, collaboration, and professional growth.',
    cta: 'Learn About Campus',
    link: '/about',
    color: 'brand'
  }
];

const Slider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden group">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[10s]"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className={`max-w-2xl transform transition-all duration-1000 delay-300 ${
              index === current ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-4 
                ${slide.color === 'brand' ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 
                  slide.color === 'amber' ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30' : 
                  'bg-blue-600/20 text-blue-400 border border-blue-500/30'}`}>
                Premium Training
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-slate-200 mb-8 leading-relaxed max-w-lg">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={slide.link}
                  className={`px-8 py-4 rounded-xl font-bold text-white flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95
                    ${slide.color === 'brand' ? 'bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-600/30' : 
                      slide.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/30' : 
                      'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'}`}
                >
                  {slide.cta} <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              current === index ? 'w-10 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Slider;
