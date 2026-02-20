import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Users, Star, Gift, Clock, CheckCircle, TrendingUp } from "lucide-react";

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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    setUserId(user.id);
    await Promise.all([
      loadCodigo(user.id),
      loadReferidos(user.id),
      loadHistorialPuntos(user.id),
      loadTotalPuntos(user.id),
    ]);
    setLoading(false);
  };

  const loadCodigo = async (uid: string) => {
    const { data } = await supabase
      .from("codigos_referido")
      .select("codigo")
      .eq("user_id", uid)
      .maybeSingle();

    if (data) {
      setCodigoReferido(data.codigo);
    } else {
      // Generate code
      const { data: newCode } = await supabase.rpc("generate_referral_code", { p_user_id: uid });
      if (newCode) {
        await supabase.from("codigos_referido").insert({ user_id: uid, codigo: newCode });
        setCodigoReferido(newCode);
      }
    }
  };

  const loadReferidos = async (uid: string) => {
    const { data } = await supabase
      .from("referidos")
      .select("id, referido_id, estado, puntos_otorgados, created_at")
      .eq("referidor_id", uid)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Load profiles for referidos
      const referidoIds = data.map((r) => r.referido_id);
      const { data: perfiles } = await supabase
        .from("profiles")
        .select("user_id, nombre_completo, avatar_url, correo")
        .in("user_id", referidoIds);

      const perfilMap = new Map(perfiles?.map((p) => [p.user_id, p]) || []);
      const enriched = data.map((r) => ({
        ...r,
        perfil: perfilMap.get(r.referido_id) as any,
      }));
      setReferidos(enriched);
    }
  };

  const loadHistorialPuntos = async (uid: string) => {
    const { data } = await supabase
      .from("puntos_referidos")
      .select("id, puntos, tipo, descripcion, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistorialPuntos(data || []);
  };

  const loadTotalPuntos = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("puntos_referidos")
      .eq("user_id", uid)
      .single();
    setTotalPuntos(data?.puntos_referidos || 0);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoReferido);
    toast.success("¡Código copiado!");
  };

  const compartirWhatsApp = () => {
    const msg = encodeURIComponent(
      `¡Únete a BRILLARTE usando mi código de referido: ${codigoReferido} y obtén beneficios exclusivos! 🌟 Regístrate aquí: ${window.location.origin}/registro?ref=${codigoReferido}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
          <Card className="border-primary/20">
            <CardContent className="pt-8 pb-8 space-y-4">
              <Gift className="h-16 w-16 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">¡Inicia sesión para participar!</h2>
              <p className="text-muted-foreground">
                Necesitas una cuenta para obtener tu código de referido y empezar a ganar puntos.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={() => (window.location.href = "/login")}>Iniciar Sesión</Button>
                <Button variant="outline" onClick={() => (window.location.href = "/registro")}>
                  Registrarse
                </Button>
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Programa de Referidos" subtitle="Refiere amigos y gana puntos" />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-3xl font-bold text-primary">{totalPuntos}</p>
              <p className="text-sm text-muted-foreground">Puntos Totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <p className="text-3xl font-bold">{referidos.length}</p>
              <p className="text-sm text-muted-foreground">Referidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-3xl font-bold">{confirmados.length}</p>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-3xl font-bold">{pendientes.length}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Código de Referido */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" /> Tu Código de Referido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-background border-2 border-primary rounded-lg px-6 py-3 text-2xl font-mono font-bold tracking-widest">
                {codigoReferido}
              </div>
              <Button size="icon" variant="outline" onClick={copiarCodigo} title="Copiar código">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Comparte este código con tus amigos. Cuando se registren y compren, ¡ambos ganan!
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={compartirWhatsApp} className="bg-green-600 hover:bg-green-700">
                Compartir por WhatsApp
              </Button>
              <Button variant="outline" onClick={copiarCodigo}>
                Copiar enlace
              </Button>
            </div>

            {/* How it works */}
            <div className="mt-6 p-4 bg-background/80 rounded-lg border">
              <h4 className="font-semibold mb-3">¿Cómo funciona?</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🔹 Si una persona <strong>nueva</strong> se registra con tu código: <strong>+2 puntos (pendientes)</strong></p>
                <p>🔹 Cuando esa persona realice su primera compra y pida su factura digital: <strong>puntos confirmados</strong></p>
                <p>🔹 Por cada compra de tu referido: <strong>+1 o +2 puntos extra</strong> según el producto</p>
                <p>🔹 Los puntos son otorgados y validados manualmente por el equipo de BRILLARTE</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mis Referidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Mis Referidos ({referidos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referidos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Aún no has referido a nadie. ¡Comparte tu código!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referidos.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {ref.perfil?.nombre_completo?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{ref.perfil?.nombre_completo || "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ref.created_at).toLocaleDateString("es-DO")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={ref.estado === "confirmado" ? "default" : "secondary"}>
                        {ref.estado === "confirmado" ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Confirmado</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                        )}
                      </Badge>
                      <span className="text-sm font-semibold text-primary">+{ref.puntos_otorgados} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de Puntos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Historial de Puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historialPuntos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>Todavía no tienes movimientos de puntos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {historialPuntos.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{h.descripcion || h.tipo}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString("es-DO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`font-bold ${h.puntos > 0 ? "text-green-600" : "text-red-500"}`}>
                      {h.puntos > 0 ? "+" : ""}
                      {h.puntos} pts
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
