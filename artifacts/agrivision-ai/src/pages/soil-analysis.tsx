import { useState } from "react";
import { useAnalyzeSoil, useListPlots } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AudioPlayer } from "@/components/audio-player";
import { Sprout, TestTube2, Droplet, ArrowRight, Activity, CalendarDays, Factory, FlaskConical, CircleAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SoilAnalysisResult } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  phLevel: z.number().min(3).max(11),
  nitrogenPpm: z.number().min(0).max(1000),
  phosphorusPpm: z.number().min(0).max(1000),
  potassiumPpm: z.number().min(0).max(1000),
  organicMatterPct: z.number().min(0).max(20).optional(),
  targetCrop: z.string().min(2, "Target crop is required"),
  language: z.enum(["en", "hi", "es", "fr", "sw"]).default("en"),
  plotId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function SoilAnalysisPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<SoilAnalysisResult | null>(null);
  
  const analyzeSoilMutation = useAnalyzeSoil();
  const { data: plots } = useListPlots({ query: { queryKey: ["plots"] } });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phLevel: 6.5,
      nitrogenPpm: 40,
      phosphorusPpm: 30,
      potassiumPpm: 120,
      organicMatterPct: 2.5,
      targetCrop: "",
      language: "en",
      plotId: null,
    },
  });

  const onSubmit = (values: FormValues) => {
    analyzeSoilMutation.mutate({
      data: {
        ...values,
        plotId: values.plotId === "none" ? null : values.plotId,
      }
    }, {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: "Analysis complete", description: "Soil health recommendations generated." });
      },
      onError: () => {
        toast({ title: "Analysis failed", description: "Could not generate recommendations. Check API keys.", variant: "destructive" });
      }
    });
  };

  const getHealthRatingColor = (rating: string) => {
    switch(rating) {
      case 'Optimal': return 'bg-success/20 text-success border-success/30';
      case 'Deficient': return 'bg-warning/20 text-warning-foreground border-warning/30';
      case 'Toxic/Excess': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'Imbalanced': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
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
      Soil Health Rating: ${result.overallHealthRating}. 
      pH Analysis: ${result.phAnalysis}. 
      Nutrient Deficiencies: ${result.nutrientDeficiencies.join(", ")}. 
      Irrigation Advice: ${result.irrigationAdvice}.
    `;
  };

  const handleGenerateCalendar = () => {
    if (result && form.getValues().targetCrop) {
      const crop = encodeURIComponent(form.getValues().targetCrop);
      setLocation(`/advisory-calendar?crop=${crop}`);
    } else {
      setLocation("/advisory-calendar");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TestTube2 className="h-8 w-8 text-primary" />
          Soil Health Planner
        </h1>
        <p className="text-muted-foreground mt-1">Input soil test data to get precise fertilizer regimens and amendments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soil Test Parameters</CardTitle>
              <CardDescription>Enter metrics from your latest soil test</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="phLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel>pH Level</FormLabel>
                          <span className="font-mono font-bold text-primary">{field.value.toFixed(1)}</span>
                        </div>
                        <FormControl>
                          <Slider
                            min={3.0}
                            max={11.0}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={(val) => field.onChange(val[0])}
                            className="py-2"
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>Acidic (3)</span>
                          <span>Neutral (7)</span>
                          <span>Alkaline (11)</span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-2 border-t">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">NPK Levels (ppm)</h3>
                    
                    <FormField
                      control={form.control}
                      name="nitrogenPpm"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-emerald-700 dark:text-emerald-400">Nitrogen (N)</FormLabel>
                            <span className="font-mono font-bold">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider min={0} max={1000} step={5} value={[field.value]} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phosphorusPpm"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-amber-700 dark:text-amber-400">Phosphorus (P)</FormLabel>
                            <span className="font-mono font-bold">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider min={0} max={1000} step={5} value={[field.value]} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="potassiumPpm"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-purple-700 dark:text-purple-400">Potassium (K)</FormLabel>
                            <span className="font-mono font-bold">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider min={0} max={1000} step={5} value={[field.value]} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="organicMatterPct"
                    render={({ field }) => (
                      <FormItem className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <FormLabel>Organic Matter (%)</FormLabel>
                          <span className="font-mono font-bold">{field.value?.toFixed(1)}%</span>
                        </div>
                        <FormControl>
                          <Slider min={0} max={20} step={0.1} value={[field.value || 0]} onValueChange={(val) => field.onChange(val[0])} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2 border-t space-y-4">
                    <FormField
                      control={form.control}
                      name="targetCrop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Crop <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="What are you planting?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="plotId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field Plot</FormLabel>
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
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold" 
                    disabled={analyzeSoilMutation.isPending}
                  >
                    {analyzeSoilMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Activity className="h-5 w-5 animate-pulse" />
                        Analyzing Data...
                      </span>
                    ) : (
                      "Generate Recommendations"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {analyzeSoilMutation.isPending && (
            <Card className="h-full border-primary/20 shadow-md">
              <CardContent className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-secondary animate-spin h-20 w-20"></div>
                  <div className="h-20 w-20 rounded-full bg-secondary/10 flex items-center justify-center">
                    <TestTube2 className="h-8 w-8 text-secondary animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-6 mb-2">Calculating Optimal Agronomy...</h3>
                <p className="text-muted-foreground max-w-sm">
                  Computing precise fertilizer requirements and organic amendments based on your soil profile.
                </p>
              </CardContent>
            </Card>
          )}

          {!analyzeSoilMutation.isPending && !result && (
            <Card className="h-full bg-muted/30 border-dashed">
              <CardContent className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Factory className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No data analyzed</h3>
                <p className="max-w-sm mt-2">
                  Enter your soil test parameters and target crop to receive a tailored fertilizer regimen.
                </p>
              </CardContent>
            </Card>
          )}

          {result && !analyzeSoilMutation.isPending && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              
              <Card className="border-secondary/30 shadow-md overflow-hidden">
                <div className="bg-secondary/5 p-6 border-b">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Target Crop: <span className="font-bold text-foreground">{form.getValues().targetCrop}</span></div>
                      <h2 className="text-2xl font-bold font-display flex items-center gap-2">
                        Soil Health:
                        <Badge variant="outline" className={cn("text-sm font-bold px-3 py-1", getHealthRatingColor(result.overallHealthRating))}>
                          {result.overallHealthRating}
                        </Badge>
                      </h2>
                    </div>
                  </div>
                  <AudioPlayer 
                    text={generateSpeechText()} 
                    language={getLanguageCode(form.getValues().language)} 
                  />
                </div>

                <CardContent className="p-0">
                  <div className="p-6 border-b">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><FlaskConical className="h-4 w-4" /> pH Analysis</h3>
                    <p className="text-sm leading-relaxed">{result.phAnalysis}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
                    <div className="p-6 bg-warning/5">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-warning-foreground">
                        <CircleAlert className="h-4 w-4" /> Nutrient Deficiencies
                      </h3>
                      {result.nutrientDeficiencies.length > 0 ? (
                        <ul className="space-y-2">
                          {result.nutrientDeficiencies.map((def, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                              <span>{def}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No critical deficiencies detected.</p>
                      )}
                    </div>
                    
                    <div className="p-6 bg-success/5">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-success">
                        <Sprout className="h-4 w-4" /> Organic Amendments
                      </h3>
                      {result.organicAmendments.length > 0 ? (
                        <ul className="space-y-2">
                          {result.organicAmendments.map((amendment, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                              <span>{amendment}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No immediate organic amendments required.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-6 border-b">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                      <Factory className="h-5 w-5" /> Recommended Fertilizer Regimen
                    </h3>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[120px]">Stage</TableHead>
                            <TableHead>Fertilizer</TableHead>
                            <TableHead className="text-right">Dosage (kg/ha)</TableHead>
                            <TableHead className="hidden sm:table-cell">Method</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.fertilizerRegimen.map((step, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{step.stage}</TableCell>
                              <TableCell>{step.fertilizerName}</TableCell>
                              <TableCell className="text-right font-mono font-bold">{step.dosageKgPerHa}</TableCell>
                              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{step.applicationMethod}</TableCell>
                            </TableRow>
                          ))}
                          {result.fertilizerRegimen.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">No fertilizers recommended at this time.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="p-6 bg-cyan-500/5">
                    <h3 className="font-bold mb-2 flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                      <Droplet className="h-4 w-4" /> Irrigation Advice
                    </h3>
                    <p className="text-sm">{result.irrigationAdvice}</p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleGenerateCalendar} 
                className="w-full h-14 text-lg font-bold shadow-lg group hover-elevate"
                variant="default"
              >
                <CalendarDays className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Generate Seasonal Calendar for {form.getValues().targetCrop}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
