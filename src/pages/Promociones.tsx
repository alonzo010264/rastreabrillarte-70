import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Gift, Calendar, Instagram, Facebook, Heart, Sparkles, Trophy } from "lucide-react";

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  imagen_url: string | null;
  fecha_inicio: string | null;
  fecha_limite: string;
  instrucciones: string | null;
  activa: boolean | null;
}

export default function Promociones() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [participandoId, setParticipaandoId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [comentario, setComentario] = useState("");

  useEffect(() => {
    loadPromociones();

    // Suscribirse a cambios en tiempo real de participaciones
    const channel = supabase
      .channel('participaciones-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participaciones_promociones'
        },
        () => {
          // Opcional: mostrar notificación cuando hay nueva participación
          console.log('Nueva participación registrada');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPromociones = async () => {
    try {
      const { data, error } = await supabase
        .from('promociones')
        .select('*')
        .eq('activa', true)
        .gte('fecha_limite', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromociones(data || []);
    } catch (error) {
      console.error('Error loading promociones:', error);
      toast.error('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipar = async (promocionId: string) => {
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Debes iniciar sesión para participar');
      // Redirigir a login después de un momento
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    try {
      // Detectar menciones en el comentario (@usuario)
      const mencionesRegex = /@(\w+)/g;
      const menciones: string[] = [];
      let match;
      
      while ((match = mencionesRegex.exec(comentario)) !== null) {
        menciones.push(match[1]);
      }

      const { error } = await supabase
        .from('participaciones_promociones')
        .insert([{
          promocion_id: promocionId,
          user_email: user.email!,
          comentario: comentario || null,
          menciones: menciones.length > 0 ? menciones : null,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya estás participando en esta promoción');
        } else {
          throw error;
        }
        return;
      }

      // Si hay menciones, enviar notificaciones
      if (menciones.length > 0) {
        // Buscar usuarios mencionados (por nombre)
        const { data: mencionados } = await supabase
          .from('profiles')
          .select('user_id, nombre_completo')
          .ilike('nombre_completo', `%${menciones[0]}%`); // Simplificado para demo

        if (mencionados && mencionados.length > 0) {
          const notificaciones = mencionados.map(m => ({
            user_id: m.user_id,
            tipo: 'mencion',
            titulo: '¡Te mencionaron!',
            mensaje: `${user.email} te mencionó en una promoción: "${comentario.substring(0, 50)}..."`,
            accion_url: '/promociones'
          }));

          await supabase.from('notifications').insert(notificaciones);
        }
      }

      toast.success('¡Participación registrada exitosamente! 🎉');
      setParticipaandoId(null);
      setEmail("");
      setComentario("");
    } catch (error) {
      console.error('Error participating:', error);
      toast.error('Error al registrar participación');
    }
  };

  const getDaysRemaining = (fechaLimite: string) => {
    const today = new Date();
    const limit = new Date(fechaLimite);
    const diffTime = limit.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-lg">Cargando promociones...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        {/* Hero Section */}
        <section className="py-16 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Trophy className="w-12 h-12 text-primary animate-bounce" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Promociones Brillarte
              </h1>
              <Gift className="w-12 h-12 text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              ¡Participa en nuestras promociones y sorteos exclusivos! Sigue los pasos de cada promoción para tener la oportunidad de ganar increíbles premios.
            </p>
            
            {/* Social Media Alert */}
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Heart className="w-8 h-8 text-primary shrink-0 mt-1 animate-pulse" />
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-2">¡Síguenos en Redes Sociales!</h3>
                    <p className="text-muted-foreground mb-4">
                      Mantente al tanto de todas nuestras promociones, sorteos y dinámicas especiales siguiéndonos en:
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Promociones Grid */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            {promociones.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No hay promociones activas</h3>
                  <p className="text-muted-foreground">
                    ¡Síguenos en redes sociales para enterarte de las próximas promociones!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {promociones.map((promocion) => {
                  const daysRemaining = getDaysRemaining(promocion.fecha_limite);
                  const isExpiringSoon = daysRemaining <= 3;
                  
                  return (
                    <Card 
                      key={promocion.id} 
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-xl">{promocion.titulo}</CardTitle>
                          {isExpiringSoon && (
                            <Badge variant="destructive" className="shrink-0 animate-pulse">
                              ¡Últimos días!
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className={isExpiringSoon ? "text-destructive font-semibold" : ""}>
                            {daysRemaining > 0 
                              ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                              : '¡Último día!'
                            }
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        {promocion.imagen_url && (
                          <img
                            src={promocion.imagen_url}
                            alt={promocion.titulo}
                            className="w-full h-48 object-cover rounded-md mb-4"
                          />
                        )}
                        
                        <CardDescription className="mb-4 text-base">
                          {promocion.descripcion}
                        </CardDescription>

                        {promocion.instrucciones && (
                          <div className="bg-muted/50 rounded-md p-3 mb-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Cómo Participar:
                            </h4>
                            <p className="text-sm whitespace-pre-line">{promocion.instrucciones}</p>
                          </div>
                        )}

                        {participandoId === promocion.id ? (
                          <div className="space-y-3 mt-4 p-4 bg-primary/5 rounded-lg">
                            <div>
                              <Label htmlFor={`comentario-${promocion.id}`}>
                                Comentario (opcional)
                              </Label>
                              <Textarea
                                id={`comentario-${promocion.id}`}
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Cuéntanos por qué quieres participar... Puedes mencionar @brillarte"
                                rows={2}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Tip: Usa @brillarte para mencionar a la cuenta oficial
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleParticipar(promocion.id)}
                                className="flex-1"
                              >
                                Confirmar Participación
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setParticipaandoId(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => setParticipaandoId(promocion.id)}
                            className="w-full"
                            size="lg"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            ¡Participar Ahora!
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}