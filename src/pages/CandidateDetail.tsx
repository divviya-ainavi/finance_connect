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
import { Loader2, MapPin, ArrowLeft, Star, Send, CheckCircle2, MessageSquare, Briefcase, Shield, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import ReviewList from "@/components/reviews/ReviewList";

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
  photo_url?: string | null;
  hourly_rate_min?: number | null;
  hourly_rate_max?: number | null;
  available_from?: string | null;
  total_hours_per_week?: number | null;
  verification_statuses?: {
    testing_status: string;
    references_status: string;
    interview_status: string;
  };
  id_verifications?: {
    status: string;
    is_insurance: boolean;
  }[];
}

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [existingRequest, setExistingRequest] = useState<{ status: string } | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Connection request form
  const [message, setMessage] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [remoteOnsite, setRemoteOnsite] = useState("");
  const [rateOffered, setRateOffered] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [projectsDelivered, setProjectsDelivered] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || userType !== "business")) {
      navigate("/auth");
      return;
    }

    if (user && userType === "business" && id) {
      fetchWorkerProfile();
      checkIfShortlisted();
      checkExistingRequest();
      fetchReviews();
      fetchProjectsDelivered();
    }
  }, [user, userType, authLoading, id, navigate]);

  const checkExistingRequest = async () => {
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
        .from("connection_requests")
        .select("status")
        .eq("business_profile_id", businessProfile.id)
        .eq("worker_profile_id", id!)
        .maybeSingle();

      setExistingRequest(data);
    } catch (error) {
      console.error("Error checking existing request:", error);
    }
  };

  const fetchProjectsDelivered = async () => {
    try {
      const { count } = await supabase
        .from("connection_requests")
        .select("*", { count: "exact", head: true })
        .eq("worker_profile_id", id!)
        .eq("status", "accepted");
      
      setProjectsDelivered(count || 0);
    } catch (error) {
      console.error("Error fetching projects delivered:", error);
    }
  };

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
          ),
          id_verifications (
            status,
            is_insurance
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

  const fetchReviews = async () => {
    try {
      const { data: workerProfile } = await supabase
        .from("worker_profiles")
        .select("profile_id")
        .eq("id", id!)
        .single();

      if (!workerProfile) return;

      const { data } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles!reviews_reviewer_profile_id_fkey (
            id,
            business_profiles (company_name)
          )
        `)
        .eq("reviewee_profile_id", workerProfile.profile_id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(5);

      setReviews(data || []);

      if (data && data.length > 0) {
        const avg = data.reduce((acc: number, r: any) => acc + r.rating, 0) / data.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
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

  // Helper functions for verification badges
  const isSkillsVerified = () => {
    return worker?.verification_statuses && 
      ["completed", "verified", "passed"].includes(worker.verification_statuses.testing_status);
  };

  const isReferencesVerified = () => {
    return worker?.verification_statuses && 
      ["completed", "verified"].includes(worker.verification_statuses.references_status);
  };

  const hasInsurance = () => {
    return worker?.id_verifications?.some(v => v.is_insurance && v.status === "approved");
  };

  // Calculate profile completeness percentages based on actual data
  const getProfileCompleteness = () => {
    const completeness = {
      skills: 0,
      rate: 0,
      availability: 0,
      location: 0,
      industry: 0,
    };

    // Skills - based on systems and verification
    if (worker?.systems && worker.systems.length > 0) {
      completeness.skills = Math.min(100, worker.systems.length * 20);
    }
    if (isSkillsVerified()) {
      completeness.skills = 100;
    }

    // Rate - check if rate is specified
    if (worker?.hourly_rate_min && worker?.hourly_rate_max) {
      completeness.rate = 100;
    } else if (worker?.hourly_rate_min || worker?.hourly_rate_max) {
      completeness.rate = 50;
    }

    // Availability - based on availability data
    if (worker?.availability) {
      const filledDays = Object.values(worker.availability).filter((v: any) => v && v.length > 0).length;
      completeness.availability = Math.min(100, filledDays * 20);
    }

    // Location - check if location is specified
    completeness.location = worker?.location ? 100 : 0;

    // Industry - based on industries listed
    if (worker?.industries && worker.industries.length > 0) {
      completeness.industry = Math.min(100, worker.industries.length * 25);
    }

    const overall = Math.round(
      (completeness.skills + completeness.rate + completeness.availability + completeness.location + completeness.industry) / 5
    );

    return { ...completeness, overall };
  };

  const profileCompleteness = getProfileCompleteness();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/search")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        <div className="space-y-6">
          {/* Main Header Section - Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Detailed Candidate View */}
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <p className="text-sm font-medium text-muted-foreground">Detailed Candidate View</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    {worker.photo_url ? (
                      <AvatarImage src={worker.photo_url} alt={worker.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {worker.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{getDisplayName()}</h2>
                    <p className="text-muted-foreground text-sm">
                      {worker.roles.slice(0, 2).map(r => r.replace(/_/g, " ")).join(" & ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {isSkillsVerified() && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Skills Verified
                        </Badge>
                      )}
                      {isReferencesVerified() && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          References OK
                        </Badge>
                      )}
                      {hasInsurance() && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          <Shield className="h-3 w-3 mr-1" />
                          PI Insured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <span className="font-semibold text-primary flex items-center gap-1">
                      {averageRating > 0 ? (
                        <>
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          {averageRating.toFixed(1)}/5 ({reviews.length} reviews)
                        </>
                      ) : (
                        <span className="text-muted-foreground">No reviews yet</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projects via Platform</span>
                    <span className="font-semibold text-primary">{projectsDelivered} completed</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rate</span>
                    <span className="font-semibold text-primary">
                      {worker.hourly_rate_min && worker.hourly_rate_max 
                        ? `£${worker.hourly_rate_min}-${worker.hourly_rate_max}/hr`
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {worker.location || "Not specified"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completeness */}
            <Card className="shadow-medium">
              <CardHeader className="pb-3">
                <p className="text-sm font-medium text-muted-foreground">Profile Completeness</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-2 border-b">
                  <p className="text-3xl font-bold text-primary">{profileCompleteness.overall}%</p>
                  <p className="text-sm text-muted-foreground">Overall Completeness</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Skills & Systems</span>
                    <span className="text-sm font-semibold text-primary">{profileCompleteness.skills}%</span>
                  </div>
                  <Progress value={profileCompleteness.skills} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rate Information</span>
                    <span className="text-sm font-semibold text-primary">{profileCompleteness.rate}%</span>
                  </div>
                  <Progress value={profileCompleteness.rate} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Availability</span>
                    <span className="text-sm font-semibold text-primary">{profileCompleteness.availability}%</span>
                  </div>
                  <Progress value={profileCompleteness.availability} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Location</span>
                    <span className="text-sm font-semibold text-primary">{profileCompleteness.location}%</span>
                  </div>
                  <Progress value={profileCompleteness.location} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Industry Experience</span>
                    <span className="text-sm font-semibold text-primary">{profileCompleteness.industry}%</span>
                  </div>
                  <Progress value={profileCompleteness.industry} className="h-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  {existingRequest ? (
                    <Button className="flex-1" variant={existingRequest.status === 'accepted' ? 'default' : 'secondary'} disabled>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {existingRequest.status === 'pending' && 'Request Pending'}
                      {existingRequest.status === 'accepted' && 'Request Accepted'}
                      {existingRequest.status === 'declined' && 'Request Declined'}
                    </Button>
                  ) : (
                    <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          <Send className="h-4 w-4 mr-2" />
                          Send Connection Request
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
                  )}
                  <Button onClick={handleToggleShortlist} variant="outline">
                    <Star className={`h-4 w-4 mr-2 ${isShortlisted ? "fill-accent text-accent" : ""}`} />
                    {isShortlisted ? "Shortlisted" : "Add to Shortlist"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

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
                {worker.systems && worker.systems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {worker.systems.map((system) => (
                      <Badge key={system} variant="secondary">
                        {system}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No systems specified</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Industries</CardTitle>
              </CardHeader>
              <CardContent>
                {worker.industries && worker.industries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {worker.industries.map((industry) => (
                      <Badge key={industry} variant="secondary">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No industries specified</p>
                )}
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

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <ReviewSummary
                    averageRating={averageRating}
                    totalReviews={reviews.length}
                    ratingDistribution={{
                      1: reviews.filter((r) => Math.round(r.rating) === 1).length,
                      2: reviews.filter((r) => Math.round(r.rating) === 2).length,
                      3: reviews.filter((r) => Math.round(r.rating) === 3).length,
                      4: reviews.filter((r) => Math.round(r.rating) === 4).length,
                      5: reviews.filter((r) => Math.round(r.rating) === 5).length,
                    }}
                    onViewAll={() => navigate(`/reviews/worker/${id}`)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Recent Reviews
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReviewList reviews={reviews} reviewerType="business" />
                      {reviews.length >= 5 && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => navigate(`/reviews/worker/${id}`)}
                        >
                          View All Reviews
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;