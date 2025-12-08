import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Briefcase, Loader2 } from "lucide-react";
import { z } from "zod";
import { LocationPicker } from "@/components/location/LocationPicker";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);
const nameSchema = z.string().min(1, "Name is required").max(100);
const companyNameSchema = z.string().min(1, "Company name is required").max(100);

const INDUSTRIES = [
  "Accounting & Finance",
  "Technology",
  "Healthcare",
  "Legal",
  "Manufacturing",
  "Retail",
  "Construction",
  "Real Estate",
  "Professional Services",
  "Non-Profit",
  "Other",
];

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userType, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const [selectedUserType, setSelectedUserType] = useState<"worker" | "business">(
    (searchParams.get("type") as "worker" | "business") || "worker"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && userType) {
      if (userType === "worker") {
        navigate("/worker/dashboard");
      } else {
        navigate("/business/dashboard");
      }
    }
  }, [user, userType, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (selectedUserType === "worker") {
        nameSchema.parse(name);
        if (!location) {
          throw new Error("Location is required");
        }
      } else {
        companyNameSchema.parse(companyName);
        nameSchema.parse(contactName);
        if (!location) {
          throw new Error("Location is required");
        }
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            user_type: selectedUserType,
          });

        if (profileError) throw profileError;

        // Create type-specific profile
        if (selectedUserType === "worker") {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (profileData) {
            const { error: workerError } = await supabase
              .from("worker_profiles")
              .insert({
                profile_id: profileData.id,
                name: name,
                visibility_mode: "anonymous",
                location: location,
                latitude: latitude,
                longitude: longitude,
              });

            if (workerError) throw workerError;
          }
        } else {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", data.user.id)
            .single();

          if (profileData) {
            const { error: businessError } = await supabase
              .from("business_profiles")
              .insert({
                profile_id: profileData.id,
                company_name: companyName,
                contact_name: contactName,
                contact_role: contactRole || null,
                industry: industry || null,
                company_size: companySize || null,
                location: location || null,
                latitude: latitude,
                longitude: longitude,
                website: website || null,
              });

            if (businessError) throw businessError;
          }
        }

        toast({
          title: "Account created!",
          description: "Welcome to FinanceConnect.",
        });

        // Redirect based on user type
        navigate(selectedUserType === "worker" ? "/worker/dashboard" : "/business/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (userType: 'worker' | 'business') => {
    setLoading(true);
    const demoEmail = `demo.${userType}@test.com`;
    const demoPassword = 'Demo123!';

    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (!signInError) {
        toast({
          title: "Demo login successful!",
          description: `Signed in as demo ${userType}.`,
        });
        return;
      }

      // If sign in fails, create the demo account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Failed to create demo user');

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: signUpData.user.id,
          user_type: userType,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Seed type-specific data
      if (userType === 'worker') {
        await seedDemoWorker(profile.id);
      } else {
        await seedDemoBusiness(profile.id);
      }

      toast({
        title: "Demo account ready!",
        description: `Your demo ${userType} account has been created with sample data.`,
      });
    } catch (error: any) {
      console.error('Demo login error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to create demo ${userType}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const seedDemoWorker = async (profileId: string) => {
    // Create worker profile
    const { data: workerProfile, error: workerError } = await supabase
      .from('worker_profiles')
      .insert({
        profile_id: profileId,
        name: 'Alex Johnson',
        pseudonym: 'Candidate #1234',
        roles: ['bookkeeper', 'management_accountant', 'financial_controller'],
        location: 'London',
        max_commute_km: 25,
        onsite_preference: 'hybrid',
        max_days_onsite: 2,
        visibility_mode: 'anonymous',
        own_equipment: true,
        systems: ['Xero', 'Sage', 'QuickBooks', 'Excel'],
        industries: ['Professional Services', 'Retail', 'Manufacturing'],
        company_sizes: ['small', 'mid', 'large'],
        qualifications: 'ACCA Part-Qualified, AAT Level 4',
        languages: { English: { written: 'native', spoken: 'native' } },
        availability: {
          monday: ['AM', 'PM'],
          tuesday: ['AM', 'PM'],
          wednesday: ['AM', 'PM'],
          thursday: ['AM', 'PM'],
          friday: []
        },
      })
      .select()
      .single();

    if (workerError) throw workerError;

    // Add skills
    const skills = [
      { skill_name: 'AP Processing', skill_level: 4 },
      { skill_name: 'Bank Reconciliations', skill_level: 4 },
      { skill_name: 'Payroll Processing', skill_level: 3 },
      { skill_name: 'Management Reporting', skill_level: 3 },
      { skill_name: 'Budgeting', skill_level: 2 },
      { skill_name: 'Credit Control', skill_level: 3 },
    ];

    await supabase.from('worker_skills').insert(
      skills.map(skill => ({
        worker_profile_id: workerProfile.id,
        ...skill,
      }))
    );

    // Update verification status
    await supabase
      .from('verification_statuses')
      .update({
        testing_status: 'passed',
        references_status: 'in_progress',
        interview_status: 'not_started',
      })
      .eq('worker_profile_id', workerProfile.id);
  };

  const seedDemoBusiness = async (profileId: string) => {
    // Create business profile
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .insert({
        profile_id: profileId,
        company_name: 'Acme Financial Services Ltd',
        contact_name: 'Sarah Mitchell',
        contact_role: 'Finance Director',
      })
      .select()
      .single();

    if (businessError) throw businessError;

    // Get a demo worker to create connection request
    const { data: demoWorker } = await supabase
      .from('worker_profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (demoWorker) {
      // Create sample connection request
      await supabase.from('connection_requests').insert({
        business_profile_id: businessProfile.id,
        worker_profile_id: demoWorker.id,
        message: 'We are looking for part-time bookkeeping support for our growing client base.',
        hours_per_week: 20,
        remote_onsite: 'Hybrid - 1 day per week onsite',
        rate_offered: 35.00,
        status: 'pending',
      });

      // Add to shortlist
      await supabase.from('shortlists').insert({
        business_profile_id: businessProfile.id,
        worker_profile_id: demoWorker.id,
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-semibold">FinanceConnect</span>
          </div>
          <p className="text-muted-foreground">
            Sign in or create an account to get started
          </p>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Choose your account type and sign in or create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm px-0"
                      onClick={async () => {
                        if (!email) {
                          toast({
                            title: "Email required",
                            description: "Please enter your email address first.",
                            variant: "destructive",
                          });
                          return;
                        }
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Check your email",
                            description: "We've sent you a password reset link.",
                          });
                        }
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>I am a...</Label>
                    <RadioGroup value={selectedUserType} onValueChange={(v) => setSelectedUserType(v as "worker" | "business")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="worker" id="worker" />
                        <Label htmlFor="worker" className="cursor-pointer">Finance Professional</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="business" id="business" />
                        <Label htmlFor="business" className="cursor-pointer">Business Looking for Talent</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {selectedUserType === "worker" ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Your Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location <span className="text-destructive">*</span></Label>
                        <LocationPicker
                          value={location}
                          latitude={latitude}
                          longitude={longitude}
                          onChange={(loc, lat, lng) => {
                            setLocation(loc);
                            setLatitude(lat);
                            setLongitude(lng);
                          }}
                          placeholder="Search for your location..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-company">Company Name</Label>
                        <Input
                          id="signup-company"
                          type="text"
                          placeholder="Acme Corp"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-contact">Your Name</Label>
                        <Input
                          id="signup-contact"
                          type="text"
                          placeholder="Sarah Mitchell"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-role">Your Role (Optional)</Label>
                        <Input
                          id="signup-role"
                          type="text"
                          placeholder="Finance Director"
                          value={contactRole}
                          onChange={(e) => setContactRole(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Industry</Label>
                          <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((ind) => (
                                <SelectItem key={ind} value={ind}>
                                  {ind}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Company Size</Label>
                          <Select value={companySize} onValueChange={setCompanySize}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size} employees
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location <span className="text-destructive">*</span></Label>
                        <LocationPicker
                          value={location}
                          latitude={latitude}
                          longitude={longitude}
                          onChange={(loc, lat, lng) => {
                            setLocation(loc);
                            setLatitude(lat);
                            setLongitude(lng);
                          }}
                          placeholder="Search for your business address..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-website">Website (Optional)</Label>
                        <Input
                          id="signup-website"
                          type="text"
                          placeholder="www.company.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Demo Login Section */}
        <Card className="shadow-medium border-muted mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-center text-muted-foreground">
              Quick Demo Access
            </CardTitle>
            <CardDescription className="text-xs text-center">
              Test the platform instantly with pre-populated demo accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleDemoLogin('worker')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Try as Demo Worker
            </Button>
            <Button
              variant="outline"
              className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleDemoLogin('business')}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Try as Demo Business
            </Button>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button variant="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
