"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function BlacklistPage() {
  const params = useParams();
  const appId = params.id as string;
  const [items, setItems] = useState<any[]>([]);
  const [val, setVal] = useState('');
  const [type, setType] = useState('ip');

  const load = () => api.get(`/developer/blacklist/${appId}`).then(res => setItems(res.data));
  useEffect(() => { load(); }, [appId]);

  const add = async () => {
    if(!val) return;
    await api.post(`/developer/blacklist/add`, { app_id: parseInt(appId), type, value: val });
    toast.success("Added to blacklist");
    setVal('');
    load();
  };

  const remove = async (id: number) => {
    await api.delete(`/developer/blacklist/${id}`);
    toast.success("Removed from blacklist");
    load();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blacklist</h1>
          <p className="text-zinc-400 mt-1">Block specific IPs, HWIDs, or Usernames from accessing your app.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
        <select value={type} onChange={e => setType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 outline-none focus:ring-1 focus:ring-[var(--primary)]">
          <option value="ip">IP Address</option>
          <option value="hwid">HWID</option>
          <option value="username">Username</option>
        </select>
        <Input placeholder="Enter value to block..." value={val} onChange={e => setVal(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white flex-1 focus-visible:ring-[var(--primary)]" />
        <Button onClick={add} className="bg-red-600 hover:bg-red-700 text-white shadow-sm"><Plus className="mr-2 h-4 w-4"/> Block Access</Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/80 border-b border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium w-32">Type</TableHead>
                <TableHead className="text-zinc-400 font-medium">Blocked Value</TableHead>
                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={3} className="text-center text-zinc-500 py-12">Blacklist is empty.</TableCell>
                </TableRow>
              )}
              {items.map(item => (
                <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="text-zinc-300 font-bold uppercase text-xs tracking-wider">{item.type}</TableCell>
                  <TableCell className="text-zinc-400 font-mono text-sm">{item.value}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(item.id)} className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
