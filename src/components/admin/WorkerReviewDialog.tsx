import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, CheckCircle, XCircle, User, FileText, 
  GraduationCap, Users, Shield, ExternalLink, Clock,
  CheckCircle2, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerForApproval {
  id: string;
  name: string;
  location: string;
  roles: string[];
  approval_status: string;
  created_at: string;
  approved_at: string | null;
  approval_notes: string | null;
  verification_score: number;
}

interface TestAttempt {
  id: string;
  role: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

interface Reference {
  id: string;
  referee_name: string;
  referee_email: string;
  referee_company: string | null;
  referee_role: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface IdVerification {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  is_insurance: boolean;
  rejection_reason: string | null;
  created_at: string;
}

interface QualificationUpload {
  id: string;
  qualification_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface WorkerReviewDialogProps {
  worker: WorkerForApproval | null;
  onClose: () => void;
  onApprovalComplete: () => void;
}

export const WorkerReviewDialog = ({ worker, onClose, onApprovalComplete }: WorkerReviewDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Verification data
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [idVerifications, setIdVerifications] = useState<IdVerification[]>([]);
  const [qualifications, setQualifications] = useState<QualificationUpload[]>([]);
  
  // Individual action states
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (worker) {
      fetchVerificationData();
    }
  }, [worker]);

