import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Gift, Calendar, Instagram, Facebook, Heart, Sparkles, Mail, Lock } from "lucide-react";

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
  const [comentario, setComentario] = useState("");
  const [isSuscrito, setIsSuscrito] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      // Check localStorage first for quick access
      const cached = localStorage.getItem('brillarte_suscrito_promos');
      if (cached === 'true') {
        setIsSuscrito(true);
        setCheckingSubscription(false);
        // Still verify in background
        verifySubscriptionInDb();
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setIsSuscrito(false);
        setCheckingSubscription(false);
        return;
      }

      const { data } = await supabase
        .from('suscriptores_newsletter')
        .select('id, activo')
        .eq('correo', user.email)
        .eq('activo', true)
        .maybeSingle();

      const subscribed = !!data;
      setIsSuscrito(subscribed);
      if (subscribed) {
        localStorage.setItem('brillarte_suscrito_promos', 'true');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSuscrito(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const verifySubscriptionInDb = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data } = await supabase
        .from('suscriptores_newsletter')
        .select('id, activo')
        .eq('correo', user.email)
        .eq('activo', true)
        .maybeSingle();
      if (!data) {
        localStorage.removeItem('brillarte_suscrito_promos');
        setIsSuscrito(false);
      }
    } catch {}
  };

  useEffect(() => {
    if (isSuscrito) {
      loadPromociones();
    }
  }, [isSuscrito]);

  const handleQuickSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error('Debes iniciar sesión primero');
      return;
    }

    try {
      // Save to DB
      const { error: dbError } = await supabase
        .from('suscriptores_newsletter')
        .insert({ correo: user.email, user_id: user.id });

      if (dbError) {
        if (dbError.code === '23505') {
          // Already exists, maybe inactive — reactivate
          await supabase
            .from('suscriptores_newsletter')
            .update({ activo: true })
            .eq('correo', user.email);
        } else {
          throw dbError;
        }
      }

      // Send welcome email
      await supabase.functions.invoke('send-newsletter-subscription', {
        body: { correo: user.email }
      });

      toast.success('¡Te has suscrito exitosamente!');
      localStorage.setItem('brillarte_suscrito_promos', 'true');
      setIsSuscrito(true);
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Error al suscribirse');
    }
  };

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Debes iniciar sesión para participar');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      return;
    }

    try {
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

      if (menciones.length > 0) {
        const { data: mencionados } = await supabase
          .from('profiles')
          .select('user_id, nombre_completo')
          .ilike('nombre_completo', `%${menciones[0]}%`);

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

      toast.success('Participación registrada exitosamente.');
      setParticipaandoId(null);
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (checkingSubscription) {
    return (
      <>
        <Header title="Promociones y Sorteos" subtitle="¡Participa y gana!" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Sparkles className="w-12 h-12 animate-pulse text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  // Subscription wall
  if (!isSuscrito) {
    return (
      <>
        <Header title="Promociones y Sorteos" subtitle="Contenido exclusivo para suscriptores" />
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <Card className="max-w-md w-full text-center overflow-hidden">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8">
              <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2">Contenido Exclusivo</h2>
              <p className="text-muted-foreground">
                Las promociones y sorteos están disponibles solo para suscriptores del newsletter de BRILLARTE.
              </p>
            </div>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3 text-left text-sm">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>Recibe ofertas exclusivas y participa en sorteos</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm">
                <Gift className="w-5 h-5 text-primary shrink-0" />
                <span>Acceso a promociones especiales solo para suscriptores</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <span>Novedades y lanzamientos antes que nadie</span>
              </div>
              <div className="pt-4">
                <Button onClick={handleQuickSubscribe} className="w-full" size="lg">
                  <Mail className="w-4 h-4 mr-2" />
                  Suscribirme Ahora
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Al suscribirte recibirás un correo de confirmación
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header title="Promociones y Sorteos" subtitle="¡Participa y gana!" />
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
      <Header title="Promociones y Sorteos" subtitle="¡Participa y gana increíbles premios!" />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Heart className="w-8 h-8 text-primary shrink-0 mt-1 animate-pulse" />
                  <div className="text-left">
                    <h3 className="font-semibold text-lg mb-2">¡Síguenos en Redes Sociales!</h3>
                    <p className="text-muted-foreground mb-4">
                      Mantente al tanto de todas nuestras promociones, sorteos y dinámicas especiales.
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Instagram className="w-4 h-4" /> Instagram
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Facebook className="w-4 h-4" /> Facebook
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

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
                    <Card key={promocion.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                      <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-xl">{promocion.titulo}</CardTitle>
                          {isExpiringSoon && (
                            <Badge variant="destructive" className="shrink-0 animate-pulse">¡Últimos días!</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className={isExpiringSoon ? "text-destructive font-semibold" : ""}>
                            {daysRemaining > 0 ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}` : '¡Último día!'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {promocion.imagen_url && (
                          <img src={promocion.imagen_url} alt={promocion.titulo} className="w-full h-48 object-cover rounded-md mb-4" />
                        )}
                        <CardDescription className="mb-4 text-base">{promocion.descripcion}</CardDescription>
                        {promocion.instrucciones && (
                          <div className="bg-muted/50 rounded-md p-3 mb-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" /> Cómo Participar:
                            </h4>
                            <p className="text-sm whitespace-pre-line">{promocion.instrucciones}</p>
                          </div>
                        )}
                        {participandoId === promocion.id ? (
                          <div className="space-y-3 mt-4 p-4 bg-primary/5 rounded-lg">
                            <div>
                              <Label htmlFor={`comentario-${promocion.id}`}>Comentario (opcional)</Label>
                              <Textarea
                                id={`comentario-${promocion.id}`}
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Cuéntanos por qué quieres participar..."
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleParticipar(promocion.id)} className="flex-1">Confirmar Participación</Button>
                              <Button variant="outline" onClick={() => setParticipaandoId(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <Button onClick={() => setParticipaandoId(promocion.id)} className="w-full" size="lg">
                            <Gift className="w-4 h-4 mr-2" /> ¡Participar Ahora!
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
