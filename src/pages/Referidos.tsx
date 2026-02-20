import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Users, Star, Gift, Clock, CheckCircle, TrendingUp, Share2, ArrowRight } from "lucide-react";

interface Referido {
  id: string;
  referido_id: string;
  estado: string;
  puntos_otorgados: number;
  created_at: string;
  perfil?: { nombre_completo: string; avatar_url: string | null; correo: string };
}

interface PuntoHistorial {
  id: string;
  puntos: number;
  tipo: string;
  descripcion: string | null;
  created_at: string;
}

const Referidos = () => {
  const [loading, setLoading] = useState(true);
  const [codigoReferido, setCodigoReferido] = useState("");
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [historialPuntos, setHistorialPuntos] = useState<PuntoHistorial[]>([]);
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoggedIn(false); setLoading(false); return; }
    setIsLoggedIn(true);
    await Promise.all([
      loadCodigo(user.id),
      loadReferidos(user.id),
      loadHistorialPuntos(user.id),
      loadTotalPuntos(user.id),
    ]);
    setLoading(false);
  };

  const loadCodigo = async (uid: string) => {
    const { data } = await supabase.from("codigos_referido").select("codigo").eq("user_id", uid).maybeSingle();
    if (data) { setCodigoReferido(data.codigo); return; }
    const { data: newCode } = await supabase.rpc("generate_referral_code", { p_user_id: uid });
    if (newCode) {
      await supabase.from("codigos_referido").insert({ user_id: uid, codigo: newCode });
      setCodigoReferido(newCode);
    }
  };

  const loadReferidos = async (uid: string) => {
    const { data } = await supabase.from("referidos").select("id, referido_id, estado, puntos_otorgados, created_at").eq("referidor_id", uid).order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const ids = data.map((r) => r.referido_id);
      const { data: perfiles } = await supabase.from("profiles").select("user_id, nombre_completo, avatar_url, correo").in("user_id", ids);
      const map = new Map(perfiles?.map((p) => [p.user_id, p]) || []);
      setReferidos(data.map((r) => ({ ...r, perfil: map.get(r.referido_id) as any })));
    }
  };

  const loadHistorialPuntos = async (uid: string) => {
    const { data } = await supabase.from("puntos_referidos").select("id, puntos, tipo, descripcion, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20);
    setHistorialPuntos(data || []);
  };

  const loadTotalPuntos = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("puntos_referidos").eq("user_id", uid).single();
    setTotalPuntos(data?.puntos_referidos || 0);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoReferido);
    toast.success("Codigo copiado al portapapeles");
  };

  const enlaceReferido = `${window.location.origin}/registro?ref=${codigoReferido}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlaceReferido);
    toast.success("Enlace de referido copiado");
  };

  const compartirWhatsApp = () => {
    const msg = encodeURIComponent(`¡Únete a BRILLARTE con mi enlace! Regístrate aquí y ambos ganamos puntos: ${enlaceReferido}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Programa de Referidos" subtitle="Gana puntos refiriendo amigos" />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <Card>
            <CardContent className="pt-10 pb-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-foreground flex items-center justify-center">
                <Gift className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">Inicia sesion para participar</h2>
              <p className="text-muted-foreground text-sm">Necesitas una cuenta para obtener tu codigo de referido y empezar a ganar puntos.</p>
              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={() => (window.location.href = "/login")}>Iniciar Sesion</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/registro")}>Registrarse</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const pendientes = referidos.filter((r) => r.estado === "pendiente");
  const confirmados = referidos.filter((r) => r.estado === "confirmado");
  const rechazados = referidos.filter((r) => r.estado === "rechazado");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Programa de Referidos" subtitle="Refiere amigos y gana puntos" />

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">

        {/* Hero Code Section */}
        <Card className="border bg-card">
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Tu codigo de referido</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-mono font-bold tracking-[0.15em]">{codigoReferido}</span>
                  <Button size="icon" variant="ghost" onClick={copiarCodigo} className="h-10 w-10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground max-w-md">Comparte este codigo. Cuando se registren y compren, ambos ganan.</p>
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <Button onClick={compartirWhatsApp} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" /> Compartir
                </Button>
                <Button variant="outline" onClick={copiarCodigo} className="w-full">
                  <Copy className="h-4 w-4 mr-2" /> Copiar codigo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Link Section */}
        <Card className="border bg-card">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">Compartir enlace de referido</p>
              <p className="text-sm text-muted-foreground">Envía este enlace a quien quieras referir. Se registrarán directamente con tu código.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-sm text-foreground truncate border">
                {enlaceReferido}
              </div>
              <Button size="icon" variant="outline" onClick={copiarEnlace} className="h-10 w-10 flex-shrink-0">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={compartirWhatsApp} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" /> Compartir por WhatsApp
              </Button>
              <Button variant="outline" onClick={copiarEnlace} className="flex-1">
                <Copy className="h-4 w-4 mr-2" /> Copiar enlace
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Puntos Totales", value: totalPuntos, icon: Star },
            { label: "Referidos", value: referidos.length, icon: Users },
            { label: "Confirmados", value: confirmados.length, icon: CheckCircle },
            { label: "Pendientes", value: pendientes.length, icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className="border">
              <CardContent className="pt-6 pb-5 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Persona nueva se registra con tu código → queda pendiente de aprobación",
              "BRILLARTE verifica que es una cuenta real (se revisa dispositivo e info)",
              "Una vez aprobado y cuando compre, tus puntos se confirman",
              "Por cada compra de tu referido: +1 o +2 puntos extra según el producto",
              "Los puntos son validados manualmente por el equipo BRILLARTE",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium">{i + 1}</span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Referidos List */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Mis Referidos</span>
              <Badge variant="secondary" className="font-mono">{referidos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referidos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aun no has referido a nadie</p>
              </div>
            ) : (
              <div className="divide-y">
                {referidos.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {ref.perfil?.nombre_completo?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ref.perfil?.nombre_completo || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString("es-DO")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={ref.estado === "confirmado" ? "default" : ref.estado === "rechazado" ? "destructive" : "outline"} 
                        className="text-xs"
                      >
                        {ref.estado === "confirmado" ? "Aprobado" : ref.estado === "rechazado" ? "Rechazado" : "En revisión"}
                      </Badge>
                      <span className="text-sm font-mono font-semibold">+{ref.puntos_otorgados}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Historial de Puntos</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historialPuntos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin movimientos de puntos</p>
              </div>
            ) : (
              <div className="divide-y">
                {historialPuntos.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{h.descripcion || h.tipo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-sm font-mono font-bold ${h.puntos > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {h.puntos > 0 ? "+" : ""}{h.puntos} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Referidos;
