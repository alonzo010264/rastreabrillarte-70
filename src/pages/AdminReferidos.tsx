import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Users, Star, Plus, CheckCircle, Clock, ArrowLeft, XCircle, 
  Smartphone, Shield, Eye, Search, AlertTriangle, Trophy, Gift
} from "lucide-react";

interface ReferidoAdmin {
  id: string;
  referidor_id: string;
  referido_id: string;
  estado: string;
  puntos_otorgados: number;
  created_at: string;
  aprobado: boolean;
  rechazado: boolean;
  user_agent: string | null;
  ip_aproximada: string | null;
  dispositivo_info: any;
  notas_admin: string | null;
  fecha_revision: string | null;
  referidor?: { nombre_completo: string; correo: string; avatar_url?: string };
  referido?: { nombre_completo: string; correo: string; avatar_url?: string };
}

interface UserProfile {
  user_id: string;
  nombre_completo: string;
  correo: string;
  puntos_referidos: number;
  avatar_url: string | null;
}

interface SolicitudCanje {
  id: string;
  user_id: string;
  puntos_canjeados: number;
  estado: string;
  notas_usuario: string | null;
  notas_admin: string | null;
  created_at: string;
  fecha_revision: string | null;
  perfil?: { nombre_completo: string; correo: string };
}

