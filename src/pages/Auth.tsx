import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Video } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = '0x4AAAAAADyx4N9eVSdP9fV4';

// Cloudflare Turnstile is scoped to production domains. On preview / localhost
// the widget gets stuck on "Verifying…", so we bypass it there. Production
// (joinperiscope.com + periscope-videos.lovable.app) still enforces it.
const CAPTCHA_ENFORCED_HOSTS = new Set([
  'joinperiscope.com',
  'www.joinperiscope.com',
  'periscope-videos.lovable.app',
]);
const isCaptchaEnforced = () =>
  typeof window !== 'undefined' && CAPTCHA_ENFORCED_HOSTS.has(window.location.hostname);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [isSignUp, setIsSignUp] = useState(!!returnTo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Route new users (no chosen intent) into onboarding; returning users home.
    // Falls back to home in demo mode / if the profile table isn't reachable.
    (async () => {
      try {
        // Admins land straight in Mission Control (/admin dashboard).
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: adminRow } = await (supabase as any)
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();
          if (adminRow) {
            navigate(returnTo && returnTo.startsWith('/') ? returnTo : '/admin');
            return;
          }
        } catch {
          // fall through to default routing
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('resident_profile').select('intent').eq('id', user.id).maybeSingle();
        const dest = returnTo && returnTo.startsWith('/') ? returnTo : (!error && data && !data.intent ? '/welcome' : '/');
        navigate(dest);
      } catch {
        navigate(returnTo && returnTo.startsWith('/') ? returnTo : '/');
      }
    })();
  }, [user, navigate, returnTo]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const enforced = isCaptchaEnforced();
      if (enforced && !captchaToken) {
        toast({
          title: 'Verification required',
          description: 'Please complete the captcha challenge.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (enforced) {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          'verify-turnstile',
          { body: { token: captchaToken } }
        );
        if (verifyError || !verifyData?.success) {
          turnstileRef.current?.reset();
          setCaptchaToken(null);
          throw new Error('Captcha verification failed. Please try again.');
        }
      }

      if (isSignUp) {
        const redirectUrl = returnTo && returnTo.startsWith('/')
          ? `${window.location.origin}${returnTo}`
          : `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Account created successfully. You can now sign in.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Signed in successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg">
              <Video className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Sign up to start posting reviews' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
            {!isSignUp && (
              <div className="text-center">
                <a href="/forgot-password" className="text-xs text-primary hover:underline">Forgot your password?</a>
              </div>
            )}
            {isCaptchaEnforced() ? (
              <div className="flex justify-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                  options={{ theme: 'auto' }}
                />
              </div>
            ) : (
              <p className="text-[11px] text-center text-muted-foreground">
                Captcha disabled on preview · enforced on joinperiscope.com
              </p>
            )}
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
          <div className="mt-3 text-center border-t pt-3">
            <a
              href="/admin"
              className="text-xs font-medium text-primary hover:underline"
            >
              Admin? Go to Mission Control →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
