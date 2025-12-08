import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Building2, FileText, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react';

interface Stats {
  totalWorkers: number;
  totalBusinesses: number;
  pendingReferences: number;
  openDisputes: number;
  pendingIdChecks: number;
  pendingQualifications: number;
  totalReviews: number;
  flaggedReviews: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalWorkers: 0,
    totalBusinesses: 0,
    pendingReferences: 0,
    openDisputes: 0,
    pendingIdChecks: 0,
    pendingQualifications: 0,
    totalReviews: 0,
    flaggedReviews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: workersCount },
        { count: businessesCount },
        { count: referencesCount },
        { count: disputesCount },
        { count: idChecksCount },
        { count: qualificationsCount },
        { count: reviewsCount },
        { count: flaggedCount },
      ] = await Promise.all([
        supabase.from('worker_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('business_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('worker_references').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('id_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('qualification_uploads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
      ]);

      setStats({
        totalWorkers: workersCount || 0,
        totalBusinesses: businessesCount || 0,
        pendingReferences: referencesCount || 0,
        openDisputes: disputesCount || 0,
        pendingIdChecks: idChecksCount || 0,
        pendingQualifications: qualificationsCount || 0,
        totalReviews: reviewsCount || 0,
        flaggedReviews: flaggedCount || 0,
      });

      // Fetch recent activity
      const { data: logs } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(logs || []);
      setLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Workers', value: stats.totalWorkers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Businesses', value: stats.totalBusinesses, icon: Building2, color: 'text-green-500' },
    { title: 'Pending References', value: stats.pendingReferences, icon: FileText, color: 'text-yellow-500' },
    { title: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, color: 'text-red-500' },
    { title: 'Pending ID Checks', value: stats.pendingIdChecks, icon: Clock, color: 'text-orange-500' },
    { title: 'Total Reviews', value: stats.totalReviews, icon: Star, color: 'text-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the Axcelera admin portal</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/verification/references" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Review References</p>
                  <p className="text-sm text-muted-foreground">{stats.pendingReferences} pending</p>
                </div>
              </a>
              <a href="/admin/disputes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Handle Disputes</p>
                  <p className="text-sm text-muted-foreground">{stats.openDisputes} open</p>
                </div>
              </a>
              <a href="/admin/reviews" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Moderate Reviews</p>
                  <p className="text-sm text-muted-foreground">{stats.flaggedReviews} flagged</p>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{activity.action_type}</p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
