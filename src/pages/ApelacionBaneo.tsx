import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Send, MessageCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BanInfo {
  razon: string;
  duracion_tipo: string;
  fecha_fin: string | null;
  automatico: boolean;
  palabra_detectada: string | null;
}

interface Apelacion {
  id: string;
  razon_apelacion: string;
  estado: string;
  notas_admin: string | null;
  created_at: string;
}

const ApelacionBaneo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [apelaciones, setApelaciones] = useState<Apelacion[]>([]);
  const [razonApelacion, setRazonApelacion] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Cargar info del baneo
      const { data: banData } = await supabase
        .from('user_bans')
        .select('razon, duracion_tipo, fecha_fin, automatico, palabra_detectada')
        .eq('user_id', user.id)
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!banData) {
        navigate('/cuenta');
        return;
      }

      setBanInfo(banData);

      // Cargar apelaciones anteriores
      const { data: apelacionesData } = await supabase
        .from('apelaciones_baneo')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setApelaciones(apelacionesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApelacion = async () => {
    if (!razonApelacion.trim()) {
      toast({
        title: "Error",
        description: "Escribe la razon de tu apelacion",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('apelaciones_baneo')
        .insert({
          user_id: user.id,
          razon_apelacion: razonApelacion.trim()
        });

      if (error) throw error;

      toast({
        title: "Apelacion enviada",
        description: "Tu apelacion sera revisada por nuestro equipo"
      });

      setRazonApelacion("");
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'aprobada':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case 'rechazada':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Info del baneo */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              Cuenta Suspendida
            </CardTitle>
            <CardDescription>
              Tu cuenta ha sido suspendida por violar nuestras politicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Razon:</Label>
              <p className="font-medium">{banInfo?.razon}</p>
            </div>
            
            {banInfo?.automatico && banInfo?.palabra_detectada && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Deteccion automatica:</strong> Se detecto contenido inapropiado en tu nombre o correo.
                </p>
              </div>
            )}
            
            <div>
              <Label className="text-muted-foreground">Duracion:</Label>
              <p className="font-medium">
                {banInfo?.duracion_tipo === 'permanente' 
                  ? 'Permanente' 
                  : `Hasta ${new Date(banInfo?.fecha_fin || '').toLocaleDateString()}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Politicas */}
        <Card>
          <CardHeader>
            <CardTitle>Politicas de Registro</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>En BRILLARTE nos comprometemos a mantener una comunidad respetuosa. No permitimos:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Nombres de usuario con palabras vulgares u ofensivas</li>
              <li>Contenido que promueva discriminacion racial</li>
              <li>Lenguaje obsceno o inapropiado</li>
              <li>Suplantacion de identidad</li>
              <li>Cualquier contenido que viole nuestros terminos de servicio</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Si crees que tu cuenta fue suspendida por error, puedes apelar tu caso a continuacion.
            </p>
          </CardContent>
        </Card>

        {/* Formulario de apelacion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Apelar Suspension
            </CardTitle>
            <CardDescription>
              Explica por que crees que la suspension es incorrecta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Escribe aqui tu apelacion. Explica por que crees que la suspension fue un error..."
              value={razonApelacion}
              onChange={(e) => setRazonApelacion(e.target.value)}
              rows={5}
            />
            <Button 
              onClick={handleSubmitApelacion} 
              disabled={sending || !razonApelacion.trim()}
              className="w-full"
            >
              {sending ? "Enviando..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Apelacion
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Historial de apelaciones */}
        {apelaciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Apelaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apelaciones.map((apelacion) => (
                  <div key={apelacion.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      {getEstadoBadge(apelacion.estado)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(apelacion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{apelacion.razon_apelacion}</p>
                    {apelacion.notas_admin && (
                      <div className="bg-muted p-3 rounded mt-2">
                        <p className="text-sm font-medium">Respuesta del administrador:</p>
                        <p className="text-sm">{apelacion.notas_admin}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Boton de cerrar sesion */}
        <Button variant="outline" onClick={handleLogout} className="w-full">
          Cerrar Sesion
        </Button>
      </div>
    </div>
  );
};

export default ApelacionBaneo;
