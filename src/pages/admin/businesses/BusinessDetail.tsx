import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Ban, CheckCircle, Building2, MapPin, Globe, 
  Users, Briefcase, Star, Calendar, Mail, Phone, FileText,
  Send, UserCheck, Clock
} from 'lucide-react';

interface BusinessProfile {
  id: string;
  company_name: string;
  contact_name: string;
  contact_role: string | null;
  location: string | null;
  industry: string | null;
  website: string | null;
  company_size: string | null;
  description: string | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  logo_url: string | null;
  max_commute_km: number | null;
  travel_time_minutes: number | null;
  location_constraints: string | null;
}

interface ConnectionStats {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}

interface ReviewStats {
  count: number;
  averageRating: number;
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ count: 0, averageRating: 0 });
  const [recentConnections, setRecentConnections] = useState<any[]>([]);

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!id) return;
      
      // Fetch business profile
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (businessError || !businessData) {
        setLoading(false);
        return;
      }

      setBusiness(businessData);
      setSuspensionReason(businessData.suspension_reason || '');

      // Fetch connection requests stats
      const { data: connections } = await supabase
        .from('connection_requests')
        .select('id, status, created_at, worker_profile_id')
        .eq('business_profile_id', id)
        .order('created_at', { ascending: false });

      if (connections) {
        setConnectionStats({
          total: connections.length,
          pending: connections.filter(c => c.status === 'pending').length,
          accepted: connections.filter(c => c.status === 'accepted').length,
          declined: connections.filter(c => c.status === 'declined').length,
        });
        setRecentConnections(connections.slice(0, 5));
      }

      // Fetch reviews stats - get profile_id first
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('profile_id')
        .eq('id', id)
        .single();

      if (profileData) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewee_profile_id', profileData.profile_id);

        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          setReviewStats({
            count: reviews.length,
            averageRating: Math.round(avgRating * 10) / 10,
          });
        }
      }

      setLoading(false);
    };

    fetchBusinessData();
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/businesses')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{business.company_name}</h1>
            <p className="text-muted-foreground">Business Profile Details</p>
          </div>
          {business.is_suspended ? (
            <Badge variant="destructive" className="text-sm px-3 py-1">Suspended</Badge>
          ) : (
            <Badge variant="default" className="bg-green-500 text-sm px-3 py-1">Active</Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connectionStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connectionStats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{connectionStats.accepted}</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Star className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviewStats.averageRating || '-'}</p>
                  <p className="text-sm text-muted-foreground">{reviewStats.count} Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Company Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo and Name */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={business.logo_url || ''} alt={business.company_name} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(business.company_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{business.company_name}</h3>
                  <p className="text-muted-foreground">
                    {business.contact_name}
                    {business.contact_role && <span className="text-muted-foreground"> • {business.contact_role}</span>}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {business.industry && <Badge variant="secondary">{business.industry}</Badge>}
                    {business.company_size && <Badge variant="outline">{business.company_size}</Badge>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {business.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">About</Label>
                  <p className="mt-1 text-sm">{business.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <p className="text-sm">{business.location || 'Not specified'}</p>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Website</Label>
                      <a 
                        href={business.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline block"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}

                {business.location_constraints && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Location Constraints</Label>
                      <p className="text-sm">{business.location_constraints}</p>
                    </div>
                  </div>
                )}

                {(business.max_commute_km || business.travel_time_minutes) && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Commute Preference</Label>
                      <p className="text-sm">
                        {business.max_commute_km && `${business.max_commute_km} km`}
                        {business.max_commute_km && business.travel_time_minutes && ' / '}
                        {business.travel_time_minutes && `${business.travel_time_minutes} mins`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-sm">{new Date(business.created_at).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage business account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {business.is_suspended ? (
                <>
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="font-medium text-destructive">This business is suspended</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {business.suspension_reason}
                    </p>
                    {business.suspended_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Suspended on: {new Date(business.suspended_at).toLocaleDateString()}
                      </p>
                    )}
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
                      rows={4}
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

        {/* Connection Requests Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Connection Requests Summary
            </CardTitle>
            <CardDescription>Overview of connection requests sent by this business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    {connectionStats.pending}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Awaiting response from finance professionals</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accepted</span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    {connectionStats.accepted}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Successfully connected with professionals</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Declined</span>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {connectionStats.declined}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Requests declined by professionals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
