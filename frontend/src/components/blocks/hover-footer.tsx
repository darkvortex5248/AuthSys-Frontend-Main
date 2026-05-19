"use client";
import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  MessageCircle,
  Share2,
} from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";

export function HoverFooter({ email, phone, address, paragraph }: any) {
  // Footer link data
  const footerLinks = [
    {
      title: "Products",
      links: [
        { label: "License Manager", href: "#" },
        { label: "HWID Locking", href: "#" },
        { label: "AI Agent", href: "#" },
        { label: "Analytics", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "SDK Downloads", href: "/sdks" },
        { label: "API Reference", href: "#" },
        {
          label: "Live Chat",
          href: "#",
          pulse: true,
        },
      ],
    },
  ];

  // Contact info data
  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#d97757]" />,
      text: email || "support@authsys.com",
      href: email ? `mailto:${email}` : "mailto:support@authsys.com",
    },
    {
      icon: <Phone size={18} className="text-[#d97757]" />,
      text: phone || "+1 (800) 123-4567",
      href: phone ? `tel:${phone.replace(/\D/g, '')}` : "tel:+18001234567",
    },
    {
      icon: <MapPin size={18} className="text-[#d97757]" />,
      text: address || "San Francisco, CA",
    },
  ];

  // Social media icons
  const socialLinks = [
    { icon: <MessageCircle size={20} />, label: "Discord", href: "#" },
    { icon: <Share2 size={20} />, label: "Community", href: "#" },
    { icon: <Globe size={20} />, label: "Website", href: "#" },
  ];

  return (
    <footer className="relative mt-20 border-t border-white/10 bg-[#0d0d0d] overflow-hidden">
      {/* Top highlight glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-[#d97757]/50 to-transparent shadow-[0_0_20px_rgba(217,119,87,0.5)]" />
      
      <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand section */}
          <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-[#d97757]" />
              <span className="text-white text-xl font-bold tracking-tight">AuthSys</span>
            </div>
            <p className="text-sm text-[#8e8ea0] leading-relaxed max-w-[240px]">
              {paragraph || "The modern standard for software authentication, license management, and AI-powered threat protection."}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#8e8ea0] hover:text-[#d97757] hover:border-[#d97757]/50 transition-all"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-[#ececec] text-sm font-bold uppercase tracking-widest mb-6">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label} className="flex items-center gap-2">
                    <a
                      href={link.href}
                      className="text-sm text-[#8e8ea0] hover:text-[#d97757] transition-colors"
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse shadow-[0_0_8px_#34d399]"></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-[#ececec] text-sm font-bold uppercase tracking-widest mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm text-[#8e8ea0]">
                  <span className="opacity-70 text-[#d97757]">{item.icon}</span>
                  {item.href ? (
                    <a href={item.href} className="hover:text-[#d97757] transition-colors">{item.text}</a>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#8e8ea0]">
            &copy; {new Date().getFullYear()} AuthSys. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-[#8e8ea0] hover:text-[#ececec]">Privacy Policy</a>
            <a href="#" className="text-xs text-[#8e8ea0] hover:text-[#ececec]">Terms of Service</a>
          </div>
        </div>
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
