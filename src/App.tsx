import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import OrderTracking from "./pages/OrderTracking";
import AboutUs from "./pages/AboutUs";
import Products from "./pages/Products";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import OrderManagement from "./components/OrderManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDemoPage from "./pages/AdminDemoPage";
import Auth from "./pages/Auth";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminOrderManagement from "./pages/AdminOrderManagement";
import CustomerDashboard from "./pages/CustomerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/nosotros" element={<AboutUs />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/rastrear" element={<OrderTracking />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/cuenta" element={<CustomerDashboard />} />
          <Route path="/manage" element={<OrderManagement />} />
          <Route path="/admin-brillarte-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-users" element={<AdminUserManagement />} />
          <Route path="/admin-order-management" element={<AdminOrderManagement />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/admin-chat-demo" element={<AdminDemoPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
