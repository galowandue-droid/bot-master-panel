import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Statistics from "./pages/Statistics";
import Search from "./pages/Search";
import Mailing from "./pages/Mailing";
import Users from "./pages/UsersTable";
import Payments from "./pages/Payments";
import PaymentSettings from "./pages/PaymentSettings";
import Settings from "./pages/Settings";
import Database from "./pages/Database";
import Logs from "./pages/Logs";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Referrals from "./pages/Referrals";
import RequiredChannels from "./pages/RequiredChannels";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/search" element={<Search />} />
            <Route path="/mailing" element={<Mailing />} />
            <Route path="/required-channels" element={<RequiredChannels />} />
            <Route path="/users" element={<Users />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payment-settings" element={<PaymentSettings />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/database" element={<Database />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
