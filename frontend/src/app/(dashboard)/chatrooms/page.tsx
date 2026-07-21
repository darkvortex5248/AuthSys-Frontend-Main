'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { isFeatureLocked } from '@/lib/plan-access';
import PremiumLocked from '@/components/PremiumLocked';
import { Hash, Plus, Settings, Users, Loader2, MessageSquare, Zap } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.07 }
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (i = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.06 }
  }),
};

export default function ChatroomsPage() {
  const { selectedAppId } = useAuthStore();
  const { data: profile } = useDeveloperMe(true);
  const locked = isFeatureLocked('seller', profile?.subscription_tier);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchRooms = async () => {
    if (locked) return;
    try {
      const res = await api.get('/developer/chatrooms');
      setRooms(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locked) {
      fetchRooms();
    }
  }, [selectedAppId, locked]);

  if (locked) return <PremiumLocked feature="Chatrooms" />;
  if (!mounted) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return toast.error('Select an application first');
    if (!newRoomName.trim()) return toast.error('Enter a room name');
    setIsCreating(true);
    try {
      await api.post('/developer/chatrooms', { app_id: selectedAppId, name: newRoomName });
      toast.success('Chatroom created!');
      setNewRoomName('');
      fetchRooms();
    } catch {
      toast.error('Failed to create chatroom');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="page-header">
        <div className="page-header-content">
          <div className="breadcrumb">
            <Zap className="w-3 h-3 text-[var(--primary)]" />
            <span>Real-time</span>
            <span className="opacity-30">/</span>
            <span className="breadcrumb-active">Communication Channels</span>
          </div>
          <h1 className="page-title">Chatrooms</h1>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="lg:col-span-1"
        >
          <div className="premium-card overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-white/6">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-foreground)] flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                New Chatroom
              </p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="field-label">Room Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)]/40" />
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    placeholder="e.g. Global"
                    className="field-input pl-9"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isCreating}
                whileTap={{ scale: 0.97 }}
                className="btn-primary w-full"
              >
                {isCreating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  : <><Plus className="w-4 h-4" /> Create Room</>
                }
              </motion.button>
            </form>
          </div>
        </motion.div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-40 bg-[var(--accent-opacity-8)] rounded-2xl" />)}
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              className="premium-card flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">No chatrooms yet for this application.</p>
              <p className="text-xs text-white/20 mt-1">Create one using the panel on the left.</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {rooms.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}

function RoomCard({ room, index }: { room: any; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative premium-card cursor-default group ${
        hovered ? 'border-[var(--primary)]/35 shadow-lg shadow-[var(--primary)]/8' : ''
      }`}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[var(--primary)]/8 to-transparent"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                hovered ? 'bg-[var(--primary)]/15' : 'bg-white/5'
              }`}
            >
              <Hash className={`w-5 h-5 transition-colors duration-300 ${
                hovered ? 'text-[var(--primary)]' : 'text-white/30'
              }`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)] leading-tight">{room.name}</h3>
              <p className="text-[10px] font-mono text-[var(--muted-foreground)] mt-0.5">ID #{room.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-white">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                +12
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl border border-white/6 bg-white/3 hover:bg-white/8 text-[var(--muted-foreground)] hover:text-white transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
