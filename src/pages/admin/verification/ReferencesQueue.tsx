import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';

interface Reference {
  id: string;
  worker_profile_id: string;
  referee_name: string;
  referee_email: string;
  referee_role: string | null;
  referee_company: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  worker_profiles: {
    name: string;
  };
}

export default function ReferencesQueue() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    const { data, error } = await supabase
      .from('worker_references')
      .select('*, worker_profiles(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReferences(data as Reference[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('worker_references')
      .update({ status, admin_notes: adminNotes })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reference status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Reference marked as ${status}`,
      });
      setSelectedRef(null);
      setAdminNotes('');
      fetchReferences();
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">References Queue</h1>
          <p className="text-muted-foreground">Review and verify worker references</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {references.filter(r => r.status === 'pending').length} pending references
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {references.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">{ref.worker_profiles?.name || 'Unknown'}</TableCell>
                    <TableCell>{ref.referee_name}</TableCell>
                    <TableCell>{ref.referee_company || '-'}</TableCell>
                    <TableCell>{ref.referee_email}</TableCell>
                    <TableCell>{getStatusBadge(ref.status)}</TableCell>
                    <TableCell>{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedRef(ref); setAdminNotes(ref.admin_notes || ''); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {references.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No references found</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedRef} onOpenChange={(open) => !open && setSelectedRef(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Reference</DialogTitle>
              <DialogDescription>
                Review and verify this reference submission
              </DialogDescription>
            </DialogHeader>
            {selectedRef && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Referee Name</p>
                    <p className="text-muted-foreground">{selectedRef.referee_name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{selectedRef.referee_email}</p>
                  </div>
                  <div>
                    <p className="font-medium">Role</p>
                    <p className="text-muted-foreground">{selectedRef.referee_role || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Company</p>
                    <p className="text-muted-foreground">{selectedRef.referee_company || 'Not provided'}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about verification..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatus(selectedRef.id, 'verified')}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus(selectedRef.id, 'declined')}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
