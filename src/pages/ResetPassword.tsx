import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, KeyRound } from 'lucide-react';

// Supabase parses the recovery hash and fires PASSWORD_RECOVERY. We wait for a
// live session before allowing a new password to be set.
const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast({ title: 'Password too short', description: 'Use at least 8 characters.', variant: 'destructive' });
    if (password !== confirm) return toast({ title: "Passwords don't match", variant: 'destructive' });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast({ title: 'Could not update', description: error.message, variant: 'destructive' });
    toast({ title: 'Password updated', description: "You're signed in with your new password." });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-md py-10 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2"><KeyRound className="w-8 h-8 text-primary" /></div>
            <CardTitle>Set a new password</CardTitle>
            <CardDescription>
              {ready ? 'Choose a new password for your account.' : 'Verifying reset link…'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 8 chars)" />
                <Input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" />
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;