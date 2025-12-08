import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { openDocument } from '@/lib/storage-utils';
import { 
  ArrowLeft, Ban, CheckCircle, User, MapPin, Briefcase, 
  Clock, Calendar, Languages, GraduationCap, Shield, 
  FileText, Building2, Laptop, Star, Globe, Mail, XCircle,
  ExternalLink, Loader2
} from 'lucide-react';

interface WorkerProfile {
  id: string;
  name: string;
  location: string | null;
  roles: string[];
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  rate_negotiable: boolean | null;
  is_suspended: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  approval_status: string | null;
  created_at: string;
  photo_url: string | null;
  cv_url: string | null;
  total_hours_per_week: number | null;
  available_from: string | null;
  onsite_preference: string | null;
  max_days_onsite: number | null;
  max_commute_km: number | null;
  location_constraints: string | null;
  own_equipment: boolean | null;
  industries: string[] | null;
  company_sizes: string[] | null;
  systems: string[] | null;
  languages: any;
  availability: any;
}

interface Skill {
  id: string;
  skill_name: string;
  skill_level: number;
}

interface Qualification {
  id: string;
  qualification_type: string;
  details: string | null;
  year_obtained: number | null;
}

interface Language {
  id: string;
  language_name: string;
  spoken_level: string | null;
  written_level: string | null;
}

interface SystemProficiency {
  id: string;
  system_name: string;
  proficiency_level: number;
}

interface TestAttempt {
  id: string;
  role: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

interface Reference {
  id: string;
  referee_name: string;
  referee_email: string;
  referee_company: string | null;
  referee_role: string | null;
  status: string;
}

interface IdVerification {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  is_insurance: boolean;
  rejection_reason: string | null;
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

const onsiteLabels: Record<string, string> = {
  fully_remote: "Fully Remote",
  hybrid: "Hybrid",
  onsite: "On-site Only",
};

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [systems, setSystems] = useState<SystemProficiency[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [idVerifications, setIdVerifications] = useState<IdVerification[]>([]);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (id) fetchWorkerData();
  }, [id]);

  const fetchWorkerData = async () => {
    if (!id) return;
    
    const [workerRes, skillsRes, qualsRes, langsRes, sysRes, testsRes, refsRes, idRes] = await Promise.all([
      supabase.from('worker_profiles').select('*').eq('id', id).single(),
      supabase.from('worker_skills').select('*').eq('worker_profile_id', id),
      supabase.from('worker_qualifications').select('*').eq('worker_profile_id', id),
      supabase.from('worker_languages').select('*').eq('worker_profile_id', id),
      supabase.from('worker_system_proficiency').select('*').eq('worker_profile_id', id),
      supabase.from('test_attempts').select('*').eq('worker_profile_id', id).order('attempted_at', { ascending: false }),
      supabase.from('worker_references').select('*').eq('worker_profile_id', id),
      supabase.from('id_verifications').select('*').eq('worker_profile_id', id),
    ]);

    if (!workerRes.error && workerRes.data) {
      setWorker(workerRes.data);
      setSuspensionReason(workerRes.data.suspension_reason || '');
    }
    if (skillsRes.data) setSkills(skillsRes.data);
    if (qualsRes.data) setQualifications(qualsRes.data);
    if (langsRes.data) setLanguages(langsRes.data);
    if (sysRes.data) setSystems(sysRes.data);
    if (testsRes.data) setTestAttempts(testsRes.data);
    if (refsRes.data) setReferences(refsRes.data);
    if (idRes.data) setIdVerifications(idRes.data);
    
    setLoading(false);
  };

