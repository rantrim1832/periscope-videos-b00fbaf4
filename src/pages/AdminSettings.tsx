import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    }
  };

  const makeAdmin = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      setIsAdmin(true);
      toast({
        title: "Success!",
        description: "You are now an admin",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      setIsAdmin(false);
      toast({
        title: "Admin removed",
        description: "You are no longer an admin",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
                Grant yourself admin access to manage the platform
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
                {!isAdmin ? (
                  <Button onClick={makeAdmin} disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'Processing...' : 'Make Me Admin'}
                  </Button>
                ) : (
                  <Button onClick={removeAdmin} disabled={loading} variant="destructive" className="w-full sm:w-auto">
                    {loading ? 'Processing...' : 'Remove Admin'}
                  </Button>
                )}
              </div>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
