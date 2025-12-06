import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface SolicitudExistente {
  id: string;
  estado: string;
  created_at: string;
  notas_admin?: string;
}

const SolicitudVerificacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [solicitudExistente, setSolicitudExistente] = useState<SolicitudExistente | null>(null);
  const [formData, setFormData] = useState({
    nombre_negocio: "",
    descripcion: "",
    instagram: "",
    whatsapp: "",
    sitio_web: "",
    motivo: ""
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para solicitar verificación");
      navigate('/auth');
      return;
    }
    setUser(user);
    
    // Verificar si ya tiene una solicitud pendiente
    const { data: solicitud } = await supabase
      .from('solicitudes_verificacion')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (solicitud) {
      setSolicitudExistente(solicitud);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motivo.trim()) {
      toast.error("Por favor indica el motivo de tu solicitud");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('solicitudes_verificacion')
        .insert({
          user_id: user.id,
          nombre_negocio: formData.nombre_negocio || null,
          descripcion: formData.descripcion || null,
          instagram: formData.instagram || null,
          whatsapp: formData.whatsapp || null,
          sitio_web: formData.sitio_web || null,
          motivo: formData.motivo
        });

      if (error) throw error;

      toast.success("Solicitud enviada correctamente");
      setSolicitudExistente({
        id: '',
        estado: 'pendiente',
        created_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error:', error);
      if (error.code === '23505') {
        toast.error("Ya tienes una solicitud pendiente");
      } else {
        toast.error("Error al enviar la solicitud");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'aprobada':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Solicitar Verificación</h1>
              <p className="text-muted-foreground">Obtén la insignia de cuenta verificada en BRILLARTE</p>
            </div>
          </div>

          {solicitudExistente ? (
            <Card>
              <CardHeader>
                <CardTitle>Estado de tu Solicitud</CardTitle>
                <CardDescription>
                  Solicitud enviada el {new Date(solicitudExistente.created_at).toLocaleDateString('es-MX')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  {getEstadoBadge(solicitudExistente.estado)}
                </div>
                
                {solicitudExistente.estado === 'pendiente' && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Tu solicitud está siendo revisada. Este proceso puede tomar hasta <strong>un mes</strong>. 
                      Te notificaremos cuando tengamos una respuesta.
                    </p>
                  </div>
                )}

                {solicitudExistente.estado === 'aprobada' && (
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ¡Felicidades! Tu cuenta ha sido verificada. Ahora tienes acceso a funciones exclusivas.
                    </p>
                  </div>
                )}

                {solicitudExistente.estado === 'rechazada' && (
                  <div className="space-y-3">
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Lo sentimos, tu solicitud no fue aprobada en esta ocasión.
                      </p>
                      {solicitudExistente.notas_admin && (
                        <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                          <strong>Razón:</strong> {solicitudExistente.notas_admin}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => setSolicitudExistente(null)} variant="outline">
                      Enviar nueva solicitud
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Formulario de Verificación</CardTitle>
                <CardDescription>
                  Completa la información para que podamos verificar tu cuenta. 
                  La revisión puede tomar hasta un mes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_negocio">Nombre del Negocio (opcional)</Label>
                    <Input
                      id="nombre_negocio"
                      value={formData.nombre_negocio}
                      onChange={(e) => setFormData({...formData, nombre_negocio: e.target.value})}
                      placeholder="Si representas una marca o empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción (opcional)</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      placeholder="Cuéntanos sobre ti o tu negocio"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram (opcional)</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                        placeholder="@tuusuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sitio_web">Sitio Web (opcional)</Label>
                    <Input
                      id="sitio_web"
                      value={formData.sitio_web}
                      onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                      placeholder="https://tusitio.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">¿Por qué deseas ser verificado? *</Label>
                    <Textarea
                      id="motivo"
                      value={formData.motivo}
                      onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                      placeholder="Explica por qué crees que tu cuenta debe ser verificada"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Estaremos revisando tu información. Este proceso puede tomar hasta un mes. 
                      Te notificaremos por correo y en la plataforma cuando tengamos una respuesta.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Enviar Solicitud
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SolicitudVerificacion;