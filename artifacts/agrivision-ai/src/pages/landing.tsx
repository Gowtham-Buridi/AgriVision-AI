import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Stethoscope, 
  Sprout, 
  CalendarDays, 
  CloudRain, 
  Database, 
  Languages, 
  ChevronRight,
  ShieldCheck,
  Tractor,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const stats = [
    { label: "Crops Diagnosed", value: "145k+", icon: Activity },
    { label: "Farms Served", value: "24k+", icon: Tractor },
    { label: "AI Accuracy Rate", value: "98.5%", icon: ShieldCheck },
  ];

  const features = [
    {
      title: "Crop Diagnosis",
      description: "Instantly identify plant diseases and pests via photo upload.",
      icon: Stethoscope,
      href: "/diagnosis",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Soil Analysis",
      description: "Calculate precise fertilizer needs based on soil health metrics.",
      icon: Sprout,
      href: "/soil-analysis",
      color: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Advisory Calendar",
      description: "Generate tailored weekly task schedules from sowing to harvest.",
      icon: CalendarDays,
      href: "/advisory-calendar",
      color: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Weather Risk",
      description: "Monitor environmental risks affecting your specific crop cycle.",
      icon: CloudRain,
      href: "/dashboard",
      color: "text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Field Logs",
      description: "Maintain a historical database of all your farm's activities.",
      icon: Database,
      href: "/field-logs",
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Multi-language",
      description: "Advisories and audio playback available in local languages.",
      icon: Languages,
      href: "/settings",
      color: "text-rose-600 dark:text-rose-400"
    },
  ];

  return (
    <div className="min-h-full pb-20">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 px-6 relative overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/20 border border-primary-foreground/30 text-sm font-medium mb-6">
            <Sprout className="w-4 h-4" />
            <span>A precision agronomist in your pocket</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Empowering farmers with <span className="text-warning">AI precision</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-10">
            Diagnose crop diseases, optimize soil health, and plan your seasonal cycles with data-driven confidence. Built for the field, trusted by thousands.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/diagnosis" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-bold h-14 px-8 text-lg hover-elevate">
                <Stethoscope className="mr-2 h-5 w-5" />
                Start Diagnosing
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover-elevate font-bold text-lg">
                View Command Center
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="bg-card shadow-lg border-primary/10">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground font-display tracking-tight">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Core Capabilities</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to maximize yield and mitigate risk, engineered for low connectivity and high sunlight environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Link key={i} href={feature.href} className="block group">
                <Card className="h-full border-border hover:border-primary/50 transition-all hover-elevate-1">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-4 p-3 rounded-lg bg-muted/50 w-fit">
                      <Icon className={cn("w-6 h-6", feature.color)} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm flex-grow">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                      Access Tool <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  );
}
