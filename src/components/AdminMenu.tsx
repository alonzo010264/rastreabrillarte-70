import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  Settings,
  Shield,
  Mail,
  Ticket,
  Users,
  Calculator,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserAvatar from "./UserAvatar";

export const AdminMenu = () => {
  const navigate = useNavigate();

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
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>Panel de Administración</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/admin-dashboard')}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard Principal
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/productos')}>
          <Package className="mr-2 h-4 w-4" />
          Gestionar Productos
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/promociones')}>
          <Megaphone className="mr-2 h-4 w-4" />
          Crear Promociones
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/tarjetas')}>
          <Gift className="mr-2 h-4 w-4" />
          Crear Tarjetas de Regalo
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/brillarte-pedidos')}>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Ver Pedidos
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/roles')}>
          <Shield className="mr-2 h-4 w-4" />
          Roles y Seguridad
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/emails')}>
          <Mail className="mr-2 h-4 w-4" />
          Correos Enviados
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/tickets')}>
          <Ticket className="mr-2 h-4 w-4" />
          Gestionar Tickets
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/solicitudes-ia')}>
          <Bot className="mr-2 h-4 w-4" />
          Solicitudes IA
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/verificaciones')}>
          <Shield className="mr-2 h-4 w-4" />
          Verificaciones y Agentes
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/carritos-abandonados')}>
          <Package className="mr-2 h-4 w-4" />
          Carritos Abandonados
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/cuentas')}>
          <Users className="mr-2 h-4 w-4" />
          Gestionar Cuentas
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/contabilidad')}>
          <Calculator className="mr-2 h-4 w-4" />
          Contabilidad
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/admin/envios')}>
          <Package className="mr-2 h-4 w-4" />
          Gestion de Envios
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <User className="mr-2 h-4 w-4" />
          Mi Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
