import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Building2, Handshake, Star } from 'lucide-react';

interface AnalyticsData {
  totalWorkers: number;
  totalBusinesses: number;
  totalConnections: number;
  totalReviews: number;
  workerGrowth: { month: string; count: number }[];
  connectionsByStatus: { status: string; count: number }[];
  reviewsByRating: { rating: number; count: number }[];
}

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    totalWorkers: 0,
    totalBusinesses: 0,
    totalConnections: 0,
    totalReviews: 0,
    workerGrowth: [],
    connectionsByStatus: [],
    reviewsByRating: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const [
      { count: workersCount },
      { count: businessesCount },
      { count: connectionsCount },
      { count: reviewsCount },
      { data: workers },
      { data: connections },
      { data: reviews },
    ] = await Promise.all([
      supabase.from('worker_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('business_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('connection_requests').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('worker_profiles').select('created_at'),
      supabase.from('connection_requests').select('status'),
      supabase.from('reviews').select('rating'),
    ]);

    // Process worker growth by month
    const workersByMonth: Record<string, number> = {};
    workers?.forEach((w) => {
      const month = new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      workersByMonth[month] = (workersByMonth[month] || 0) + 1;
    });
    const workerGrowth = Object.entries(workersByMonth)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);

    // Process connections by status
    const statusCounts: Record<string, number> = {};
    connections?.forEach((c) => {
      statusCounts[c.status || 'pending'] = (statusCounts[c.status || 'pending'] || 0) + 1;
    });
    const connectionsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // Process reviews by rating
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews?.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });
    const reviewsByRating = Object.entries(ratingCounts).map(([rating, count]) => ({ rating: parseInt(rating), count }));

    setData({
      totalWorkers: workersCount || 0,
      totalBusinesses: businessesCount || 0,
      totalConnections: connectionsCount || 0,
      totalReviews: reviewsCount || 0,
      workerGrowth,
      connectionsByStatus,
      reviewsByRating,
    });
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Workers', value: data.totalWorkers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Businesses', value: data.totalBusinesses, icon: Building2, color: 'text-green-500' },
    { title: 'Connections', value: data.totalConnections, icon: Handshake, color: 'text-purple-500' },
    { title: 'Reviews', value: data.totalReviews, icon: Star, color: 'text-yellow-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Platform performance and metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle>Worker Registration Trend</CardTitle>
              <CardDescription>New workers by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.workerGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Requests by Status</CardTitle>
              <CardDescription>Distribution of connection statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.connectionsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.connectionsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reviews by Rating</CardTitle>
              <CardDescription>Distribution of review ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.reviewsByRating}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
