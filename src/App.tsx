import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import FollowingStar from "@/components/FollowingStar";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function lazyWithRetry(importFn: () => Promise<any>, retries = 3): ReturnType<typeof lazy> {
  return lazy(() => {
    const attempt = (triesLeft: number): Promise<any> =>
      importFn().catch((err: any) => {
        if (triesLeft <= 0) throw err;
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => attempt(triesLeft - 1));
      });
    return attempt(retries);
  });
}

// Lazy load pages
const Home = lazyWithRetry(() => import("./pages/Home"));
const OrderTracking = lazyWithRetry(() => import("./pages/OrderTracking"));
const AboutUs = lazyWithRetry(() => import("./pages/AboutUs"));
const Products = lazyWithRetry(() => import("./pages/Products"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Account = lazyWithRetry(() => import("./pages/Account"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const OrderRequest = lazyWithRetry(() => import("./pages/OrderRequest"));
const OrderManagement = lazyWithRetry(() => import("./components/OrderManagement"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const CustomerDashboard = lazyWithRetry(() => import("./pages/CustomerDashboard"));
const BrillarteRegalos = lazyWithRetry(() => import("./pages/BrillarteRegalos"));
const CancelNotifications = lazyWithRetry(() => import("./pages/CancelNotifications"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const ShippingPolicy = lazyWithRetry(() => import("./pages/ShippingPolicy"));
const RefundPolicy = lazyWithRetry(() => import("./pages/RefundPolicy"));
const TermsConditions = lazyWithRetry(() => import("./pages/TermsConditions"));
const AdminPoliticas = lazyWithRetry(() => import("./pages/AdminPoliticas"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const RegistroConfirmado = lazyWithRetry(() => import("./pages/RegistroConfirmado"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminProductos = lazyWithRetry(() => import("./pages/AdminProductos"));
const BrillartePedidos = lazyWithRetry(() => import("./pages/BrillartePedidos"));
const Promociones = lazyWithRetry(() => import("./pages/Promociones"));
const AdminPromociones = lazyWithRetry(() => import("./pages/AdminPromociones"));
const Favoritos = lazyWithRetry(() => import("./pages/Favoritos"));
const Perfil = lazyWithRetry(() => import("./pages/Perfil"));
const PerfilPublico = lazyWithRetry(() => import("./pages/PerfilPublico"));
const TarjetasRegalo = lazyWithRetry(() => import("./pages/TarjetasRegalo"));
const AdminTarjetas = lazyWithRetry(() => import("./pages/AdminTarjetas"));
const AdminRoles = lazyWithRetry(() => import("./pages/AdminRoles"));
const AdminEmails = lazyWithRetry(() => import("./pages/AdminEmails"));
const AdminCuentas = lazyWithRetry(() => import("./pages/AdminCuentas"));
const AdminCuentaDetalle = lazyWithRetry(() => import("./pages/AdminCuentaDetalle"));
const Comunidad = lazyWithRetry(() => import("./pages/Comunidad"));
const Mensajes = lazyWithRetry(() => import("./pages/Mensajes"));
const AdminTickets = lazyWithRetry(() => import("./pages/AdminTickets"));
const AdminVerificaciones = lazyWithRetry(() => import("./pages/AdminVerificaciones"));
const AdminContabilidad = lazyWithRetry(() => import("./pages/AdminContabilidad"));
const SolicitudVerificacion = lazyWithRetry(() => import("./pages/SolicitudVerificacion"));
const BannedAccount = lazyWithRetry(() => import("./pages/BannedAccount"));
const AdminCarritosAbandonados = lazyWithRetry(() => import("./pages/AdminCarritosAbandonados"));
const AdminEnvios = lazyWithRetry(() => import("./pages/AdminEnvios"));
const ApelacionBaneo = lazyWithRetry(() => import("./pages/ApelacionBaneo"));
const AdminSolicitudesIA = lazyWithRetry(() => import("./pages/AdminSolicitudesIA"));
const GuiaCodigosPago = lazyWithRetry(() => import("./pages/GuiaCodigosPago"));
const AdminCodigosPago = lazyWithRetry(() => import("./pages/AdminCodigosPago"));
const AdminBrillartePay = lazyWithRetry(() => import("./pages/AdminBrillartePay"));
const RastrearPedidoOnline = lazyWithRetry(() => import("./pages/RastrearPedidoOnline"));
const AgentLogin = lazyWithRetry(() => import("./pages/AgentLogin"));
const AgentDashboard = lazyWithRetry(() => import("./pages/AgentDashboard"));
const RastrearTicket = lazyWithRetry(() => import("./pages/RastrearTicket"));
const SuscribirPedido = lazyWithRetry(() => import("./pages/SuscribirPedido"));
const AdminCupones = lazyWithRetry(() => import("./pages/AdminCupones"));
const Eventos = lazyWithRetry(() => import("./pages/Eventos"));
const AdminNoticias = lazyWithRetry(() => import("./pages/AdminNoticias"));
const Novedades = lazyWithRetry(() => import("./pages/Novedades"));
const MiPedidoDetalle = lazyWithRetry(() => import("./pages/MiPedidoDetalle"));
const VerificacionPage = lazyWithRetry(() => import("./pages/Verificacion"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Referidos = lazyWithRetry(() => import("./pages/Referidos"));
const AdminReferidos = lazyWithRetry(() => import("./pages/AdminReferidos"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const AdminBlog = lazyWithRetry(() => import("./pages/AdminBlog"));
const EmprendeBrillarte = lazyWithRetry(() => import("./pages/EmprendeBrillarte"));
const EmprendeBrillarteAplicar = lazyWithRetry(() => import("./pages/EmprendeBrillarteAplicar"));
const AdminCorreosIA = lazyWithRetry(() => import("./pages/AdminCorreosIA"));
const ProtectedRoute = lazyWithRetry(() => import("./components/ProtectedRoute"));

const Chatbot = lazyWithRetry(() => import("./components/Chatbot").then(m => ({ default: m.Chatbot })));
const ChatbotTrigger = lazyWithRetry(() => import("./components/Chatbot").then(m => ({ default: m.ChatbotTrigger })));

const ChatbotSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  return isOpen ? <Chatbot onClose={() => setIsOpen(false)} /> : <ChatbotTrigger onClick={() => setIsOpen(true)} />;
};

const pageVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -8, filter: "blur(2px)", transition: { duration: 0.2 } },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
        <Route path="/nosotros" element={<PageWrapper><AboutUs /></PageWrapper>} />
        <Route path="/productos" element={<PageWrapper><Products /></PageWrapper>} />
        <Route path="/rastrear" element={<PageWrapper><OrderTracking /></PageWrapper>} />
        <Route path="/faq" element={<PageWrapper><FAQ /></PageWrapper>} />
        <Route path="/contacto" element={<PageWrapper><Contact /></PageWrapper>} />
        <Route path="/pedir" element={<PageWrapper><OrderRequest /></PageWrapper>} />
        <Route path="/regalos" element={<PageWrapper><BrillarteRegalos /></PageWrapper>} />
        <Route path="/cancel-notifications" element={<PageWrapper><CancelNotifications /></PageWrapper>} />
        <Route path="/politicas-privacidad" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
        <Route path="/politicas-envio" element={<PageWrapper><ShippingPolicy /></PageWrapper>} />
        <Route path="/politicas-reembolso" element={<PageWrapper><RefundPolicy /></PageWrapper>} />
        <Route path="/terminos-condiciones" element={<PageWrapper><TermsConditions /></PageWrapper>} />
        <Route path="/registro" element={<PageWrapper><Register /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        <Route path="/registro-confirmado" element={<PageWrapper><RegistroConfirmado /></PageWrapper>} />
        <Route path="/mi-cuenta" element={<PageWrapper><CustomerDashboard /></PageWrapper>} />
        <Route path="/perfil" element={<PageWrapper><Perfil /></PageWrapper>} />
        <Route path="/promociones" element={<PageWrapper><Promociones /></PageWrapper>} />
        <Route path="/favoritos" element={<PageWrapper><Favoritos /></PageWrapper>} />
        <Route path="/perfil/:userId" element={<PageWrapper><PerfilPublico /></PageWrapper>} />
        <Route path="/perfil-publico/:userId" element={<PageWrapper><PerfilPublico /></PageWrapper>} />
        <Route path="/tarjetas-regalo" element={<PageWrapper><TarjetasRegalo /></PageWrapper>} />
        <Route path="/comunidad" element={<PageWrapper><Comunidad /></PageWrapper>} />
        <Route path="/mensajes" element={<PageWrapper><Mensajes /></PageWrapper>} />
        <Route path="/solicitar-verificacion" element={<PageWrapper><SolicitudVerificacion /></PageWrapper>} />
        <Route path="/cuenta-suspendida" element={<PageWrapper><BannedAccount /></PageWrapper>} />
        <Route path="/apelar-baneo" element={<PageWrapper><ApelacionBaneo /></PageWrapper>} />
        <Route path="/guia-codigos-pago" element={<PageWrapper><GuiaCodigosPago /></PageWrapper>} />
        <Route path="/rastrear-pedido/:codigoPedido" element={<PageWrapper><RastrearPedidoOnline /></PageWrapper>} />
        <Route path="/cuenta" element={<PageWrapper><Account /></PageWrapper>} />
        <Route path="/rastrear-ticket" element={<PageWrapper><RastrearTicket /></PageWrapper>} />
        <Route path="/suscribir-pedido" element={<PageWrapper><SuscribirPedido /></PageWrapper>} />
        <Route path="/eventos" element={<PageWrapper><Eventos /></PageWrapper>} />
        <Route path="/novedades" element={<PageWrapper><Novedades /></PageWrapper>} />
        <Route path="/blog" element={<PageWrapper><Blog /></PageWrapper>} />
        <Route path="/mi-pedido/:codigoPedido" element={<PageWrapper><MiPedidoDetalle /></PageWrapper>} />
        <Route path="/verificacion" element={<PageWrapper><VerificacionPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="/referidos" element={<PageWrapper><Referidos /></PageWrapper>} />
        <Route path="/emprende-brillarte" element={<PageWrapper><EmprendeBrillarte /></PageWrapper>} />
        <Route path="/emprende-brillarte/aplicar" element={<PageWrapper><EmprendeBrillarteAplicar /></PageWrapper>} />
        <Route path="/agente/login" element={<PageWrapper><AgentLogin /></PageWrapper>} />
        <Route path="/agente/dashboard" element={<PageWrapper><ProtectedRoute requiredRole="agent"><AgentDashboard /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin-dashboard" element={<PageWrapper><ProtectedRoute><AdminDashboard /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/productos" element={<PageWrapper><ProtectedRoute><AdminProductos /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/promociones" element={<PageWrapper><ProtectedRoute><AdminPromociones /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/tarjetas" element={<PageWrapper><ProtectedRoute><AdminTarjetas /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/roles" element={<PageWrapper><ProtectedRoute><AdminRoles /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/emails" element={<PageWrapper><ProtectedRoute><AdminEmails /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/cuentas" element={<PageWrapper><ProtectedRoute><AdminCuentas /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/cuenta/:userId" element={<PageWrapper><ProtectedRoute><AdminCuentaDetalle /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/tickets" element={<PageWrapper><ProtectedRoute><AdminTickets /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/verificaciones" element={<PageWrapper><ProtectedRoute><AdminVerificaciones /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/contabilidad" element={<PageWrapper><ProtectedRoute><AdminContabilidad /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/carritos-abandonados" element={<PageWrapper><ProtectedRoute><AdminCarritosAbandonados /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/envios" element={<PageWrapper><ProtectedRoute><AdminEnvios /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/solicitudes-ia" element={<PageWrapper><ProtectedRoute><AdminSolicitudesIA /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/codigos-pago" element={<PageWrapper><ProtectedRoute><AdminCodigosPago /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/brillarte-pay" element={<PageWrapper><ProtectedRoute><AdminBrillartePay /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/politicas" element={<PageWrapper><ProtectedRoute><AdminPoliticas /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/cupones" element={<PageWrapper><ProtectedRoute><AdminCupones /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/noticias" element={<PageWrapper><ProtectedRoute><AdminNoticias /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/blog" element={<PageWrapper><ProtectedRoute><AdminBlog /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/referidos" element={<PageWrapper><ProtectedRoute><AdminReferidos /></ProtectedRoute></PageWrapper>} />
        <Route path="/admin/correos-ia" element={<PageWrapper><ProtectedRoute><AdminCorreosIA /></ProtectedRoute></PageWrapper>} />
        <Route path="/brillarte-pedidos" element={<PageWrapper><ProtectedRoute><BrillartePedidos /></ProtectedRoute></PageWrapper>} />
        <Route path="/manage" element={<PageWrapper><ProtectedRoute><OrderManagement /></ProtectedRoute></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
            <ChatbotSection />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
