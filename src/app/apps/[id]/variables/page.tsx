"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function VariablesPage() {
  const params = useParams();
  const appId = params.id as string;
  const [vars, setVars] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});

  const load = () => api.get(`/developer/variables/${appId}`).then(res => setVars(res.data));
  useEffect(() => { load(); }, [appId]);

  const add = async () => {
    if(!name || !val) return;
    await api.post(`/developer/variables/create`, { app_id: parseInt(appId), key_name: name, key_value: val, is_global: true });
    toast.success("Variable saved");
    setName(''); setVal('');
    load();
  };

  const remove = async (id: number) => {
    await api.delete(`/developer/variables/${id}`);
    toast.success("Variable deleted");
    load();
  };

  const toggleShow = (id: number) => {
    setShowValues(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Server Variables</h1>
          <p className="text-zinc-400 mt-1">Store configuration securely on the server to be fetched by the SDK.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-md">
        <Input placeholder="Variable Name (e.g. GAME_VERSION)" value={name} onChange={e => setName(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white w-1/3 focus-visible:ring-[var(--primary)]" />
        <Input placeholder="Value (e.g. 1.0.5)" value={val} onChange={e => setVal(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white flex-1 focus-visible:ring-[var(--primary)]" />
        <Button onClick={add} className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white shadow-sm"><Plus className="mr-2 h-4 w-4"/> Save Variable</Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/80 border-b border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium w-1/3">Variable Name</TableHead>
                <TableHead className="text-zinc-400 font-medium">Value</TableHead>
                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vars.length === 0 && (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={3} className="text-center text-zinc-500 py-12">No variables set.</TableCell>
                </TableRow>
              )}
              {vars.map(v => (
                <TableRow key={v.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="text-zinc-200 font-medium font-mono text-sm">{v.key_name}</TableCell>
                  <TableCell className="text-zinc-400 font-mono text-sm flex items-center gap-2">
                    {showValues[v.id] ? v.key_value : '••••••••••••••••'}
                    <button onClick={() => toggleShow(v.id)} className="text-zinc-500 hover:text-zinc-300 ml-2 focus:outline-none">
                      {showValues[v.id] ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(v.id)} className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-900/20">
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
