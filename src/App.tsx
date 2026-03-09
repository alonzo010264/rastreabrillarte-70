import { lazy, Suspense, useEffect } from "react";
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

// Helper: lazy load with automatic retry on chunk load failure (common on mobile)
function lazyWithRetry(importFn: () => Promise<any>, retries = 3): ReturnType<typeof lazy> {
  return lazy(() => {
    const attempt = (triesLeft: number): Promise<any> =>
      importFn().catch((err: any) => {
        if (triesLeft <= 0) throw err;
        // Wait briefly then retry (helps with flaky mobile connections)
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => attempt(triesLeft - 1));
      });
    return attempt(retries);
  });
}

// Lazy load de páginas principales
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
// Componentes de protección
const ProtectedRoute = lazyWithRetry(() => import("./components/ProtectedRoute"));

// Chatbot se carga de forma diferida
const ChatbotWrapper = lazyWithRetry(() => import("./components/ChatbotWrapper").then(m => ({ default: m.ChatbotWrapper })));

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
            <Route path="/regalos" element={<BrillarteRegalos />} />
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
            <Route path="/suscribir-pedido" element={<SuscribirPedido />} />
            
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/novedades" element={<Novedades />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/mi-pedido/:codigoPedido" element={<MiPedidoDetalle />} />
            <Route path="/verificacion" element={<VerificacionPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/referidos" element={<Referidos />} />
            <Route path="/emprende-brillarte" element={<EmprendeBrillarte />} />
            <Route path="/emprende-brillarte/aplicar" element={<EmprendeBrillarteAplicar />} />

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
            <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
            <Route path="/admin/referidos" element={<ProtectedRoute><AdminReferidos /></ProtectedRoute>} />
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
