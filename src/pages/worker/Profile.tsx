import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, Save, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RateExpectations } from "@/components/worker/RateExpectations";
import { SkillsMatrix } from "@/components/worker/SkillsMatrix";
import { SystemsProficiency } from "@/components/worker/SystemsProficiency";
import { LanguagesSection } from "@/components/worker/LanguagesSection";
import { QualificationsSection } from "@/components/worker/QualificationsSection";
const ROLES = [{
  value: "accounts_payable",
  label: "Accounts Payable"
}, {
  value: "accounts_receivable",
  label: "Accounts Receivable"
}, {
  value: "bookkeeper",
  label: "Bookkeeper"
}, {
  value: "payroll_clerk",
  label: "Payroll Clerk"
}, {
  value: "management_accountant",
  label: "Management Accountant"
}, {
  value: "credit_controller",
  label: "Credit Controller"
}, {
  value: "financial_controller",
  label: "Financial Controller"
}, {
  value: "finance_manager",
  label: "Finance Manager"
}, {
  value: "cfo_fpa",
  label: "CFO / FP&A"
}];
const INDUSTRIES = ["Professional Services", "Retail", "Manufacturing", "Technology", "Healthcare", "Finance", "Construction", "Hospitality", "Non-profit"];
const COMPANY_SIZES = [
  { value: "micro", label: "Micro (1-10)" },
  { value: "sme", label: "SME (10-250)" },
  { value: "mid_large", label: "Mid/Large (250+)" },
  { value: "multi_entity", label: "Multi-entity groups" }
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = ["AM", "PM", "Evening"];
const WorkerProfile = () => {
  const navigate = useNavigate();
  const {
    user,
    userType,
    loading: authLoading
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form state - Basic
  const [name, setName] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [visibilityMode, setVisibilityMode] = useState<"anonymous" | "fully_disclosed">("anonymous");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Rate expectations
  const [rateMin, setRateMin] = useState(0);
  const [rateMax, setRateMax] = useState(0);
  const [rateNegotiable, setRateNegotiable] = useState(false);
  
  // Location & Travel
  const [location, setLocation] = useState("");
  const [locationMode, setLocationMode] = useState<"distance" | "time">("distance");
  const [maxCommuteKm, setMaxCommuteKm] = useState("");
  const [travelTimeMinutes, setTravelTimeMinutes] = useState("");
  const [locationConstraints, setLocationConstraints] = useState("");
  const [onsitePreference, setOnsitePreference] = useState<string>("");
  const [maxDaysOnsite, setMaxDaysOnsite] = useState("");
  
  // Availability
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [totalHoursPerWeek, setTotalHoursPerWeek] = useState("");
  
  // Skills, Systems, Languages, Qualifications
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [systems, setSystems] = useState<Record<string, number>>({});
  const [languages, setLanguages] = useState<Array<{ name: string; written: string; spoken: string }>>([]);
  const [qualifications, setQualifications] = useState<Array<{ type: string; details: string; year: number | null }>>([]);
  
  // CV upload
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Industries & Company Sizes
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>([]);
  
  // Equipment
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

      // Fetch worker profile
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
        
        // Rate expectations
        setRateMin(data.hourly_rate_min || 0);
        setRateMax(data.hourly_rate_max || 0);
        setRateNegotiable(data.rate_negotiable || false);
        
        // Location
        setLocation(data.location || "");
        setMaxCommuteKm(data.max_commute_km?.toString() || "");
        setTravelTimeMinutes(data.travel_time_minutes?.toString() || "");
        setLocationConstraints(data.location_constraints || "");
        setLocationMode(data.travel_time_minutes ? "time" : "distance");
        setOnsitePreference(data.onsite_preference || "");
        setMaxDaysOnsite(data.max_days_onsite?.toString() || "");
        
        // Availability
        setAvailability(data.availability as Record<string, string[]> || {});
        setTotalHoursPerWeek(data.total_hours_per_week?.toString() || "");
        
        // Industries & Company Sizes
        setSelectedIndustries(data.industries || []);
        setSelectedCompanySizes(data.company_sizes || []);
        setOwnEquipment(data.own_equipment || false);
        setCvUrl(data.cv_url || null);

        // Fetch skills
        const { data: skillsData } = await supabase
          .from("worker_skills")
          .select("*")
          .eq("worker_profile_id", data.id);
        
        if (skillsData) {
          const skillsMap: Record<string, number> = {};
          skillsData.forEach(skill => {
            skillsMap[skill.skill_name] = skill.skill_level;
          });
          setSkills(skillsMap);
        }

        // Fetch system proficiency
        const { data: systemsData } = await supabase
          .from("worker_system_proficiency")
          .select("*")
          .eq("worker_profile_id", data.id);
        
        if (systemsData) {
          const systemsMap: Record<string, number> = {};
          systemsData.forEach(sys => {
            systemsMap[sys.system_name] = sys.proficiency_level;
          });
          setSystems(systemsMap);
        }

        // Fetch languages
        const { data: languagesData } = await supabase
          .from("worker_languages")
          .select("*")
          .eq("worker_profile_id", data.id);
        
        if (languagesData) {
          setLanguages(languagesData.map(lang => ({
            name: lang.language_name,
            written: lang.written_level || "basic",
            spoken: lang.spoken_level || "basic"
          })));
        }

        // Fetch qualifications
        const { data: qualsData } = await supabase
          .from("worker_qualifications")
          .select("*")
          .eq("worker_profile_id", data.id);
        
        if (qualsData) {
          setQualifications(qualsData.map(qual => ({
            type: qual.qualification_type,
            details: qual.details || "",
            year: qual.year_obtained
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };
  const calculateProgress = () => {
    let completed = 0;
    const total = 14;
    
    if (name) completed++;
    if (selectedRoles.length > 0) completed++;
    if (rateMin > 0 && rateMax > 0) completed++;
    if (location) completed++;
    if (onsitePreference) completed++;
    if (Object.keys(availability).length > 0) completed++;
    if (totalHoursPerWeek) completed++;
    if (Object.keys(skills).length > 0) completed++;
    if (Object.keys(systems).length > 0) completed++;
    if (selectedIndustries.length > 0) completed++;
    if (selectedCompanySizes.length > 0) completed++;
    if (qualifications.length > 0) completed++;
    if (languages.length > 0) completed++;
    if (visibilityMode === "anonymous" ? pseudonym : true) completed++;
    
    return (completed / total) * 100;
  };
  
  const handleCvUpload = async (file: File) => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      console.error('CV upload error:', uploadError);
      throw uploadError;
    }
    
    const { data: urlData } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  };

  const handleCvDelete = async () => {
    if (!user || !cvUrl) return;
    
    try {
      const fileName = cvUrl.split('/').slice(-2).join('/');
      const { error } = await supabase.storage
        .from('cvs')
        .remove([fileName]);
      
      if (error) throw error;
      
      setCvUrl(null);
      setCvFile(null);
      
      toast({
        title: "Success",
        description: "CV deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: "Error",
        description: "Failed to delete CV",
        variant: "destructive",
      });
    }
  };
  
  const handleSave = async () => {
    if (!name || selectedRoles.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please provide your name and select at least one role.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    setUploading(true);
    try {
      // Upload CV if new file selected
      let newCvUrl = cvUrl;
      if (cvFile) {
        newCvUrl = await handleCvUpload(cvFile);
      }
      
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
        hourly_rate_min: rateMin || null,
        hourly_rate_max: rateMax || null,
        rate_negotiable: rateNegotiable,
        location,
        max_commute_km: locationMode === "distance" && maxCommuteKm ? parseInt(maxCommuteKm) : null,
        travel_time_minutes: locationMode === "time" && travelTimeMinutes ? parseInt(travelTimeMinutes) : null,
        location_constraints: locationConstraints || null,
        onsite_preference: onsitePreference as any || null,
        max_days_onsite: maxDaysOnsite ? parseInt(maxDaysOnsite) : null,
        availability,
        total_hours_per_week: totalHoursPerWeek ? parseFloat(totalHoursPerWeek) : null,
        industries: selectedIndustries,
        company_sizes: selectedCompanySizes,
        own_equipment: ownEquipment,
        cv_url: newCvUrl
      };

      let workerProfileId = profileId;

      if (profileId) {
        const { error } = await supabase
          .from("worker_profiles")
          .update(profilePayload)
          .eq("id", profileId);
        if (error) throw error;
      } else {
        const { data: newProfile, error } = await supabase
          .from("worker_profiles")
          .insert([profilePayload])
          .select()
          .single();
        if (error) throw error;
        workerProfileId = newProfile.id;
        setProfileId(workerProfileId);
      }

      // Save skills
      if (workerProfileId) {
        // Delete existing skills
        await supabase
          .from("worker_skills")
          .delete()
          .eq("worker_profile_id", workerProfileId);

        // Insert new skills
        const skillsToInsert = Object.entries(skills)
          .filter(([_, level]) => level > 0)
          .map(([skillName, level]) => ({
            worker_profile_id: workerProfileId,
            skill_name: skillName,
            skill_level: level
          }));

        if (skillsToInsert.length > 0) {
          await supabase.from("worker_skills").insert(skillsToInsert);
        }

        // Save system proficiency
        await supabase
          .from("worker_system_proficiency")
          .delete()
          .eq("worker_profile_id", workerProfileId);

        const systemsToInsert = Object.entries(systems)
          .filter(([_, level]) => level > 0)
          .map(([systemName, level]) => ({
            worker_profile_id: workerProfileId,
            system_name: systemName,
            proficiency_level: level
          }));

        if (systemsToInsert.length > 0) {
          await supabase.from("worker_system_proficiency").insert(systemsToInsert);
        }

        // Save languages
        await supabase
          .from("worker_languages")
          .delete()
          .eq("worker_profile_id", workerProfileId);

        const languagesToInsert = languages.map(lang => ({
          worker_profile_id: workerProfileId,
          language_name: lang.name,
          written_level: lang.written,
          spoken_level: lang.spoken
        }));

        if (languagesToInsert.length > 0) {
          await supabase.from("worker_languages").insert(languagesToInsert);
        }

        // Save qualifications
        await supabase
          .from("worker_qualifications")
          .delete()
          .eq("worker_profile_id", workerProfileId);

        const qualsToInsert = qualifications.map(qual => ({
          worker_profile_id: workerProfileId,
          qualification_type: qual.type as any,
          details: qual.details || null,
          year_obtained: qual.year
        }));

        if (qualsToInsert.length > 0) {
          await supabase.from("worker_qualifications").insert(qualsToInsert);
        }
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully."
      });
      navigate("/worker/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  const toggleCompanySize = (size: string) => {
    setSelectedCompanySizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleAvailability = (day: string, slot: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(slot) 
        ? daySlots.filter(s => s !== slot) 
        : [...daySlots, slot];
      return { ...prev, [day]: updated };
    });
  };
  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  const progress = calculateProgress();
  return <div className="min-h-screen bg-gradient-subtle">
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
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Anonymous Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide your real name from businesses
                  </p>
                </div>
                <Switch checked={visibilityMode === "anonymous"} onCheckedChange={checked => setVisibilityMode(checked ? "anonymous" : "fully_disclosed")} />
              </div>

              {visibilityMode === "anonymous" && <div>
                  <Label htmlFor="pseudonym">Pseudonym</Label>
                  <Input id="pseudonym" value={pseudonym} onChange={e => setPseudonym(e.target.value)} placeholder="e.g., Candidate #1234" />
                </div>}
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Roles Offered *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
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

          {/* Rate Expectations */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Rate Expectations</CardTitle>
            </CardHeader>
            <CardContent>
              <RateExpectations
                rateMin={rateMin}
                rateMax={rateMax}
                negotiable={rateNegotiable}
                onRateMinChange={setRateMin}
                onRateMaxChange={setRateMax}
                onNegotiableChange={setRateNegotiable}
              />
            </CardContent>
          </Card>

          {/* Location & Travel */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Location & Travel Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Home Base Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or postcode"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Commute</Label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={locationMode === "distance"}
                      onChange={() => setLocationMode("distance")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Distance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={locationMode === "time"}
                      onChange={() => setLocationMode("time")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Travel Time</span>
                  </label>
                </div>

                {locationMode === "distance" ? (
                  <Input
                    type="number"
                    value={maxCommuteKm}
                    onChange={(e) => setMaxCommuteKm(e.target.value)}
                    placeholder="e.g., 25 km"
                  />
                ) : (
                  <Input
                    type="number"
                    value={travelTimeMinutes}
                    onChange={(e) => setTravelTimeMinutes(e.target.value)}
                    placeholder="e.g., 30 minutes"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="locationConstraints">Location Constraints (optional)</Label>
                <Input
                  id="locationConstraints"
                  value={locationConstraints}
                  onChange={(e) => setLocationConstraints(e.target.value)}
                  placeholder='e.g., "Only South London" or "Croydon area"'
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="onsite">Remote/Onsite Preference</Label>
                  <Select value={onsitePreference} onValueChange={setOnsitePreference}>
                    <SelectTrigger id="onsite">
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully_remote">Fully Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">Onsite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(onsitePreference === "hybrid" || onsitePreference === "onsite") && (
                  <div>
                    <Label htmlFor="maxDays">Max Days Onsite Per Week</Label>
                    <Input
                      id="maxDays"
                      type="number"
                      value={maxDaysOnsite}
                      onChange={(e) => setMaxDaysOnsite(e.target.value)}
                      placeholder="e.g., 2"
                      min="1"
                      max="5"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CV Upload - Only visible in fully disclosed mode */}
          {visibilityMode === "fully_disclosed" && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>CV / Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cv-upload">Upload CV (PDF or Word)</Label>
                  <p className="text-sm text-muted-foreground">
                    Your CV will be visible to businesses when you're in fully disclosed mode. Max 10MB.
                  </p>
                  <Input
                    id="cv-upload"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10485760) {
                          toast({
                            title: "Error",
                            description: "File size must be less than 10MB",
                            variant: "destructive",
                          });
                          return;
                        }
                        setCvFile(file);
                      }
                    }}
                  />
                </div>
                
                {cvFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1">{cvFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCvFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                
                {cvUrl && !cvFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm flex-1">Current CV uploaded</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCvDelete}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="totalHours">Total Hours Available Per Week</Label>
                <Input
                  id="totalHours"
                  type="number"
                  value={totalHoursPerWeek}
                  onChange={(e) => setTotalHoursPerWeek(e.target.value)}
                  placeholder="e.g., 20"
                  step="0.5"
                />
              </div>

              <div>
                <Label className="mb-3 block">Weekly Recurring Availability</Label>
                <div className="space-y-2">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium">{day}</div>
                      <div className="flex gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <Badge
                            key={slot}
                            variant={availability[day]?.includes(slot) ? "default" : "outline"}
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
              </div>
            </CardContent>
          </Card>

          {/* Skills Matrix */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Rate your proficiency in each skill (0 = No experience, 4 = Expert)
              </p>
            </CardHeader>
            <CardContent>
              <SkillsMatrix skills={skills} onSkillChange={(skill, level) => setSkills(prev => ({ ...prev, [skill]: level }))} />
            </CardContent>
          </Card>

          {/* Systems & Tools */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Systems & Software Proficiency</CardTitle>
              <p className="text-sm text-muted-foreground">
                Rate your proficiency with each system (0 = None, 4 = Expert)
              </p>
            </CardHeader>
            <CardContent>
              <SystemsProficiency
                systems={systems}
                onSystemChange={(system, level) => setSystems(prev => ({ ...prev, [system]: level }))}
                onSystemRemove={(system) => setSystems(prev => {
                  const updated = { ...prev };
                  delete updated[system];
                  return updated;
                })}
              />
            </CardContent>
          </Card>

          {/* Industries */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Industry Experience</CardTitle>
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
                    key={size.value}
                    variant={selectedCompanySizes.includes(size.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCompanySize(size.value)}
                  >
                    {size.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
            </CardHeader>
            <CardContent>
              <QualificationsSection
                qualifications={qualifications}
                onQualificationAdd={(qual) => setQualifications(prev => [...prev, qual])}
                onQualificationRemove={(index) => setQualifications(prev => prev.filter((_, i) => i !== index))}
              />
            </CardContent>
          </Card>

          {/* Languages */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguagesSection
                languages={languages}
                onLanguageAdd={(lang) => setLanguages(prev => [...prev, lang])}
                onLanguageRemove={(index) => setLanguages(prev => prev.filter((_, i) => i !== index))}
                onLanguageChange={(index, field, value) => {
                  setLanguages(prev => prev.map((lang, i) => 
                    i === index ? { ...lang, [field]: value } : lang
                  ));
                }}
              />
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Equipment & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Own Equipment</Label>
                  <p className="text-sm text-muted-foreground">
                    I have my own computer and necessary software
                  </p>
                </div>
                <Switch checked={ownEquipment} onCheckedChange={setOwnEquipment} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving || uploading} className="flex-1">
              {(saving || uploading) ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </> : <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>}
            </Button>
            <Button variant="outline" onClick={() => navigate("/worker/dashboard")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default WorkerProfile;