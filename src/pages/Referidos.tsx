import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, Users, Star, Gift, Clock, CheckCircle, TrendingUp, Share2, Wallet, Sun, Moon, Mail, Trophy, Send } from "lucide-react";
import ReferidosOnboarding from "@/components/referidos/ReferidosOnboarding";
import ReferidosLeaderboard from "@/components/referidos/ReferidosLeaderboard";

const PUNTOS_MAX_CANJE = 100;

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
  const [saldo, setSaldo] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  const [estadoSolicitud, setEstadoSolicitud] = useState<string>("pendiente");
  const [razonRechazo, setRazonRechazo] = useState<string | null>(null);

  // Canje state
  const [canjeEnviado, setCanjeEnviado] = useState(false);
  const [enviandoCanje, setEnviandoCanje] = useState(false);
  const [notaCanje, setNotaCanje] = useState("");

  // Email invite state
  const [correoInvitado, setCorreoInvitado] = useState("");
  const [mensajePersonalizado, setMensajePersonalizado] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  useEffect(() => {
    checkUserAndLoad();
  }, []);

  // Realtime: escuchar cambios en referidos_perfiles para actualización instantánea
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('referidos-perfil-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'referidos_perfiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const nuevoEstado = newData.estado;
          setEstadoSolicitud(nuevoEstado);
          setRazonRechazo(newData.razon_rechazo || null);
          if (nuevoEstado === "aprobado") {
            setTema(newData.tema_preferido === "oscuro" ? "oscuro" : "claro");
            toast.success("Tu solicitud ha sido aprobada. Bienvenido al programa de referidos.");
            loadAllData(userId);
          } else if (nuevoEstado === "rechazado") {
            toast.error("Tu solicitud ha sido rechazada.");
          } else if (nuevoEstado === "revocado") {
            toast.error("Tu acceso al programa ha sido revocado.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkUserAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoggedIn(false); setLoading(false); return; }
    setIsLoggedIn(true);
    setUserId(user.id);

    const { data: perfil } = await supabase
      .from("referidos_perfiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (perfil) {
      if (perfil.estado === "aprobado") {
        setHasOnboarded(true);
        setEstadoSolicitud("aprobado");
        setTema(perfil.tema_preferido === "oscuro" ? "oscuro" : "claro");
        await loadAllData(user.id);
      } else if (perfil.estado === "rechazado") {
        setHasOnboarded(true);
        setEstadoSolicitud("rechazado");
        setRazonRechazo(perfil.razon_rechazo || null);
      } else if (perfil.estado === "revocado") {
        setHasOnboarded(true);
        setEstadoSolicitud("revocado");
        setRazonRechazo(perfil.razon_rechazo || null);
      } else {
        // pendiente
        setHasOnboarded(true);
        setEstadoSolicitud("pendiente");
      }
    } else {
      setHasOnboarded(false);
    }
    setLoading(false);
  };

  const loadAllData = async (uid: string) => {
    await Promise.all([
      loadCodigo(uid),
      loadReferidos(uid),
      loadHistorialPuntos(uid),
      loadTotalPuntos(uid),
      loadSaldo(uid),
      loadNombreUsuario(uid),
      checkCanjeExistente(uid),
    ]);
  };

  const loadNombreUsuario = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("nombre_completo").eq("user_id", uid).maybeSingle();
    setNombreUsuario(data?.nombre_completo || "Usuario");
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
    const { data } = await supabase.from("profiles").select("puntos_referidos").eq("user_id", uid).maybeSingle();
    setTotalPuntos(data?.puntos_referidos || 0);
  };

  const loadSaldo = async (uid: string) => {
    const { data } = await supabase.from("profiles").select("saldo").eq("user_id", uid).maybeSingle();
    setSaldo(data?.saldo || 0);
  };

  const checkCanjeExistente = async (uid: string) => {
    const { data } = await supabase
      .from("solicitudes_canje_referidos")
      .select("id")
      .eq("user_id", uid)
      .eq("estado", "pendiente")
      .maybeSingle();
    setCanjeEnviado(!!data);
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoReferido);
    toast.success("Codigo copiado al portapapeles");
  };

  const enlaceReferido = `https://brillarte.lat/registro?ref=${codigoReferido}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlaceReferido);
    toast.success("Enlace de referido copiado");
  };

  const compartirWhatsApp = () => {
    const msg = encodeURIComponent(`Unete a BRILLARTE con mi enlace! Registrate aqui y ambos ganamos puntos: ${enlaceReferido}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const toggleTema = async () => {
    const nuevoTema = tema === "claro" ? "oscuro" : "claro";
    setTema(nuevoTema);
    await supabase.from("referidos_perfiles").update({ tema_preferido: nuevoTema }).eq("user_id", userId);
  };

  const handleOnboardingComplete = async () => {
    setHasOnboarded(true);
    setEstadoSolicitud("pendiente");
  };

  const enviarSolicitudCanje = async () => {
    if (totalPuntos < PUNTOS_MAX_CANJE) {
      toast.error(`Necesitas ${PUNTOS_MAX_CANJE} puntos para canjear`);
      return;
    }
    setEnviandoCanje(true);
    const { error } = await supabase.from("solicitudes_canje_referidos").insert({
      user_id: userId,
      puntos_canjeados: PUNTOS_MAX_CANJE,
      notas_usuario: notaCanje || null,
    });
    if (error) {
      toast.error("Error al enviar solicitud");
    } else {
      toast.success("Solicitud de canje enviada. El equipo te contactará pronto.");
      setCanjeEnviado(true);
      setNotaCanje("");
    }
    setEnviandoCanje(false);
  };

  const enviarInvitacionCorreo = async () => {
    if (!correoInvitado) {
      toast.error("Ingresa un correo válido");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoInvitado)) {
      toast.error("Correo no válido");
      return;
    }
    setEnviandoCorreo(true);
    const { data, error } = await supabase.functions.invoke("send-referral-invite", {
      body: {
        destinatario: correoInvitado,
        nombre_referidor: nombreUsuario,
        codigo_referido: codigoReferido,
        mensaje_personalizado: mensajePersonalizado || null,
      },
    });
    if (error) {
      toast.error("Error al enviar invitación");
    } else {
      toast.success(`Invitación enviada a ${correoInvitado}`);
      setCorreoInvitado("");
      setMensajePersonalizado("");
    }
    setEnviandoCorreo(false);
  };

  // Theme classes
  const bgPage = tema === "oscuro" ? "bg-neutral-950 text-white" : "bg-background";
  const cardClass = tema === "oscuro" ? "bg-neutral-900 border-neutral-800 text-white" : "border bg-card";
  const mutedText = tema === "oscuro" ? "text-neutral-400" : "text-muted-foreground";
  const statBg = tema === "oscuro" ? "bg-neutral-900 border-neutral-800" : "border";
  const inputClass = tema === "oscuro" ? "bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500" : "";

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

  if (hasOnboarded === false) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Programa de Referidos" subtitle="Configura tu cuenta de referidos" />
        <ReferidosOnboarding userId={userId} onComplete={handleOnboardingComplete} />
        <Footer />
      </div>
    );
  }

  // Pending approval
  if (estadoSolicitud === "pendiente") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Programa de Referidos" subtitle="Solicitud en revisión" />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <Card>
            <CardContent className="pt-10 pb-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-foreground flex items-center justify-center">
                <Clock className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">Solicitud en revisión</h2>
              <p className="text-muted-foreground text-sm">Tu solicitud para unirte al programa de referidos está siendo revisada por el equipo BRILLARTE. Te notificaremos por correo cuando sea procesada.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Rejected or revoked
  if (estadoSolicitud === "rechazado" || estadoSolicitud === "revocado") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Programa de Referidos" subtitle={estadoSolicitud === "revocado" ? "Acceso revocado" : "Solicitud rechazada"} />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <Card>
            <CardContent className="pt-10 pb-10 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-destructive flex items-center justify-center">
                <Gift className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">{estadoSolicitud === "revocado" ? "Acceso revocado" : "Solicitud rechazada"}</h2>
              {razonRechazo && (
                <div className="bg-muted rounded-lg p-4 text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Razon</p>
                  <p className="text-sm">{razonRechazo}</p>
                </div>
              )}
              <p className="text-muted-foreground text-sm">Si consideras que fue un error, contacta al equipo de soporte a traves del chat.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const pendientes = referidos.filter((r) => r.estado === "pendiente");
  const confirmados = referidos.filter((r) => r.estado === "confirmado");
  const puedeCanjar = totalPuntos >= PUNTOS_MAX_CANJE && !canjeEnviado;
  const progresoCanje = Math.min((totalPuntos / PUNTOS_MAX_CANJE) * 100, 100);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgPage}`}>
      <Navigation />
      <PageHeader title="Programa de Referidos" subtitle="Refiere amigos y gana puntos" />

      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">

        {/* Theme toggle */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={toggleTema} className={tema === "oscuro" ? "border-neutral-700 text-white hover:bg-neutral-800" : ""}>
            {tema === "oscuro" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {tema === "oscuro" ? "Modo claro" : "Modo oscuro"}
          </Button>
        </div>

        {/* Balance & Points */}
        <Card className={cardClass}>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <p className={`text-xs uppercase tracking-[0.2em] font-medium ${mutedText}`}>Tu Saldo</p>
                </div>
                <p className="text-4xl font-bold font-mono">RD${saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</p>
                <p className={`text-sm ${mutedText}`}>Saldo disponible en tu cuenta BRILLARTE</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  <p className={`text-xs uppercase tracking-[0.2em] font-medium ${mutedText}`}>Puntos de Referido</p>
                </div>
                <p className="text-4xl font-bold font-mono">{totalPuntos} <span className={`text-lg ${mutedText}`}>/ {PUNTOS_MAX_CANJE}</span></p>
                <p className={`text-sm ${mutedText}`}>Máximo canjeable: {PUNTOS_MAX_CANJE} puntos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canje Section */}
        <Card className={`${cardClass} ${puedeCanjar ? (tema === "oscuro" ? "border-neutral-500/50" : "border-neutral-400/30") : ""}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Canjear Puntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={mutedText}>{totalPuntos} puntos</span>
                <span className={mutedText}>{PUNTOS_MAX_CANJE} necesarios</span>
              </div>
              <div className={`w-full h-3 rounded-full ${tema === "oscuro" ? "bg-neutral-800" : "bg-muted"}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tema === "oscuro" ? "bg-white" : "bg-foreground"}`}
                  style={{ width: `${progresoCanje}%` }}
                />
              </div>
            </div>

            {canjeEnviado ? (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${tema === "oscuro" ? "bg-neutral-800 border border-neutral-700" : "bg-muted border border-border"}`}>
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Solicitud enviada</p>
                  <p className={`text-xs ${mutedText}`}>El equipo BRILLARTE te contactará pronto para procesar tu canje.</p>
                </div>
              </div>
            ) : puedeCanjar ? (
              <div className="space-y-3">
                <p className="text-sm">Tienes suficientes puntos. Envia tu solicitud y el equipo se encargara de contactarte.</p>
                <Textarea
                  placeholder="Nota opcional (ej: preferencia de recompensa, método de contacto...)"
                  value={notaCanje}
                  onChange={(e) => setNotaCanje(e.target.value)}
                  className={`min-h-[60px] text-sm ${inputClass}`}
                />
                <Button onClick={enviarSolicitudCanje} disabled={enviandoCanje} className="w-full">
                  {enviandoCanje ? "Enviando..." : "Solicitar Canje de Puntos"}
                </Button>
              </div>
            ) : (
              <p className={`text-sm ${mutedText}`}>
                Te faltan <strong>{PUNTOS_MAX_CANJE - totalPuntos}</strong> puntos para canjear. ¡Sigue refiriendo amigos!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Invitation */}
        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" /> Enviar Invitación por Correo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`text-sm ${mutedText}`}>
              Envía un correo real con tu enlace de referido. El correo incluirá tu nombre y código personalizado.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className={`text-xs ${mutedText}`}>Correo del invitado</Label>
                <Input
                  type="email"
                  placeholder="amigo@email.com"
                  value={correoInvitado}
                  onChange={(e) => setCorreoInvitado(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={`text-xs ${mutedText}`}>Mensaje personalizado (opcional)</Label>
                <Textarea
                  placeholder="Ej: ¡Hola! Mira estos accesorios increíbles, regístrate con mi código..."
                  value={mensajePersonalizado}
                  onChange={(e) => setMensajePersonalizado(e.target.value)}
                  className={`min-h-[60px] text-sm ${inputClass}`}
                />
              </div>
              <Button onClick={enviarInvitacionCorreo} disabled={enviandoCorreo || !correoInvitado} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {enviandoCorreo ? "Enviando..." : "Enviar Invitación"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hero Code Section */}
        <Card className={cardClass}>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <p className={`text-xs uppercase tracking-[0.2em] font-medium ${mutedText}`}>Tu codigo de referido</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-mono font-bold tracking-[0.15em]">{codigoReferido}</span>
                  <Button size="icon" variant="ghost" onClick={copiarCodigo} className="h-10 w-10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className={`text-sm max-w-md ${mutedText}`}>Comparte este codigo. Cuando se registren y compren, ambos ganan.</p>
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <Button onClick={compartirWhatsApp} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" /> Compartir
                </Button>
                <Button variant="outline" onClick={copiarCodigo} className={`w-full ${tema === "oscuro" ? "border-neutral-700 text-white hover:bg-neutral-800" : ""}`}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar codigo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Share Link */}
        <Card className={cardClass}>
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="space-y-1">
              <p className={`text-xs uppercase tracking-[0.2em] font-medium ${mutedText}`}>Compartir enlace de referido</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex-1 rounded-lg px-4 py-2.5 font-mono text-sm truncate border ${tema === "oscuro" ? "bg-neutral-800 border-neutral-700" : "bg-muted"}`}>
                {enlaceReferido}
              </div>
              <Button size="icon" variant="outline" onClick={copiarEnlace} className={`h-10 w-10 flex-shrink-0 ${tema === "oscuro" ? "border-neutral-700 text-white hover:bg-neutral-800" : ""}`}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={compartirWhatsApp} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={copiarEnlace} className={`flex-1 ${tema === "oscuro" ? "border-neutral-700 text-white hover:bg-neutral-800" : ""}`}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Puntos Totales", value: totalPuntos, icon: Star },
            { label: "Referidos", value: referidos.length, icon: Users },
            { label: "Confirmados", value: confirmados.length, icon: CheckCircle },
            { label: "Pendientes", value: pendientes.length, icon: Clock },
          ].map((stat) => (
            <Card key={stat.label} className={statBg}>
              <CardContent className="pt-6 pb-5 text-center">
                <stat.icon className={`h-5 w-5 mx-auto mb-2 ${mutedText}`} />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className={`text-xs mt-1 ${mutedText}`}>{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leaderboard */}
        <ReferidosLeaderboard tema={tema} />

        {/* How it works */}
        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Persona nueva se registra con tu codigo - queda pendiente de aprobacion",
              "BRILLARTE verifica que es una cuenta real (se revisa dispositivo e info)",
              "Una vez aprobado y cuando compre, tus puntos se confirman",
              "Al llegar a 100 puntos, puedes solicitar tu canje",
              "El equipo BRILLARTE te contacta para entregar tu recompensa",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${tema === "oscuro" ? "bg-white text-black" : "bg-foreground text-background"}`}>{i + 1}</span>
                <p className={`text-sm ${mutedText}`}>{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Referidos List */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Mis Referidos</span>
              <Badge variant="secondary" className="font-mono">{referidos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referidos.length === 0 ? (
              <div className={`text-center py-12 ${mutedText}`}>
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aun no has referido a nadie</p>
              </div>
            ) : (
              <div className={`divide-y ${tema === "oscuro" ? "divide-neutral-800" : ""}`}>
                {referidos.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${tema === "oscuro" ? "bg-neutral-800" : "bg-muted"}`}>
                        {ref.perfil?.nombre_completo?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ref.perfil?.nombre_completo || "Usuario"}</p>
                        <p className={`text-xs ${mutedText}`}>{new Date(ref.created_at).toLocaleDateString("es-DO")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={ref.estado === "confirmado" ? "default" : ref.estado === "rechazado" ? "destructive" : "outline"} className="text-xs">
                        {ref.estado === "confirmado" ? "Aprobado" : ref.estado === "rechazado" ? "Rechazado" : "En revision"}
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
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Historial de Puntos</span>
              <TrendingUp className={`h-4 w-4 ${mutedText}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historialPuntos.length === 0 ? (
              <div className={`text-center py-12 ${mutedText}`}>
                <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin movimientos de puntos</p>
              </div>
            ) : (
              <div className={`divide-y ${tema === "oscuro" ? "divide-neutral-800" : ""}`}>
                {historialPuntos.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{h.descripcion || h.tipo}</p>
                      <p className={`text-xs ${mutedText}`}>
                        {new Date(h.created_at).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-sm font-mono font-bold ${h.puntos > 0 ? "" : mutedText}`}>
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
