import { useState } from "react";
import { useListDiagnoses, useListSoilTests, useListSchedules, useListPlots } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Search, Filter, Stethoscope, Sprout, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { CropDiagnosis } from "@workspace/api-client-react";

export function FieldLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlot, setSelectedPlot] = useState<string>("all");
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<string | null>(null);

  const { data: plots } = useListPlots({ query: { queryKey: ["plots"] } });
  
  // Queries
  const { data: diagnosesData, isLoading: isDiagLoading } = useListDiagnoses({ 
    limit: 50,
    plotId: selectedPlot !== "all" ? selectedPlot : undefined
  }, { query: { queryKey: ["diagnoses", selectedPlot] } });
  
  const { data: soilData, isLoading: isSoilLoading } = useListSoilTests({
    limit: 50,
    plotId: selectedPlot !== "all" ? selectedPlot : undefined
  }, { query: { queryKey: ["soilTests", selectedPlot] } });
  
  const { data: schedulesData, isLoading: isSchedLoading } = useListSchedules({
    plotId: selectedPlot !== "all" ? selectedPlot : undefined
  }, { query: { queryKey: ["schedules", selectedPlot] } });

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Low': return 'bg-success/20 text-success border-success/30';
      case 'Moderate': return 'bg-warning/20 text-warning-foreground border-warning/30';
      case 'Severe': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'Critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
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

  // Client-side filtering
  const filteredDiagnoses = diagnosesData?.items.filter(d => 
    d.cropName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.diseaseIdentified.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleDiagnosis = (id: string) => {
    if (expandedDiagnosis === id) setExpandedDiagnosis(null);
    else setExpandedDiagnosis(id);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Field Logs
          </h1>
          <p className="text-muted-foreground mt-1">Historical database of all farm activities and analyses.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search records..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedPlot} onValueChange={setSelectedPlot}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Plots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plots</SelectItem>
              {plots?.map(plot => (
                <SelectItem key={plot.id} value={plot.id}>{plot.plotName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="diagnoses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mb-6">
          <TabsTrigger value="diagnoses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Stethoscope className="w-4 h-4 mr-2" /> Diagnoses
          </TabsTrigger>
          <TabsTrigger value="soil" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
            <Sprout className="w-4 h-4 mr-2" /> Soil Tests
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">
            <CalendarDays className="w-4 h-4 mr-2" /> Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnoses" className="space-y-4">
          <Card>
            <CardHeader className="py-4 border-b bg-muted/20">
              <CardTitle className="text-lg">Crop Disease Diagnoses</CardTitle>
              <CardDescription>History of all image-based AI pathology reports</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isDiagLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading records...</div>
              ) : filteredDiagnoses.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-t border-dashed m-4 rounded">No records found matching your criteria.</div>
              ) : (
                <div className="rounded-none border-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Crop</TableHead>
                        <TableHead>Disease</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiagnoses.map((diag) => (
                        <React.Fragment key={diag.id}>
                          <TableRow 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleDiagnosis(diag.id)}
                          >
                            <TableCell className="whitespace-nowrap">{format(new Date(diag.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-medium">{diag.cropName}</TableCell>
                            <TableCell className="font-semibold text-destructive">{diag.diseaseIdentified}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getSeverityColor(diag.severityLevel)}>
                                {diag.severityLevel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{diag.confidenceScore}%</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                {expandedDiagnosis === diag.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedDiagnosis === diag.id && (
                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 border-t border-b border-primary/10 shadow-inner">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-bold text-sm uppercase text-muted-foreground mb-2">Immediate Action</h4>
                                      <p className="text-sm bg-background p-3 rounded border text-destructive font-medium">
                                        {diag.immediateAction}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm uppercase text-muted-foreground mb-2">Treatments</h4>
                                      <div className="text-sm bg-background p-3 rounded border">
                                        <p><strong>Organic:</strong> {diag.organicTreatment[0] || "None"}</p>
                                        <p className="mt-1"><strong>Chemical:</strong> {diag.chemicalTreatment[0] || "None"}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="soil" className="space-y-4">
          <Card>
            <CardHeader className="py-4 border-b bg-muted/20">
              <CardTitle className="text-lg">Soil Health Analyses</CardTitle>
              <CardDescription>Historical soil tests and fertilizer recommendations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isSoilLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading records...</div>
              ) : soilData?.items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-t border-dashed m-4 rounded">No records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Health Rating</TableHead>
                      <TableHead>pH Analysis</TableHead>
                      <TableHead>Deficiencies</TableHead>
                      <TableHead>Fertilizer Steps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soilData?.items.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(test.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getHealthRatingColor(test.overallHealthRating)}>
                            {test.overallHealthRating}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={test.phAnalysis}>
                          {test.phAnalysis}
                        </TableCell>
                        <TableCell>
                          {test.nutrientDeficiencies.length} issues
                        </TableCell>
                        <TableCell className="font-mono">
                          {test.fertilizerRegimen.length} applications
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader className="py-4 border-b bg-muted/20">
              <CardTitle className="text-lg">Advisory Schedules</CardTitle>
              <CardDescription>Generated crop cycle plans</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isSchedLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading records...</div>
              ) : !schedulesData || schedulesData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-t border-dashed m-4 rounded">No records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Generated On</TableHead>
                      <TableHead>Crop</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Sowing Date</TableHead>
                      <TableHead>Est. Harvest</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedulesData.map((sched) => {
                      const today = new Date();
                      const harvestDate = new Date(sched.expectedHarvestDate);
                      const isComplete = today > harvestDate;
                      
                      return (
                        <TableRow key={sched.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {format(new Date(sched.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-bold text-primary">{sched.cropType}</TableCell>
                          <TableCell>{sched.totalDays} days</TableCell>
                          <TableCell>{format(new Date(sched.startDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="font-semibold">{format(harvestDate, 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {isComplete ? (
                              <Badge variant="secondary">Completed</Badge>
                            ) : (
                              <Badge className="bg-primary hover:bg-primary">Active</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Need to import React for the React.Fragment usage
import React from 'react';
