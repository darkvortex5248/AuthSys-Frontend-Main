"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, BookOpen, Terminal, Shield, Cpu, Zap } from "lucide-react";

export default function DocsPage() {
  const sections = [
    {
      id: "introduction",
      title: "Introduction",
      icon: BookOpen,
      content: "AuthSys is a next-generation authentication and security platform designed for software developers who take protection seriously. We provide a robust infrastructure for managing license keys, hardware-bound authentication (HWID), and real-time threat monitoring through an intuitive AI-powered dashboard."
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Zap,
      content: "To begin protecting your application, first create a developer account and register your first app in the dashboard. You'll receive a unique API Key that you'll use to communicate with our secure endpoints. Integration takes less than 5 minutes using our native SDKs."
    },
    {
      id: "security",
      title: "Security & HWID",
      icon: Shield,
      content: "Our core strength lies in our multi-layered security approach. By binding license keys to specific Hardware IDs (HWID), we ensure that your software cannot be shared or pirated. Our system continuously monitors for VPN usage, proxy attempts, and suspicious login patterns in real-time."
    },
    {
      id: "integration",
      title: "SDK Integration",
      icon: Terminal,
      content: "We offer native SDKs for Python, C#, C++, and JavaScript. Each SDK is designed to be lightweight and highly resistant to reverse engineering. Simply import the library, initialize with your key, and call the authenticate method to secure your application logic."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#ececec] font-sans selection:bg-[#d97757]/30">
      {/* Simple Header */}
      <header className="border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#d97757]/10 flex items-center justify-center border border-[#d97757]/20 group-hover:border-[#d97757]/50 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#d97757]" />
            </div>
            <span className="font-bold text-lg tracking-tight">AuthSys <span className="text-[#8e8ea0] font-medium text-sm ml-1">Docs</span></span>
          </Link>
          
          <Link href="/" className="text-sm text-[#8e8ea0] hover:text-white flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-12">
          {/* Sidebar Nav */}
          <aside className="hidden lg:block sticky top-28 h-fit">
            <nav className="space-y-1">
              {sections.map((section) => (
                <a 
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-[#8e8ea0] hover:text-white hover:bg-white/5 transition-all"
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="space-y-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Documentation</h1>
              <p className="text-lg text-[#8e8ea0] leading-relaxed">
                Learn how to integrate AuthSys into your project and leverage our enterprise-grade security features to protect your intellectual property.
              </p>
            </motion.div>

            <div className="space-y-24">
              {sections.map((section, i) => (
                <motion.section 
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1 }}
                  className="scroll-mt-32"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#d97757]/10 flex items-center justify-center border border-[#d97757]/20">
                      <section.icon className="w-5 h-5 text-[#d97757]" />
                    </div>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                  </div>
                  <div className="bg-[#1a1a1a]/40 border border-white/5 rounded-2xl p-8 md:p-10">
                    <p className="text-[#8e8ea0] text-lg leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Help CTA */}
            <section className="bg-gradient-to-br from-[#d97757]/10 to-transparent border border-[#d97757]/20 rounded-3xl p-8 md:p-12 text-center">
              <h3 className="text-xl font-bold mb-3">Need more help?</h3>
              <p className="text-[#8e8ea0] mb-6">Our support team is available 24/7 for technical assistance.</p>
              <Link 
                href="/contact"
                className="inline-flex items-center justify-center bg-[#d97757] hover:bg-[#c96a47] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[#d97757]/20"
              >
                Contact Support
              </Link>
            </section>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/5 py-12 mt-20 text-center">
        <p className="text-[#5a5a72] text-sm">© 2026 AuthSys Security Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
