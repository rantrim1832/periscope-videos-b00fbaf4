import { Button } from "@/components/ui/button";
import { Video, Search, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Header = () => {
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
          <Link to="/community" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Community
          </Link>
          <Link to="/help" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Help Center
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="hero" size="sm" className="hidden sm:flex" asChild>
            <Link to="/post">Post Review</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
