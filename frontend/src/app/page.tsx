"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Shield, Play, Terminal, Key, Cpu, Bot, BarChart3, 
  AlertTriangle, Webhook, Check, X, ChevronDown, Menu, X as XIcon, FileCode2, Zap, Star, Sparkles
} from "lucide-react";
import { HoverFooter } from "@/components/blocks/hover-footer";
import HeroSection from "@/components/HeroSection";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import api from "@/lib/api";

// --- Components inline for single-file portability ---

const Button = ({ children, variant = "default", className = "", ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  const variants: any = {
    default: "bg-[#d97757] text-white hover:bg-[#c96a47] shadow-lg shadow-[#d97757]/20",
    ghost: "hover:bg-zinc-800 hover:text-zinc-50 text-zinc-300",
    outline: "border border-zinc-700 hover:bg-zinc-800 text-zinc-100",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} h-12 py-2 px-6 ${className}`} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, className = "" }: any) => (
  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none border-transparent bg-[#d97757] text-white ${className}`}>
    {children}
  </div>
);

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const defaultPlans = [
  { name: "Starter", price_monthly: 0, price_yearly: 0, max_apps: 1, max_users_per_app: 50, max_keys_per_month: 100, features_json: ["Basic Analytics", "Community Support", "All Auth Methods", "Token System"] },
  { name: "Developer", price_monthly: 1900, price_yearly: 19000, max_apps: 5, max_users_per_app: 500, max_keys_per_month: 5000, features_json: ["Advanced Analytics", "Discord Bot", "Telegram Bot", "Chatrooms", "Team Management", "Customer Panel"] },
  { name: "Enterprise", price_monthly: 4900, price_yearly: 45000, max_apps: 20, max_users_per_app: 5000, max_keys_per_month: 50000, features_json: ["White Label", "Custom Branding", "Priority Support", "AI Agent Access", "Seller API"] },
];

const defaultSettings = [
  { key: 'watch_demo_url', value: '#' },
  { key: 'landing_paragraph', value: 'License keys, HWID lock, real-time threat detection & AI-powered control — all in one dashboard. Ship protected software in minutes.' },
  { key: 'contact_email', value: 'support@authsys.com' },
  { key: 'contact_phone', value: '+1 (800) 555-0199' },
  { key: 'contact_address', value: 'San Francisco, CA' }
];

