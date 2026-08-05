import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  LayoutDashboard, 
  Stethoscope, 
  Sprout, 
  CalendarDays, 
  Database, 
  Settings,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const navItems = [
  { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
  { href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { href: "/diagnosis", icon: <Stethoscope className="w-5 h-5" />, label: "Crop Diagnosis" },
  { href: "/soil-analysis", icon: <Sprout className="w-5 h-5" />, label: "Soil Health" },
  { href: "/advisory-calendar", icon: <CalendarDays className="w-5 h-5" />, label: "Crop Planner" },
  { href: "/field-logs", icon: <Database className="w-5 h-5" />, label: "Field Logs" },
  { href: "/settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
];

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-sm transition-colors",
      active 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card shadow-sm z-10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
            <Sprout className="w-6 h-6" />
            AgriVision AI
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={location === item.href} 
            />
          ))}
        </nav>
        <div className="p-4 border-t mt-auto text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AgriVision AI
        </div>
      </aside>

      {/* Mobile Sidebar & Header */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-primary">
            <Sprout className="w-5 h-5" />
            AgriVision
          </Link>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="p-6 border-b">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary">
                  <Sprout className="w-6 h-6" />
                  AgriVision AI
                </Link>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavItem 
                    key={item.href} 
                    href={item.href} 
                    icon={item.icon} 
                    label={item.label} 
                    active={location === item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
