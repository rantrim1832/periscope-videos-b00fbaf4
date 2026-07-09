import { useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Loader2, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-md py-10 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2"><KeyRound className="w-8 h-8 text-primary" /></div>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter your email and we'll send a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3">
                <p className="text-sm">If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.</p>
                <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it in a minute.</p>
                <Link to="/auth" className="text-sm text-primary hover:underline">Back to sign in</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
                </Button>
                <div className="text-center">
                  <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">Back to sign in</Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;