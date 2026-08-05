import { useState, useEffect } from "react";
import { useGenerateAdvisory, useListPlots } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/audio-player";
import { CalendarDays, Tractor, Droplet, Bug, Sprout, Target, Sun, Clock, CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { AdvisorySchedule, WeeklyTask } from "@workspace/api-client-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  cropType: z.string().min(2, "Crop type is required"),
  startDate: z.string().min(10, "Valid date required"),
  regionName: z.string().min(2, "Region is required"),
  soilType: z.string().optional(),
  language: z.enum(["en", "hi", "es", "fr", "sw"]).default("en"),
  plotId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function AdvisoryCalendarPage() {
  const { toast } = useToast();
  const [result, setResult] = useState<AdvisorySchedule | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  
  const generateAdvisoryMutation = useGenerateAdvisory();
  const { data: plots } = useListPlots({ query: { queryKey: ["plots"] } });

  // Get crop from URL if coming from soil page
  const searchParams = new URLSearchParams(window.location.search);
  const initialCrop = searchParams.get("crop") || "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropType: initialCrop,
      startDate: format(new Date(), "yyyy-MM-dd"),
      regionName: "",
      soilType: "",
      language: "en",
      plotId: null,
    },
  });

  const onSubmit = (values: FormValues) => {
    generateAdvisoryMutation.mutate({
      data: {
        ...values,
        plotId: values.plotId === "none" ? null : values.plotId,
      }
    }, {
      onSuccess: (data) => {
        setResult(data);
        // Expand first 3 weeks by default
        const initialExpanded: Record<number, boolean> = {};
        data.weeklyTasks.slice(0, 3).forEach(w => initialExpanded[w.week] = true);
        setExpandedWeeks(initialExpanded);
        toast({ title: "Schedule generated", description: `Created a ${data.totalDays}-day plan for ${values.cropType}.` });
      },
      onError: () => {
        toast({ title: "Failed to generate", description: "Could not create schedule. Check API keys.", variant: "destructive" });
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('soil') || c.includes('prep')) return Tractor;
    if (c.includes('sow') || c.includes('plant')) return Sprout;
    if (c.includes('fertiliz') || c.includes('nutrient')) return Target;
    if (c.includes('pest') || c.includes('weed') || c.includes('disease')) return Bug;
    if (c.includes('irrigat') || c.includes('water')) return Droplet;
    if (c.includes('harvest')) return Sun;
    return CalendarDays;
  };

  const getCategoryColor = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('soil') || c.includes('prep')) return 'bg-amber-800/10 text-amber-800 border-amber-800/20'; // Brown
    if (c.includes('sow') || c.includes('plant')) return 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20'; // Green
    if (c.includes('fertiliz')) return 'bg-blue-600/10 text-blue-700 border-blue-600/20'; // Blue
    if (c.includes('pest')) return 'bg-destructive/10 text-destructive border-destructive/20'; // Red
    if (c.includes('irrigat')) return 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20'; // Cyan
    if (c.includes('monitor')) return 'bg-warning/10 text-warning-foreground border-warning/20'; // Yellow
    if (c.includes('harvest')) return 'bg-orange-500/10 text-orange-700 border-orange-500/20'; // Orange
    return 'bg-muted text-muted-foreground';
  };

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => ({ ...prev, [week]: !prev[week] }));
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getLanguageCode = (lang: string) => {
    switch(lang) {
      case 'hi': return 'hi-IN';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'sw': return 'sw-KE';
      default: return 'en-US';
    }
  };

  const generateSpeechText = () => {
    if (!result) return "";
    return `
      Advisory Schedule for ${result.cropType}. 
      Total duration: ${result.totalDays} days. 
      Expected harvest: ${new Date(result.expectedHarvestDate).toLocaleDateString()}.
      ${result.weeklyTasks.slice(0, 3).map(w => `Week ${w.week}, focus on ${w.category}.`).join(' ')}
    `;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          Crop Cycle Planner
        </h1>
        <p className="text-muted-foreground mt-1">Generate a week-by-week actionable timeline from sowing to harvest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Form Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cropType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Maize, Soybean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start/Sowing Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="regionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region/Climate</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Sub-Saharan, Midwest US" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="soilType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soil Type (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Loam, Clay, Sandy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plotId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Plot</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plot" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {plots?.map(plot => (
                              <SelectItem key={plot.id} value={plot.id}>{plot.plotName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">🇺🇸 EN</SelectItem>
                            <SelectItem value="hi">🇮🇳 HI</SelectItem>
                            <SelectItem value="es">🇪🇸 ES</SelectItem>
                            <SelectItem value="fr">🇫🇷 FR</SelectItem>
                            <SelectItem value="sw">🇰🇪 SW</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full font-bold" 
                    disabled={generateAdvisoryMutation.isPending}
                  >
                    {generateAdvisoryMutation.isPending ? "Generating..." : "Generate Schedule"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          {generateAdvisoryMutation.isPending && (
            <Card className="h-[500px] border-primary/20 shadow-md">
              <CardContent className="h-full flex flex-col items-center justify-center text-center">
                <CalendarDays className="h-12 w-12 text-primary animate-bounce mb-4" />
                <h3 className="text-xl font-bold mb-2">Building Growth Timeline...</h3>
                <p className="text-muted-foreground">Synthesizing meteorological patterns and crop agronomy.</p>
              </CardContent>
            </Card>
          )}

          {!generateAdvisoryMutation.isPending && !result && (
            <Card className="h-[500px] bg-muted/30 border-dashed">
              <CardContent className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Tractor className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Ready to plan</h3>
                <p>Fill in the details to generate your seasonal timeline.</p>
              </CardContent>
            </Card>
          )}

          {result && !generateAdvisoryMutation.isPending && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Header Card */}
              <Card className="bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                  <Sprout className="w-64 h-64" />
                </div>
                <CardContent className="p-6 md:p-8 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                      <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-3 px-3 py-1">
                        {result.totalDays} Day Cycle
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                        {result.cropType} Schedule
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Start: {new Date(result.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sun className="w-4 h-4 text-warning" /> Harvest: {new Date(result.expectedHarvestDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-background/10 backdrop-blur-md p-3 rounded-lg border border-primary-foreground/20 w-full md:w-auto">
                      <AudioPlayer 
                        text={generateSpeechText()} 
                        language={getLanguageCode(form.getValues().language)} 
                        className="bg-transparent border-none p-0 w-full md:w-[280px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-primary/50 before:to-border">
                {result.weeklyTasks.map((week, idx) => {
                  const Icon = getCategoryIcon(week.category);
                  const isExpanded = expandedWeeks[week.week];
                  
                  return (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-card shadow shrink-0 z-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-primary/20">
                        <span className="font-bold text-sm text-foreground">{week.week}</span>
                      </div>
                      
                      {/* Card Content */}
                      <Card 
                        className={cn(
                          "w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] transition-all duration-300 border-l-4",
                          getCategoryColor(week.category).split(' ')[2].replace('border-', 'border-l-'), // Apply exact border color class to left
                          isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
                        )}
                      >
                        <div 
                          className="p-4 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleWeek(week.week)}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={cn("px-2 py-0.5 font-bold text-xs uppercase tracking-wider", getCategoryColor(week.category))}>
                                <Icon className="w-3 h-3 mr-1 inline-block" />
                                {week.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-mono">
                                {new Date(week.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <h4 className="font-bold text-lg line-clamp-1">{week.tasks[0]}</h4>
                          </div>
                          <Button variant="ghost" size="icon" className="shrink-0 rounded-full h-8 w-8">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        {isExpanded && (
                          <CardContent className="pt-0 pb-4 px-4 bg-muted/10">
                            <div className="space-y-3 pt-3 border-t">
                              {week.tasks.map((task, tIdx) => {
                                const taskId = `${week.week}-${tIdx}`;
                                const isChecked = completedTasks[taskId];
                                return (
                                  <div key={tIdx} className="flex items-start gap-3 group/task">
                                    <Checkbox 
                                      id={taskId} 
                                      checked={isChecked}
                                      onCheckedChange={() => toggleTask(taskId)}
                                      className="mt-1 shrink-0"
                                    />
                                    <label 
                                      htmlFor={taskId}
                                      className={cn(
                                        "text-sm leading-snug cursor-pointer select-none transition-colors",
                                        isChecked ? "text-muted-foreground line-through" : "text-foreground group-hover/task:text-primary"
                                      )}
                                    >
                                      {task}
                                    </label>
                                  </div>
                                );
                              })}
                              
                              {week.notes && (
                                <div className="mt-3 p-3 bg-card border rounded-md text-xs italic text-muted-foreground flex items-start gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  <p>{week.notes}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
