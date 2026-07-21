"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Ban, UserCheck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAppUsers, useDeleteAppUser } from '@/hooks/use-developer-queries';

export default function UsersPage() {
  const params = useParams();
  const appId = parseInt(params.id as string, 10);
  const confirm = useConfirm();
  const deleteUser = useDeleteAppUser();
  const { data: users = [], refetch } = useAppUsers(appId);

  useEffect(() => {
    if (appId) refetch();
  }, [appId, refetch]);

  const banUser = async (id: number) => {
    await api.post(`/developer/users/${id}/ban`, { reason: "Banned from dashboard" });
    toast.success("User banned");
    refetch();
  };

  const unbanUser = async (id: number) => {
    await api.post(`/developer/users/${id}/unban`);
    toast.success("User unbanned");
    refetch();
  };

  const resetHwid = async (id: number) => {
    await api.post(`/developer/users/${id}/hwid-reset`);
    toast.success("HWID Reset successful");
    refetch();
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete user?',
      message: 'Delete this user permanently? This cannot be undone.',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteUser.mutateAsync({ id, appId });
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">End Users</h1>
          <p className="text-zinc-400 mt-1">Manage users authenticated in your application.</p>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Username</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">HWID</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: any) => (
                <TableRow key={u.id} className="border-zinc-800">
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    {u.is_banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="outline">Active</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[120px]">{u.hwid || '—'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {u.is_banned ? (
                      <Button size="sm" variant="ghost" onClick={() => unbanUser(u.id)}><UserCheck className="h-4 w-4" /></Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => banUser(u.id)}><Ban className="h-4 w-4" /></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => resetHwid(u.id)}><RefreshCcw className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
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
