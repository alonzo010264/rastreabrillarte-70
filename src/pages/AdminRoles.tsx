import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Shield, UserCog } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles?: {
    nombre_completo: string;
    correo: string;
  };
}

const AdminRoles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("user");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadUserRoles();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    setIsAdmin(hasAdminRole || false);

    if (!hasAdminRole) {
      toast.error('No tienes permisos de administrador');
      navigate('/');
    }
  };

  const loadUserRoles = async () => {
    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cargar perfiles separadamente
      const rolesWithProfiles = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, correo')
            .eq('user_id', role.user_id)
            .single();

          return {
            ...role,
            profiles: profile
          };
        })
      );

      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!email) {
      toast.error('Ingresa un correo electrónico');
      return;
    }

    try {
      // Buscar el usuario por email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('correo', email)
        .single();

      if (!profile) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Asignar el rol
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: profile.user_id,
          role: selectedRole as 'admin' | 'moderator' | 'user'
        }]);

      if (error) throw error;

      toast.success(`Rol ${selectedRole} asignado correctamente`);
      setEmail("");
      loadUserRoles();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      if (error.code === '23505') {
        toast.error('El usuario ya tiene este rol asignado');
      } else {
        toast.error('Error al asignar rol');
      }
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Rol eliminado correctamente');
      loadUserRoles();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Error al eliminar rol');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'moderator':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Gestión de Roles y Seguridad</h1>
              <p className="text-muted-foreground">Administra los permisos de los usuarios del sistema</p>
            </div>
          </div>

          {/* Asignar Nuevo Rol */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Asignar Nuevo Rol
              </CardTitle>
              <CardDescription>
                Otorga permisos de administrador o moderador a usuarios registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="email">Correo del Usuario</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={assignRole} className="w-full">
                    Asignar Rol
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Roles Actuales */}
          <Card>
            <CardHeader>
              <CardTitle>Usuarios con Roles Especiales</CardTitle>
              <CardDescription>
                Lista de todos los usuarios con permisos administrativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Asignación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.profiles?.nombre_completo || 'N/A'}
                      </TableCell>
                      <TableCell>{userRole.profiles?.correo || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(userRole.role)}>
                          {userRole.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(userRole.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRole(userRole.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminRoles;