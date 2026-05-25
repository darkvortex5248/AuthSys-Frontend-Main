"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  User, 
  FileText,
  LifeBuoy,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const SERVICE_ID = "service_0fipnst";
const TEMPLATE_ID = "template_k6aq2hs";
const PUBLIC_KEY = "paASe-BeBARA5RmC-";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setLoading(true);
    try {
      await emailjs.sendForm(
        SERVICE_ID,
        TEMPLATE_ID,
        formRef.current,
        PUBLIC_KEY
      );
      setSent(true);
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#ececec] font-sans p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#8e8ea0] hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-[#131313] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
          <div className="bg-gradient-to-r from-[#d97757]/20 to-transparent p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#d97757]/10 flex items-center justify-center border border-[#d97757]/20">
                <LifeBuoy className="w-6 h-6 text-[#d97757]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Contact & Support</h1>
                <p className="text-sm text-[#8e8ea0]">Have questions? Reach out to our team.</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            {sent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-20 text-center"
              >
                <div className="w-24 h-24 rounded-full bg-[#d97757]/10 flex items-center justify-center border border-[#d97757]/20 mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-[#d97757]" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Message Sent!</h3>
                <p className="text-[#8e8ea0] text-lg">Thank you for reaching out. We will get back to you at your email address shortly.</p>
                <Link href="/" className="inline-block mt-8 text-[#d97757] font-bold hover:underline">
                  Return Home
                </Link>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#5a5a72] flex items-center gap-2">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input 
                      required
                      name="from_name"
                      type="text" 
                      placeholder="John Doe"
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d97757]/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#5a5a72] flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input 
                      required
                      name="reply_to"
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d97757]/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5a5a72] flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Message
                  </label>
                  <textarea 
                    required
                    name="message"
                    rows={6}
                    placeholder="How can we help you today?"
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d97757]/50 transition-colors resize-none"
                  />
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full h-14 bg-[#d97757] hover:bg-[#c96a47] disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(217,119,87,0.2)] active:scale-95 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
