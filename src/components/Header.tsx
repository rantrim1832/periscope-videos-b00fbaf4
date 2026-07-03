import { Button } from "@/components/ui/button";
import { Video, Search, User, Menu, Shield, LogIn, LogOut, X, Bell, Bookmark } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
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
  const { unread } = useNotifications();
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
          <Link to="/feed" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Feed
          </Link>
          <Link to="/discover" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Discover
          </Link>
          {user && (
            <Link to="/following" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Following
            </Link>
          )}
          <Link to="/browse" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Browse Properties
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
          <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
          {isAdmin && (
            <>
              <Link to="/admin/settings" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Admin Settings
              </Link>
              <Link to="/admin/safety" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Safety
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
          <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
            <Link to="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link to="/saved" aria-label="Saved">
                  <Bookmark className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link to="/notifications" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero" size="sm" className="hidden sm:flex" asChild>
                <Link to="/contribute">Post Review</Link>
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
                  to="/feed" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Feed
                </Link>
                <Link 
                  to="/discover" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Discover
                </Link>
                <Link 
                  to="/browse" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse Properties
                </Link>
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
                <Link 
                  to="/contact" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link 
                  to="/report" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Report Content
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
                      to="/admin/safety" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Safety Inbox
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
                  <>
                    <Link 
                      to="/following" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Following
                    </Link>
                    <Link 
                      to="/saved" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Saved
                    </Link>
                    <Link 
                      to="/notifications" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Notifications{unread > 0 ? ` (${unread})` : ''}
                    </Link>
                    <Link 
                      to="/profile" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/contribute" 
                      className="text-lg font-medium hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Post Review
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
