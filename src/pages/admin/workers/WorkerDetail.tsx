import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Ban, CheckCircle, User, MapPin, Briefcase, Star } from 'lucide-react';

interface WorkerProfile {
  id: string;
  name: string;
  location: string | null;
  roles: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  photo_url: string | null;
}

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setWorker(data);
        setSuspensionReason(data.suspension_reason || '');
      }
      setLoading(false);
    };

    fetchWorker();
  }, [id]);

  const handleSuspend = async () => {
    if (!worker || !suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a suspension reason',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('worker_profiles')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: suspensionReason,
      })
      .eq('id', worker.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend professional',
        variant: 'destructive',
      });
    } else {
      setWorker({ ...worker, is_suspended: true, suspension_reason: suspensionReason });
      toast({
        title: 'Professional suspended',
        description: 'The finance professional has been suspended successfully',
      });
    }
    setActionLoading(false);
  };

  const handleUnsuspend = async () => {
    if (!worker) return;

    setActionLoading(true);
    const { error } = await supabase
      .from('worker_profiles')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('id', worker.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unsuspend professional',
        variant: 'destructive',
      });
    } else {
      setWorker({ ...worker, is_suspended: false, suspension_reason: null });
      setSuspensionReason('');
      toast({
        title: 'Professional unsuspended',
        description: 'The finance professional has been unsuspended successfully',
      });
    }
    setActionLoading(false);
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!worker) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Finance Professional not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/workers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{worker.name}</h1>
            <p className="text-muted-foreground">Finance Professional Profile</p>
          </div>
          {worker.is_suspended ? (
            <Badge variant="destructive" className="ml-auto">Suspended</Badge>
          ) : (
            <Badge variant="default" className="ml-auto bg-green-500">Active</Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {worker.photo_url ? (
                  <img src={worker.photo_url} alt={worker.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{worker.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {new Date(worker.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{worker.location || 'No location set'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>
                  {worker.hourly_rate_min && worker.hourly_rate_max
                    ? `£${worker.hourly_rate_min} - £${worker.hourly_rate_max}/hr`
                    : 'Rate not set'}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {worker.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {formatRole(role)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage finance professional account status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {worker.is_suspended ? (
                <>
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="font-medium text-destructive">This finance professional is suspended</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {worker.suspension_reason}
                    </p>
                  </div>
                  <Button
                    onClick={handleUnsuspend}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unsuspend Professional
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Suspension Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Enter reason for suspension..."
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleSuspend}
                    disabled={actionLoading || !suspensionReason.trim()}
                    className="w-full"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Professional
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
