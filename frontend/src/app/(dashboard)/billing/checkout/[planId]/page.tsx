'use client';
import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, CreditCard, Wallet, ArrowLeft, CheckCircle2, Globe, Phone, CreditCard as CardIcon, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [walletNumber, setWalletNumber] = useState('');
  const [trxId, setTrxId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, methodsRes] = await Promise.all([
          api.get('/billing/plans'),
          api.get('/billing/payment-methods')
        ]);
        const found = plansRes.data.find((p: any) => p.id === parseInt(planId));
        setPlan(found);
        setMethods(methodsRes.data);
        if (methodsRes.data.length > 0) {
          setSelectedMethod(methodsRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [planId]);

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;
    
    if (selectedMethod.type === 'local' && (!walletNumber || !trxId)) {
      alert("Please enter wallet number and Transaction ID");
      return;
    }

    setProcessing(true);
    try {
      await api.post('/billing/order', { 
        plan_id: parseInt(planId),
        payment_method: selectedMethod.name,
        wallet: walletNumber,
        transaction_id: trxId
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/billing');
      }, 3000);
    } catch (err) {
      alert("Failed to process request");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!plan) return <div>Plan not found</div>;

  const bdtAmount = selectedMethod ? Math.round((plan.price_monthly / 100) * selectedMethod.exchange_rate) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 pb-20 selection:bg-purple-500/30">
      <div className="max-w-5xl mx-auto">
        <Link href="/billing" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Plans
        </Link>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card bg-green-500/10 border border-green-500/20 rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Request Sent!</h1>
            <p className="text-zinc-400 max-w-md mx-auto">
              Your request for <span className="text-white font-bold">{plan.name}</span> has been logged. 
              Our team will verify the payment and activate your tier shortly.
            </p>
            <div className="mt-8 text-xs text-zinc-500 animate-pulse">Redirecting to history...</div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl"></div>
                <h3 className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-6">Payment Summary</h3>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-zinc-500">Billed {plan.price_monthly > 0 ? 'Monthly' : 'Once'}</p>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5 text-sm">
                   <div className="flex justify-between text-zinc-400">
                     <span>USD Amount</span>
                     <span>${(plan.price_monthly / 100).toFixed(2)}</span>
                   </div>
                   {selectedMethod?.type === 'local' && (
                     <>
                        <div className="flex justify-between text-zinc-400">
                          <span>Exchange Rate</span>
                          <span>{selectedMethod.exchange_rate} BDT/$</span>
                        </div>
                        <div className="flex justify-between pt-4 text-xl font-black border-t border-white/5">
                          <span className="text-white">Total BDT</span>
                          <span className="text-purple-400">{bdtAmount} ৳</span>
                        </div>
                     </>
                   )}
                   {selectedMethod?.type !== 'local' && (
                     <div className="flex justify-between pt-4 text-xl font-black border-t border-white/5">
                        <span className="text-white">Total</span>
                        <span className="text-purple-400">${(plan.price_monthly / 100).toFixed(2)}</span>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex gap-4">
                <Shield className="w-6 h-6 text-purple-500 shrink-0" />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Your payment is verified manually by our secure administrative core. Access is granted after validation.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card bg-white/5 border border-white/10 rounded-3xl p-8">
                <h2 className="text-2xl font-bold mb-2">Secure Checkout</h2>
                <p className="text-zinc-500 text-sm mb-8">Select your preferred payment gateway</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                   {methods.map(m => (
                     <button 
                      key={m.id}
                      onClick={() => setSelectedMethod(m)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 relative ${selectedMethod?.id === m.id ? 'border-purple-500 bg-purple-500/5 shadow-lg' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                     >
                       <span className="material-symbols-outlined text-xl text-purple-400">{m.icon_name}</span>
                       <div>
                         <p className="font-bold text-xs">{m.name}</p>
                         <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{m.type}</p>
                       </div>
                     </button>
                   ))}
                </div>

                <AnimatePresence mode="wait">
                  {selectedMethod?.type === 'international' ? (
                    <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                       <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                          <div className="flex items-center gap-3 mb-2 text-zinc-400">
                             <CreditCard size={18} />
                             <span className="text-xs font-bold uppercase tracking-widest">Card Details</span>
                          </div>
                          <div className="space-y-3 text-zinc-500 text-xs italic">
                            {selectedMethod.instructions || "Enter your card details for international payment."}
                             <div className="space-y-3 mt-4">
                                <input type="text" placeholder="Card Number" className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500" />
                                <div className="grid grid-cols-2 gap-3">
                                  <input type="text" placeholder="MM / YY" className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500" />
                                  <input type="text" placeholder="CVC" className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-purple-500" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div key="local" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                       <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-black text-white">
                                   {selectedMethod?.name[0]}
                                </div>
                                <span className="text-sm font-bold">Pay via {selectedMethod?.name}</span>
                             </div>
                             <div className="text-right">
                               <p className="text-[10px] text-zinc-500">Payable Amount</p>
                               <p className="text-lg font-black text-white">{bdtAmount} ৳</p>
                             </div>
                          </div>
                          
                          <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/5">
                             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Payment Instructions</p>
                             <p className="text-sm font-medium text-purple-300">{selectedMethod?.instructions}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest px-1">Your Wallet Number</p>
                               <input value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} type="text" placeholder="01XXXXXXXXX" className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-purple-500" />
                             </div>
                             <div className="space-y-2">
                               <p className="text-[10px] text-zinc-500 uppercase tracking-widest px-1">Transaction ID (TrxID)</p>
                               <input value={trxId} onChange={(e) => setTrxId(e.target.value)} type="text" placeholder="8N7X2W..." className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl p-3 text-sm font-bold outline-none focus:border-purple-500" />
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  onClick={handleConfirmPayment}
                  disabled={processing || !selectedMethod}
                  className="w-full h-16 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-lg transition-all shadow-2xl shadow-purple-900/40 mt-8 disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {processing ? (
                     <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Confirm Subscription
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-zinc-600 mt-6">
                  SSL Secure 256-bit Encryption • Satisfaction Guaranteed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
