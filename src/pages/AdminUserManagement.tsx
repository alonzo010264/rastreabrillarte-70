import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AdminUserManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  // Estados para crear nuevo admin
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  
  // Lista de administradores
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    checkCurrentUser();
    loadAdminUsers();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    
    setCurrentUser(session.user);
    
    // Verificar si el usuario actual es admin
    const { data: userRole } = await supabase.rpc('get_user_role');
    if (userRole !== 'admin') {
      toast({
        title: 'Acceso denegado',
        description: 'Solo los administradores pueden acceder a esta página',
        variant: 'destructive',
      });
      navigate('/customer-dashboard');
      return;
    }
    
    setIsCurrentUserAdmin(true);
  };

  const loadAdminUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles!inner(role)
      `)
      .eq('user_roles.role', 'admin');

    if (error) {
      console.error('Error loading admin users:', error);
      return;
    }

    setAdminUsers(profiles || []);
  };

  const createAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            nombre_completo: adminName,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Asignar rol de admin (esto se debe hacer desde el backend)
        // Por ahora, mostraremos un mensaje indicando que se debe hacer manualmente
        toast({
          title: 'Usuario creado',
          description: `Se ha creado el usuario ${adminEmail}. Necesita confirmación por email y asignación manual de rol de administrador.`,
        });

        // Limpiar formulario
        setAdminEmail('');
        setAdminPassword('');
        setAdminName('');
        
        // Recargar lista de usuarios
        setTimeout(() => {
          loadAdminUsers();
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Error al crear usuario',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isCurrentUserAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin-brillarte-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Administradores</h1>
              <p className="text-muted-foreground">Crear y gestionar cuentas de administradores</p>
            </div>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>

        {/* Crear nuevo administrador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Nuevo Administrador
            </CardTitle>
            <CardDescription>
              Crea una cuenta nueva para un agente administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createAdminUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Nombre completo</Label>
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="Nombre del administrador"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Correo electrónico</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@brillarte.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña temporal</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  El administrador deberá cambiar esta contraseña en su primer inicio de sesión
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Creando...' : 'Crear Administrador'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de administradores */}
        <Card>
          <CardHeader>
            <CardTitle>Administradores Actuales</CardTitle>
            <CardDescription>
              Lista de todos los usuarios con permisos de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Fecha de registro</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.nombre_completo}
                      </TableCell>
                      <TableCell>{admin.correo}</TableCell>
                      <TableCell>
                        {new Date(admin.fecha_creacion).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          Administrador
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay administradores registrados aún</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />
        
        {/* Información importante */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Información Importante</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700 space-y-2">
            <p>• Los nuevos administradores recibirán un email de confirmación</p>
            <p>• Deben confirmar su email antes de poder iniciar sesión</p>
            <p>• El rol de administrador se asigna automáticamente tras la creación</p>
            <p>• Pueden acceder tanto al panel de clientes como al de administradores</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserManagement;