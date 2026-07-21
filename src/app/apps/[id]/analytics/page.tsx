"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert } from 'lucide-react';

export default function AnalyticsPage() {
  const params = useParams();
  const appId = params.id as string;
  const [stats, setStats] = useState({ total_logs: 0 });
  const [suspicious, setSuspicious] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/developer/analytics/${appId}`).then(res => setStats(res.data));
    api.get(`/developer/analytics/${appId}/suspicious`).then(res => setSuspicious(res.data));
  }, [appId]);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Threats</h1>
          <p className="text-zinc-400 mt-1">Monitor usage and detect suspicious activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800 shadow-md hover:border-[var(--primary)]/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total API Events Logged</CardTitle>
            <div className="p-2 bg-[var(--primary)]/30 rounded-lg"><Activity className="h-4 w-4 text-[var(--primary)]" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_logs}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 shadow-md hover:border-red-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Suspicious Events</CardTitle>
            <div className="p-2 bg-red-900/30 rounded-lg"><ShieldAlert className="h-4 w-4 text-red-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{suspicious.length}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4 tracking-tight">Suspicious Activity Log</h2>
      <Card className="bg-zinc-900 border-zinc-800 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-950/80 border-b border-zinc-800">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-medium">Timestamp</TableHead>
                <TableHead className="text-zinc-400 font-medium">Action Type</TableHead>
                <TableHead className="text-zinc-400 font-medium">IP Address</TableHead>
                <TableHead className="text-zinc-400 font-medium">Risk Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspicious.length === 0 && (
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableCell colSpan={4} className="text-center text-zinc-500 py-12 flex flex-col items-center">
                    <ShieldAlert className="text-zinc-600 mb-2 h-8 w-8" />
                    No suspicious activity detected.
                  </TableCell>
                </TableRow>
              )}
              {suspicious.map(s => (
                <TableRow key={s.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <TableCell className="text-zinc-400 text-sm">{new Date(s.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-zinc-200 capitalize font-medium">{s.action_type.replace('_', ' ')}</TableCell>
                  <TableCell className="text-zinc-500 font-mono text-xs">{s.ip_address}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.risk_score > 50 ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-amber-900/20 text-amber-400 border-amber-900/50'}>
                      {s.risk_score} / 100
                    </Badge>
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
