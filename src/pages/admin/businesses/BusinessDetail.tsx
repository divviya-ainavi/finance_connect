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
import { ArrowLeft, Ban, CheckCircle, Building2, MapPin, Globe } from 'lucide-react';

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_name: string;
  contact_role: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  logo_url: string | null;
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setBusiness(data);
        setSuspensionReason(data.suspension_reason || '');
      }
      setLoading(false);
    };

    fetchBusiness();
  }, [id]);

  const handleSuspend = async () => {
    if (!business || !suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a suspension reason',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('business_profiles')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: suspensionReason,
      })
      .eq('id', business.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend business',
        variant: 'destructive',
      });
    } else {
      setBusiness({ ...business, is_suspended: true, suspension_reason: suspensionReason });
      toast({
        title: 'Business suspended',
        description: 'The business has been suspended successfully',
      });
    }
    setActionLoading(false);
  };

  const handleUnsuspend = async () => {
    if (!business) return;

    setActionLoading(true);
    const { error } = await supabase
      .from('business_profiles')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null,
      })
      .eq('id', business.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unsuspend business',
        variant: 'destructive',
      });
    } else {
      setBusiness({ ...business, is_suspended: false, suspension_reason: null });
      setSuspensionReason('');
      toast({
        title: 'Business unsuspended',
        description: 'The business has been unsuspended successfully',
      });
    }
    setActionLoading(false);
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

  if (!business) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Business not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/businesses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{business.company_name}</h1>
            <p className="text-muted-foreground">Business Profile</p>
          </div>
          {business.is_suspended ? (
            <Badge variant="destructive" className="ml-auto">Suspended</Badge>
          ) : (
            <Badge variant="default" className="ml-auto bg-green-500">Active</Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {business.logo_url ? (
                  <img src={business.logo_url} alt={business.company_name} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{business.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {business.contact_name} {business.contact_role && `- ${business.contact_role}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{business.location || 'No location set'}</span>
              </div>
              
              {business.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {business.website}
                  </a>
                </div>
              )}

              {business.industry && (
                <div>
                  <p className="text-sm font-medium mb-1">Industry</p>
                  <Badge variant="secondary">{business.industry}</Badge>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Joined {new Date(business.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage business account status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {business.is_suspended ? (
                <>
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="font-medium text-destructive">This business is suspended</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {business.suspension_reason}
                    </p>
                  </div>
                  <Button
                    onClick={handleUnsuspend}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Unsuspend Business
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
                    Suspend Business
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
