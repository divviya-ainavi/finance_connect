import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, Clock, UserCheck, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkerReviewDialog } from "@/components/admin/WorkerReviewDialog";

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

const WorkerApproval = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerForApproval[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerForApproval | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchAllWorkers();
  }, []);

  const fetchAllWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate verification score for each worker
      const workersWithScores = await Promise.all(
        (data || []).map(async (worker) => {
          let score = 0;

          // Check test attempts
          const { data: tests } = await supabase
            .from("test_attempts")
            .select("passed")
            .eq("worker_profile_id", worker.id);
          
          if (tests?.some((t) => t.passed)) score += 25;

          // Check references
          const { data: refs } = await supabase
            .from("worker_references")
            .select("status")
            .eq("worker_profile_id", worker.id);
          
          if (refs?.some((r) => r.status === "verified")) score += 25;

          // Check ID verification
          const { data: idVers } = await supabase
            .from("id_verifications")
            .select("status, is_insurance")
            .eq("worker_profile_id", worker.id);
          
          if (idVers?.some((v) => !v.is_insurance && v.status === "verified")) score += 25;
          if (idVers?.some((v) => v.is_insurance && v.status === "verified")) score += 25;

          return {
            ...worker,
            verification_score: score,
          };
        })
      );

      setWorkers(workersWithScores);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalComplete = async () => {
    setSelectedWorker(null);
    setLoading(true);
    await fetchAllWorkers();
  };

  const getRoleLabels = (roles: string[]) => {
    const labels: Record<string, string> = {
      accounts_payable: "AP",
      accounts_receivable: "AR",
      bookkeeper: "Bookkeeper",
      payroll_clerk: "Payroll",
      management_accountant: "Mgmt Acct",
      credit_controller: "Credit Ctrl",
      financial_controller: "FC",
      finance_manager: "FM",
      cfo_fpa: "CFO/FP&A",
    };
    return roles.map((r) => labels[r] || r).join(", ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingWorkers = workers.filter(w => w.approval_status === "pending");
  const approvedWorkers = workers.filter(w => w.approval_status === "active");
  const declinedWorkers = workers.filter(w => w.approval_status === "declined");

  const renderWorkerTable = (workerList: WorkerForApproval[], showActions: boolean = true) => (
    workerList.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        No workers in this category.
      </p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workerList.map((worker) => (
            <TableRow key={worker.id}>
              <TableCell className="font-medium">{worker.name}</TableCell>
              <TableCell className="text-sm">
                {getRoleLabels(worker.roles || [])}
              </TableCell>
              <TableCell>{worker.location || "—"}</TableCell>
              <TableCell>
                <Badge variant={worker.verification_score >= 75 ? "default" : "secondary"}>
                  {worker.verification_score}%
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(worker.approval_status)}</TableCell>
              <TableCell>
                {worker.approved_at 
                  ? new Date(worker.approved_at).toLocaleDateString()
                  : new Date(worker.created_at).toLocaleDateString()
                }
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/admin/workers/${worker.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {showActions && worker.approval_status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Worker Approval</h1>
          <p className="text-muted-foreground">
            Review and manage worker approvals before they go live on the platform.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingWorkers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedWorkers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{declinedWorkers.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Worker Management</CardTitle>
            <CardDescription>
              View all workers and their approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingWorkers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Approved ({approvedWorkers.length})
                  </TabsTrigger>
                  <TabsTrigger value="declined" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Declined ({declinedWorkers.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                  {renderWorkerTable(pendingWorkers, true)}
                </TabsContent>
                <TabsContent value="approved">
                  {renderWorkerTable(approvedWorkers, false)}
                </TabsContent>
                <TabsContent value="declined">
                  {renderWorkerTable(declinedWorkers, false)}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Review Dialog */}
        <WorkerReviewDialog
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onApprovalComplete={handleApprovalComplete}
        />
      </div>
    </AdminLayout>
  );
};

export default WorkerApproval;
