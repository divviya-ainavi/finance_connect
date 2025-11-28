import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, MapPin, ArrowLeft, Trash2, UserPlus, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShortlistedWorker {
  id: string;
  worker_profile: {
    id: string;
    name: string;
    pseudonym: string;
    visibility_mode: string;
    roles: string[];
    location: string;
    systems: string[];
    industries: string[];
    verification_statuses?: {
      testing_status: string;
      references_status: string;
      interview_status: string;
    };
  };
}

const BusinessShortlist = () => {
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState<ShortlistedWorker[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || userType !== "business")) {
      navigate("/auth");
      return;
    }

    if (user && userType === "business") {
      fetchShortlist();
    }
  }, [user, userType, authLoading, navigate]);

  const fetchShortlist = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profileData) return;

      const { data: businessProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("profile_id", profileData.id)
        .single();

      if (!businessProfile) return;

      const { data, error } = await supabase
        .from("shortlists")
        .select(`
          id,
          worker_profile:worker_profiles (
            id,
            name,
            pseudonym,
            visibility_mode,
            roles,
            location,
            systems,
            industries,
            verification_statuses (
              testing_status,
              references_status,
              interview_status
            )
          )
        `)
        .eq("business_profile_id", businessProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShortlist(data || []);
    } catch (error) {
      console.error("Error fetching shortlist:", error);
      toast({
        title: "Error loading shortlist",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (shortlistId: string) => {
    try {
      const { error } = await supabase
        .from("shortlists")
        .delete()
        .eq("id", shortlistId);

      if (error) throw error;

      setShortlist((prev) => prev.filter((item) => item.id !== shortlistId));
      toast({
        title: "Removed from shortlist",
        description: "Candidate has been removed.",
      });
    } catch (error) {
      console.error("Error removing from shortlist:", error);
      toast({
        title: "Error removing candidate",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDisplayName = (worker: ShortlistedWorker["worker_profile"]) => {
    if (worker.visibility_mode === "anonymous" && worker.pseudonym) {
      return worker.pseudonym;
    }
    return worker.name;
  };

  const getVerificationCount = (worker: ShortlistedWorker["worker_profile"]) => {
    if (!worker.verification_statuses) return 0;
    const status = worker.verification_statuses;
    let count = 0;
    if (["completed", "verified", "passed"].includes(status.testing_status)) count++;
    if (["completed", "verified"].includes(status.references_status)) count++;
    if (["completed"].includes(status.interview_status)) count++;
    return count;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/business/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold">Your Shortlist</h1>
          </div>
          <p className="text-muted-foreground">
            Candidates you've saved for later review
          </p>
        </div>

        {shortlist.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your shortlist by browsing candidates
              </p>
              <Button onClick={() => navigate("/search")}>
                Browse Candidates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {shortlist.map((item) => {
              const worker = item.worker_profile;
              return (
                <Card key={item.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">
                        {getDisplayName(worker)}
                      </CardTitle>
                      {worker.visibility_mode === "anonymous" && (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {worker.location || "Location not specified"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {worker.roles && worker.roles.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {worker.roles.slice(0, 3).map((role) => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {role.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {worker.roles.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{worker.roles.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {worker.systems && worker.systems.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Systems</p>
                        <div className="flex flex-wrap gap-1">
                          {worker.systems.slice(0, 4).map((system) => (
                            <Badge key={system} variant="secondary" className="text-xs">
                              {system}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      {getVerificationCount(worker)}/3 Verifications Complete
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/candidate/${worker.id}`)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        View & Request
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessShortlist;