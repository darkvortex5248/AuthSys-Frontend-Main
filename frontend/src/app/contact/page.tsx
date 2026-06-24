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
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-sans p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-3xl mx-auto"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="bg-[var(--color-bg-elevated)] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="bg-gradient-to-r from-[var(--color-accent)]/15 to-transparent p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-dim)] flex items-center justify-center border border-[var(--color-accent)]/20">
                <LifeBuoy className="w-6 h-6 text-[var(--color-accent)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Contact & Support</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">Have questions? Reach out to our team.</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            {sent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="py-20 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-24 h-24 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center border border-[var(--color-accent)]/20 mx-auto mb-8"
                >
                  <CheckCircle2 className="w-12 h-12 text-[var(--color-accent)]" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4">Message Sent!</h3>
                <p className="text-[var(--color-text-secondary)] text-lg">Thank you for reaching out. We will get back to you shortly.</p>
                <Link href="/" className="inline-block mt-8 text-[var(--color-accent)] font-bold hover:underline">
                  Return Home
                </Link>
              </motion.div>
            ) : (
              <motion.form
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
                }}
                ref={formRef} onSubmit={handleSubmit} className="space-y-6"
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                      <User className="w-3 h-3" /> Full Name
                    </label>
                    <input 
                      required
                      name="from_name"
                      type="text" 
                      placeholder="John Doe"
                      className="w-full bg-[var(--color-bg-surface)] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]/50 transition-all placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input 
                      required
                      name="reply_to"
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full bg-[var(--color-bg-surface)] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]/50 transition-all placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Message
                  </label>
                  <textarea 
                    required
                    name="message"
                    rows={6}
                    placeholder="How can we help you today?"
                    className="w-full bg-[var(--color-bg-surface)] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]/50 transition-all resize-none placeholder:text-[var(--color-text-muted)]"
                  />
                </motion.div>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                >
                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full h-12 bg-[var(--color-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:pointer-events-none text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_color-mix(in_srgb,var(--primary)_20%,transparent)] active:scale-[0.97] text-sm"
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
                </motion.div>
              </motion.form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
