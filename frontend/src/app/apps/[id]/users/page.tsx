"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Ban, UserCheck, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const params = useParams();
  const appId = params.id as string;
  const [users, setUsers] = useState<any[]>([]);

  const loadUsers = () => {
    api.get(`/developer/users/${appId}`).then(res => setUsers(res.data));
  };

  useEffect(() => { loadUsers(); }, [appId]);

  const banUser = async (id: number) => {
    await api.post(`/developer/users/${id}/ban`, { reason: "Banned from dashboard" });
    toast.success("User banned");
    loadUsers();
  };

  const unbanUser = async (id: number) => {
    await api.post(`/developer/users/${id}/unban`);
    toast.success("User unbanned");
    loadUsers();
  };

  const resetHwid = async (id: number) => {
    await api.post(`/developer/users/${id}/hwid-reset`);
    toast.success("HWID Reset successful");
    loadUsers();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete user permanently?")) return;
    await api.delete(`/developer/users/${id}`);
    toast.success("User deleted");
    loadUsers();
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
            <TableHeader className="bg-zinc-950/80 border-b border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium">Username</TableHead>
                <TableHead className="text-zinc-400 font-medium">IP Address</TableHead>
                <TableHead className="text-zinc-400 font-medium">HWID</TableHead>
                <TableHead className="text-zinc-400 font-medium">Logins</TableHead>
                <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                <TableHead className="text-right text-zinc-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="font-medium text-zinc-200">{u.username}</TableCell>
                  <TableCell className="text-zinc-400 text-xs font-mono">{u.last_ip || 'N/A'}</TableCell>
                  <TableCell className="text-zinc-500 text-xs font-mono max-w-[150px] truncate" title={u.hwid}>{u.hwid || 'Not locked'}</TableCell>
                  <TableCell className="text-zinc-400 font-medium">{u.login_count}</TableCell>
                  <TableCell>
                    {u.is_banned ? <Badge variant="outline" className="bg-red-900/10 text-red-400 border-red-900/50">Banned</Badge> : 
                     <Badge variant="outline" className="bg-emerald-900/10 text-emerald-400 border-emerald-900/50">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => resetHwid(u.id)} title="Reset HWID" className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20">
                      <RefreshCcw size={14} />
                    </Button>
                    {u.is_banned ? (
                      <Button variant="ghost" size="icon" onClick={() => unbanUser(u.id)} title="Unban User" className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20">
                        <UserCheck size={14} />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => banUser(u.id)} title="Ban User" className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20">
                        <Ban size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-12">No users registered yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
