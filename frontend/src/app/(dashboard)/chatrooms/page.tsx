'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function ChatroomsPage() {
  const { selectedAppId } = useAuthStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/developer/chatrooms');
      // Filter rooms by selected app if needed, although backend handles it
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedAppId]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return toast.error("Please select an application first");
    if (!newRoomName) return toast.error("Please enter a room name");

    try {
      setIsCreating(true);
      await api.post('/developer/chatrooms', {
        app_id: selectedAppId,
        name: newRoomName
      });
      toast.success("Chatroom created successfully!");
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      toast.error("Failed to create chatroom");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Chatrooms</h2>
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
          <span>Real-time</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[var(--vault-primary)]">Communication Channels</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Creation Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[var(--vault-primary)]/10 to-transparent">
              <h4 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">New Chatroom</h4>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                 <input 
                   type="text"
                   value={newRoomName}
                   onChange={(e) => setNewRoomName(e.target.value)}
                   placeholder="Room Name (e.g. Global)"
                   className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--vault-primary)] transition-all"
                 />
                 <button 
                   disabled={isCreating}
                   className="w-full py-3 bg-[var(--vault-primary)] text-black rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   {isCreating ? 'Creating...' : <><span className="material-symbols-outlined text-sm">add</span> Create Room</>}
                 </button>
              </form>
           </div>
        </div>

        {/* Rooms List */}
        <div className="lg:col-span-3 space-y-4">
           {rooms.length === 0 ? (
             <div className="glass-card p-12 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-5xl text-white/10 mb-4">forum</span>
                <p className="text-zinc-500">No chatrooms found for this application.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="glass-card p-6 rounded-[2rem] border border-white/5 hover:border-[var(--vault-primary)]/30 transition-all group relative overflow-hidden">
                     <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--vault-primary)]/5 blur-[50px] rounded-full group-hover:bg-[var(--vault-primary)]/10 transition-all"></div>
                     <div className="flex justify-between items-start relative z-10">
                        <div>
                           <h3 className="text-lg font-bold text-white mb-1">{room.name}</h3>
                           <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold">Room ID: #{room.id}</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 rounded-full">
                           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                     </div>
                     <div className="mt-6 flex items-center justify-between relative z-10">
                        <div className="flex -space-x-2">
                           {[1,2,3].map(i => (
                             <div key={i} className="w-7 h-7 rounded-full border-2 border-[#0A0A0A] bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-white">U{i}</div>
                           ))}
                           <div className="w-7 h-7 rounded-full border-2 border-[#0A0A0A] bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500">+12</div>
                        </div>
                        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
                           <span className="material-symbols-outlined text-lg">settings</span>
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