  const fetchVerificationData = async () => {
    if (!worker) return;
    
    setLoading(true);
    try {
      // Fetch all verification data in parallel
      const [testsRes, refsRes, idRes, qualsRes] = await Promise.all([
        supabase
          .from("test_attempts")
          .select("*")
          .eq("worker_profile_id", worker.id)
          .order("attempted_at", { ascending: false }),
        supabase
          .from("worker_references")
          .select("*")
          .eq("worker_profile_id", worker.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("id_verifications")
          .select("*")
          .eq("worker_profile_id", worker.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("qualification_uploads")
          .select("*")
          .eq("worker_profile_id", worker.id)
          .order("created_at", { ascending: false }),
      ]);

      setTestAttempts(testsRes.data || []);
      setReferences(refsRes.data || []);
      setIdVerifications(idRes.data || []);
      setQualifications(qualsRes.data || []);
    } catch (error) {
      console.error("Error fetching verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (status: "active" | "declined") => {
    if (!worker) return;

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("worker_profiles")
        .update({
          approval_status: status,
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
          approval_notes: approvalNotes || null,
        })
        .eq("id", worker.id);

      if (error) throw error;

      toast({
        title: status === "active" ? "Worker approved" : "Worker declined",
        description: `${worker.name} has been ${status === "active" ? "approved and is now live" : "declined"}.`,
      });

      onApprovalComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReferenceAction = async (refId: string, status: "verified" | "declined") => {
    setProcessingItem(refId);
    try {
      const { error } = await supabase
        .from("worker_references")
        .update({ 
          status, 
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", refId);

      if (error) throw error;

      toast({ title: `Reference ${status}` });
      setAdminNotes("");
      fetchVerificationData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleIdVerificationAction = async (idVerId: string, status: "verified" | "rejected") => {
    setProcessingItem(idVerId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("id_verifications")
        .update({ 
          status,
          rejection_reason: status === "rejected" ? rejectionReason : null,
          verified_at: status === "verified" ? new Date().toISOString() : null,
          verified_by: status === "verified" ? user?.id : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", idVerId);

      if (error) throw error;

      toast({ title: `ID verification ${status}` });
      setRejectionReason("");
      fetchVerificationData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleQualificationAction = async (qualId: string, status: "verified" | "rejected") => {
    setProcessingItem(qualId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("qualification_uploads")
        .update({ 
          status,
          rejection_reason: status === "rejected" ? rejectionReason : null,
          verified_at: status === "verified" ? new Date().toISOString() : null,
          verified_by: status === "verified" ? user?.id : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", qualId);

      if (error) throw error;

      toast({ title: `Qualification ${status}` });
      setRejectionReason("");
      fetchVerificationData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingItem(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      accounts_payable: "Accounts Payable",
      accounts_receivable: "Accounts Receivable",
      bookkeeper: "Bookkeeper",
      payroll_clerk: "Payroll Clerk",
      management_accountant: "Management Accountant",
      credit_controller: "Credit Controller",
      financial_controller: "Financial Controller",
      finance_manager: "Finance Manager",
      cfo_fpa: "CFO/FP&A",
    };
    return labels[role] || role;
  };

  const formatQualification = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "passed":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
      case "declined":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate verification summary
  const testsVerified = testAttempts.some(t => t.passed);
  const refsVerified = references.some(r => r.status === "verified");
  const idVerified = idVerifications.some(v => !v.is_insurance && v.status === "verified");
  const insuranceVerified = idVerifications.some(v => v.is_insurance && v.status === "verified");
  const qualsVerified = qualifications.some(q => q.status === "verified");

  if (!worker) return null;

  return (
    <Dialog open={!!worker} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Review: {worker.name}
          </DialogTitle>
          <DialogDescription>
            Complete verification review for this worker
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="tests" className="text-xs">
                  Skills Tests
                  {testsVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="references" className="text-xs">
                  References
                  {refsVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="id" className="text-xs">
                  ID & Insurance
                  {idVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="qualifications" className="text-xs">
                  Qualifications
                  {qualsVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Basic Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {worker.name}</div>
                      <div><span className="font-medium">Location:</span> {worker.location || "Not specified"}</div>
                      <div><span className="font-medium">Roles:</span> {worker.roles?.map(r => getRoleLabel(r)).join(", ") || "None"}</div>
                      <div><span className="font-medium">Registered:</span> {new Date(worker.created_at).toLocaleDateString()}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Verification Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Skills Tests</span>
                        {testsVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>References</span>
                        {refsVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ID Verification</span>
                        {idVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Insurance</span>
                        {insuranceVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Qualifications</span>
                        {qualsVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between font-medium">
                        <span>Overall Score</span>
                        <Badge variant={worker.verification_score >= 75 ? "default" : "secondary"}>
                          {worker.verification_score}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Approval Notes (optional)</label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add notes about this approval decision..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Skills Tests Tab */}
              <TabsContent value="tests" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Skills Test Attempts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testAttempts.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No test attempts yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {testAttempts.map((test) => (
                          <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{getRoleLabel(test.role)}</p>
                              <p className="text-sm text-muted-foreground">
                                Score: {test.score}% • {new Date(test.attempted_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={test.passed ? "bg-green-500" : "bg-red-500"}>
                              {test.passed ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* References Tab */}
              <TabsContent value="references" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      References
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {references.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No references submitted.</p>
                    ) : (
                      <div className="space-y-4">
                        {references.map((ref) => (
                          <div key={ref.id} className="p-3 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{ref.referee_name}</p>
                                <p className="text-sm text-muted-foreground">{ref.referee_email}</p>
                                {ref.referee_company && (
                                  <p className="text-sm text-muted-foreground">
                                    {ref.referee_role} at {ref.referee_company}
                                  </p>
                                )}
                              </div>
                              {getStatusBadge(ref.status || "pending")}
                            </div>
                            
                            {ref.status === "pending" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Admin notes (optional)..."
                                  value={processingItem === ref.id ? adminNotes : ""}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReferenceAction(ref.id, "declined")}
                                    disabled={processingItem === ref.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" /> Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReferenceAction(ref.id, "verified")}
                                    disabled={processingItem === ref.id}
                                  >
                                    {processingItem === ref.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    Verify
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ID & Insurance Tab */}
              <TabsContent value="id" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      ID & Insurance Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {idVerifications.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No documents uploaded.</p>
                    ) : (
                      <div className="space-y-4">
                        {idVerifications.map((doc) => (
                          <div key={doc.id} className="p-3 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {doc.is_insurance ? "Insurance Document" : "ID Document"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Type: {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-primary"
                                  onClick={() => window.open(doc.document_url, "_blank")}
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> View Document
                                </Button>
                              </div>
                              {getStatusBadge(doc.status || "pending")}
                            </div>
                            
                            {doc.status === "pending" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Rejection reason (if rejecting)..."
                                  value={processingItem === doc.id ? rejectionReason : ""}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleIdVerificationAction(doc.id, "rejected")}
                                    disabled={processingItem === doc.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" /> Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleIdVerificationAction(doc.id, "verified")}
                                    disabled={processingItem === doc.id}
                                  >
                                    {processingItem === doc.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    Verify
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {doc.rejection_reason && (
                              <p className="text-sm text-destructive">
                                Rejection reason: {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Qualifications Tab */}
              <TabsContent value="qualifications" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Qualification Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {qualifications.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No qualifications uploaded.</p>
                    ) : (
                      <div className="space-y-4">
                        {qualifications.map((qual) => (
                          <div key={qual.id} className="p-3 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{formatQualification(qual.qualification_type)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Submitted: {new Date(qual.created_at).toLocaleDateString()}
                                </p>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-primary"
                                  onClick={() => window.open(qual.document_url, "_blank")}
                                >
                                  <ExternalLink className="mr-1 h-3 w-3" /> View Certificate
                                </Button>
                              </div>
                              {getStatusBadge(qual.status || "pending")}
                            </div>
                            
                            {qual.status === "pending" && (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Rejection reason (if rejecting)..."
                                  value={processingItem === qual.id ? rejectionReason : ""}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQualificationAction(qual.id, "rejected")}
                                    disabled={processingItem === qual.id}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" /> Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleQualificationAction(qual.id, "verified")}
                                    disabled={processingItem === qual.id}
                                  >
                                    {processingItem === qual.id ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    Verify
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {qual.rejection_reason && (
                              <p className="text-sm text-destructive">
                                Rejection reason: {qual.rejection_reason}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleApproval("declined")}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Decline
          </Button>
          <Button
            onClick={() => handleApproval("active")}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Approve & Go Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
