import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Briefcase, Loader2, MapPin, CheckCircle, Star, Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerProfile {
  id: string;
  name: string;
  pseudonym: string;
  roles: string[];
  location: string;
  onsite_preference: string;
  visibility_mode: string;
  industries: string[];
  systems: string[];
  available_from: string | null;
  verification_statuses?: {
    testing_status: string;
    references_status: string;
    interview_status: string;
  };
}

const Search = () => {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<WorkerProfile[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<WorkerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("any");

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchTerm, roleFilter, locationFilter, availabilityFilter]);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select(`
          *,
          verification_statuses (testing_status, references_status, interview_status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    // Search term
    if (searchTerm) {
      filtered = filtered.filter((c) =>
        c.systems?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.industries?.some((i) => i.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Role filter
    if (roleFilter && roleFilter !== "all") {
      filtered = filtered.filter((c) => c.roles?.includes(roleFilter));
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter((c) =>
        c.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Availability filter
    if (availabilityFilter && availabilityFilter !== "any") {
      const now = new Date();
      filtered = filtered.filter((c) => {
        if (!c.available_from) return true; // No available_from = available immediately
        const availableDate = new Date(c.available_from);
        
        if (availabilityFilter === "now") return availableDate <= now;
        if (availabilityFilter === "1week") {
          const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return availableDate <= oneWeek;
        }
        if (availabilityFilter === "2weeks") {
          const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          return availableDate <= twoWeeks;
        }
        if (availabilityFilter === "1month") {
          const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return availableDate <= oneMonth;
        }
        return true;
      });
    }

    setFilteredCandidates(filtered);
  };

  const getDisplayName = (candidate: WorkerProfile) => {
    return candidate.name;
  };

  const getAvailabilityText = (candidate: WorkerProfile) => {
    if (!candidate.available_from) return "Available now";
    const availableDate = new Date(candidate.available_from);
    const now = new Date();
    if (availableDate <= now) return "Available now";
    return `Available from ${availableDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  };

  const getVerificationCount = (candidate: WorkerProfile) => {
    if (!candidate.verification_statuses) return 0;
    const status = candidate.verification_statuses;
    let count = 0;
    if (["completed", "verified", "passed"].includes(status.testing_status)) count++;
    if (["completed", "verified"].includes(status.references_status)) count++;
    if (["completed"].includes(status.interview_status)) count++;
    return count;
  };

  const handleCandidateClick = (candidateId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to view candidate details and send connection requests.",
      });
      navigate("/auth?type=business");
      return;
    }
    navigate(`/candidate/${candidateId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">Part-Time Finance People</span>
          </div>
          <div className="flex gap-2">
            {!user ? (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate(userType === "worker" ? "/worker/dashboard" : "/business/dashboard")}>
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Finance Talent</h1>
          <p className="text-muted-foreground">
            Browse verified finance professionals. {!user && "Sign in to send connection requests."}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Skills or Systems</Label>
                <Input
                  id="search"
                  placeholder="e.g. Xero, SAP"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="accounts_payable">Accounts Payable</SelectItem>
                    <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                    <SelectItem value="bookkeeper">Bookkeeper</SelectItem>
                    <SelectItem value="payroll_clerk">Payroll Clerk</SelectItem>
                    <SelectItem value="management_accountant">Management Accountant</SelectItem>
                    <SelectItem value="credit_controller">Credit Controller</SelectItem>
                    <SelectItem value="financial_controller">Financial Controller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City or region"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="availability">Available within</Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger id="availability">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="now">Now</SelectItem>
                    <SelectItem value="1week">1 week</SelectItem>
                    <SelectItem value="2weeks">2 weeks</SelectItem>
                    <SelectItem value="1month">1 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredCandidates.length} candidates
        </div>

        {filteredCandidates.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No candidates match your search criteria. Try adjusting your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <Card 
                key={candidate.id} 
                className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer"
                onClick={() => handleCandidateClick(candidate.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">
                      {getDisplayName(candidate)}
                    </CardTitle>
                    <Badge variant={candidate.available_from && new Date(candidate.available_from) > new Date() ? "outline" : "default"}>
                      {getAvailabilityText(candidate)}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {candidate.location || "Location not specified"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.roles && candidate.roles.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Roles</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.roles.slice(0, 2).map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {candidate.roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{candidate.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {candidate.systems && candidate.systems.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Systems</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.systems.slice(0, 3).map((system) => (
                          <Badge key={system} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">
                      {getVerificationCount(candidate)}/3 Verifications Complete
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