export default function HomePage() {
  const scrollRef = useScrollAnimation();
  const [plans, setPlans] = useState<any[]>(defaultPlans);
  const [settings, setSettings] = useState<any[]>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Add a visually hidden H1 for SEO purposes, complementing the HeroSection's visual content.
  // The sr-only class (screen reader only) ensures it doesn't affect the UI.
  const seoH1 = "AuthSys: Secure Authentication System & Cyber Security Login Platform for Developers";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, settingsRes] = await Promise.all([
          api.get('/billing/plans'),
          api.get('/admin/settings/public')
        ]);
        
        if (plansRes.data && plansRes.data.length > 0) {
          const sortedPlans = [...plansRes.data].sort((a, b) => a.price_monthly - b.price_monthly);
          setPlans(sortedPlans);
        }
        
        if (settingsRes.data && settingsRes.data.length > 0) {
          setSettings(prev => {
            const merged = [...prev];
            settingsRes.data.forEach((s: any) => {
              const idx = merged.findIndex(item => item.key === s.key);
              if (idx > -1) merged[idx] = s;
              else merged.push(s);
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to fetch landing data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getVal = (key: string) => settings.find(s => s.key === key)?.value || '';

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#0d0d0d] text-[#ececec] font-sans selection:bg-[#d97757]/30">
      <h1 className="sr-only">{seoH1}</h1> {/* Visually hidden H1 for SEO */}

      <HeroSection 
        demoUrl={getVal('watch_demo_url')} 
        heroParagraph={getVal('landing_paragraph')}
      />
      <main>
        {/* SOCIAL PROOF BAR */}
        <section className="border-y border-white/10 bg-[#1a1a1a]/40 py-6 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            <span className="text-sm font-medium text-[#8e8ea0] whitespace-nowrap mr-8">Trusted by developers at:</span>
            <div className="flex-1 relative overflow-hidden flex items-center">
              <motion.div 
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex gap-16 whitespace-nowrap"
              >
                {["DevForge", "NexaTools", "ByteCraft", "ShadowBuild", "CodeSecure", "DevForge", "NexaTools", "ByteCraft", "ShadowBuild", "CodeSecure"].map((name, i) => (
                  <span key={i} className="text-lg font-bold text-[#212121] tracking-wider uppercase flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#5a5a72]" /> {name}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section data-animate className="py-12 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Developers", value: "2,000+" },
              { label: "Auth Requests", value: "50M+" },
              { label: "Uptime", value: "99.9%" },
              { label: "Response Time", value: "<50ms" },
            ].map((stat, i) => (
              <div 
                key={i}
                data-animate data-delay={i + 1}
                className="p-6 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-[#d97757]/50 transition-colors text-center group"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-[#d97757] transition-colors">{stat.value}</div>
                <div className="text-sm text-[#8e8ea0] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" data-animate className="py-12 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to protect your software</h2>
            <p className="text-[#8e8ea0]">Enterprise-grade security features out of the box.</p>
          </div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Key, title: "License Key System", desc: "Time, lifetime, uses-based keys. Bulk generate up to 1000 keys at once." },
              { icon: Cpu, title: "HWID Lock", desc: "Hardware fingerprint binding. Prevent key sharing and unauthorized access." },
              { icon: Bot, title: "AI Agent", desc: 'Natural language control. "Ban all users from Russia." Done.' },
              { icon: BarChart3, title: "Real-time Analytics", desc: "Login maps, suspicious activity detection, and risk scoring metrics." },
              { icon: AlertTriangle, title: "Threat Detection", desc: "Auto-ban, impossible travel detection, and VPN/Proxy flagging." },
              { icon: Webhook, title: "Webhook System", desc: "Instant notifications on any event directly to your Discord or endpoint." }
            ].map((feat, i) => (
              <div 
                key={i} data-animate data-delay={i % 3 + 1}
                className="group p-6 rounded-2xl bg-[#1a1a1a] border border-white/10 hover:border-[#d97757] transition-all hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(217,119,87,0.08)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0d0d0d] border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#d97757]/50 transition-colors">
                  <feat.icon className="w-6 h-6 text-[#d97757]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-[#8e8ea0] leading-relaxed text-sm">{feat.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* AI AGENT SHOWCASE */}
        <section data-animate className="py-12 px-4 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-t border-white/10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <Badge className="mb-6 bg-[#d97757]/10 text-[#d97757] hover:bg-[#d97757]/20 border-none">World's First</Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Meet your AI <br/> security agent</h2>
              <p className="text-[#8e8ea0] text-lg mb-8 leading-relaxed">
                Manage your entire user base with plain English. Our AI agent understands context, analyzes threats, and executes commands instantly.
              </p>
              <ul className="space-y-4">
                {["Ban users by complex criteria", "Generate insights from login data", "Auto-resolve support tickets", "Configure security rules"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-[#d97757]/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#d97757]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Chat Mockup */}
            <div className="flex-1 w-full max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl">
                <div className="px-4 py-3 border-b border-white/10 bg-[#1a1a1a] flex items-center gap-3">
                  <Bot className="w-5 h-5 text-[#d97757]" />
                  <span className="font-semibold text-sm">AuthSys Agent</span>
                  <div className="w-2 h-2 rounded-full bg-[#d97757] ml-auto animate-pulse" />
                </div>
                <div className="p-6 space-y-6 h-[320px] overflow-y-auto">
                  <div className="flex justify-end">
                    <div className="bg-[#212121] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                      Ban all users with risk score above 80
                    </div>
                  </div>
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-start">
                    <div className="bg-[#d97757]/10 border border-[#d97757]/20 text-[#ececec] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[80%]">
                      Found 12 users matching criteria. Banning now...<br/><br/>
                      <span className="text-[#d97757] flex items-center gap-1 mt-1"><Check className="w-3 h-3"/> 12 users banned successfully.</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SDK CODE TABS */}
        <SDKSection />

        {/* PRICING SECTION - RESTORED POSITION */}
        <PricingSection plans={plans} />

        {/* FAQ SECTION */}
        <FAQSection />

        {/* CTA BANNER */}
        <section data-animate className="py-12 px-4">
          <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d97757]/20 to-amber-500/20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-[#1a1a1a] -z-10" />
            <div className="p-12 md:p-20 text-center relative z-10 border border-white/10 rounded-3xl">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Start protecting your software today</h2>
              <p className="text-[#8e8ea0] text-lg mb-8 max-w-2xl mx-auto">Join 2,000+ developers. Free forever, upgrade when ready.</p>
              <div className="flex flex-col items-center gap-3">
                <Link href="/register">
                  <Button className="h-14 px-10 text-lg shadow-[0_0_30px_rgba(217,119,87,0.3)] hover:scale-105 transition-transform">
                    Get Started Free →
                  </Button>
                </Link>
                <span className="text-xs text-[#8e8ea0]">No credit card required</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <HoverFooter 
        email={getVal('contact_email')}
        phone={getVal('contact_phone')}
        address={getVal('contact_address')}
        paragraph={getVal('landing_paragraph')}
      />
    </div>
  );
}

// --- Sub-components ---

function SDKSection() {
  const [activeTab, setActiveTab] = useState("Python");
  const tabs = ["Python", "C#", "JavaScript", "C++"];
  
  const codeSnippets: any = {
    "Python": `import authsys\n\n# Initialize client\nclient = authsys.Client(api_key="sk_live_550e8400")\n\ntry:\n    # HWID Protected Authentication\n    user = client.authenticate(\n        username="dev_rinox",\n        password="secure_password",\n        hwid=authsys.get_hwid()\n    )\n    print(f"Session established: {user.session_id}")\nexcept authsys.AuthError as e:\n    print(f"Authentication failed: {e.message}")`,
    "C#": `using AuthSys;\n\n// Create secure client instance\nvar auth = new AuthSysClient("sk_live_550e8400");\n\ntry {\n    // Perform multi-factor HWID validation\n    var session = await auth.AuthenticateAsync(\n        username: "dev_rinox",\n        password: "secure_password",\n        hwid: HardwareID.Get()\n    );\n    \n    Console.WriteLine($"Access granted: {session.Token}");\n} catch (AuthException ex) {\n    Console.WriteLine($"Security Error: {ex.Message}");\n}`,
    "JavaScript": `import { AuthSys } from '@authsys/sdk';\n\nconst auth = new AuthSys('sk_live_550e8400');\n\n// Asynchronous authentication flow\nconst { user, error } = await auth.login({\n  username: 'dev_rinox',\n  password: 'secure_password',\n  hwid: await auth.getMachineId()\n});`,
    "C++": `#include <authsys/security.hpp>\n\nauthsys::Client sdk("sk_live_550e8400");\n\n// Hardware-bound authentication\nauto response = sdk.authenticate({\n    .username = "dev_rinox",\n    .password = "secure_password",\n    .hwid = authsys::generate_hwid()\n});`
  };

  return (
    <section className="py-12 px-4 bg-[#1a1a1a]/40 border-y border-white/10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Works with your language</h2>
          <p className="text-[#8e8ea0]">Native SDKs for seamless integration.</p>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden">
          <div className="flex border-b border-white/10 bg-[#1a1a1a] overflow-x-auto">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-[#d97757] text-white bg-[#d97757]/5' : 'border-transparent text-[#8e8ea0] hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6">
            <pre className="font-mono text-sm text-zinc-300 overflow-x-auto">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection({ plans }: { plans: any[] }) {
  const [yearly, setYearly] = useState(false);

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <section id="pricing" className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Flexible options for teams of all sizes</h2>
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-bold ${!yearly ? 'text-white' : 'text-[#8e8ea0]'}`}>Monthly</span>
          <button 
            onClick={() => setYearly(!yearly)}
            className="w-14 h-7 rounded-full bg-[#212121] relative transition-all border border-white/5"
          >
            <motion.div 
              animate={{ x: yearly ? 30 : 4 }} 
              className="w-5 h-5 rounded-full bg-[#d97757] absolute top-0.5 shadow-[0_0_10px_rgba(217,119,87,0.5)]"
            />
          </button>
          <span className={`text-sm font-bold flex items-center gap-2 ${yearly ? 'text-white' : 'text-[#8e8ea0]'}`}>
            Yearly <span className="text-[10px] bg-[#d97757]/20 text-[#d97757] px-2 py-0.5 rounded-full font-black">save 60%</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayPlans.map((p, i) => {
          const price = yearly ? p.price_yearly : p.price_monthly;
          const isDeveloper = p.name.toLowerCase().includes('developer') || p.name.toLowerCase().includes('pro');
          const isEnterprise = p.name.toLowerCase().includes('enterprise') || p.name.toLowerCase().includes('seller');
          const isTester = p.name.toLowerCase().includes('tester') || p.name.toLowerCase().includes('free') || p.name.toLowerCase().includes('starter') || price === 0;

          const formattedPrice = price % 100 === 0 ? (price / 100).toString() : (price / 100).toFixed(2);

          return (
            <div key={i} className={`rounded-[2.5rem] p-10 border transition-all duration-500 hover:scale-[1.02] flex flex-col ${isDeveloper ? 'bg-[#1a1a1a] border-[#d97757]/50 shadow-[0_0_50px_rgba(217,119,87,0.06)] relative' : 'bg-[#1a1a1a]/40 border-white/10'}`}>
              <h3 className="text-xl font-bold mb-4">{p.name}</h3>
              <div className="mb-10">
                {price === 0 ? (
                  <span className="text-5xl font-black text-white">Free</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">${formattedPrice}</span>
                    <span className="text-[#8e8ea0] font-bold text-sm">/{yearly ? 'year' : 'month'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-12 flex-1">
                 {/* Manual Feature List Only */}
                 {(p.features_json || []).length > 0 ? (p.features_json || []).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-[#d97757]/10 flex items-center justify-center shrink-0">
                         <Check className="w-3 h-3 text-[#d97757]" strokeWidth={4} />
                       </div>
                       <span className="text-sm font-bold text-zinc-300">{feature}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-zinc-500 italic text-center">No features configured yet.</p>
                  )}
              </div>

              <Link href="/register" className="mt-auto">
                <Button className={`w-full py-6 text-sm uppercase tracking-widest ${isTester ? 'bg-[#d97757]/10 text-[#d97757] border border-[#d97757]/20 hover:bg-[#d97757] hover:text-white' : 'bg-[#d97757] text-white shadow-xl shadow-[#d97757]/20'}`}>
                  {isTester ? 'Get Started' : `Choose ${p.name}`}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    { q: "How does HWID locking work?", a: "We generate a unique fingerprint based on CPU, Motherboard, and MAC address. The license key is then permanently bound to this signature." },
    { q: "Can I use this for private software?", a: "Yes. AuthSys is designed to be highly resistant to reverse engineering and memory tampering." },
    { q: "What payment methods do you accept?", a: "We accept bKash, Nagad, Rocket, and all major credit cards via manual and automated processing." },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="py-12 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2></div>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-white/10 rounded-xl bg-[#0d0d0d] overflow-hidden">
            <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between font-medium text-left hover:bg-[#1a1a1a]">
              {faq.q}
              <ChevronDown className={`w-5 h-5 text-[#8e8ea0] transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>{openIdx === i && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-6 pb-4 text-[#8e8ea0] text-sm">{faq.a}</motion.div>}</AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

