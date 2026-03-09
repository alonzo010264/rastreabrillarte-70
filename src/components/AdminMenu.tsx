import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Gift,
  Megaphone,
  User,
  LogOut,
  ShoppingBag,
  Shield,
  Mail,
  Ticket,
  Users,
  Calculator,
  Bot,
  Key,
  CreditCard,
  FileText,
  Truck,
  ShoppingCart,
  Tag,
  PartyPopper,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";
import { cn } from "@/lib/utils";

const adminDashboards = [
  { label: "Dashboard Principal", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Gestionar Productos", href: "/admin/productos", icon: Package },
  { label: "Crear Promociones", href: "/admin/promociones", icon: Megaphone },
  { label: "Tarjetas de Regalo", href: "/admin/tarjetas", icon: Gift },
  { label: "Ver Pedidos", href: "/brillarte-pedidos", icon: ShoppingBag },
  { label: "Gestionar Envíos", href: "/admin/envios", icon: Truck },
  { label: "Carritos Abandonados", href: "/admin/carritos-abandonados", icon: ShoppingCart },
  { label: "Gestionar Cuentas", href: "/admin/cuentas", icon: Users },
  { label: "Roles y Seguridad", href: "/admin/roles", icon: Shield },
  { label: "Correos Enviados", href: "/admin/emails", icon: Mail },
  { label: "Gestionar Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Solicitudes IA", href: "/admin/solicitudes-ia", icon: Bot },
  { label: "Verificaciones y Agentes", href: "/admin/verificaciones", icon: Shield },
  { label: "Contabilidad", href: "/admin/contabilidad", icon: Calculator },
  { label: "Códigos de Pago", href: "/admin/codigos-pago", icon: Key },
  { label: "BrillartePay", href: "/admin/brillarte-pay", icon: CreditCard },
  { label: "Políticas", href: "/admin/politicas", icon: FileText },
  { label: "Cupones", href: "/admin/cupones", icon: Tag },
  { label: "Correos IA", href: "/admin/correos-ia", icon: Bot },
];

export const AdminMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <UserAvatar size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 max-h-[70vh] overflow-y-auto" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Panel de Administración
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
            Dashboards
          </DropdownMenuLabel>
          {adminDashboards.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <DropdownMenuItem
                key={item.href}
                onClick={() => navigate(item.href)}
                className={cn(
                  "cursor-pointer",
                  isActive && "bg-primary/10 text-primary font-medium"
                )}
              >
                <Icon className={cn("mr-2 h-4 w-4", isActive && "text-primary")} />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/perfil')} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Mi Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
