import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Save, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { value: "accounts_payable", label: "Accounts Payable" },
  { value: "accounts_receivable", label: "Accounts Receivable" },
  { value: "bookkeeper", label: "Bookkeeper" },
  { value: "payroll_clerk", label: "Payroll Clerk" },
  { value: "management_accountant", label: "Management Accountant" },
  { value: "credit_controller", label: "Credit Controller" },
  { value: "financial_controller", label: "Financial Controller" },
];

const SYSTEMS = ["Xero", "Sage", "QuickBooks", "SAP", "Oracle", "Excel", "NetSuite", "Dynamics"];
const INDUSTRIES = ["Professional Services", "Retail", "Manufacturing", "Technology", "Healthcare", "Finance"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = ["AM", "PM", "Evening"];

const WorkerProfile = () => {
  const navigate = useNavigate();
  const { user, userType, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [visibilityMode, setVisibilityMode] = useState<"anonymous" | "fully_disclosed">("anonymous");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [maxCommuteKm, setMaxCommuteKm] = useState("");
  const [onsitePreference, setOnsitePreference] = useState<string>("");
  const [maxDaysOnsite, setMaxDaysOnsite] = useState("");
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState("");
  const [ownEquipment, setOwnEquipment] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || userType !== "worker")) {
      navigate("/auth");
      return;
    }

    if (user && userType === "worker") {
      fetchProfile();
    }
  }, [user, userType, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profileData) return;

      const { data, error } = await supabase
        .from("worker_profiles")
        .select("*")
        .eq("profile_id", profileData.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileId(data.id);
        setName(data.name || "");
        setPseudonym(data.pseudonym || "");
        setVisibilityMode(data.visibility_mode || "anonymous");
        setSelectedRoles(data.roles || []);
        setLocation(data.location || "");
        setMaxCommuteKm(data.max_commute_km?.toString() || "");
        setOnsitePreference(data.onsite_preference || "");
        setMaxDaysOnsite(data.max_days_onsite?.toString() || "");
        setAvailability(data.availability as Record<string, string[]> || {});
        setSelectedSystems(data.systems || []);
        setSelectedIndustries(data.industries || []);
        setSelectedCompanySizes(data.company_sizes || []);
        setQualifications(data.qualifications || "");
        setOwnEquipment(data.own_equipment || false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 10;
    
    if (name) completed++;
    if (selectedRoles.length > 0) completed++;
    if (location) completed++;
    if (onsitePreference) completed++;
    if (Object.keys(availability).length > 0) completed++;
    if (selectedSystems.length > 0) completed++;
    if (selectedIndustries.length > 0) completed++;
    if (selectedCompanySizes.length > 0) completed++;
    if (qualifications) completed++;
    if (visibilityMode === "anonymous" ? pseudonym : true) completed++;
    
    return (completed / total) * 100;
  };

  const handleSave = async () => {
    if (!name || selectedRoles.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please provide your name and select at least one role.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      const profilePayload = {
        profile_id: profileData!.id,
        name,
        pseudonym: visibilityMode === "anonymous" ? pseudonym : null,
        visibility_mode: visibilityMode,
        roles: selectedRoles as any,
        location,
        max_commute_km: maxCommuteKm ? parseInt(maxCommuteKm) : null,
        onsite_preference: onsitePreference as any || null,
        max_days_onsite: maxDaysOnsite ? parseInt(maxDaysOnsite) : null,
        availability,
        systems: selectedSystems,
        industries: selectedIndustries,
        company_sizes: selectedCompanySizes,
        qualifications,
        own_equipment: ownEquipment,
      };

      if (profileId) {
        const { error } = await supabase
          .from("worker_profiles")
          .update(profilePayload)
          .eq("id", profileId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("worker_profiles")
          .insert([profilePayload]);

        if (error) throw error;
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });
      
      navigate("/worker/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleSystem = (system: string) => {
    setSelectedSystems((prev) =>
      prev.includes(system) ? prev.filter((s) => s !== system) : [...prev, system]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const toggleCompanySize = (size: string) => {
    setSelectedCompanySizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleAvailability = (day: string, slot: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: updated };
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/worker/dashboard")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground">
            Complete your profile to be discovered by businesses
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-6 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              {progress === 100 && <CheckCircle2 className="h-5 w-5 text-accent" />}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Basics */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Anonymous Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide your real name from businesses
                  </p>
                </div>
                <Switch
                  checked={visibilityMode === "anonymous"}
                  onCheckedChange={(checked) =>
                    setVisibilityMode(checked ? "anonymous" : "fully_disclosed")
                  }
                />
              </div>

              {visibilityMode === "anonymous" && (
                <div>
                  <Label htmlFor="pseudonym">Pseudonym</Label>
                  <Input
                    id="pseudonym"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="e.g., Candidate #1234"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Job Roles *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Badge
                    key={role.value}
                    variant={selectedRoles.includes(role.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRole(role.value)}
                  >
                    {role.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Location & Commute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or region"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commute">Max Commute (km)</Label>
                  <Input
                    id="commute"
                    type="number"
                    value={maxCommuteKm}
                    onChange={(e) => setMaxCommuteKm(e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div>
                  <Label htmlFor="onsite">Onsite Preference</Label>
                  <Select value={onsitePreference} onValueChange={setOnsitePreference}>
                    <SelectTrigger id="onsite">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully_remote">Fully Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {onsitePreference === "hybrid" && (
                <div>
                  <Label htmlFor="maxDays">Max Days Onsite Per Week</Label>
                  <Input
                    id="maxDays"
                    type="number"
                    value={maxDaysOnsite}
                    onChange={(e) => setMaxDaysOnsite(e.target.value)}
                    placeholder="2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
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
                      {TIME_SLOTS.map((slot) => (
                        <Badge
                          key={slot}
                          variant={
                            availability[day]?.includes(slot) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleAvailability(day, slot)}
                        >
                          {slot}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Systems */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Systems & Software</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SYSTEMS.map((system) => (
                  <Badge
                    key={system}
                    variant={selectedSystems.includes(system) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSystem(system)}
                  >
                    {system}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Industries */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((industry) => (
                  <Badge
                    key={industry}
                    variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleIndustry(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Company Sizes */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Preferred Company Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((size) => (
                  <Badge
                    key={size}
                    variant={selectedCompanySizes.includes(size) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCompanySize(size)}
                  >
                    {size} employees
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g., AAT Level 4, ACCA Part-Qualified"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Own Equipment</Label>
                  <p className="text-sm text-muted-foreground">
                    I have my own computer and software
                  </p>
                </div>
                <Switch checked={ownEquipment} onCheckedChange={setOwnEquipment} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/worker/dashboard")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;