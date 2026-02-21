import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Ban, DollarSign, Trash2, Eye, ShieldCheck, XCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile {
  id: string;
  user_id: string;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  saldo: number;
  verificado: boolean;
  created_at: string;
}

interface UserBan {
  id: string;
  razon: string;
  duracion_tipo: string;
  fecha_fin: string | null;
  activo: boolean;
}

const AdminCuentas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showAdjustBalanceDialog, setShowAdjustBalanceDialog] = useState(false);
  const [userBans, setUserBans] = useState<Record<string, UserBan>>({});
  const [banInfo, setBanInfo] = useState({
    razon: "",
    duracion_tipo: "temporal",
    duracion_horas: 24
  });
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    monto: 0,
    concepto: ""
  });

  useEffect(() => {
    checkAdminStatus();
    loadProfiles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = profiles.filter(profile =>
        profile.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.correo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchTerm, profiles]);

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      toast.error('No tienes permisos de administrador');
      navigate('/');
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cargar suspensiones activas
      const { data: bansData } = await supabase
        .from('user_bans')
        .select('*')
        .eq('activo', true);
      
      const bansMap: Record<string, UserBan> = {};
      bansData?.forEach(ban => {
        if (ban.duracion_tipo === 'permanente' || 
            (ban.fecha_fin && new Date(ban.fecha_fin) > new Date())) {
          bansMap[ban.user_id] = ban;
        }
      });
      
      setUserBans(bansMap);
      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedProfile || !banInfo.razon) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const banData: any = {
        user_id: selectedProfile.user_id,
        admin_id: user?.id,
        razon: banInfo.razon,
        duracion_tipo: banInfo.duracion_tipo,
        activo: true
      };

      if (banInfo.duracion_tipo === 'temporal') {
        banData.duracion_horas = banInfo.duracion_horas;
        const fechaFin = new Date();
        fechaFin.setHours(fechaFin.getHours() + banInfo.duracion_horas);
        banData.fecha_fin = fechaFin.toISOString();
      }

      const { error } = await supabase
        .from('user_bans')
        .insert(banData);

      if (error) throw error;

      toast.success('Usuario suspendido correctamente');
      setShowBanDialog(false);
      setBanInfo({ razon: "", duracion_tipo: "temporal", duracion_horas: 24 });
      setSelectedProfile(null);
      loadProfiles();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Error al banear usuario');
    }
  };

  const handleAdjustBalance = async (action: 'add' | 'remove') => {
    if (!selectedProfile || !balanceAdjustment.monto || !balanceAdjustment.concepto) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const tipo = action === 'add' ? 'credito' : 'debito';
      const monto = Math.abs(balanceAdjustment.monto);

      const { error } = await supabase.rpc('update_user_balance', {
        p_user_id: selectedProfile.user_id,
        p_monto: monto,
        p_tipo: tipo,
        p_concepto: balanceAdjustment.concepto,
        p_admin_id: user?.id
      });

      if (error) throw error;

      toast.success(`Saldo ${action === 'add' ? 'agregado' : 'deducido'} correctamente`);
      setShowAdjustBalanceDialog(false);
      setBalanceAdjustment({ monto: 0, concepto: "" });
      setSelectedProfile(null);
      loadProfiles();
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Error al ajustar saldo');
    }
  };

  const handleRemoveBan = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_bans')
        .update({ activo: false })
        .eq('user_id', userId)
        .eq('activo', true);

      if (error) throw error;

      toast.success('Suspensión removida correctamente');
      loadProfiles();
    } catch (error) {
      console.error('Error removing ban:', error);
      toast.error('Error al remover suspensión');
    }
  };

  const handleToggleVerification = async (profile: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verificado: !profile.verificado })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success(`Cuenta ${!profile.verificado ? 'verificada' : 'desverificada'} correctamente`);
      loadProfiles();
    } catch (error) {
      console.error('Error toggling verification:', error);
      toast.error('Error al cambiar verificación');
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
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Gestión de Cuentas de Clientes</h1>
              <p className="text-muted-foreground">Control total sobre las cuentas de usuarios</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Búsqueda de Usuarios</CardTitle>
              <CardDescription>
                Busca por nombre, correo o código de membresía
              </CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Suspensión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.nombre_completo}</TableCell>
                      <TableCell>{profile.correo}</TableCell>
                      <TableCell>${profile.saldo?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={profile.verificado ? "default" : "secondary"}
                          className={profile.verificado ? 'bg-blue-500 hover:bg-blue-600' : ''}
                        >
                          {profile.verificado ? 'Oficial' : 'Sin verificar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userBans[profile.user_id] ? (
                          <Badge variant="destructive">
                            {userBans[profile.user_id].duracion_tipo === 'permanente' 
                              ? 'Permanente' 
                              : `Hasta ${new Date(userBans[profile.user_id].fecha_fin!).toLocaleDateString('es-MX')}`}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin suspensión</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/admin/cuenta/${profile.user_id}`)}
                            title="Ver cuenta completa"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={profile.verificado ? "default" : "outline"}
                            size="icon"
                            onClick={() => handleToggleVerification(profile)}
                            title={profile.verificado ? "Quitar verificación oficial" : "Dar verificación oficial (check azul)"}
                            className={profile.verificado ? 'bg-blue-500 hover:bg-blue-600' : ''}
                          >
                            <ShieldCheck className={`h-4 w-4 ${profile.verificado ? 'text-white' : 'text-gray-400'}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedProfile(profile);
                              setShowAdjustBalanceDialog(true);
                            }}
                            title="Ajustar saldo"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          {userBans[profile.user_id] ? (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveBan(profile.user_id)}
                              title="Quitar suspensión"
                            >
                              <XCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedProfile(profile);
                                setShowBanDialog(true);
                              }}
                              title="Suspender cuenta"
                            >
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialog para banear usuario */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banear Usuario</DialogTitle>
            <DialogDescription>
              Suspende temporalmente o permanentemente el acceso de {selectedProfile?.nombre_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="razon">Razón del Baneo</Label>
              <Textarea
                id="razon"
                value={banInfo.razon}
                onChange={(e) => setBanInfo({ ...banInfo, razon: e.target.value })}
                placeholder="Explica por qué se está baneando este usuario"
              />
            </div>
            <div>
              <Label htmlFor="duracion_tipo">Tipo de Baneo</Label>
              <Select
                value={banInfo.duracion_tipo}
                onValueChange={(value) => setBanInfo({ ...banInfo, duracion_tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="permanente">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banInfo.duracion_tipo === 'temporal' && (
              <div>
                <Label htmlFor="duracion_horas">Duración (horas)</Label>
                <Input
                  id="duracion_horas"
                  type="number"
                  min="1"
                  value={banInfo.duracion_horas}
                  onChange={(e) => setBanInfo({ ...banInfo, duracion_horas: parseInt(e.target.value) })}
                />
              </div>
            )}
            <Button onClick={handleBanUser} variant="destructive" className="w-full">
              Confirmar Baneo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ajustar saldo */}
      <Dialog open={showAdjustBalanceDialog} onOpenChange={setShowAdjustBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>
              Saldo actual de {selectedProfile?.nombre_completo}: ${selectedProfile?.saldo?.toFixed(2) || '0.00'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={balanceAdjustment.monto}
                onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, monto: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={balanceAdjustment.concepto}
                onChange={(e) => setBalanceAdjustment({ ...balanceAdjustment, concepto: e.target.value })}
                placeholder="Ej: Reembolso por pedido cancelado"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAdjustBalance('add')} className="flex-1">
                Agregar Crédito
              </Button>
              <Button onClick={() => handleAdjustBalance('remove')} variant="destructive" className="flex-1">
                Quitar Crédito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminCuentas;