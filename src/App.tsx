import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Componente de carga
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Lazy load de páginas principales
const Home = lazy(() => import("./pages/Home"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Products = lazy(() => import("./pages/Products"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrderRequest = lazy(() => import("./pages/OrderRequest"));
const OrderManagement = lazy(() => import("./components/OrderManagement"));
const Auth = lazy(() => import("./pages/Auth"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const PickupRequest = lazy(() => import("./pages/PickupRequest"));
const CancelNotifications = lazy(() => import("./pages/CancelNotifications"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const AdminPoliticas = lazy(() => import("./pages/AdminPoliticas"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const RegistroConfirmado = lazy(() => import("./pages/RegistroConfirmado"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProductos = lazy(() => import("./pages/AdminProductos"));
const BrillartePedidos = lazy(() => import("./pages/BrillartePedidos"));
const Promociones = lazy(() => import("./pages/Promociones"));
const AdminPromociones = lazy(() => import("./pages/AdminPromociones"));
const Favoritos = lazy(() => import("./pages/Favoritos"));
const Perfil = lazy(() => import("./pages/Perfil"));
const PerfilPublico = lazy(() => import("./pages/PerfilPublico"));
const TarjetasRegalo = lazy(() => import("./pages/TarjetasRegalo"));
const AdminTarjetas = lazy(() => import("./pages/AdminTarjetas"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminEmails = lazy(() => import("./pages/AdminEmails"));
const AdminCuentas = lazy(() => import("./pages/AdminCuentas"));
const AdminCuentaDetalle = lazy(() => import("./pages/AdminCuentaDetalle"));
const Comunidad = lazy(() => import("./pages/Comunidad"));
const Mensajes = lazy(() => import("./pages/Mensajes"));
const AdminTickets = lazy(() => import("./pages/AdminTickets"));
const AdminVerificaciones = lazy(() => import("./pages/AdminVerificaciones"));
const AdminContabilidad = lazy(() => import("./pages/AdminContabilidad"));
const SolicitudVerificacion = lazy(() => import("./pages/SolicitudVerificacion"));
const BannedAccount = lazy(() => import("./pages/BannedAccount"));
const AdminCarritosAbandonados = lazy(() => import("./pages/AdminCarritosAbandonados"));
const AdminEnvios = lazy(() => import("./pages/AdminEnvios"));
const ApelacionBaneo = lazy(() => import("./pages/ApelacionBaneo"));
const AdminSolicitudesIA = lazy(() => import("./pages/AdminSolicitudesIA"));
const GuiaCodigosPago = lazy(() => import("./pages/GuiaCodigosPago"));
const AdminCodigosPago = lazy(() => import("./pages/AdminCodigosPago"));
const AdminBrillartePay = lazy(() => import("./pages/AdminBrillartePay"));
const RastrearPedidoOnline = lazy(() => import("./pages/RastrearPedidoOnline"));
const AgentLogin = lazy(() => import("./pages/AgentLogin"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const RastrearTicket = lazy(() => import("./pages/RastrearTicket"));
const Cupones = lazy(() => import("./pages/Cupones"));
const AdminCupones = lazy(() => import("./pages/AdminCupones"));

// Chatbot se carga de forma diferida
const ChatbotWrapper = lazy(() => import("./components/ChatbotWrapper").then(m => ({ default: m.ChatbotWrapper })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes cacheTime)
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/nosotros" element={<AboutUs />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/rastrear" element={<OrderTracking />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/pedir" element={<OrderRequest />} />
            <Route path="/manage" element={<OrderManagement />} />
            <Route path="/solicitar-retiro" element={<PickupRequest />} />
            <Route path="/cancel-notifications" element={<CancelNotifications />} />
            <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
            <Route path="/politicas-envio" element={<ShippingPolicy />} />
            <Route path="/politicas-reembolso" element={<RefundPolicy />} />
            <Route path="/terminos-condiciones" element={<TermsConditions />} />
            <Route path="/admin/politicas" element={<AdminPoliticas />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro-confirmado" element={<RegistroConfirmado />} />
            <Route path="/mi-cuenta" element={<CustomerDashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/productos" element={<AdminProductos />} />
            <Route path="/admin/promociones" element={<AdminPromociones />} />
            <Route path="/brillarte-pedidos" element={<BrillartePedidos />} />
            <Route path="/promociones" element={<Promociones />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/perfil/:userId" element={<PerfilPublico />} />
            <Route path="/tarjetas-regalo" element={<TarjetasRegalo />} />
            <Route path="/admin/tarjetas" element={<AdminTarjetas />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/emails" element={<AdminEmails />} />
            <Route path="/admin/cuentas" element={<AdminCuentas />} />
            <Route path="/admin/cuenta/:userId" element={<AdminCuentaDetalle />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/verificaciones" element={<AdminVerificaciones />} />
            <Route path="/admin/contabilidad" element={<AdminContabilidad />} />
            <Route path="/comunidad" element={<Comunidad />} />
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/perfil-publico/:userId" element={<PerfilPublico />} />
            <Route path="/solicitar-verificacion" element={<SolicitudVerificacion />} />
            <Route path="/cuenta-suspendida" element={<BannedAccount />} />
            <Route path="/admin/carritos-abandonados" element={<AdminCarritosAbandonados />} />
            <Route path="/admin/envios" element={<AdminEnvios />} />
            <Route path="/apelar-baneo" element={<ApelacionBaneo />} />
            <Route path="/admin/solicitudes-ia" element={<AdminSolicitudesIA />} />
            <Route path="/guia-codigos-pago" element={<GuiaCodigosPago />} />
            <Route path="/admin/codigos-pago" element={<AdminCodigosPago />} />
            <Route path="/admin/brillarte-pay" element={<AdminBrillartePay />} />
            <Route path="/rastrear-pedido/:codigoPedido" element={<RastrearPedidoOnline />} />
            <Route path="/cuenta" element={<Account />} />
            <Route path="/agente/login" element={<AgentLogin />} />
            <Route path="/agente/dashboard" element={<AgentDashboard />} />
            <Route path="/rastrear-ticket" element={<RastrearTicket />} />
            <Route path="/cupones" element={<Cupones />} />
            <Route path="/admin/cupones" element={<AdminCupones />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWrapper />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;