import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save } from 'lucide-react';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('setting_key');

    if (!error && data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: any) => {
    const updatedSettings = settings.map(s => 
      s.setting_key === key ? { ...s, setting_value: value } : s
    );
    setSettings(updatedSettings);
  };

  const saveSettings = async () => {
    setSaving(true);
    
    for (const setting of settings) {
      const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: setting.setting_value, updated_at: new Date().toISOString() })
        .eq('setting_key', setting.setting_key);

      if (error) {
        toast({
          title: 'Error',
          description: `Failed to save ${setting.setting_key}`,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }
    }

    toast({
      title: 'Success',
      description: 'Settings saved successfully',
    });
    setSaving(false);
  };

  const getSetting = (key: string) => {
    return settings.find(s => s.setting_key === key);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-muted-foreground">Configure platform-wide settings</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable access for non-admin users
                  </p>
                </div>
                <Switch
                  checked={getSetting('platform_maintenance')?.setting_value === true}
                  onCheckedChange={(checked) => updateSetting('platform_maintenance', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>Daily Connection Request Limit</Label>
                <Input
                  type="number"
                  value={getSetting('daily_connection_limit')?.setting_value || 10}
                  onChange={(e) => updateSetting('daily_connection_limit', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum connection requests a business can send per day
                </p>
              </div>
              <div className="space-y-2">
                <Label>Maximum CV Size (MB)</Label>
                <Input
                  type="number"
                  value={getSetting('max_cv_size_mb')?.setting_value || 10}
                  onChange={(e) => updateSetting('max_cv_size_mb', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Configuration</CardTitle>
              <CardDescription>Skills test settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pass Threshold (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={getSetting('test_pass_threshold')?.setting_value || 80}
                  onChange={(e) => updateSetting('test_pass_threshold', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum percentage required to pass skills test
                </p>
              </div>
              <div className="space-y-2">
                <Label>Lockout Period (Days)</Label>
                <Input
                  type="number"
                  value={getSetting('test_lockout_days')?.setting_value || 30}
                  onChange={(e) => updateSetting('test_lockout_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Days before a worker can retake a failed test
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking Weights</CardTitle>
              <CardDescription>Configure candidate ranking algorithm weights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getSetting('ranking_weights')?.setting_value && (
                <>
                  {Object.entries(getSetting('ranking_weights')?.setting_value || {}).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace('_', ' ')} Weight (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={value as number}
                        onChange={(e) => {
                          const weights = { ...getSetting('ranking_weights')?.setting_value };
                          weights[key] = parseInt(e.target.value);
                          updateSetting('ranking_weights', weights);
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
