import { useEffect } from "react";
import { useGetFarmerProfile, useUpdateFarmerProfile } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, MapPin, User, Mail, Phone, Languages, Tractor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFarmerProfileQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().optional(),
  preferredLanguage: z.enum(["en", "hi", "es", "fr", "sw"]),
  farmLocationName: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  farmUnit: z.enum(["acres", "hectares"]),
  primaryCrops: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading } = useGetFarmerProfile({ 
    query: { queryKey: getGetFarmerProfileQueryKey() } 
  });
  
  const updateProfileMutation = useUpdateFarmerProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      preferredLanguage: "en",
      farmLocationName: "",
      latitude: undefined,
      longitude: undefined,
      farmUnit: "hectares",
      primaryCrops: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber || "",
        preferredLanguage: (profile.preferredLanguage as any) || "en",
        farmLocationName: profile.farmLocationName || "",
        latitude: profile.latitude || undefined,
        longitude: profile.longitude || undefined,
        farmUnit: profile.farmUnit || "hectares",
        primaryCrops: profile.primaryCrops || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: FormValues) => {
    updateProfileMutation.mutate({
      data: values
    }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetFarmerProfileQueryKey(), data);
        toast({ title: "Profile saved", description: "Your farm settings have been updated successfully." });
      },
      onError: () => {
        toast({ title: "Save failed", description: "Could not update profile.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Farm Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your identity, farm details, and app preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="email" placeholder="john@example.com" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" type="tel" placeholder="+1 (555) 000-0000" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <Languages className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                            <SelectTrigger className="pl-9">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                          <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="sw">🇰🇪 Swahili</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">Used for UI labels and audio advisory playback.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/20 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tractor className="h-5 w-5 text-secondary" /> Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="farmLocationName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Farm Name / Region</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="e.g. Green Valley Farm, Rift Valley" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g. 34.0522" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription className="text-xs">Used for precision weather forecasting.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g. -118.2437" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="farmUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Measurement Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hectares">Hectares (ha)</SelectItem>
                          <SelectItem value="acres">Acres (ac)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryCrops"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Primary Crops Grown</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List main crops grown, separated by commas (e.g. Maize, Sorghum, Tomatoes)" 
                          className="resize-none h-20"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t p-6 flex justify-end">
              <Button type="submit" size="lg" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto font-bold px-8">
                {updateProfileMutation.isPending ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

// Missing component import for FormDescription
import { FormDescription } from "@/components/ui/form";
