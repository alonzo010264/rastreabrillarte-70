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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Star, Search, Plus, CheckCircle, Clock, ArrowLeft } from "lucide-react";

interface ReferidoAdmin {
  id: string;
  referidor_id: string;
  referido_id: string;
  estado: string;
  puntos_otorgados: number;
  created_at: string;
  referidor?: { nombre_completo: string; correo: string };
  referido?: { nombre_completo: string; correo: string };
}

interface UserProfile {
  user_id: string;
  nombre_completo: string;
  correo: string;
  puntos_referidos: number;
}

const AdminReferidos = () => {
  const navigate = useNavigate();
  const [referidos, setReferidos] = useState<ReferidoAdmin[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Form for adding points
  const [selectedUserId, setSelectedUserId] = useState("");
  const [puntos, setPuntos] = useState("");
  const [tipo, setTipo] = useState("registro");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [refRes, usersRes] = await Promise.all([
      supabase.from("referidos").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("user_id, nombre_completo, correo, puntos_referidos").order("nombre_completo"),
    ]);

    if (refRes.data && refRes.data.length > 0) {
      const allIds = [...new Set([...refRes.data.map(r => r.referidor_id), ...refRes.data.map(r => r.referido_id)])];
      const { data: perfiles } = await supabase.from("profiles").select("user_id, nombre_completo, correo").in("user_id", allIds);
      const pMap = new Map(perfiles?.map(p => [p.user_id, p]) || []);
      setReferidos(refRes.data.map(r => ({
        ...r,
        referidor: pMap.get(r.referidor_id) as any,
        referido: pMap.get(r.referido_id) as any,
      })));
    }
    setUsers(usersRes.data || []);
    setLoading(false);
  };

  const confirmarReferido = async (id: string, referidorId: string) => {
    const { error } = await supabase.from("referidos").update({ estado: "confirmado" }).eq("id", id);
    if (error) { toast.error("Error al confirmar"); return; }
    toast.success("Referido confirmado");
    loadData();
  };

  const otorgarPuntos = async () => {
    if (!selectedUserId || !puntos || parseInt(puntos) <= 0) {
      toast.error("Selecciona usuario y puntos validos");
      return;
    }
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Insert points record
    const { error: pError } = await supabase.from("puntos_referidos").insert({
      user_id: selectedUserId,
      puntos: parseInt(puntos),
      tipo,
      descripcion: descripcion || `Puntos otorgados manualmente - ${tipo}`,
      admin_id: user?.id,
    });

    if (pError) { toast.error("Error al otorgar puntos"); setSubmitting(false); return; }

    // Update profile total
    const { data: profile } = await supabase.from("profiles").select("puntos_referidos").eq("user_id", selectedUserId).single();
    const newTotal = (profile?.puntos_referidos || 0) + parseInt(puntos);
    await supabase.from("profiles").update({ puntos_referidos: newTotal }).eq("user_id", selectedUserId);

    toast.success(`+${puntos} puntos otorgados`);
    setSelectedUserId("");
    setPuntos("");
    setDescripcion("");
    setSubmitting(false);
    loadData();
  };

  const filteredUsers = users.filter(u =>
    u.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
    u.correo?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReferidos = referidos;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Gestion de Referidos" subtitle="Administra puntos y referidos" />

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <Button variant="ghost" onClick={() => navigate("/admin-dashboard")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al panel
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border">
            <CardContent className="pt-6 text-center">
              <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{referidos.length}</p>
              <p className="text-xs text-muted-foreground">Total Referidos</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{referidos.filter(r => r.estado === "confirmado").length}</p>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="pt-6 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{referidos.filter(r => r.estado === "pendiente").length}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Otorgar Puntos */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Otorgar Puntos Manualmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buscar usuario</Label>
                <Input placeholder="Nombre o correo..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && filteredUsers.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {filteredUsers.slice(0, 8).map(u => (
                      <button
                        key={u.user_id}
                        onClick={() => { setSelectedUserId(u.user_id); setSearch(u.nombre_completo || u.correo); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${selectedUserId === u.user_id ? "bg-muted" : ""}`}
                      >
                        <span className="font-medium">{u.nombre_completo || "Sin nombre"}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{u.correo}</span>
                        <span className="float-right text-xs text-muted-foreground">{u.puntos_referidos || 0} pts</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Puntos a otorgar</Label>
                <Input type="number" min="1" placeholder="Ej: 2" value={puntos} onChange={e => setPuntos(e.target.value)} />
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
                <Label>Descripcion (opcional)</Label>
                <Input placeholder="Razon del otorgamiento..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
              </div>
            </div>
            <Button onClick={otorgarPuntos} disabled={submitting || !selectedUserId || !puntos} className="w-full md:w-auto">
              {submitting ? "Otorgando..." : "Otorgar Puntos"}
            </Button>
          </CardContent>
        </Card>

        {/* Referidos List */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Referidos Recientes</span>
              <Badge variant="secondary" className="font-mono">{referidos.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full mx-auto" />
              </div>
            ) : referidos.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No hay referidos registrados</p>
            ) : (
              <div className="divide-y">
                {filteredReferidos.map((ref) => (
                  <div key={ref.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{ref.referidor?.nombre_completo || "?"}</span>
                        <span className="text-muted-foreground mx-2">refirio a</span>
                        <span className="font-medium">{ref.referido?.nombre_completo || "?"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString("es-DO")} · {ref.puntos_otorgados} pts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ref.estado === "confirmado" ? "default" : "outline"} className="text-xs">
                        {ref.estado}
                      </Badge>
                      {ref.estado === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => confirmarReferido(ref.id, ref.referidor_id)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Points Overview */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resumen de Puntos por Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {users.filter(u => (u.puntos_referidos || 0) > 0).sort((a, b) => (b.puntos_referidos || 0) - (a.puntos_referidos || 0)).slice(0, 20).map(u => (
                <div key={u.user_id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{u.nombre_completo || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{u.correo}</p>
                  </div>
                  <span className="font-mono font-bold text-sm">{u.puntos_referidos} pts</span>
                </div>
              ))}
              {users.filter(u => (u.puntos_referidos || 0) > 0).length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">Ningun usuario tiene puntos aun</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminReferidos;
