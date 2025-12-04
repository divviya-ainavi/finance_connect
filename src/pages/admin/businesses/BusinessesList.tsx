import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye } from 'lucide-react';

interface Business {
  id: string;
  company_name: string;
  contact_name: string;
  location: string | null;
  industry: string | null;
  is_suspended: boolean;
  created_at: string;
}

export default function BusinessesList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('id, company_name, contact_name, location, industry, is_suspended, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBusinesses(data);
      }
      setLoading(false);
    };

    fetchBusinesses();
  }, []);

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.company_name.toLowerCase().includes(search.toLowerCase()) ||
      b.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      b.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Businesses</h1>
            <p className="text-muted-foreground">Manage business profiles</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, contact or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell className="font-medium">{business.company_name}</TableCell>
                    <TableCell>{business.contact_name}</TableCell>
                    <TableCell>{business.location || '-'}</TableCell>
                    <TableCell>{business.industry || '-'}</TableCell>
                    <TableCell>
                      {business.is_suspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(business.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/businesses/${business.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBusinesses.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No businesses found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
