import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';

import { LandingPage } from '@/pages/landing';
import { DashboardPage } from '@/pages/dashboard';
import { DiagnosisPage } from '@/pages/diagnosis';
import { SoilAnalysisPage } from '@/pages/soil-analysis';
import { AdvisoryCalendarPage } from '@/pages/advisory-calendar';
import { FieldLogsPage } from '@/pages/field-logs';
import { SettingsPage } from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout>
          <LandingPage />
        </Layout>
      </Route>
      <Route path="/dashboard">
        <Layout>
          <DashboardPage />
        </Layout>
      </Route>
      <Route path="/diagnosis">
        <Layout>
          <DiagnosisPage />
        </Layout>
      </Route>
      <Route path="/soil-analysis">
        <Layout>
          <SoilAnalysisPage />
        </Layout>
      </Route>
      <Route path="/advisory-calendar">
        <Layout>
          <AdvisoryCalendarPage />
        </Layout>
      </Route>
      <Route path="/field-logs">
        <Layout>
          <FieldLogsPage />
        </Layout>
      </Route>
      <Route path="/settings">
        <Layout>
          <SettingsPage />
        </Layout>
      </Route>
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
