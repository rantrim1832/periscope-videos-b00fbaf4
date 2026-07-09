import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Crown, Users, Settings } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminSettings = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Admin Settings</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your admin privileges and access</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Admin Status
              </CardTitle>
              <CardDescription>
                Your administrative access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4">
                <div className="flex items-center gap-3">
                  <Shield className={`w-6 h-6 md:w-8 md:h-8 ${isAdmin ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm md:text-base">Current Status</p>
                    <p className={`text-xs md:text-sm ${isAdmin ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {isAdmin ? 'Admin Access Granted' : 'Standard User'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Admin roles are provisioned by existing administrators. To grant
                the first admin, seed the role directly via the Supabase dashboard.
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Admin Tools
                </CardTitle>
                <CardDescription>
                  Quick access to admin features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start text-sm md:text-base" variant="outline">
                  <Link to="/admin/moderate">
                    <Shield className="w-4 h-4 mr-2" />
                    Moderate Content
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start text-sm md:text-base" variant="outline">
                  <Link to="/admin/scraper">
                    <Users className="w-4 h-4 mr-2" />
                    Property Scraper
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start text-sm md:text-base" variant="outline">
                  <Link to="/admin/curated">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Curated video library
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
