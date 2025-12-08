import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VerificationScoreBox } from "@/components/worker/VerificationScoreBox";
import { IdInsuranceUpload } from "@/components/worker/IdInsuranceUpload";

interface TestAttempt {
  role: string;
  passed: boolean;
  score: number;
  lockout_until: string | null;
  attempted_at: string;
}

interface Reference {
  id: string;
  referee_name: string;
  referee_email: string;
  referee_role: string;
  referee_company: string;
  status: string;
}

interface IdVerification {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  is_insurance: boolean;
  created_at: string;
}

interface VerificationStatus {
  testing_status: string;
  references_status: string;
  interview_status: string;
}

const Verification = () => {
  const { user, userType } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [idVerifications, setIdVerifications] = useState<IdVerification[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [approvalStatus, setApprovalStatus] = useState("pending");
  const [showAddReference, setShowAddReference] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [skippingTest, setSkippingTest] = useState<string | null>(null);
  const [newReference, setNewReference] = useState({
    name: "",
    email: "",
    role: "",
    company: "",
  });

  const handleSkipAllTests = async () => {
    if (!workerProfileId || selectedRoles.length === 0) return;
    
    setSkippingTest("all");
    try {
      // Get roles that haven't been passed yet
      const rolesToSkip = selectedRoles.filter(role => {
        const attempt = testAttempts.find(a => a.role === role);
        return !attempt?.passed;
      });

      if (rolesToSkip.length === 0) {
        return;
      }

      // Insert passed test attempts for all pending roles
      const inserts = rolesToSkip.map(role => ({
        worker_profile_id: workerProfileId,
        role: role as "accounts_payable" | "accounts_receivable" | "bookkeeper" | "payroll_clerk" | "management_accountant" | "credit_controller" | "financial_controller" | "finance_manager" | "cfo_fpa",
        passed: true,
        score: 100,
        questions_answered: { demo_skip: true },
      }));

      const { error } = await supabase.from("test_attempts").insert(inserts);
      if (error) throw error;

      toast({
        title: "Tests Skipped",
        description: "All skill tests marked as passed.",
      });
      
      fetchVerificationData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSkippingTest(null);
    }
  };

  const handleUnskipAllTests = async () => {
    if (!workerProfileId) return;
    
    setSkippingTest("all");
    try {
      // Delete test attempts that were skipped (have demo_skip flag)
      const { error } = await supabase
        .from("test_attempts")
        .delete()
        .eq("worker_profile_id", workerProfileId)
        .contains("questions_answered", { demo_skip: true });
      
      if (error) throw error;

      toast({
        title: "Tests Enabled",
        description: "You can now attend the skill tests.",
      });
      
      fetchVerificationData();
    } catch (error) {
      console.error("Error enabling tests:", error);
      toast({
        title: "Error",
        description: "Failed to enable tests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSkippingTest(null);
    }
  };

  const handleToggleSkipTest = async (enabled: boolean) => {
    setDemoMode(enabled);
    if (enabled) {
      await handleSkipAllTests();
    } else {
      await handleUnskipAllTests();
    }
  };

  useEffect(() => {
    if (!user || userType !== "worker") {
      navigate("/auth");
      return;
    }
    fetchVerificationData();
  }, [user, userType, navigate]);

  const fetchVerificationData = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!profile) return;

      const { data: workerProfile } = await supabase
        .from("worker_profiles")
        .select("id, roles, approval_status")
        .eq("profile_id", profile.id)
        .single();

      if (workerProfile) {
        setWorkerProfileId(workerProfile.id);
        setSelectedRoles(workerProfile.roles || []);
        setApprovalStatus(workerProfile.approval_status || "pending");

        // Fetch verification status
        const { data: verStatus } = await supabase
          .from("verification_statuses")
          .select("*")
          .eq("worker_profile_id", workerProfile.id)
          .single();

        setVerificationStatus(verStatus);

        // Fetch test attempts
        const { data: attempts } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("worker_profile_id", workerProfile.id)
          .order("attempted_at", { ascending: false });

        setTestAttempts(attempts || []);

        // Fetch references
        const { data: refs } = await supabase
          .from("worker_references")
          .select("*")
          .eq("worker_profile_id", workerProfile.id)
          .order("created_at", { ascending: false });

        setReferences(refs || []);

        // Fetch ID verifications
        const { data: idVers } = await supabase
          .from("id_verifications")
          .select("*")
          .eq("worker_profile_id", workerProfile.id)
          .order("created_at", { ascending: false });

        setIdVerifications(idVers || []);
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workerProfileId) return;

    const { error } = await supabase
      .from("worker_references")
      .insert({
        worker_profile_id: workerProfileId,
        referee_name: newReference.name,
        referee_email: newReference.email,
        referee_role: newReference.role,
        referee_company: newReference.company,
      });

    if (error) {
      toast({
        title: "Error adding reference",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reference added",
        description: "Your reference has been added successfully.",
      });
      setNewReference({ name: "", email: "", role: "", company: "" });
      setShowAddReference(false);
      fetchVerificationData();
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
      cfo_fpa: "CFO / FP&A",
    };
    return labels[role] || role;
  };

  const getRoleTestStatus = (role: string) => {
    const attempt = testAttempts.find((a) => a.role === role);
    if (!attempt) return { status: "not_started", icon: Clock, color: "secondary" };
    
    if (attempt.lockout_until && new Date(attempt.lockout_until) > new Date()) {
      return { status: "locked", icon: XCircle, color: "destructive", lockoutDate: attempt.lockout_until };
    }
    
    if (attempt.passed) {
      return { status: "passed", icon: CheckCircle2, color: "default" };
    }
    
    return { status: "failed", icon: XCircle, color: "destructive" };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      sent: "secondary",
      verified: "default",
      declined: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  // Calculate overall statuses for score box dynamically from actual data
  const getTestingStatus = () => {
    if (selectedRoles.length === 0) return "not_started";
    const passedTests = testAttempts.filter(a => a.passed);
    const allPassed = selectedRoles.every(role => 
      passedTests.some(a => a.role === role)
    );
    if (allPassed) return "passed";
    if (passedTests.length > 0) return "in_progress";
    return "not_started";
  };

  const getReferencesStatus = () => {
    if (references.length === 0) return "not_started";
    const verifiedRefs = references.filter(r => r.status === "verified");
    if (verifiedRefs.length >= 2) return "verified";
    if (references.length > 0) return "pending";
    return "not_started";
  };

  const getIdVerificationStatus = () => {
    const idDocs = idVerifications.filter((v) => !v.is_insurance);
    if (idDocs.length === 0) return "not_submitted";
    const verified = idDocs.some((v) => v.status === "verified");
    if (verified) return "verified";
    const rejected = idDocs.every((v) => v.status === "rejected");
    if (rejected) return "rejected";
    return "pending";
  };

  const getInsuranceStatus = () => {
    const insuranceDocs = idVerifications.filter((v) => v.is_insurance);
    if (insuranceDocs.length === 0) return "not_submitted";
    const verified = insuranceDocs.some((v) => v.status === "verified");
    if (verified) return "verified";
    const rejected = insuranceDocs.every((v) => v.status === "rejected");
    if (rejected) return "rejected";
    return "pending";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Verification</h1>
          <Button variant="outline" onClick={() => navigate("/worker/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skills Testing */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 1: Skills Testing</CardTitle>
                    <CardDescription>
                      Complete a test for each role you offer. Pass rate: 80% or higher.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 bg-accent/10 px-3 py-2 rounded-lg border border-accent/20">
                    <Zap className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Skip Test</span>
                    <Switch 
                      checked={demoMode} 
                      onCheckedChange={handleToggleSkipTest}
                      disabled={skippingTest === "all"}
                    />
                    {skippingTest === "all" && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRoles.length === 0 ? (
                  <p className="text-muted-foreground">
                    No roles selected. <Button variant="link" className="p-0" onClick={() => navigate("/worker/profile")}>Update your profile</Button> to select roles.
                  </p>
                ) : (
                  selectedRoles.map((role) => {
                    const testStatus = getRoleTestStatus(role);
                    const StatusIcon = testStatus.icon;
                    
                    return (
                      <div
                        key={role}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-5 w-5" />
                          <div>
                            <p className="font-medium">{getRoleLabel(role)}</p>
                            {testStatus.status === "locked" && (
                              <p className="text-sm text-muted-foreground">
                                Locked until {new Date(testStatus.lockoutDate!).toLocaleDateString()}
                              </p>
                            )}
                            {testStatus.status === "passed" && (
                              <p className="text-sm text-muted-foreground">Test passed</p>
                            )}
                            {testStatus.status === "failed" && (
                              <p className="text-sm text-muted-foreground">Test failed - retry available</p>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate(`/worker/test/${role}`)}
                          disabled={testStatus.status === "locked" || testStatus.status === "passed"}
                        >
                          {testStatus.status === "passed" 
                            ? "Passed" 
                            : testStatus.status === "not_started" 
                              ? "Start Test" 
                              : "Retake Test"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: References</CardTitle>
                <CardDescription>
                  Add professional references to verify your experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {references.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{ref.referee_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ref.referee_role} at {ref.referee_company}
                      </p>
                      <p className="text-sm text-muted-foreground">{ref.referee_email}</p>
                    </div>
                    {getStatusBadge(ref.status)}
                  </div>
                ))}
                
                {showAddReference ? (
                  <form onSubmit={handleAddReference} className="space-y-4 border p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newReference.name}
                          onChange={(e) => setNewReference({ ...newReference, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newReference.email}
                          onChange={(e) => setNewReference({ ...newReference, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={newReference.role}
                          onChange={(e) => setNewReference({ ...newReference, role: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={newReference.company}
                          onChange={(e) => setNewReference({ ...newReference, company: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Add Reference</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddReference(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setShowAddReference(true)} variant="outline">
                    Add Reference
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ID & Insurance Verification */}
            {workerProfileId && user && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Step 3: ID & Insurance Verification</h2>
                <IdInsuranceUpload
                  workerProfileId={workerProfileId}
                  userId={user.id}
                  idVerifications={idVerifications}
                  onRefresh={fetchVerificationData}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Verification Score */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <VerificationScoreBox
                testingStatus={getTestingStatus()}
                referencesStatus={getReferencesStatus()}
                idVerificationStatus={getIdVerificationStatus()}
                insuranceStatus={getInsuranceStatus()}
                approvalStatus={approvalStatus}
              />

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Complete all verification steps to increase your visibility and be approved to go live on the platform.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;
