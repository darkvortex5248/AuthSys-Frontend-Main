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
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useCopy } from '@/components/ui/copy-dialog';
import { useDeleteLicenseKey, useLicenseKeys } from '@/hooks/use-developer-queries';

export default function KeysPage() {
  const params = useParams();
  const appId = parseInt(params.id as string, 10);
  const confirm = useConfirm();
  const copy = useCopy();
  const deleteKey = useDeleteLicenseKey();
  const { data: keys = [], isLoading: loading, refetch } = useLicenseKeys(appId);

  useEffect(() => {
    if (appId) refetch();
  }, [appId, refetch]);

  const copyKey = (key: string) => {
    copy(key, { label: 'License key copied', description: 'Paste into your app or share with customer.' });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete license key?',
      message: 'Are you sure you want to delete this license key? This cannot be undone.',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteKey.mutateAsync({ id, appId });
      toast.success("Key deleted");
    } catch {
      toast.error("Failed to delete key");
    }
  };

  const generateKey = async () => {
    await api.post(`/developer/keys/generate`, { app_id: appId, key_type: 'time', duration_days: 30 });
    toast.success("Generated new 30-day key");
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">License Keys</h1>
          <p className="text-zinc-400 mt-1">Manage keys for your application.</p>
        </div>
        <Button onClick={generateKey} className="bg-zinc-100 text-zinc-900 hover:bg-white">
          <Plus className="mr-2 h-4 w-4" /> Generate Key
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Loading keys...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Key</TableHead>
                  <TableHead className="text-zinc-400">Type</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k: any) => (
                  <TableRow key={k.id} className="border-zinc-800">
                    <TableCell className="font-mono text-sm">{k.key_value}</TableCell>
                    <TableCell><Badge variant="outline">{k.key_type}</Badge></TableCell>
                    <TableCell>{k.is_paused ? 'Paused' : 'Active'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => copyKey(k.key_value)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(k.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
