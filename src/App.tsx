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
import OrderRequest from "./pages/OrderRequest";
import OrderManagement from "./components/OrderManagement";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/CustomerDashboard";
import PickupRequest from "./pages/PickupRequest";
import CancelNotifications from "./pages/CancelNotifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import TermsConditions from "./pages/TermsConditions";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RegistroConfirmado from "./pages/RegistroConfirmado";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProductos from "./pages/AdminProductos";
import BrillartePedidos from "./pages/BrillartePedidos";
import Promociones from "./pages/Promociones";
import AdminPromociones from "./pages/AdminPromociones";
import Favoritos from "./pages/Favoritos";
import Perfil from "./pages/Perfil";
import PerfilPublico from "./pages/PerfilPublico";
import TarjetasRegalo from "./pages/TarjetasRegalo";
import AdminTarjetas from "./pages/AdminTarjetas";
import AdminRoles from "./pages/AdminRoles";
import AdminEmails from "./pages/AdminEmails";
import AdminCuentas from "./pages/AdminCuentas";
import AdminCuentaDetalle from "./pages/AdminCuentaDetalle";
import Comunidad from "./pages/Comunidad";
import Mensajes from "./pages/Mensajes";
import AdminTickets from "./pages/AdminTickets";
import AdminVerificaciones from "./pages/AdminVerificaciones";
import AdminContabilidad from "./pages/AdminContabilidad";
import SolicitudVerificacion from "./pages/SolicitudVerificacion";
import BannedAccount from "./pages/BannedAccount";
import AdminCarritosAbandonados from "./pages/AdminCarritosAbandonados";
import AdminEnvios from "./pages/AdminEnvios";
import ApelacionBaneo from "./pages/ApelacionBaneo";
import AdminSolicitudesIA from "./pages/AdminSolicitudesIA";
import { ChatbotWrapper } from "./components/ChatbotWrapper";
import GuiaCodigosPago from "./pages/GuiaCodigosPago";
import AdminCodigosPago from "./pages/AdminCodigosPago";
import AdminBrillartePay from "./pages/AdminBrillartePay";
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
          <Route path="/pedir" element={<OrderRequest />} />
          <Route path="/manage" element={<OrderManagement />} />
          <Route path="/solicitar-retiro" element={<PickupRequest />} />
          <Route path="/cancel-notifications" element={<CancelNotifications />} />
          <Route path="/politicas-privacidad" element={<PrivacyPolicy />} />
          <Route path="/politicas-envio" element={<ShippingPolicy />} />
          <Route path="/terminos-condiciones" element={<TermsConditions />} />
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
          <Route path="/cuenta" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatbotWrapper />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
