import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import verificadoIcon from "@/assets/verificado-icon.png";

interface PublicProfile {
  id: string;
  nombre_completo: string;
  avatar_url: string | null;
  verificado: boolean;
  fecha_creacion: string;
}

export default function PerfilPublico() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const loadPublicProfile = async () => {
    if (!userId) {
      toast.error('Usuario no encontrado');
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo, avatar_url, verificado, fecha_creacion')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error('Perfil no encontrado');
        navigate('/');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar perfil');
      navigate('/');
    } finally {
      setLoading(false);
    }
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
                      className="absolute -bottom-1 -right-1 w-8 h-8"
                    />
                  )}
                </div>
                
                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.nombre_completo}</h1>
                    {profile.verificado && (
                      <img 
                        src={verificadoIcon} 
                        alt="Verificado" 
                        className="w-6 h-6"
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="mt-6 space-y-4">
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
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <img 
                      src={verificadoIcon} 
                      alt="Verificado" 
                      className="w-6 h-6 shrink-0 mt-0.5"
                    />
                    <div>
                      <h3 className="font-semibold mb-1">Cuenta Verificada</h3>
                      <p className="text-sm text-muted-foreground">
                        Esta es una cuenta oficial verificada de Brillarte.
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