const AdminReferidos = () => {
  const navigate = useNavigate();
  const [referidos, setReferidos] = useState<ReferidoAdmin[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [solicitudesCanje, setSolicitudesCanje] = useState<SolicitudCanje[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pendientes" | "aprobados" | "rechazados" | "canjes" | "puntos">("pendientes");
  const [notaAdmin, setNotaAdmin] = useState<Record<string, string>>({});

  // Points form
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [puntos, setPuntos] = useState("");
  const [tipo, setTipo] = useState("registro");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [refRes, usersRes, canjesRes] = await Promise.all([
      supabase.from("referidos").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("user_id, nombre_completo, correo, puntos_referidos, avatar_url").order("nombre_completo"),
      supabase.from("solicitudes_canje_referidos").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (refRes.data && refRes.data.length > 0) {
      const allIds = [...new Set([...refRes.data.map(r => r.referidor_id), ...refRes.data.map(r => r.referido_id)])];
      const { data: perfiles } = await supabase.from("profiles").select("user_id, nombre_completo, correo, avatar_url").in("user_id", allIds);
      const pMap = new Map(perfiles?.map(p => [p.user_id, p]) || []);
      setReferidos(refRes.data.map(r => ({
        ...r,
        aprobado: r.aprobado ?? false,
        rechazado: r.rechazado ?? false,
        referidor: pMap.get(r.referidor_id) as any,
        referido: pMap.get(r.referido_id) as any,
      })));
    } else {
      setReferidos([]);
    }

    // Load canje profiles
    if (canjesRes.data && canjesRes.data.length > 0) {
      const canjeIds = [...new Set(canjesRes.data.map(c => c.user_id))];
      const { data: canjePerfiles } = await supabase.from("profiles").select("user_id, nombre_completo, correo").in("user_id", canjeIds);
      const cpMap = new Map(canjePerfiles?.map(p => [p.user_id, p]) || []);
      setSolicitudesCanje(canjesRes.data.map(c => ({
        ...c,
        perfil: cpMap.get(c.user_id) as any,
      })));
    } else {
      setSolicitudesCanje([]);
    }

    setUsers(usersRes.data || []);
    setLoading(false);
  };

  const aprobarReferido = async (ref: ReferidoAdmin) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("referidos").update({
      aprobado: true, rechazado: false, estado: "confirmado",
      fecha_revision: new Date().toISOString(), admin_revisor: user?.id,
      notas_admin: notaAdmin[ref.id] || null,
    }).eq("id", ref.id);
    if (error) { toast.error("Error al aprobar"); return; }
    toast.success("Referido aprobado ✓");
    loadData();
  };

  const rechazarReferido = async (ref: ReferidoAdmin) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("referidos").update({
      aprobado: false, rechazado: true, estado: "rechazado",
      fecha_revision: new Date().toISOString(), admin_revisor: user?.id,
      notas_admin: notaAdmin[ref.id] || "Rechazado por sospecha de fraude",
    }).eq("id", ref.id);
    if (error) { toast.error("Error al rechazar"); return; }
    toast.success("Referido rechazado");
    loadData();
  };

  const aprobarCanje = async (canje: SolicitudCanje) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("solicitudes_canje_referidos").update({
      estado: "aprobado",
      fecha_revision: new Date().toISOString(),
      admin_revisor: user?.id,
      notas_admin: notaAdmin[canje.id] || "Canje aprobado",
    }).eq("id", canje.id);
    if (error) { toast.error("Error al aprobar canje"); return; }
    toast.success("Canje aprobado ✓ Contacta al usuario para entregar la recompensa");
    loadData();
  };

  const rechazarCanje = async (canje: SolicitudCanje) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("solicitudes_canje_referidos").update({
      estado: "rechazado",
      fecha_revision: new Date().toISOString(),
      admin_revisor: user?.id,
      notas_admin: notaAdmin[canje.id] || "Canje rechazado",
    }).eq("id", canje.id);
    if (error) { toast.error("Error al rechazar canje"); return; }
    toast.success("Canje rechazado");
    loadData();
  };

  const otorgarPuntos = async () => {
    if (!selectedUserId || !puntos || parseInt(puntos) <= 0) {
      toast.error("Selecciona usuario y puntos válidos"); return;
    }
    const puntosNum = parseInt(puntos);
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Check max 100
    const { data: profile } = await supabase.from("profiles").select("puntos_referidos").eq("user_id", selectedUserId).single();
    const currentPts = profile?.puntos_referidos || 0;
    if (currentPts + puntosNum > 100) {
      toast.error(`No se puede exceder 100 puntos. El usuario tiene ${currentPts} puntos actualmente.`);
      setSubmitting(false); return;
    }

    const { error: pError } = await supabase.from("puntos_referidos").insert({
      user_id: selectedUserId, puntos: puntosNum, tipo,
      descripcion: descripcion || `Puntos otorgados manualmente - ${tipo}`,
      admin_id: user?.id,
    });
    if (pError) { toast.error("Error al otorgar puntos"); setSubmitting(false); return; }

    const newTotal = currentPts + puntosNum;
    await supabase.from("profiles").update({ puntos_referidos: newTotal }).eq("user_id", selectedUserId);

    toast.success(`+${puntos} puntos otorgados (Total: ${newTotal}/100)`);
    setSelectedUserId(""); setPuntos(""); setDescripcion(""); setSearchUser("");
    setSubmitting(false);
    loadData();
  };

  const pendientes = referidos.filter(r => !r.aprobado && !r.rechazado);
  const aprobados = referidos.filter(r => r.aprobado);
  const rechazados = referidos.filter(r => r.rechazado);
  const canjesPendientes = solicitudesCanje.filter(c => c.estado === "pendiente");

  const filteredUsers = users.filter(u =>
    u.nombre_completo?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.correo?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const getDeviceIcon = (ua: string | null) => {
    if (!ua) return "Desconocido";
    if (ua.includes("iPhone") || ua.includes("Android")) return "📱 Móvil";
    return "💻 Desktop";
  };

  const renderReferidoCard = (ref: ReferidoAdmin, showActions: boolean) => (
    <div key={ref.id} className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{ref.referidor?.nombre_completo || "?"}</span>
            <span className="text-xs text-muted-foreground">→ refirió a →</span>
            <span className="font-semibold text-sm">{ref.referido?.nombre_completo || "?"}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {ref.referido?.correo} · {new Date(ref.created_at).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Badge variant={ref.aprobado ? "default" : ref.rechazado ? "destructive" : "outline"} className="text-xs shrink-0">
          {ref.aprobado ? "Aprobado" : ref.rechazado ? "Rechazado" : "Pendiente"}
        </Badge>
      </div>

      <div className="bg-muted/50 rounded-md p-3 space-y-1.5">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> Info del Dispositivo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <p className="text-xs text-muted-foreground"><span className="font-medium">Tipo:</span> {getDeviceIcon(ref.user_agent)}</p>
          <p className="text-xs text-muted-foreground"><span className="font-medium">IP:</span> {ref.ip_aproximada || "No registrada"}</p>
        </div>
        {ref.user_agent && <p className="text-[10px] text-muted-foreground/70 break-all font-mono leading-tight">{ref.user_agent.substring(0, 120)}...</p>}
        {ref.dispositivo_info && Object.keys(ref.dispositivo_info).length > 0 && (
          <div className="text-[10px] text-muted-foreground/70 font-mono space-y-0.5">
            {ref.dispositivo_info.screen && <p>Pantalla: {ref.dispositivo_info.screen}</p>}
            {ref.dispositivo_info.language && <p>Idioma: {ref.dispositivo_info.language}</p>}
            {ref.dispositivo_info.platform && <p>Plataforma: {ref.dispositivo_info.platform}</p>}
            {ref.dispositivo_info.timezone && <p>Zona horaria: {ref.dispositivo_info.timezone}</p>}
          </div>
        )}
      </div>

      {ref.notas_admin && <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">Nota: {ref.notas_admin}</p>}

      {showActions && (
        <div className="space-y-2">
          <Textarea placeholder="Nota del admin (opcional)..." value={notaAdmin[ref.id] || ""} onChange={(e) => setNotaAdmin(prev => ({ ...prev, [ref.id]: e.target.value }))} className="text-xs min-h-[60px]" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => aprobarReferido(ref)} className="flex-1"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar</Button>
            <Button size="sm" variant="destructive" onClick={() => rechazarReferido(ref)} className="flex-1"><XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar</Button>
          </div>
        </div>
      )}

      {ref.fecha_revision && <p className="text-[10px] text-muted-foreground">Revisado: {new Date(ref.fecha_revision).toLocaleDateString("es-DO")}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Gestión de Referidos" subtitle="Aprueba referidos y gestiona puntos" />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin-dashboard")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al panel
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border">
            <CardContent className="pt-5 text-center">
              <Users className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xl font-bold">{referidos.length}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border border-yellow-500/30">
            <CardContent className="pt-5 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto mb-1.5 text-yellow-500" />
              <p className="text-xl font-bold">{pendientes.length}</p>
              <p className="text-[10px] text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-5 text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xl font-bold">{aprobados.length}</p>
              <p className="text-[10px] text-muted-foreground">Aprobados</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-5 text-center">
              <XCircle className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xl font-bold">{rechazados.length}</p>
              <p className="text-[10px] text-muted-foreground">Rechazados</p>
            </CardContent>
          </Card>
          <Card className={`border ${canjesPendientes.length > 0 ? "border-orange-500/30" : ""}`}>
            <CardContent className="pt-5 text-center">
              <Trophy className="h-4 w-4 mx-auto mb-1.5 text-orange-500" />
              <p className="text-xl font-bold">{canjesPendientes.length}</p>
              <p className="text-[10px] text-muted-foreground">Canjes Pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
          {[
            { key: "pendientes", label: "Pendientes", count: pendientes.length, icon: Clock },
            { key: "canjes", label: "Canjes", count: canjesPendientes.length, icon: Trophy },
            { key: "aprobados", label: "Aprobados", count: aprobados.length, icon: CheckCircle },
            { key: "rechazados", label: "Rechazados", count: rechazados.length, icon: XCircle },
            { key: "puntos", label: "Dar Puntos", icon: Star },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {"count" in t && t.count !== undefined && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">{t.count}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {tab === "pendientes" && (
              <div className="space-y-3">
                {pendientes.length === 0 ? (
                  <Card className="border"><CardContent className="py-12 text-center"><Shield className="h-8 w-8 mx-auto mb-3 text-muted-foreground" /><p className="text-sm text-muted-foreground">No hay referidos pendientes</p></CardContent></Card>
                ) : pendientes.map(ref => renderReferidoCard(ref, true))}
              </div>
            )}

            {tab === "canjes" && (
              <div className="space-y-3">
                {solicitudesCanje.length === 0 ? (
                  <Card className="border"><CardContent className="py-12 text-center"><Gift className="h-8 w-8 mx-auto mb-3 text-muted-foreground" /><p className="text-sm text-muted-foreground">No hay solicitudes de canje</p></CardContent></Card>
                ) : (
                  solicitudesCanje.map(canje => (
                    <div key={canje.id} className="border border-border rounded-lg p-4 space-y-3 bg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-sm">{canje.perfil?.nombre_completo || "Usuario"}</p>
                          <p className="text-xs text-muted-foreground">{canje.perfil?.correo}</p>
                          <p className="text-xs text-muted-foreground">
                            Solicitado: {new Date(canje.created_at).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">{canje.puntos_canjeados} pts</Badge>
                          <Badge variant={canje.estado === "aprobado" ? "default" : canje.estado === "rechazado" ? "destructive" : "outline"} className="text-xs">
                            {canje.estado === "aprobado" ? "Aprobado" : canje.estado === "rechazado" ? "Rechazado" : "Pendiente"}
                          </Badge>
                        </div>
                      </div>

                      {canje.notas_usuario && (
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs font-medium mb-1">Nota del usuario:</p>
                          <p className="text-xs text-muted-foreground">{canje.notas_usuario}</p>
                        </div>
                      )}

                      {canje.notas_admin && <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">Admin: {canje.notas_admin}</p>}

                      {canje.estado === "pendiente" && (
                        <div className="space-y-2">
                          <Textarea placeholder="Nota del admin..." value={notaAdmin[canje.id] || ""} onChange={(e) => setNotaAdmin(prev => ({ ...prev, [canje.id]: e.target.value }))} className="text-xs min-h-[60px]" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => aprobarCanje(canje)} className="flex-1"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Aprobar Canje</Button>
                            <Button size="sm" variant="destructive" onClick={() => rechazarCanje(canje)} className="flex-1"><XCircle className="h-3.5 w-3.5 mr-1" /> Rechazar</Button>
                          </div>
                        </div>
                      )}

                      {canje.fecha_revision && <p className="text-[10px] text-muted-foreground">Revisado: {new Date(canje.fecha_revision).toLocaleDateString("es-DO")}</p>}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "aprobados" && (
              <div className="space-y-3">
                {aprobados.length === 0 ? <p className="text-center py-12 text-sm text-muted-foreground">No hay referidos aprobados</p>
                : aprobados.map(ref => renderReferidoCard(ref, false))}
              </div>
            )}

            {tab === "rechazados" && (
              <div className="space-y-3">
                {rechazados.length === 0 ? <p className="text-center py-12 text-sm text-muted-foreground">No hay referidos rechazados</p>
                : rechazados.map(ref => renderReferidoCard(ref, false))}
              </div>
            )}

            {tab === "puntos" && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Otorgar Puntos (Máx 100)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Buscar usuario</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Nombre o correo..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="pl-9" />
                      </div>
                      {searchUser && filteredUsers.length > 0 && (
                        <div className="border rounded-md max-h-40 overflow-y-auto">
                          {filteredUsers.slice(0, 8).map(u => (
                            <button key={u.user_id} onClick={() => { setSelectedUserId(u.user_id); setSearchUser(u.nombre_completo || u.correo); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${selectedUserId === u.user_id ? "bg-muted" : ""}`}>
                              <span className="font-medium">{u.nombre_completo || "Sin nombre"}</span>
                              <span className="text-muted-foreground ml-2 text-xs">{u.correo}</span>
                              <span className="float-right text-xs text-muted-foreground">{u.puntos_referidos || 0}/100 pts</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Puntos a otorgar</Label>
                      <Input type="number" min="1" max="100" placeholder="Ej: 2" value={puntos} onChange={e => setPuntos(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={setTipo}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registro">Registro de referido</SelectItem>
                          <SelectItem value="compra">Compra de referido</SelectItem>
                          <SelectItem value="bonus">Bonus manual</SelectItem>
                          <SelectItem value="ajuste">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción (opcional)</Label>
                      <Input placeholder="Razón..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={otorgarPuntos} disabled={submitting || !selectedUserId || !puntos} className="w-full md:w-auto">
                    {submitting ? "Otorgando..." : "Otorgar Puntos"}
                  </Button>

                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="text-sm font-semibold mb-3">Ranking de Puntos (Máx 100)</h3>
                    <div className="divide-y divide-border">
                      {users.filter(u => (u.puntos_referidos || 0) > 0).sort((a, b) => (b.puntos_referidos || 0) - (a.puntos_referidos || 0)).slice(0, 20).map((u, i) => (
                        <div key={u.user_id} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground w-5">#{i + 1}</span>
                            <div>
                              <p className="text-sm font-medium">{u.nombre_completo || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">{u.correo}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted">
                              <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min((u.puntos_referidos / 100) * 100, 100)}%` }} />
                            </div>
                            <span className="font-mono font-bold text-sm">{u.puntos_referidos}/100</span>
                          </div>
                        </div>
                      ))}
                      {users.filter(u => (u.puntos_referidos || 0) > 0).length === 0 && (
                        <p className="text-center py-8 text-sm text-muted-foreground">Ningún usuario tiene puntos aún</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminReferidos;
