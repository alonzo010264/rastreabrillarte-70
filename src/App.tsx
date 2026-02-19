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
const Eventos = lazy(() => import("./pages/Eventos"));
const AdminNoticias = lazy(() => import("./pages/AdminNoticias"));
const Novedades = lazy(() => import("./pages/Novedades"));
const MiPedidoDetalle = lazy(() => import("./pages/MiPedidoDetalle"));
const VerificacionPage = lazy(() => import("./pages/Verificacion"));

// Componentes de protección
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));

// Chatbot se carga de forma diferida
const ChatbotWrapper = lazy(() => import("./components/ChatbotWrapper").then(m => ({ default: m.ChatbotWrapper })));

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/nosotros" element={<AboutUs />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/rastrear" element={<OrderTracking />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/pedir" element={<OrderRequest />} />
            <Route path="/solicitar-retiro" element={<PickupRequest />} />
            <Route path="/cancel-notifications" element={<CancelNotifications />} />
            <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
            <Route path="/politicas-envio" element={<ShippingPolicy />} />
            <Route path="/politicas-reembolso" element={<RefundPolicy />} />
            <Route path="/terminos-condiciones" element={<TermsConditions />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro-confirmado" element={<RegistroConfirmado />} />
            <Route path="/mi-cuenta" element={<CustomerDashboard />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/promociones" element={<Promociones />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/perfil/:userId" element={<PerfilPublico />} />
            <Route path="/perfil-publico/:userId" element={<PerfilPublico />} />
            <Route path="/tarjetas-regalo" element={<TarjetasRegalo />} />
            <Route path="/comunidad" element={<Comunidad />} />
            <Route path="/mensajes" element={<Mensajes />} />
            <Route path="/solicitar-verificacion" element={<SolicitudVerificacion />} />
            <Route path="/cuenta-suspendida" element={<BannedAccount />} />
            <Route path="/apelar-baneo" element={<ApelacionBaneo />} />
            <Route path="/guia-codigos-pago" element={<GuiaCodigosPago />} />
            <Route path="/rastrear-pedido/:codigoPedido" element={<RastrearPedidoOnline />} />
            <Route path="/cuenta" element={<Account />} />
            <Route path="/rastrear-ticket" element={<RastrearTicket />} />
            <Route path="/cupones" element={<Cupones />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/novedades" element={<Novedades />} />
            <Route path="/mi-pedido/:codigoPedido" element={<MiPedidoDetalle />} />
            <Route path="/verificacion" element={<VerificacionPage />} />

            {/* Rutas de agente - requiere rol agent */}
            <Route path="/agente/login" element={<AgentLogin />} />
            <Route path="/agente/dashboard" element={<ProtectedRoute requiredRole="agent"><AgentDashboard /></ProtectedRoute>} />

            {/* Rutas protegidas de administración - solo admin verificados */}
            <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute><AdminProductos /></ProtectedRoute>} />
            <Route path="/admin/promociones" element={<ProtectedRoute><AdminPromociones /></ProtectedRoute>} />
            <Route path="/admin/tarjetas" element={<ProtectedRoute><AdminTarjetas /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/emails" element={<ProtectedRoute><AdminEmails /></ProtectedRoute>} />
            <Route path="/admin/cuentas" element={<ProtectedRoute><AdminCuentas /></ProtectedRoute>} />
            <Route path="/admin/cuenta/:userId" element={<ProtectedRoute><AdminCuentaDetalle /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute><AdminTickets /></ProtectedRoute>} />
            <Route path="/admin/verificaciones" element={<ProtectedRoute><AdminVerificaciones /></ProtectedRoute>} />
            <Route path="/admin/contabilidad" element={<ProtectedRoute><AdminContabilidad /></ProtectedRoute>} />
            <Route path="/admin/carritos-abandonados" element={<ProtectedRoute><AdminCarritosAbandonados /></ProtectedRoute>} />
            <Route path="/admin/envios" element={<ProtectedRoute><AdminEnvios /></ProtectedRoute>} />
            <Route path="/admin/solicitudes-ia" element={<ProtectedRoute><AdminSolicitudesIA /></ProtectedRoute>} />
            <Route path="/admin/codigos-pago" element={<ProtectedRoute><AdminCodigosPago /></ProtectedRoute>} />
            <Route path="/admin/brillarte-pay" element={<ProtectedRoute><AdminBrillartePay /></ProtectedRoute>} />
            <Route path="/admin/politicas" element={<ProtectedRoute><AdminPoliticas /></ProtectedRoute>} />
            <Route path="/admin/cupones" element={<ProtectedRoute><AdminCupones /></ProtectedRoute>} />
            <Route path="/admin/noticias" element={<ProtectedRoute><AdminNoticias /></ProtectedRoute>} />
            <Route path="/brillarte-pedidos" element={<ProtectedRoute><BrillartePedidos /></ProtectedRoute>} />
            <Route path="/manage" element={<ProtectedRoute><OrderManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatbotWrapper />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
