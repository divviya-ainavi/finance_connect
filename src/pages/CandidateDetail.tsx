import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, MapPin, ArrowLeft, Star, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerProfile {
  id: string;
  name: string;
  pseudonym: string;
  visibility_mode: string;
  roles: string[];
  location: string;
  max_commute_km: number;
  onsite_preference: string;
  max_days_onsite: number;
  systems: string[];
  industries: string[];
  company_sizes: string[];
  qualifications: string;
  own_equipment: boolean;
  availability: any;
  verification_statuses?: {
    testing_status: string;
    references_status: string;
    interview_status: string;
  };
}

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Connection request form
  const [message, setMessage] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [remoteOnsite, setRemoteOnsite] = useState("");
  const [rateOffered, setRateOffered] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || userType !== "business")) {
      navigate("/auth");
      return;
    }

    if (user && userType === "business" && id) {
      fetchWorkerProfile();
      checkIfShortlisted();
    }
  }, [user, userType, authLoading, id, navigate]);

  const fetchWorkerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("worker_profiles")
        .select(`
          *,
          verification_statuses (
            testing_status,
            references_status,
            interview_status
          )
        `)
        .eq("id", id!)
        .single();

      if (error) throw error;
      setWorker(data);
    } catch (error) {
      console.error("Error fetching worker profile:", error);
      toast({
        title: "Error loading profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfShortlisted = async () => {
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

      const { data } = await supabase
        .from("shortlists")
        .select("id")
        .eq("business_profile_id", businessProfile.id)
        .eq("worker_profile_id", id!)
        .maybeSingle();

      setIsShortlisted(!!data);
    } catch (error) {
      console.error("Error checking shortlist:", error);
    }
  };

  const handleToggleShortlist = async () => {
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

      if (isShortlisted) {
        const { error } = await supabase
          .from("shortlists")
          .delete()
          .eq("business_profile_id", businessProfile.id)
          .eq("worker_profile_id", id!);

        if (error) throw error;
        setIsShortlisted(false);
        toast({ title: "Removed from shortlist" });
      } else {
        const { error } = await supabase
          .from("shortlists")
          .insert([{
            business_profile_id: businessProfile.id,
            worker_profile_id: id!,
          }]);

        if (error) throw error;
        setIsShortlisted(true);
        toast({ title: "Added to shortlist" });
      }
    } catch (error) {
      console.error("Error toggling shortlist:", error);
      toast({
        title: "Error updating shortlist",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendRequest = async () => {
    if (!message || !hoursPerWeek || !remoteOnsite) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
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

      const { error } = await supabase
        .from("connection_requests")
        .insert([{
          business_profile_id: businessProfile.id,
          worker_profile_id: id!,
          message,
          hours_per_week: parseInt(hoursPerWeek),
          remote_onsite: remoteOnsite,
          rate_offered: rateOffered ? parseFloat(rateOffered) : null,
          status: "pending",
        }]);

      if (error) throw error;

      toast({
        title: "Connection request sent",
        description: "The candidate will be notified of your request.",
      });
      setRequestDialogOpen(false);
      navigate("/business/dashboard");
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error sending request",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getDisplayName = () => {
    if (!worker) return "";
    return worker.name;
  };

  const getVerificationStatus = (status: string) => {
    if (["completed", "verified", "passed"].includes(status)) {
      return <CheckCircle2 className="h-4 w-4 text-accent" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-muted" />;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Candidate not found</h2>
          <Button onClick={() => navigate("/search")}>Browse Candidates</Button>
        </div>
      </div>
    );
  }

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/search")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{getDisplayName()}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{worker.location || "Location not specified"}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={handleToggleShortlist} variant="outline" className="flex-1">
                  <Star className={`h-4 w-4 mr-2 ${isShortlisted ? "fill-accent text-accent" : ""}`} />
                  {isShortlisted ? "Shortlisted" : "Add to Shortlist"}
                </Button>
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Request Connection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Connection Request</DialogTitle>
                      <DialogDescription>
                        Provide details about the role you're offering
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Introduce your company and the opportunity..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hours">Hours Per Week *</Label>
                        <Input
                          id="hours"
                          type="number"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                          placeholder="e.g., 20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="workmode">Work Mode *</Label>
                        <Select value={remoteOnsite} onValueChange={setRemoteOnsite}>
                          <SelectTrigger id="workmode">
                            <SelectValue placeholder="Select work mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="onsite">Onsite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate Offered (£/hour)</Label>
                        <Input
                          id="rate"
                          type="number"
                          value={rateOffered}
                          onChange={(e) => setRateOffered(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSendRequest} disabled={sending} className="flex-1">
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Request"
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Job Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {worker.roles.map((role) => (
                  <Badge key={role} variant="default">
                    {role.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Preferences */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Onsite Preference</p>
                <p className="font-medium capitalize">{worker.onsite_preference?.replace(/_/g, " ")}</p>
              </div>
              {worker.max_commute_km && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Commute</p>
                  <p className="font-medium">{worker.max_commute_km} km</p>
                </div>
              )}
              {worker.max_days_onsite && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Days Onsite</p>
                  <p className="font-medium">{worker.max_days_onsite} days/week</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Own Equipment</p>
                <p className="font-medium">{worker.own_equipment ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          {worker.availability && Object.keys(worker.availability).length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Weekly Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{day}</div>
                      <div className="flex gap-2">
                        {worker.availability[day]?.map((slot: string) => (
                          <Badge key={slot} variant="secondary">
                            {slot}
                          </Badge>
                        )) || <span className="text-sm text-muted-foreground">Not available</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Systems & Industries */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {worker.systems?.map((system) => (
                    <Badge key={system} variant="secondary">
                      {system}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {worker.industries?.map((industry) => (
                    <Badge key={industry} variant="secondary">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Sizes */}
          {worker.company_sizes && worker.company_sizes.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Preferred Company Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {worker.company_sizes.map((size) => (
                    <Badge key={size} variant="outline">
                      {size} employees
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {worker.qualifications && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{worker.qualifications}</p>
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          {worker.verification_statuses && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {getVerificationStatus(worker.verification_statuses.testing_status)}
                  <div>
                    <p className="font-medium">Skills Testing</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {worker.verification_statuses.testing_status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getVerificationStatus(worker.verification_statuses.references_status)}
                  <div>
                    <p className="font-medium">References</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {worker.verification_statuses.references_status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getVerificationStatus(worker.verification_statuses.interview_status)}
                  <div>
                    <p className="font-medium">Interview</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {worker.verification_statuses.interview_status.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;