  const handleSuspend = async () => {
    if (!worker || !suspensionReason.trim()) {
      toast({ title: 'Error', description: 'Please provide a suspension reason', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    const { error } = await supabase
      .from('worker_profiles')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: suspensionReason,
      })
      .eq('id', worker.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to suspend professional', variant: 'destructive' });
    } else {
      setWorker({ ...worker, is_suspended: true, suspension_reason: suspensionReason });
      toast({ title: 'Professional suspended' });
    }
    setActionLoading(false);
  };

  const handleUnsuspend = async () => {
    if (!worker) return;

    setActionLoading(true);
    const { error } = await supabase
      .from('worker_profiles')
      .update({ is_suspended: false, suspended_at: null, suspension_reason: null })
      .eq('id', worker.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to unsuspend professional', variant: 'destructive' });
    } else {
      setWorker({ ...worker, is_suspended: false, suspension_reason: null });
      setSuspensionReason('');
      toast({ title: 'Professional unsuspended' });
    }
    setActionLoading(false);
  };

  const handleReferenceAction = async (refId: string, status: 'verified' | 'declined') => {
    setProcessingItem(refId);
    try {
      const { error } = await supabase
        .from('worker_references')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', refId);

      if (error) throw error;

      toast({ title: `Reference ${status}` });
      setReferences(refs => refs.map(r => r.id === refId ? { ...r, status } : r));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleIdVerificationAction = async (docId: string, status: 'verified' | 'rejected') => {
    setProcessingItem(docId);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('id_verifications')
        .update({
          status,
          rejection_reason: status === 'rejected' ? rejectionReason : null,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          verified_by: status === 'verified' ? user?.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', docId);

      if (error) throw error;

      toast({ title: `Document ${status}` });
      setIdVerifications(docs => docs.map(d => d.id === docId ? { ...d, status, rejection_reason: status === 'rejected' ? rejectionReason : null } : d));
      setRejectionReason('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingItem(null);
    }
  };

  const handleOverrideTestResult = async (testId: string, passed: boolean) => {
    setProcessingItem(testId);
    try {
      const { error } = await supabase
        .from('test_attempts')
        .update({ passed })
        .eq('id', testId);

      if (error) throw error;

      toast({ title: `Test result ${passed ? 'passed' : 'failed'} (overridden)` });
      setTestAttempts(tests => tests.map(t => t.id === testId ? { ...t, passed } : t));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingItem(null);
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  const formatQualification = (type: string) => type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Pending</Badge>;
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500">Approved</Badge>;
      case 'declined': return <Badge variant="destructive">Declined</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  // Calculate verification score
  const testsVerified = testAttempts.some(t => t.passed);
  const refsVerified = references.some(r => r.status === 'verified');
  const idVerified = idVerifications.some(v => !v.is_insurance && v.status === 'verified');
  const insuranceVerified = idVerifications.some(v => v.is_insurance && v.status === 'verified');
  const verificationScore = [testsVerified, refsVerified, idVerified, insuranceVerified].filter(Boolean).length * 25;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!worker) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Finance Professional not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/workers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-14 w-14 border-2 border-background shadow">
            <AvatarImage src={worker.photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(worker.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{worker.name}</h1>
              {getStatusBadge(worker.approval_status)}
              {worker.is_suspended && <Badge variant="destructive">Suspended</Badge>}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {worker.location || 'No location set'}
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4" />
              Joined {new Date(worker.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="skills">Skills & Systems</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rate</p>
                      <p className="font-medium">
                        {worker.hourly_rate_min 
                          ? `£${worker.hourly_rate_min}${worker.hourly_rate_max ? `-${worker.hourly_rate_max}` : ''}/hr`
                          : 'Not set'}
                        {worker.rate_negotiable && <span className="text-xs text-muted-foreground ml-1">(Negotiable)</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hours/Week</p>
                      <p className="font-medium">{worker.total_hours_per_week || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Available From</p>
                      <p className="font-medium">
                        {worker.available_from ? new Date(worker.available_from).toLocaleDateString() : 'Now'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Work Preference</p>
                      <p className="font-medium">{worker.onsite_preference ? onsiteLabels[worker.onsite_preference] : 'Not set'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.roles?.map(role => (
                        <Badge key={role} variant="secondary">{roleLabels[role] || role}</Badge>
                      ))}
                      {(!worker.roles || worker.roles.length === 0) && (
                        <span className="text-sm text-muted-foreground">No roles specified</span>
                      )}
                    </div>
                  </div>

                  {worker.cv_url && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">CV</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            const success = await openDocument(worker.cv_url!, 'cvs');
                            if (!success) {
                              toast({
                                title: "Error",
                                description: "Failed to open CV document",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View CV
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.industries?.map(ind => (
                        <Badge key={ind} variant="outline">{ind}</Badge>
                      ))}
                      {(!worker.industries || worker.industries.length === 0) && (
                        <span className="text-sm text-muted-foreground">Any industry</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Company Sizes</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.company_sizes?.map(size => (
                        <Badge key={size} variant="outline">{size}</Badge>
                      ))}
                      {(!worker.company_sizes || worker.company_sizes.length === 0) && (
                        <span className="text-sm text-muted-foreground">Any size</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Max Commute</p>
                      <p className="font-medium">{worker.max_commute_km ? `${worker.max_commute_km} km` : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Own Equipment</p>
                      <p className="font-medium">{worker.own_equipment ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {worker.location_constraints && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Location Constraints</p>
                      <p className="text-sm">{worker.location_constraints}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Qualifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {qualifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No qualifications added</p>
                  ) : (
                    <div className="space-y-3">
                      {qualifications.map(qual => (
                        <div key={qual.id} className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{formatQualification(qual.qualification_type)}</p>
                            {qual.details && <p className="text-sm text-muted-foreground">{qual.details}</p>}
                          </div>
                          {qual.year_obtained && (
                            <Badge variant="outline">{qual.year_obtained}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {languages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No languages added</p>
                  ) : (
                    <div className="space-y-3">
                      {languages.map(lang => (
                        <div key={lang.id} className="flex items-center justify-between">
                          <span className="font-medium">{lang.language_name}</span>
                          <div className="flex gap-2">
                            {lang.spoken_level && <Badge variant="secondary">Spoken: {lang.spoken_level}</Badge>}
                            {lang.written_level && <Badge variant="outline">Written: {lang.written_level}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skills & Systems Tab */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Skills Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No skills assessed</p>
                  ) : (
                    <div className="space-y-4">
                      {skills.map(skill => (
                        <div key={skill.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{skill.skill_name}</span>
                            <span className="text-sm text-muted-foreground">{skill.skill_level}/4</span>
                          </div>
                          <Progress value={(skill.skill_level / 4) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Systems */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Laptop className="h-5 w-5" />
                    Systems Proficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No systems added</p>
                  ) : (
                    <div className="space-y-4">
                      {systems.map(sys => (
                        <div key={sys.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{sys.system_name}</span>
                            <span className="text-sm text-muted-foreground">{sys.proficiency_level}/4</span>
                          </div>
                          <Progress value={(sys.proficiency_level / 4) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            {/* Verification Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold">{verificationScore}%</div>
                  <Progress value={verificationScore} className="flex-1 h-3" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${testsVerified ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <p className="text-sm font-medium">Skills Tests</p>
                    <p className={`text-xs ${testsVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {testsVerified ? 'Passed' : 'Not completed'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${refsVerified ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <p className="text-sm font-medium">References</p>
                    <p className={`text-xs ${refsVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {refsVerified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${idVerified ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <p className="text-sm font-medium">ID Check</p>
                    <p className={`text-xs ${idVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {idVerified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${insuranceVerified ? 'bg-emerald-500/10' : 'bg-muted'}`}>
                    <p className="text-sm font-medium">Insurance</p>
                    <p className={`text-xs ${insuranceVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {insuranceVerified ? 'Verified' : 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Attempts with Override */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Test Attempts</CardTitle>
                <CardDescription>View test results and override if needed</CardDescription>
              </CardHeader>
              <CardContent>
                {testAttempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No test attempts</p>
                ) : (
                  <div className="space-y-3">
                    {testAttempts.map(test => (
                      <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{roleLabels[test.role] || test.role}</p>
                          <p className="text-sm text-muted-foreground">
                            Score: {test.score}% • {new Date(test.attempted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={test.passed ? 'bg-emerald-500' : 'bg-destructive'}>
                            {test.passed ? 'Passed' : 'Failed'}
                          </Badge>
                          <div className="flex gap-2">
                            {!test.passed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOverrideTestResult(test.id, true)}
                                disabled={processingItem === test.id}
                              >
                                {processingItem === test.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Override Pass
                                  </>
                                )}
                              </Button>
                            )}
                            {test.passed && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOverrideTestResult(test.id, false)}
                                disabled={processingItem === test.id}
                              >
                                {processingItem === test.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Revoke Pass
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* References with Verification Actions */}
            <Card>
              <CardHeader>
                <CardTitle>References</CardTitle>
                <CardDescription>Verify or decline submitted references</CardDescription>
              </CardHeader>
              <CardContent>
                {references.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No references submitted</p>
                ) : (
                  <div className="space-y-4">
                    {references.map(ref => (
                      <div key={ref.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{ref.referee_name}</p>
                            <p className="text-sm text-muted-foreground">{ref.referee_role} at {ref.referee_company}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" /> {ref.referee_email}
                            </p>
                          </div>
                          <Badge className={
                            ref.status === 'verified' ? 'bg-emerald-500' : 
                            ref.status === 'declined' ? 'bg-destructive' : ''
                          }>
                            {ref.status || 'pending'}
                          </Badge>
                        </div>

                        {ref.status === 'pending' && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReferenceAction(ref.id, 'declined')}
                              disabled={processingItem === ref.id}
                            >
                              {processingItem === ref.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Decline
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReferenceAction(ref.id, 'verified')}
                              disabled={processingItem === ref.id}
                            >
                              {processingItem === ref.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID & Insurance Documents with Verification Actions */}
            <Card>
              <CardHeader>
                <CardTitle>ID & Insurance Documents</CardTitle>
                <CardDescription>Review and verify uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                {idVerifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                ) : (
                  <div className="space-y-4">
                    {idVerifications.map(doc => (
                      <div key={doc.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {doc.is_insurance ? 'Insurance Document' : 'ID Document'}
                            </p>
                            <p className="text-sm text-muted-foreground">Type: {doc.document_type}</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-primary"
                              onClick={async () => {
                                const success = await openDocument(doc.document_url, 'cvs');
                                if (!success) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to open document",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <ExternalLink className="mr-1 h-3 w-3" /> View Document
                            </Button>
                          </div>
                          <Badge className={
                            doc.status === 'verified' ? 'bg-emerald-500' : 
                            doc.status === 'rejected' ? 'bg-destructive' : ''
                          }>
                            {doc.status || 'pending'}
                          </Badge>
                        </div>

                        {doc.rejection_reason && (
                          <p className="text-sm text-destructive">
                            Rejection reason: {doc.rejection_reason}
                          </p>
                        )}

                        {doc.status === 'pending' && (
                          <div className="space-y-3 pt-2 border-t">
                            <Textarea
                              placeholder="Rejection reason (if rejecting)..."
                              value={processingItem === doc.id ? rejectionReason : ''}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIdVerificationAction(doc.id, 'rejected')}
                                disabled={processingItem === doc.id}
                              >
                                {processingItem === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleIdVerificationAction(doc.id, 'verified')}
                                disabled={processingItem === doc.id}
                              >
                                {processingItem === doc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Verify
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage finance professional account status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {worker.is_suspended ? (
                  <>
                    <div className="p-4 bg-destructive/10 rounded-lg">
                      <p className="font-medium text-destructive">This professional is suspended</p>
                      <p className="text-sm text-muted-foreground mt-1">Reason: {worker.suspension_reason}</p>
                    </div>
                    <Button onClick={handleUnsuspend} disabled={actionLoading} className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unsuspend Professional
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Suspension Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for suspension..."
                        value={suspensionReason}
                        onChange={(e) => setSuspensionReason(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleSuspend}
                      disabled={actionLoading || !suspensionReason.trim()}
                      className="w-full"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend Professional
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}