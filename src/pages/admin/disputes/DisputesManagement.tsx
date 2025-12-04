import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Eye, CheckCircle } from 'lucide-react';

interface Dispute {
  id: string;
  dispute_type: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
  reporter_profile_id: string;
  reported_profile_id: string;
}

export default function DisputesManagement() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    let query = supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDisputes(data);
    }
    setLoading(false);
  };

  const updateDispute = async () => {
    if (!selectedDispute || !newStatus) return;

    setActionLoading(true);
    const updateData: any = { 
      status: newStatus,
    };
    
    if (newStatus === 'resolved') {
      updateData.resolution = resolution;
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', selectedDispute.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update dispute',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Dispute updated successfully',
      });
      setSelectedDispute(null);
      setResolution('');
      setNewStatus('');
      fetchDisputes();
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'investigating':
        return <Badge variant="secondary">Investigating</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="destructive">Open</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground">Handle and resolve user disputes</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {disputes.filter(d => d.status === 'open').length} open disputes
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.dispute_type}</TableCell>
                    <TableCell className="max-w-xs truncate">{dispute.description}</TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>{new Date(dispute.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setNewStatus(dispute.status);
                          setResolution(dispute.resolution || '');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {disputes.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No disputes found</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Dispute</DialogTitle>
              <DialogDescription>
                Review and resolve this dispute
              </DialogDescription>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Dispute Type</p>
                    <p className="text-muted-foreground">{selectedDispute.dispute_type}</p>
                  </div>
                  <div>
                    <p className="font-medium">Current Status</p>
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Description</p>
                  <p className="text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedDispute.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Update Status</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newStatus === 'resolved' && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Resolution</p>
                    <Textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Describe how the dispute was resolved..."
                    />
                  </div>
                )}
                <Button
                  onClick={updateDispute}
                  disabled={actionLoading || (newStatus === 'resolved' && !resolution.trim())}
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Dispute
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
