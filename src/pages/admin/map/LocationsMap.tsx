import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationMap, MapMarker } from '@/components/location/LocationMap';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, Users, Building2, Filter, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const ROLES = [
  { value: 'accounts_payable', label: 'Accounts Payable' },
  { value: 'accounts_receivable', label: 'Accounts Receivable' },
  { value: 'bookkeeper', label: 'Bookkeeper' },
  { value: 'payroll_clerk', label: 'Payroll Clerk' },
  { value: 'management_accountant', label: 'Management Accountant' },
  { value: 'credit_controller', label: 'Credit Controller' },
  { value: 'financial_controller', label: 'Financial Controller' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'cfo_fpa', label: 'CFO / FP&A' },
];

interface WorkerData {
  id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  roles: string[];
  approval_status: string | null;
  verification_status?: {
    testing_status: string | null;
    references_status: string | null;
  } | null;
}

interface BusinessData {
  id: string;
  company_name: string;
  logo_url: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  industry: string | null;
}

const LocationsMap = () => {
  const { loading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  // Filter state
  const [showWorkers, setShowWorkers] = useState(true);
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [locationSearch, setLocationSearch] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalBusinesses: 0,
    workersWithLocation: 0,
    businessesWithLocation: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading]);

  useEffect(() => {
    applyFilters();
  }, [workers, businesses, showWorkers, showBusinesses, selectedRole, verificationFilter, approvalFilter, locationSearch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch workers with verification status
      const { data: workersData, error: workersError } = await supabase
        .from('worker_profiles')
        .select(`
          id,
          name,
          photo_url,
          location,
          latitude,
          longitude,
          roles,
          approval_status,
          verification_statuses (
            testing_status,
            references_status
          )
        `);

      if (workersError) throw workersError;

      // Fetch businesses
      const { data: businessesData, error: businessesError } = await supabase
        .from('business_profiles')
        .select('id, company_name, logo_url, location, latitude, longitude, industry');

      if (businessesError) throw businessesError;

      const processedWorkers = (workersData || []).map((w: any) => ({
        ...w,
        verification_status: w.verification_statuses?.[0] || null,
      }));

      setWorkers(processedWorkers);
      setBusinesses(businessesData || []);

      // Calculate stats
      setStats({
        totalWorkers: processedWorkers.length,
        totalBusinesses: (businessesData || []).length,
        workersWithLocation: processedWorkers.filter((w: WorkerData) => w.latitude && w.longitude).length,
        businessesWithLocation: (businessesData || []).filter((b: BusinessData) => b.latitude && b.longitude).length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const newMarkers: MapMarker[] = [];

    // Filter and add workers
    if (showWorkers) {
      let filteredWorkers = workers.filter((w) => w.latitude && w.longitude);

      // Role filter
      if (selectedRole !== 'all') {
        filteredWorkers = filteredWorkers.filter((w) => w.roles?.includes(selectedRole));
      }

      // Verification filter
      if (verificationFilter !== 'all') {
        filteredWorkers = filteredWorkers.filter((w) => {
          const testingPassed = w.verification_status?.testing_status === 'passed';
          const refsPassed = w.verification_status?.references_status === 'verified';
          
          if (verificationFilter === 'verified') return testingPassed && refsPassed;
          if (verificationFilter === 'partial') return testingPassed || refsPassed;
          if (verificationFilter === 'unverified') return !testingPassed && !refsPassed;
          return true;
        });
      }

      // Approval filter
      if (approvalFilter !== 'all') {
        filteredWorkers = filteredWorkers.filter((w) => w.approval_status === approvalFilter);
      }

      // Location search
      if (locationSearch) {
        filteredWorkers = filteredWorkers.filter((w) =>
          w.location?.toLowerCase().includes(locationSearch.toLowerCase())
        );
      }

      filteredWorkers.forEach((worker) => {
        const roleLabels = (worker.roles || [])
          .map((r) => ROLES.find((role) => role.value === r)?.label || r)
          .slice(0, 2)
          .join(', ');
        
        const initials = worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        newMarkers.push({
          id: worker.id,
          lat: worker.latitude!,
          lng: worker.longitude!,
          label: worker.name,
          type: 'worker',
          photoUrl: worker.photo_url,
          initials,
          popupContent: `
            <div style="min-width: 200px;">
              <strong>${worker.name}</strong><br/>
              <span style="color: #666; font-size: 12px;">${roleLabels}</span><br/>
              <span style="color: #888; font-size: 11px;">${worker.location || 'No location'}</span><br/>
              <span style="font-size: 11px; color: ${worker.approval_status === 'active' ? 'green' : 'orange'};">
                Status: ${worker.approval_status || 'pending'}
              </span>
            </div>
          `,
        });
      });
    }

    // Filter and add businesses
    if (showBusinesses) {
      let filteredBusinesses = businesses.filter((b) => b.latitude && b.longitude);

      // Location search
      if (locationSearch) {
        filteredBusinesses = filteredBusinesses.filter((b) =>
          b.location?.toLowerCase().includes(locationSearch.toLowerCase())
        );
      }

      filteredBusinesses.forEach((business) => {
        const initials = business.company_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        
        newMarkers.push({
          id: business.id,
          lat: business.latitude!,
          lng: business.longitude!,
          label: business.company_name,
          type: 'business',
          photoUrl: business.logo_url,
          initials,
          popupContent: `
            <div style="min-width: 200px;">
              <strong>${business.company_name}</strong><br/>
              <span style="color: #666; font-size: 12px;">${business.industry || 'No industry'}</span><br/>
              <span style="color: #888; font-size: 11px;">${business.location || 'No location'}</span>
            </div>
          `,
        });
      });
    }

    setMarkers(newMarkers);
  };

  const clearFilters = () => {
    setSelectedRole('all');
    setVerificationFilter('all');
    setApprovalFilter('all');
    setLocationSearch('');
    setShowWorkers(true);
    setShowBusinesses(true);
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Locations Map
          </h1>
          <p className="text-muted-foreground">
            View all finance professionals and businesses on the map
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Professionals</p>
                  <p className="text-xl font-bold">
                    {stats.workersWithLocation} / {stats.totalWorkers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Businesses</p>
                  <p className="text-xl font-bold">
                    {stats.businessesWithLocation} / {stats.totalBusinesses}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">On Map</p>
                  <p className="text-xl font-bold">{markers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Filters Active</p>
                  <p className="text-xl font-bold">
                    {[
                      selectedRole !== 'all',
                      verificationFilter !== 'all',
                      approvalFilter !== 'all',
                      locationSearch !== '',
                      !showWorkers,
                      !showBusinesses,
                    ].filter(Boolean).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show/Hide Toggles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Show on Map</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-workers"
                    checked={showWorkers}
                    onCheckedChange={(checked) => setShowWorkers(!!checked)}
                  />
                  <label htmlFor="show-workers" className="text-sm flex items-center gap-1 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    Professionals
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-businesses"
                    checked={showBusinesses}
                    onCheckedChange={(checked) => setShowBusinesses(!!checked)}
                  />
                  <label htmlFor="show-businesses" className="text-sm flex items-center gap-1 cursor-pointer">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    Businesses
                  </label>
                </div>
              </div>

              {/* Location Search */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location Search</Label>
                <Input
                  placeholder="Search location..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                />
              </div>

              {/* Role Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verification Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Verification Status</Label>
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Fully Verified</SelectItem>
                    <SelectItem value="partial">Partially Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approval Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Approval Status</Label>
                <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Legend</Label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                    <span>Finance Professional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-accent border-2 border-white shadow" />
                    <span>Business</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="lg:col-span-3">
            <CardContent className="p-0 overflow-hidden rounded-lg">
              {markers.length > 0 ? (
                <LocationMap markers={markers} height="600px" />
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-muted/30">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No locations to display</p>
                    <p className="text-sm">Try adjusting your filters or add locations to profiles</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LocationsMap;
