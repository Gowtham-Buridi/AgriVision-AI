import { useState, useRef, useCallback } from "react";
import { useAnalyzeCrop, useListPlots } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/audio-player";
import { Upload, Camera, Leaf, AlertTriangle, ArrowRight, FlaskConical, Beaker, ShieldCheck, Sprout, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CropDiagnosis } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  cropName: z.string().min(2, "Crop name is required"),
  observedSymptoms: z.string().optional(),
  language: z.enum(["en", "hi", "es", "fr", "sw"]).default("en"),
  plotId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function DiagnosisPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [result, setResult] = useState<CropDiagnosis | null>(null);
  
  const analyzeCropMutation = useAnalyzeCrop();
  const { data: plots } = useListPlots({ query: { queryKey: ["plots"] } });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cropName: "",
      observedSymptoms: "",
      language: "en",
      plotId: null,
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, or WEBP image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: FormValues) => {
    if (!selectedFile) {
      toast({ title: "Image required", description: "Please upload an image of the crop.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = e.target?.result as string;
      const base64 = resultStr.split(',')[1];
      
      analyzeCropMutation.mutate({
        data: {
          cropName: values.cropName,
          imageBase64: base64,
          imageMimeType: selectedFile.type as 'image/jpeg' | 'image/png' | 'image/webp',
          observedSymptoms: values.observedSymptoms,
          language: values.language as any,
          plotId: values.plotId === "none" ? null : values.plotId,
        }
      }, {
        onSuccess: (data) => {
          setResult(data);
          toast({ title: "Analysis complete", description: "Diagnosis report generated successfully." });
        },
        onError: (err) => {
          toast({ title: "Analysis failed", description: "Could not generate diagnosis. Check API keys.", variant: "destructive" });
        }
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Low': return 'bg-success/20 text-success border-success/30';
      case 'Moderate': return 'bg-warning/20 text-warning-foreground border-warning/30';
      case 'Severe': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'Critical': return 'bg-destructive/20 text-destructive border-destructive/30';
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

  // Generate full text for audio reading
  const generateSpeechText = () => {
    if (!result) return "";
    return `
      Diagnosis for ${result.cropName}: ${result.diseaseIdentified}. 
      Severity level is ${result.severityLevel}. 
      Confidence score: ${result.confidenceScore} percent.
      Immediate action required: ${result.immediateAction}.
      ${result.localizedNote ? `Note: ${result.localizedNote}` : ''}
    `;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-primary" />
          Crop Diagnostic Tool
        </h1>
        <p className="text-muted-foreground mt-1">Upload a photo to instantly identify plant diseases and get treatment plans.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Sample</CardTitle>
              <CardDescription>Provide details and an image of the affected plant</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Image Upload Area */}
                  <div className="space-y-2">
                    <FormLabel>Plant Photo <span className="text-destructive">*</span></FormLabel>
                    <div 
                      className={`
                        relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                        ${dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}
                        ${previewUrl ? 'p-1 border-solid' : 'min-h-[200px]'}
                      `}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => !previewUrl && fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/jpeg, image/png, image/webp" 
                        className="hidden" 
                      />
                      
                      {previewUrl ? (
                        <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden group">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                              Remove Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-background rounded-full mb-3 shadow-sm border">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium mb-1">Drag & drop or click to upload</p>
                          <p className="text-xs text-muted-foreground">JPEG, PNG, WEBP up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cropName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crop Type <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tomato, Corn, Wheat..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observedSymptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observed Symptoms (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what you see (e.g. yellow spots on lower leaves)" 
                            className="resize-none h-20"
                            {...field} 
                          />
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
                          <FormLabel>Field Plot (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plot" />
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
                          <FormLabel>Output Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">🇺🇸 English</SelectItem>
                              <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                              <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                              <SelectItem value="fr">🇫🇷 French</SelectItem>
                              <SelectItem value="sw">🇰🇪 Swahili</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold mt-4" 
                    disabled={analyzeCropMutation.isPending}
                  >
                    {analyzeCropMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Camera className="h-5 w-5 animate-pulse" />
                        Analyzing...
                      </span>
                    ) : (
                      "Diagnose Crop"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {analyzeCropMutation.isPending && (
            <Card className="h-full border-primary/20 shadow-md">
              <CardContent className="h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin h-20 w-20"></div>
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-6 mb-2">AI is analyzing your sample...</h3>
                <p className="text-muted-foreground max-w-sm">
                  Our models are cross-referencing your image against thousands of pathogens, pests, and nutrient deficiencies.
                </p>
                <div className="w-64 mt-8">
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {!analyzeCropMutation.isPending && !result && (
            <Card className="h-full bg-muted/30 border-dashed">
              <CardContent className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Leaf className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No diagnosis yet</h3>
                <p className="max-w-sm mt-2">
                  Upload an image and submit the form to receive a detailed pathology report and treatment plan.
                </p>
              </CardContent>
            </Card>
          )}

          {result && !analyzeCropMutation.isPending && (
            <Card className="border-primary/30 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-primary/5 p-6 border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold font-display">{result.diseaseIdentified}</h2>
                      <Badge variant="outline" className={cn("text-xs font-bold", getSeverityColor(result.severityLevel))}>
                        {result.severityLevel}
                      </Badge>
                    </div>
                    {result.scientificName && (
                      <p className="italic text-muted-foreground text-sm">{result.scientificName} • Affecting {result.cropName}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-medium mb-1">AI Confidence</div>
                    <div className="flex items-center gap-2">
                      <Progress value={result.confidenceScore} className="h-2 w-24" />
                      <span className="font-mono text-sm font-bold">{result.confidenceScore}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <AudioPlayer 
                    text={generateSpeechText()} 
                    language={getLanguageCode(form.getValues().language)} 
                  />
                </div>
              </div>

              <CardContent className="p-0">
                <div className="p-6 bg-destructive/5 border-b border-destructive/10">
                  <h3 className="font-bold text-destructive flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5" /> Immediate Action Required
                  </h3>
                  <p className="text-sm">{result.immediateAction}</p>
                </div>

                <div className="p-6 pb-2">
                  <h3 className="font-bold mb-3">Symptoms Analysis</h3>
                  <ul className="space-y-2">
                    {result.symptomsAnalysis.map((symptom, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6">
                  <Tabs defaultValue="organic" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-4">
                      <TabsTrigger value="organic" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Sprout className="w-4 h-4 mr-2" /> Organic Treatment
                      </TabsTrigger>
                      <TabsTrigger value="chemical" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                        <Beaker className="w-4 h-4 mr-2" /> Chemical Treatment
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="organic" className="bg-muted/30 p-4 rounded-lg border">
                      {result.organicTreatment.length > 0 ? (
                        <ul className="space-y-3">
                          {result.organicTreatment.map((treatment, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <ShieldCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
                              <span>{treatment}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">No effective organic treatments available for this condition.</p>
                      )}
                    </TabsContent>
                    <TabsContent value="chemical" className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                      {result.chemicalTreatment.length > 0 ? (
                         <ul className="space-y-3">
                         {result.chemicalTreatment.map((treatment, i) => (
                           <li key={i} className="text-sm flex items-start gap-2">
                             <FlaskConical className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                             <span>{treatment}</span>
                           </li>
                         ))}
                       </ul>
                      ) : (
                        <p className="text-sm italic text-muted-foreground">No chemical treatments recommended.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="p-6 bg-muted/20 border-t">
                  <h3 className="font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Preventive Measures for Next Cycle</h3>
                  <ul className="space-y-2">
                    {result.preventiveMeasures.map((measure, i) => (
                      <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {result.localizedNote && (
                  <div className="p-4 bg-warning/10 border-t border-warning/20 text-sm italic">
                    <span className="font-semibold not-italic">Local context:</span> {result.localizedNote}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
