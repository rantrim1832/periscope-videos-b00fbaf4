import { Button } from "@/components/ui/button";
import { Video, Search, User, Menu, Shield, LogIn, LogOut, Bell, Bookmark, ChevronDown, PenLine } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRIMARY_LINKS = [
  { to: "/discover", label: "Discover" },
  { to: "/browse", label: "Browse" },
  { to: "/shorts", label: "Shorts" },
  { to: "/community", label: "Community" },
];

const ADMIN_LINKS = [
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/safety", label: "Safety inbox" },
  { to: "/admin/moderate", label: "Moderation" },
  { to: "/admin/claims", label: "Claims" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/properties", label: "Properties" },
  { to: "/admin/scraper", label: "Scraper" },
  { to: "/admin/scrape-logs", label: "Scrape logs" },
  { to: "/admin/stats", label: "Stats" },
  { to: "/admin/csv-upload", label: "CSV upload" },
];

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
          <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl shadow-card">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-none">
            <span className="block font-bold text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Periscope
            </span>
            <span className="block text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">Reviews</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none">
              More <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild><Link to="/feed">Feed</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/reviews">Reviews</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/leaderboard">Leaderboard</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/manager">For managers</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/help">Help center</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/contact">Contact</Link></DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-1.5 text-xs"><Shield className="h-3 w-3" /> Admin</DropdownMenuLabel>
                  {ADMIN_LINKS.map((l) => (
                    <DropdownMenuItem key={l.to} asChild><Link to={l.to}>{l.label}</Link></DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
            <Link to="/search" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeToggle />
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
                    <span className="absolute top-1.5 right-1.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-background">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground font-normal">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/following">Following</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/saved">Saved</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="hero" size="sm" className="hidden sm:inline-flex ml-1" asChild>
                <Link to="/contribute"><PenLine className="h-4 w-4" /> Share</Link>
              </Button>
            </>
          ) : (
            <Button variant="hero" size="sm" className="ml-1" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in</span>
              </Link>
            </Button>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0 flex flex-col">
              <SheetHeader className="p-5 border-b">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <MobileSection title="Explore">
                  <MobileLink to="/discover" onNav={() => setMobileMenuOpen(false)}>Discover</MobileLink>
                  <MobileLink to="/browse" onNav={() => setMobileMenuOpen(false)}>Browse properties</MobileLink>
                  <MobileLink to="/shorts" onNav={() => setMobileMenuOpen(false)}>Shorts</MobileLink>
                  <MobileLink to="/feed" onNav={() => setMobileMenuOpen(false)}>Feed</MobileLink>
                  <MobileLink to="/reviews" onNav={() => setMobileMenuOpen(false)}>Reviews</MobileLink>
                  <MobileLink to="/community" onNav={() => setMobileMenuOpen(false)}>Community</MobileLink>
                  <MobileLink to="/leaderboard" onNav={() => setMobileMenuOpen(false)}>Leaderboard</MobileLink>
                </MobileSection>

                {user && (
                  <MobileSection title="You">
                    <MobileLink to="/profile" onNav={() => setMobileMenuOpen(false)}>Profile</MobileLink>
                    <MobileLink to="/following" onNav={() => setMobileMenuOpen(false)}>Following</MobileLink>
                    <MobileLink to="/saved" onNav={() => setMobileMenuOpen(false)}>Saved</MobileLink>
                    <MobileLink to="/notifications" onNav={() => setMobileMenuOpen(false)}>
                      Notifications{unread > 0 ? ` · ${unread}` : ''}
                    </MobileLink>
                    <MobileLink to="/contribute" onNav={() => setMobileMenuOpen(false)}>Share an experience</MobileLink>
                  </MobileSection>
                )}

                <MobileSection title="Support">
                  <MobileLink to="/manager" onNav={() => setMobileMenuOpen(false)}>For managers</MobileLink>
                  <MobileLink to="/help" onNav={() => setMobileMenuOpen(false)}>Help center</MobileLink>
                  <MobileLink to="/contact" onNav={() => setMobileMenuOpen(false)}>Contact</MobileLink>
                  <MobileLink to="/report" onNav={() => setMobileMenuOpen(false)}>Report content</MobileLink>
                </MobileSection>

                {isAdmin && (
                  <MobileSection title={<span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Admin</span>}>
                    {ADMIN_LINKS.map((l) => (
                      <MobileLink key={l.to} to={l.to} onNav={() => setMobileMenuOpen(false)}>{l.label}</MobileLink>
                    ))}
                  </MobileSection>
                )}
              </div>
              {!user && (
                <div className="p-5 border-t">
                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4" /> Sign in
                    </Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const MobileSection = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{title}</h4>
    <div className="flex flex-col">{children}</div>
  </div>
);

const MobileLink = ({ to, onNav, children }: { to: string; onNav: () => void; children: React.ReactNode }) => (
  <Link
    to={to}
    onClick={onNav}
    className="text-[15px] py-2 px-1 rounded-md text-foreground/90 hover:text-primary hover:bg-muted/60 transition-colors"
  >
    {children}
  </Link>
);
