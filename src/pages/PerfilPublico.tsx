import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, UserPlus, UserCheck, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import verificadoIcon from "@/assets/verificado-icon.png";

interface PublicProfile {
  id: string;
  user_id: string;
  nombre_completo: string;
  avatar_url: string | null;
  verificado: boolean;
  fecha_creacion: string;
  correo: string;
}

export default function PerfilPublico() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    checkCurrentUser();
    loadPublicProfile();

    // Suscribirse a cambios en tiempo real del perfil
    if (userId) {
      const channel = supabase
        .channel(`public-profile-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Profile updated:', payload.new);
            setProfile(payload.new as PublicProfile);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'follows'
          },
          () => {
            loadFollowStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadFollowStats = async () => {
    if (!userId) return;

    // Verificar si es la cuenta oficial primero
    const { data: profileData } = await supabase
      .from('profiles')
      .select('correo')
      .eq('user_id', userId)
      .single();

    const isOfficialBrillarte = profileData?.correo === 'oficial@brillarte.lat';

    // Cargar seguidores
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    // Si es la cuenta oficial, siempre mostrar 700 seguidores
    setFollowersCount(isOfficialBrillarte ? 700 : (followersCount || 0));

    // Cargar siguiendo
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    setFollowingCount(followingCount || 0);

    // Verificar si el usuario actual sigue a este perfil
    if (currentUser) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    }
  };

  const BRILLARTE_OFFICIAL_EMAIL = 'oficial@brillarte.lat';
  const BRILLARTE_LOGO_URL = '/lovable-uploads/991959ba-9b7a-4a2d-9059-6a3eb1bb866c.png';

  const loadPublicProfile = async () => {
    if (!userId) {
      toast.error('Usuario no encontrado');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nombre_completo, avatar_url, verificado, fecha_creacion, correo')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Perfil no encontrado');
        navigate('/');
        return;
      }

      // Si es cuenta oficial de BRILLARTE, usar datos especiales
      const isOfficial = data.correo === BRILLARTE_OFFICIAL_EMAIL;
      const finalProfile = isOfficial 
        ? { 
            ...data, 
            nombre_completo: 'BRILLARTE', 
            avatar_url: BRILLARTE_LOGO_URL, 
            verificado: true 
          }
        : data;

      setProfile(finalProfile);
      await loadFollowStats();
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar perfil');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para seguir usuarios');
      navigate('/login');
      return;
    }

    if (!userId) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        toast.success('Has dejado de seguir a este usuario');
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          });

        toast.success('Ahora sigues a este usuario');
      }

      setIsFollowing(!isFollowing);
      await loadFollowStats();
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error('No se pudo realizar la acción');
    }
  };

  const handleMessage = () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesión para enviar mensajes');
      navigate('/login');
      return;
    }

    navigate(`/mensajes?userId=${userId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
            <CardHeader className="relative pb-0">
              <div className="flex flex-col items-center -mt-16">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage 
                      src={profile.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : undefined} 
                      alt={profile.nombre_completo}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {profile.nombre_completo.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {profile.verificado && (
                    <img 
                      src={verificadoIcon} 
                      alt="Verificado" 
                      className="absolute -bottom-1 -right-1 w-10 h-10"
                    />
                  )}
                </div>
                
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.nombre_completo}</h1>
                    {profile.verificado && (
                      <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        <img 
                          src={verificadoIcon} 
                          alt="Verificado" 
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-blue-500">Oficial</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="mt-6 space-y-4">
              {/* Estadísticas de seguimiento */}
              <div className="flex justify-center gap-8 pb-4 border-b">
                <div className="text-center">
                  <p className="text-2xl font-bold">{followersCount}</p>
                  <p className="text-sm text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{followingCount}</p>
                  <p className="text-sm text-muted-foreground">Siguiendo</p>
                </div>
              </div>

              {/* Botones de acción */}
              {currentUser && currentUser.id !== userId && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? 'outline' : 'default'}
                    className="flex-1"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Siguiendo
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleMessage}
                    variant="outline"
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensaje
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>
                  Miembro desde {new Date(profile.fecha_creacion).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>

              {profile.verificado && (
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <img 
                      src={verificadoIcon} 
                      alt="Verificado" 
                      className="w-6 h-6 shrink-0 mt-0.5"
                    />
                    <div>
                      <h3 className="font-semibold mb-1 text-blue-600">Cuenta Oficial</h3>
                      <p className="text-sm text-muted-foreground">
                        {profile.correo === 'oficial@brillarte.lat' 
                          ? 'Esta es la cuenta oficial de BRILLARTE.'
                          : 'Esta cuenta ha sido verificada por BRILLARTE como cuenta oficial.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
