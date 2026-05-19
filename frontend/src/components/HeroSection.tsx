'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Play, 
  Check, 
  Lock, 
  LayoutDashboard, 
  AppWindow, 
  Key, 
  Users, 
  Activity, 
  AlertTriangle, 
  LineChart, 
  Shield, 
  Braces, 
  Bot, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import MagneticButton from '@/components/ui/MagneticButton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

// --- Count Up Hook ---
const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count.toLocaleString();
};

// --- Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-[#0d0d0d]/80 backdrop-blur-md border-white/10 shadow-[0_4px_20px_-10px_rgba(217,119,87,0.2)]' 
          : 'bg-[#0d0d0d] border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="w-[18px] h-[18px] text-[#d97757]" />
          <span className="text-[14px] font-semibold text-[#ececec]">AuthSys</span>
        </Link>

        {/* Center: Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Docs', 'Status'].map((link) => (
            <Link 
              key={link} 
              href={`#${link.toLowerCase()}`} 
              className="text-[12px] text-[#8e8ea0] transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#d97757] after:transition-all after:duration-300 hover:after:w-full hover:text-white"
            >
              {link}
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-[12px] text-[#8e8ea0] hover:text-white font-medium transition-colors">
            Sign In
          </Link>
          <Link href="/register">
            <MagneticButton className="bg-[#d97757] hover:bg-[#c96a47] text-white rounded-[6px] px-[14px] py-[6px] text-[12px] font-medium transition-all active:scale-95 shadow-[0_4px_15px_rgba(217,119,87,0.3)]">
              Start Free
            </MagneticButton>
          </Link>
          <button 
            className="md:hidden text-[#8e8ea0]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0d0d0d] border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {['Features', 'Pricing', 'Docs', 'Status'].map((link) => (
                <Link 
                  key={link} 
                  href={`#${link.toLowerCase()}`} 
                  className="text-[14px] text-[#8e8ea0]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link}
                </Link>
              ))}
              <Link href="/login" className="text-[14px] text-[#8e8ea0]">Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const StatCard = ({ icon: Icon, iconBg, iconColor, trend, number, label, endValue }: any) => {
  const displayValue = useCountUp(endValue);
  
  return (
    <div className="bg-[#1a1a1a] border-[0.5px] border-white/10 rounded-[5px] p-[6px_7px] flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div 
          className="w-[16px] h-[16px] rounded-[3px] flex items-center justify-center" 
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={9} color={iconColor} />
        </div>
        <span className="text-[7px] font-bold" style={{ color: iconColor }}>{trend}</span>
      </div>
      <span className="text-[14px] font-bold leading-none transition-all duration-200 hover:text-[#d97757]" style={{ color: number.includes('#') ? number : '#ececec' }}>
        {displayValue}
      </span>
      <span className="text-[7px] text-[#5a5a72] mt-[2px]">{label}</span>
    </div>
  );
};

const DashboardFrame = () => {
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBarsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const barData = [38, 52, 45, 70, 61, 85, 72];
  const maxBar = Math.max(...barData);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
      className="max-w-[580px] mx-auto mt-12 relative z-10"
    >
      {/* Browser Chrome */}
      <div className="bg-[#1a1a1a] border-t border-x border-white/10 rounded-t-[10px] overflow-hidden">
        <div className="h-8 border-b-[0.5px] border-white/10 flex items-center px-3 justify-between">
          <div className="flex gap-[6px]">
            <div className="w-[7px] h-[7px] rounded-full bg-[#FF5F57]" />
            <div className="w-[7px] h-[7px] rounded-full bg-[#FFBD2E]" />
            <div className="w-[7px] h-[7px] rounded-full bg-[#28C840]" />
          </div>
          <div className="bg-[#212121] rounded-[4px] px-3 py-[3px] flex items-center gap-1.5">
            <Lock size={9} className="text-[#8e8ea0]" />
            <span className="text-[9px] text-[#8e8ea0] font-medium font-sans">dash.authsys.com / overview</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Dashboard Layout */}
        <div className="flex h-[220px]">
          {/* Sidebar */}
          <div className="w-[88px] bg-[#0d0d0d] border-r-[0.5px] border-white/10 flex flex-col">
            <div className="p-3 border-b-[0.5px] border-white/10 flex items-center gap-1.5 mb-2">
              <ShieldCheck size={10} className="text-[#d97757]" />
              <span className="text-[10px] font-bold text-[#d97757]">AuthSys</span>
            </div>
            
            <div className="px-2 mb-1">
              <span className="text-[8px] text-[#5a5a72] uppercase tracking-[.08em] font-bold">Main</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#d97757]/10 text-white border-r-2 border-[#d97757]">
                <LayoutDashboard size={11} className="text-[#d97757]" />
                <span className="text-[9px] font-medium">Overview</span>
              </div>
              {[
                { icon: AppWindow, label: "Applications" },
                { icon: Key, label: "License Keys" },
                { icon: Users, label: "Users", badge: "12" },
                { icon: LineChart, label: "Analytics" },
                { icon: Shield, label: "Blacklist" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between px-2.5 py-1.5 text-[#8e8ea0] hover:text-white transition-colors cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <item.icon size={11} />
                    <span className="text-[9px] font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-[#d97757]/20 text-[#d97757] text-[8px] px-1 rounded-[2px]">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="px-2 mt-3 mb-1">
              <span className="text-[8px] text-[#5a5a72] uppercase tracking-[.08em] font-bold">Insights</span>
            </div>
            
            <div className="flex flex-col gap-0.5">
              {[
                { icon: LineChart, label: "Analytics" },
                { icon: Shield, label: "Blacklist" },
                { icon: Braces, label: "Variables" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[#8e8ea0] hover:text-white transition-colors cursor-pointer">
                  <item.icon size={11} />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto p-2">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#212121] border-[0.5px] border-white/10 rounded-[6px] p-1.5 text-center cursor-pointer hover:border-[#d97757] transition-all">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Bot size={8} className="text-[#d97757]" />
                  <span className="text-[8px] text-[#d97757] font-bold">AI Agent</span>
                </div>
                <span className="text-[7px] text-[#8e8ea0]">Ask anything →</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[#0d0d0d] p-[10px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-[#ececec]">Overview</span>
              <div className="bg-[#1a1a1a] border-[0.5px] border-white/10 rounded-[4px] px-2 py-[3px] flex items-center gap-1.5 cursor-pointer">
                <div className="w-[5px] h-[5px] rounded-full bg-[#d97757]" />
                <span className="text-[8px] text-[#8e8ea0]">MyCheatApp v2.1</span>
                <ChevronDown size={8} className="text-[#8e8ea0]" />
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[5px] mb-2">
              <StatCard 
                icon={Users} 
                iconBg="rgba(217,119,87,0.1)" 
                iconColor="#d97757" 
                trend="↑12%" 
                number="#ececec" 
                label="Total users" 
                endValue={1284}
              />
              <StatCard 
                icon={Activity} 
                iconBg="rgba(217,119,87,0.15)" 
                iconColor="#d97757" 
                trend="↑8%" 
                number="#d97757" 
                label="Active now" 
                endValue={847}
              />
              <StatCard 
                icon={Key} 
                iconBg="rgba(217,119,87,0.1)" 
                iconColor="#d97757" 
                trend="200/mo" 
                number="#d97757" 
                label="Keys issued" 
                endValue={3921}
              />
              <StatCard 
                icon={AlertTriangle} 
                iconBg="rgba(217,119,87,0.15)" 
                iconColor="#d97757" 
                trend="↓3" 
                number="#d97757" 
                label="Alerts" 
                endValue={12}
              />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[6px] flex-1">
              <div className="bg-[#1a1a1a] border-[0.5px] border-white/10 rounded-[5px] p-[7px] flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] text-[#8e8ea0] font-medium">Logins last 7 days</span>
                  <span className="text-[7px] text-[#5a5a72]">+18% vs last week</span>
                </div>
                <div className="flex items-end gap-[3px] h-[40px] mt-auto pb-1">
                  {barData.map((val, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-t-[2px] transition-all duration-700 ${
                        i === 5 ? 'bg-[#d97757]' : 'bg-[#212121] border-[0.5px] border-white/10'
                      }`}
                      style={{ 
                        height: barsVisible ? `${(val / maxBar) * 100}%` : '0%',
                        transitionDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a1a] border-[0.5px] border-white/10 rounded-[5px] p-[7px] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] text-[#8e8ea0] font-medium">Live activity log</span>
                  <span className="text-[7px] text-[#5a5a72]">real-time</span>
                </div>
                <div className="flex flex-col gap-0">
                  {[
                    { dot: "#d97757", event: "user_login", meta: "john123 · BD", badge: "success", badgeBg: "rgba(217,119,87,0.15)", badgeColor: "#d97757" },
                    { dot: "#d97757", event: "hwid_mismatch", meta: "dev99 · RU", badge: "risk 50", badgeBg: "rgba(217,119,87,0.15)", badgeColor: "#d97757" },
                    { dot: "#d97757", event: "vpn_detected", meta: "user77 · US", badge: "warn", badgeBg: "rgba(217,119,87,0.15)", badgeColor: "#d97757" },
                    { dot: "#d97757", event: "brute_force", meta: "192.168.x · CN", badge: "auto-ban", badgeBg: "rgba(217,119,87,0.15)", badgeColor: "#d97757" },
                  ].map((row, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + (i * 0.1), duration: 0.3 }}
                      key={i} 
                      className="flex items-center justify-between py-[3px] border-b-[0.5px] border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: row.dot }} />
                        <div className="flex flex-col leading-tight overflow-hidden">
                          <span className="text-[8px] text-[#ececec] truncate">{row.event}</span>
                          <span className="text-[7px] text-[#5a5a72] truncate">{row.meta}</span>
                        </div>
                      </div>
                      <div 
                        className="text-[8px] px-1.5 py-0.5 rounded-[2px] font-bold shrink-0"
                        style={{ backgroundColor: row.badgeBg, color: row.badgeColor }}
                      >
                        {row.badge}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade Overlay */}
      <div className="h-[50px] bg-gradient-to-t from-[#0d0d0d] to-transparent relative z-[2] -mt-[50px] pointer-events-none" />
    </motion.div>
  );
};

export default function HeroSection({ demoUrl, heroParagraph }: { demoUrl?: string, heroParagraph?: string }) {
  const scrollRef = useScrollAnimation();

  return (
    <div ref={scrollRef}>
      <Navbar />
      
      <section className="pt-[100px] pb-24 px-4 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#d97757]/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
        
        {/* Hero Text Block */}
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Announcement Badge */}
          <div 
            data-animate
            className="bg-[#1a1a1a] border-[0.5px] border-white/10 rounded-[20px] px-3 py-1 flex items-center gap-2 mb-8 cursor-pointer hover:border-[#d97757] transition-colors"
          >
            <div className="w-[6px] h-[6px] rounded-full bg-[#d97757] animate-pulse shadow-[0_0_8px_#d97757]" />
            <span className="text-[11px] text-[#8e8ea0] font-medium">AI Agent — control your app in plain English</span>
          </div>

          {/* H1 Headline */}
          <h1 
            data-animate data-delay="1"
            className="text-[34px] md:text-[56px] font-extrabold leading-[1.1] tracking-[-0.5px] mb-6 max-w-4xl"
          >
            The Auth Platform <br />
            Built for <span className="bg-gradient-to-r from-[#d97757] to-[#c96a47] bg-clip-text text-transparent transition-colors duration-200 hover:text-[#c96a47]">Serious Developers</span>
          </h1>

          {/* Subtitle */}
          <p 
            data-animate data-delay="2"
            className="text-[13px] md:text-[16px] text-[#8e8ea0] max-w-[400px] md:max-w-xl mx-auto leading-[1.7] mb-10"
          >
            {heroParagraph || "License keys, HWID lock, real-time threat detection & AI-powered control — all in one dashboard. Ship protected software in minutes."}
          </p>

          {/* CTA Buttons */}
          <div 
            data-animate data-delay="3"
            className="flex flex-col sm:flex-row items-center gap-[10px] mb-12"
          >
            <Link href="/register">
              <MagneticButton className="flex items-center gap-2 bg-[#d97757] hover:bg-[#c96a47] text-white rounded-[8px] px-6 py-[11px] text-[13px] font-bold transition-all active:scale-95 shadow-[0_4px_20px_rgba(217,119,87,0.3)]">
                <Zap size={13} fill="currentColor" />
                Start for free
              </MagneticButton>
            </Link>
            <a href={demoUrl || '#'} target={demoUrl ? "_blank" : "_self"}>
              <MagneticButton className="flex items-center gap-2 bg-transparent text-[#8e8ea0] border-[0.5px] border-white/10 hover:border-white/20 hover:text-white rounded-[8px] px-[18px] py-[11px] text-[13px] font-medium transition-all">
                <Play size={12} fill="currentColor" />
                Watch demo
              </MagneticButton>
            </a>
          </div>

          {/* Trust Badges */}
          <div 
            data-animate data-delay="4"
            className="grid grid-cols-2 md:flex items-center justify-center gap-x-6 gap-y-3 mb-4"
          >
            {[
              "No credit card",
              "Setup in 5 min",
              "99.9% uptime",
              "Free forever plan"
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check size={12} className="text-[#d97757]" strokeWidth={3} />
                <span className="text-[11px] text-[#8e8ea0] font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Visual */}
        <div data-animate data-delay="5">
          <DashboardFrame />
        </div>
      </section>

      {/* Decorative Blur */}
      <div className="fixed bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none -z-10" />
    </div>
  );
}
