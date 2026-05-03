import { useState } from "react";
import { Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";
import verificadoIcon from "@/assets/verificado-icon.png";

const Correos = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [destinatariosRaw, setDestinatariosRaw] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.verificado) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-3xl mb-2">Acceso restringido</h1>
          <p className="text-muted-foreground">Esta sección es exclusiva para cuentas verificadas de BRILLARTE.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSend = async () => {
    const destinatarios = destinatariosRaw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));

    if (destinatarios.length === 0) {
      toast({ title: "Sin destinatarios", description: "Ingresa al menos un correo válido.", variant: "destructive" });
      return;
    }
    if (!asunto.trim() || !mensaje.trim()) {
      toast({ title: "Faltan datos", description: "Asunto y mensaje son obligatorios.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-bulk-email", {
        body: { destinatarios, asunto, mensaje },
      });
      if (error) throw error;
      toast({ title: "Correos enviados", description: `${data?.enviados || 0} enviados · ${data?.fallidos || 0} fallidos.` });
      setDestinatariosRaw("");
      setAsunto("");
      setMensaje("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "No se pudo enviar.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-4xl mb-2">Correos BRILLARTE</h1>
          <p className="text-muted-foreground">Envía ofertas, avisos y comunicados oficiales con el branding de BRILLARTE.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Mail className="w-5 h-5" /> Nuevo correo</span>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <img src={verificadoIcon} alt="" className="w-4 h-4" />
                {profile.nombre_completo || profile.correo}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm mb-1.5 block">Destinatarios (separa por coma o salto de línea)</label>
              <Textarea
                placeholder="cliente1@ejemplo.com, cliente2@ejemplo.com"
                value={destinatariosRaw}
                onChange={(e) => setDestinatariosRaw(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm mb-1.5 block">Asunto</label>
              <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Ej: Nueva oferta exclusiva" />
            </div>
            <div>
              <label className="text-sm mb-1.5 block">Mensaje</label>
              <Textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={10} placeholder="Escribe el contenido del correo..." />
            </div>
            <div className="text-xs text-muted-foreground">
              Remitente: <strong>brillarte@oficial.brillarte.lat</strong> · firmado como <strong>{profile.nombre_completo || profile.correo}</strong> (cuenta verificada).
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar correo</>}
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Correos;
