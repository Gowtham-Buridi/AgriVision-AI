import { useGetDashboardSummary, useGetWeatherRisk } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, Sprout, CalendarDays, CloudRain, AlertTriangle, AlertCircle, CheckCircle2, ThermometerSun, Droplets, Bug, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

export function DashboardPage() {
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useGetDashboardSummary();
  const { data: weather, isLoading: isWeatherLoading } = useGetWeatherRisk();

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'Low': return 'bg-success/20 text-success border-success/30';
      case 'Moderate': return 'bg-warning/20 text-warning-foreground border-warning/30';
      case 'Severe': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'Critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityChartColor = (severity: string) => {
    switch(severity) {
      case 'Low': return 'var(--color-success)';
      case 'Moderate': return 'var(--color-warning)';
      case 'Severe': return '#f97316';
      case 'Critical': return 'var(--color-destructive)';
      default: return 'var(--color-muted)';
    }
  };

  if (isSummaryLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (summaryError || !summary) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardHeader className="text-destructive flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Unable to load dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please check your API key configuration and network connection.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const severityData = [
    { name: 'Low', count: summary.severityBreakdown.Low },
    { name: 'Moderate', count: summary.severityBreakdown.Moderate },
    { name: 'Severe', count: summary.severityBreakdown.Severe },
    { name: 'Critical', count: summary.severityBreakdown.Critical },
  ];

  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plots</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPlots}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diagnoses</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDiagnoses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soil Tests</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSoilTests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Schedules</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSchedules}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Weather Risk Widget */}
        <Card className="col-span-full lg:col-span-1 bg-gradient-to-br from-card to-muted border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-primary" />
              Field Conditions
            </CardTitle>
            <CardDescription>Current weather & risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {isWeatherLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : weather ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-background p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ThermometerSun className="h-8 w-8 text-warning" />
                    <div>
                      <p className="text-2xl font-bold">{weather.temperature}°C</p>
                      <p className="text-xs text-muted-foreground">Temperature</p>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border"></div>
                  <div className="flex items-center gap-3">
                    <Droplets className="h-8 w-8 text-cyan-500" />
                    <div>
                      <p className="text-2xl font-bold">{weather.humidity}%</p>
                      <p className="text-xs text-muted-foreground">Humidity</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> 
                    Overall Risk: <Badge variant="outline" className={getSeverityColor(weather.overallRiskLevel)}>{weather.overallRiskLevel}</Badge>
                  </h4>
                  
                  {weather.pestRisks.length > 0 && (
                    <div className="space-y-2">
                      {weather.pestRisks.map((pest, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-background p-2 rounded border">
                          <Bug className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold">{pest.pestName}:</span> {pest.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">Weather data unavailable</div>
            )}
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="col-span-full md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Disease Severity History</CardTitle>
            <CardDescription>Breakdown of all diagnoses by severity level</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityChartColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Diagnoses</CardTitle>
            <CardDescription>Latest crop disease analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentDiagnoses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No recent diagnoses
              </div>
            ) : (
              <div className="space-y-4">
                {summary.recentDiagnoses.map((diag) => (
                  <div key={diag.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {diag.cropName} 
                        <Badge variant="outline" className={getSeverityColor(diag.severityLevel)}>
                          {diag.severityLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-destructive font-medium mt-1">
                        {diag.diseaseIdentified}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(diag.createdAt).toLocaleDateString()} {diag.plotName ? `• ${diag.plotName}` : ''}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 text-sm font-mono flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {diag.confidenceScore}% match
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crop Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Crop Distribution</CardTitle>
            <CardDescription>Overview of monitored crops</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {summary.cropDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                No crop data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.cropDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="crop"
                  >
                    {summary.cropDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
