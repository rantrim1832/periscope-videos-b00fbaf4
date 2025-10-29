import { Button } from "@/components/ui/button";
import { Video, Search, User, Menu, Shield, LogIn, LogOut, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  const { isAdmin } = useAdmin();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully",
    });
    navigate('/');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-lg">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Pariscope
            </h1>
            <p className="text-[10px] text-muted-foreground leading-none">Reviews</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/reviews" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Reviews
          </Link>
          <Link to="/shorts" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Shorts
          </Link>
          <Link to="/community" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Community
          </Link>
          <Link to="/help" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Help Center
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/settings" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Admin Settings
              </Link>
              <Link to="/admin/scraper" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Scraper
              </Link>
              <Link to="/admin/scrape-logs" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Scrape Logs
              </Link>
              <Link to="/admin/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Properties
              </Link>
              <Link to="/admin/stats" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Stats
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero" size="sm" className="hidden sm:flex" asChild>
                <Link to="/post">Post Review</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/reviews" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </Link>
                <Link 
                  to="/shorts" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shorts
                </Link>
                <Link 
                  to="/community" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Community
                </Link>
                <Link 
                  to="/help" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help Center
                </Link>
                {isAdmin && (
                  <>
                    <Link 
                      to="/admin/settings" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Settings
                    </Link>
                    <Link 
                      to="/admin/scraper" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Scraper
                    </Link>
                    <Link 
                      to="/admin/scrape-logs" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Scrape Logs
                    </Link>
                    <Link 
                      to="/admin/properties" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Properties
                    </Link>
                    <Link 
                      to="/admin/stats" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Stats
                    </Link>
                  </>
                )}
                {user && (
                  <Link 
                    to="/post" 
                    className="text-lg font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Post Review
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
