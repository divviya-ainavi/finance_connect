import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Eye, Clock, UserCheck, UserX, Search, MapPin, Briefcase, Shield, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WorkerReviewDialog } from "@/components/admin/WorkerReviewDialog";

interface WorkerProfile {
  id: string;
  name: string;
  location: string | null;
  roles: string[];
  approval_status: string;
  is_suspended: boolean;
  created_at: string;
  approved_at: string | null;
  approval_notes: string | null;
  photo_url: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  verification_score: number;
}

const roleLabels: Record<string, string> = {
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

export default function WorkersList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

      const workersWithScores = await Promise.all(
        (data || []).map(async (worker) => {
          let score = 0;

          const { data: tests } = await supabase
            .from("test_attempts")
            .select("passed")
            .eq("worker_profile_id", worker.id);
          
          if (tests?.some((t) => t.passed)) score += 25;

          const { data: refs } = await supabase
            .from("worker_references")
            .select("status")
            .eq("worker_profile_id", worker.id);
          
          if (refs?.some((r) => r.status === "verified")) score += 25;

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (worker: WorkerProfile) => {
    if (worker.is_suspended) {
      return <Badge variant="destructive" className="gap-1"><UserX className="h-3 w-3" /> Suspended</Badge>;
    }
    switch (worker.approval_status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><UserCheck className="h-3 w-3" /> Approved</Badge>;
      case "declined":
        return <Badge variant="destructive" className="gap-1"><UserX className="h-3 w-3" /> Declined</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
    }
  };

  const getVerificationBadge = (score: number) => {
    if (score >= 100) return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{score}%</Badge>;
    if (score >= 50) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">{score}%</Badge>;
    return <Badge variant="secondary">{score}%</Badge>;
  };

  // Filter workers
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = search === "" || 
      worker.name.toLowerCase().includes(search.toLowerCase()) ||
      worker.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter === "all" || worker.roles.includes(roleFilter);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "suspended" && worker.is_suspended) ||
      (statusFilter !== "suspended" && !worker.is_suspended && worker.approval_status === statusFilter);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Tab counts
  const allCount = workers.length;
  const pendingCount = workers.filter(w => w.approval_status === "pending" && !w.is_suspended).length;
  const approvedCount = workers.filter(w => w.approval_status === "active" && !w.is_suspended).length;
  const declinedCount = workers.filter(w => w.approval_status === "declined" && !w.is_suspended).length;
  const suspendedCount = workers.filter(w => w.is_suspended).length;

  // Filter by tab
  const getTabWorkers = () => {
    switch (activeTab) {
      case "pending":
        return filteredWorkers.filter(w => w.approval_status === "pending" && !w.is_suspended);
      case "approved":
        return filteredWorkers.filter(w => w.approval_status === "active" && !w.is_suspended);
      case "declined":
        return filteredWorkers.filter(w => w.approval_status === "declined" && !w.is_suspended);
      case "suspended":
        return filteredWorkers.filter(w => w.is_suspended);
      default:
        return filteredWorkers;
    }
  };

  const displayWorkers = getTabWorkers();

  const WorkerCard = ({ worker }: { worker: WorkerProfile }) => (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
          <AvatarImage src={worker.photo_url || undefined} alt={worker.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getInitials(worker.name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{worker.name}</h3>
            {getStatusBadge(worker)}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {worker.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {worker.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(worker.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {worker.roles.slice(0, 3).map((role) => (
              <Badge key={role} variant="outline" className="text-xs font-normal">
                {roleLabels[role] || role}
              </Badge>
            ))}
            {worker.roles.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{worker.roles.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Verification:</span>
            {getVerificationBadge(worker.verification_score)}
          </div>
          {worker.hourly_rate_min && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                £{worker.hourly_rate_min}{worker.hourly_rate_max ? `-${worker.hourly_rate_max}` : ''}/hr
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/admin/workers/${worker.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {worker.approval_status === "pending" && !worker.is_suspended && (
            <Button
              size="sm"
              onClick={() => setSelectedWorker(worker)}
            >
              Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance Professionals</h1>
          <p className="text-muted-foreground">
            Manage and approve finance professionals on the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("all")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{allCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setActiveTab("pending")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => setActiveTab("approved")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setActiveTab("declined")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold text-destructive">{declinedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setActiveTab("suspended")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspended</p>
                  <p className="text-2xl font-bold text-destructive">{suspendedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Professional Management</CardTitle>
                <CardDescription>
                  Search, filter and manage all finance professionals
                </CardDescription>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 bg-muted/50">
                  <TabsTrigger value="all" className="gap-2">
                    All ({allCount})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Pending ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Approved ({approvedCount})
                  </TabsTrigger>
                  <TabsTrigger value="declined" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Declined ({declinedCount})
                  </TabsTrigger>
                  <TabsTrigger value="suspended" className="gap-2">
                    <UserX className="h-4 w-4" />
                    Suspended ({suspendedCount})
                  </TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  {displayWorkers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No professionals found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {displayWorkers.map((worker) => (
                        <WorkerCard key={worker.id} worker={worker} />
                      ))}
                    </div>
                  )}
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <WorkerReviewDialog
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onApprovalComplete={handleApprovalComplete}
        />
      </div>
    </AdminLayout>
  );
}