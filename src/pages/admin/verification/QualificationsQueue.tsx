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
import { CheckCircle, XCircle, Eye, GraduationCap } from 'lucide-react';
import { openDocument } from '@/lib/storage-utils';

interface QualificationUpload {
  id: string;
  worker_profile_id: string;
  qualification_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  worker_profiles: {
    name: string;
  };
}

export default function QualificationsQueue() {
  const [uploads, setUploads] = useState<QualificationUpload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<QualificationUpload | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    const { data, error } = await supabase
      .from('qualification_uploads')
      .select('*, worker_profiles(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUploads(data as QualificationUpload[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(true);
    const updateData: any = { 
      status,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
    };
    
    if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('qualification_uploads')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update qualification status',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Qualification ${status}`,
      });
      setSelectedUpload(null);
      setRejectionReason('');
      fetchUploads();
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatQualification = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Qualifications Queue</h1>
          <p className="text-muted-foreground">Review and verify qualification documents</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {uploads.filter(u => u.status === 'pending').length} pending qualifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.worker_profiles?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatQualification(upload.qualification_type)}</TableCell>
                    <TableCell>{getStatusBadge(upload.status)}</TableCell>
                    <TableCell>{new Date(upload.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedUpload(upload)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {uploads.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No qualification uploads found</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedUpload} onOpenChange={(open) => !open && setSelectedUpload(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Qualification</DialogTitle>
              <DialogDescription>
                Review the submitted qualification document
              </DialogDescription>
            </DialogHeader>
            {selectedUpload && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Worker</p>
                    <p className="text-muted-foreground">{selectedUpload.worker_profiles?.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Qualification Type</p>
                    <p className="text-muted-foreground">{formatQualification(selectedUpload.qualification_type)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm mb-2">Document</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={async () => {
                      const success = await openDocument(selectedUpload.document_url, 'cvs');
                      if (!success) {
                        toast({
                          title: "Error",
                          description: "Failed to open document",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    View Document
                  </Button>
                </div>
                {selectedUpload.status === 'pending' && (
                  <>
                    <div>
                      <p className="font-medium text-sm mb-2">Rejection Reason (if rejecting)</p>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateStatus(selectedUpload.id, 'verified')}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus(selectedUpload.id, 'rejected')}
                        disabled={actionLoading || !rejectionReason.trim()}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
