"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function KeysPage() {
  const params = useParams();
  const appId = params.id as string;
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKeys = () => {
    setLoading(true);
    api.get(`/developer/keys/${appId}`).then(res => {
      setKeys(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadKeys(); }, [appId]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Key copied");
  };

  const deleteKey = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    await api.delete(`/developer/keys/${id}`);
    toast.success("Key deleted");
    loadKeys();
  };

  const generateKey = async () => {
    await api.post(`/developer/keys/generate`, { app_id: parseInt(appId), key_type: 'time', duration_days: 30 });
    toast.success("Generated new 30-day key");
    loadKeys();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">License Keys</h1>
          <p className="text-zinc-400 mt-1">Generate and manage access keys for your application.</p>
        </div>
        <Button onClick={generateKey} className="bg-[#d97757] hover:bg-[#d97757] text-white shadow-md">
          <Plus className="mr-2 h-4 w-4"/> Generate Key
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/80 border-b border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium">Key Value</TableHead>
                <TableHead className="text-zinc-400 font-medium">Type</TableHead>
                <TableHead className="text-zinc-400 font-medium">Uses</TableHead>
                <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 && !loading && (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-12">No keys found. Generate one to get started.</TableCell>
                </TableRow>
              )}
              {keys.map(k => (
                <TableRow key={k.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-mono text-sm text-zinc-300">{k.key_value}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 capitalize">{k.key_type}</Badge></TableCell>
                  <TableCell className="text-zinc-400">{k.current_uses} / {k.max_uses || '∞'}</TableCell>
                  <TableCell>
                    {k.is_paused ? <Badge variant="outline" className="bg-red-900/10 text-red-400 border-red-900/50">Paused</Badge> : 
                     <Badge variant="outline" className="bg-emerald-900/10 text-emerald-400 border-emerald-900/50">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => copyKey(k.key_value)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteKey(k.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
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
