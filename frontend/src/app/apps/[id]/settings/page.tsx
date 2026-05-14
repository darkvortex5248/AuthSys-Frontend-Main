"use client";
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const regenSecret = async () => {
    if (!confirm("This will break existing versions that use the old secret. Continue?")) return;
    await api.post(`/developer/apps/${appId}/regenerate-secret`);
    toast.success("Secret regenerated successfully");
  };

  const deleteApp = async () => {
    if (!confirm("DANGER! This deletes ALL keys, users, and data permanently. Type exactly 'I agree' to proceed?")) return;
    await api.delete(`/developer/apps/${appId}`);
    toast.success("Application deleted");
    router.push('/apps');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-zinc-400 mt-1">Configure danger zone actions.</p>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        <Card className="bg-zinc-900 border-amber-900/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-amber-500 text-lg">Regenerate App Secret</CardTitle>
            <CardDescription className="text-zinc-400">
              If your application secret is compromised, you can generate a new one. All software using the old secret will instantly lose access to AuthSys API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={regenSecret} className="bg-amber-600 hover:bg-amber-700 text-white font-medium">
              <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Secret Key
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-red-900/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-500 text-lg">Delete Application</CardTitle>
            <CardDescription className="text-zinc-400">
              Permanently delete this application, all associated license keys, users, logs, and variables. This action CANNOT be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={deleteApp} className="bg-red-600 hover:bg-red-700 text-white font-medium">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Application
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
