import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Gamepad2 } from "lucide-react";

interface NavbarProps {
  username?: string;
}

const Navbar = ({ username }: NavbarProps) => {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Lobby", path: "/lobby" },
    { name: "Leaderboard", path: "/leaderboard" },
    { name: "Rewards", path: "/rewards" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Gamepad2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-neon">Drawn</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isActive(link.path) && "text-primary hover:text-primary"
                  )}
                >
                  {link.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Badge */}
          {username ? (
            <Badge
              variant="neon"
              className="flex items-center gap-2 px-3 py-1.5"
            >
              <User className="h-4 w-4" />
              <span>{username}</span>
            </Badge>
          ) : (
            <Link to="/create-profile">
              <Button variant="neon" size="sm">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// Helper for conditional classes
const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export default Navbar;
