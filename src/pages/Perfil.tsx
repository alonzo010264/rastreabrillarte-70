import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UserAvatar from "@/components/UserAvatar";
import { MisPedidos } from "@/components/MisPedidos";
import { MiSaldo } from "@/components/MiSaldo";
import { Upload, LogOut, User as UserIcon, Mail, Phone, MapPin, Package, DollarSign, Ticket } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import TicketSupport from "@/components/TicketSupport";
import verificadoIcon from "@/assets/verificado-icon.png";

export default function Perfil() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const isBrillarteAccount = profile?.correo === 'oficial@brillarte.lat';
  
  const defaultTab = searchParams.get('tab') || 'perfil';

  useEffect(() => {
    checkUser();

    // Suscribirse a cambios en tiempo real del perfil
    const channel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Si es el perfil del usuario actual, actualizar
          if (user && payload.new.user_id === user.id) {
            setProfile(payload.new);
            toast.success('Perfil actualizado');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 2MB');
        return;
      }

      setUploading(true);

      // Crear URL temporal para mostrar la imagen inmediatamente
      const tempUrl = URL.createObjectURL(file);
      
      // Actualizar el perfil localmente primero para feedback inmediato
      setProfile((prev: any) => ({ ...prev, avatar_url: tempUrl }));
      toast.success('Subiendo imagen...');

      // Subir imagen a storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Eliminar avatar anterior si existe
      if (profile?.avatar_url && profile.avatar_url.includes('avatars/')) {
        const oldPath = profile.avatar_url.split('/avatars/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refrescar el perfil para obtener la última versión
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // Limpiar URL temporal
      URL.revokeObjectURL(tempUrl);
      
      toast.success('¡Foto de perfil actualizada! Todos pueden verla ahora 🎉');
      
      // Realtime se encargará de actualizar automáticamente
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir foto de perfil');
      // Recargar perfil en caso de error
      checkUser();
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.trim()) {
      toast.error("Por favor ingresa una dirección");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ direccion: newAddress })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, direccion: newAddress });
      setEditingAddress(false);
      toast.success("Dirección actualizada");
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error("Error al actualizar dirección");
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Cargando...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="perfil">
                <UserIcon className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              {!isBrillarteAccount && (
                <>
                  <TabsTrigger value="pedidos">
                    <Package className="w-4 h-4 mr-2" />
                    Mis Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="saldo">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Mi Saldo
                  </TabsTrigger>
                  <TabsTrigger value="tickets">
                    <Ticket className="w-4 h-4 mr-2" />
                    Tickets
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="perfil" className="space-y-6">
              {/* Avatar Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Foto de Perfil
                    {profile?.verificado && (
                      <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        <img src={verificadoIcon} alt="Verificado" className="w-5 h-5" />
                        <span className="text-sm font-medium text-blue-500">Cuenta Oficial</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <UserAvatar size="lg" />
                    {profile?.verificado && (
                      <img 
                        src={verificadoIcon} 
                        alt="Verificado" 
                        className="absolute -bottom-1 -right-1 w-8 h-8"
                      />
                    )}
                  </div>
                  
                  {/* Mostrar insignia de cuenta oficial */}
                  {profile?.verificado && (
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20 w-full">
                      <div className="flex items-center gap-3">
                        <img src={verificadoIcon} alt="Verificado" className="w-8 h-8" />
                        <div>
                          <h3 className="font-semibold text-blue-600">Cuenta Oficial Verificada</h3>
                          <p className="text-sm text-muted-foreground">
                            Tu cuenta ha sido verificada por BRILLARTE
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" disabled={uploading} asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG o GIF. Máximo 2MB.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">{profile?.nombre_completo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Correo</p>
                      <p className="font-medium">{profile?.correo}</p>
                    </div>
                  </div>

                  {profile?.telefono && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{profile.telefono}</p>
                      </div>
                    </div>
                  )}

                  {!isBrillarteAccount && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">Dirección</p>
                        {editingAddress ? (
                          <div className="space-y-2">
                            <Textarea
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="Ingresa tu dirección completa..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateAddress}>
                                Guardar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setEditingAddress(false);
                                  setNewAddress("");
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{profile?.direccion || 'No especificada'}</p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="mt-2"
                              onClick={() => {
                                setEditingAddress(true);
                                setNewAddress(profile?.direccion || "");
                              }}
                            >
                              {profile?.direccion ? 'Editar' : 'Agregar'} Dirección
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {profile?.codigo_membresia && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Código de Membresía</p>
                        <p className="font-bold text-primary">{profile.codigo_membresia}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {!isBrillarteAccount && (
              <>
                <TabsContent value="pedidos">
                  <MisPedidos />
                </TabsContent>

                <TabsContent value="saldo">
                  <MiSaldo />
                </TabsContent>

                <TabsContent value="tickets">
                  <TicketSupport userId={user.id} codigoMembresia={profile?.codigo_membresia || ''} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}
