"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Settings, Box } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';

export default function AppsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState('');

  const loadApps = () => {
    api.get('/developer/apps').then(res => setApps(res.data));
  };

  useEffect(() => { loadApps(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/developer/apps/create', { name });
      toast.success("App created");
      setName('');
      loadApps();
    } catch (e: any) {
      toast.error("Failed to create app");
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success("App Secret copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-zinc-400 mt-1">Manage and configure your software projects.</p>
        </div>
        <Dialog>
          <DialogTrigger 
            render={
              <Button className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white shadow-md">
                <Plus className="mr-2 h-4 w-4"/> New App
              </Button>
            }
          />
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input placeholder="Application Name" value={name} onChange={e => setName(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" />
              <Button onClick={handleCreate} className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]">Create Application</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 flex flex-col items-center justify-center">
             <Box className="h-12 w-12 text-zinc-600 mb-4" />
             <h3 className="text-lg font-medium text-zinc-300">No applications yet</h3>
             <p className="text-sm text-zinc-500 mt-1">Create your first application to get started.</p>
          </div>
        )}
        {apps.map(app => (
          <Card key={app.id} className="bg-zinc-900 border-zinc-800 flex flex-col shadow-lg transition-transform hover:-translate-y-1 duration-300">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[var(--primary)] shadow-inner">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  {app.name}
                </CardTitle>
                <Badge variant="outline" className={app.status === 'active' ? 'text-emerald-400 border-emerald-900/50 bg-emerald-900/10' : 'text-zinc-400 border-zinc-700 bg-zinc-800'}>
                  {app.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">App Secret Key</p>
                <div className="flex gap-2 items-center bg-zinc-950/80 rounded-md border border-zinc-800 p-1.5">
                  <code className="text-zinc-300 font-mono text-xs flex-1 overflow-hidden text-ellipsis px-2 blur-[3px] hover:blur-none transition-all">
                    {app.app_secret}
                  </code>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0" onClick={() => copySecret(app.app_secret)}>
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <Link href={`/apps/${app.id}/keys`} className="block mt-auto pt-2">
                <Button variant="secondary" className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700">
                  <Settings className="mr-2 h-4 w-4" /> Manage Application
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
