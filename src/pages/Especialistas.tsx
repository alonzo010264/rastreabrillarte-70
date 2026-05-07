import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { Loader2, ShieldCheck, Paperclip, Mail } from "lucide-react";

interface Caso {
  id: string;
  tipo: string;
  cliente_email: string;
  cliente_nombre: string | null;
  codigo_pedido: string | null;
  descripcion: string;
  evidencias: any[];
  agente_nombre: string | null;
  estado: string;
  respuesta: string | null;
  created_at: string;
}

const Especialistas = () => {
  const { user, isAdmin, isAgent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("casos_especialistas" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setCasos((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user && (isAdmin || isAgent)) load();
  }, [user, isAdmin, isAgent]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user || (!isAdmin && !isAgent)) return <Navigate to="/login" replace />;

  const resolverCaso = async (id: string, decision: "aprobado" | "rechazado") => {
    const respuesta = respuestas[id]?.trim();
    if (!respuesta) {
      toast({ title: "Falta respuesta", description: "Escribe la decisión", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("casos_especialistas" as any)
      .update({
        estado: decision,
        respuesta,
        respondido_at: new Date().toISOString(),
        respondido_por: user.id,
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Decisión guardada", description: `Caso ${decision}` });
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-8 h-8" />
          <div>
            <h1 className="font-display text-3xl">Especialistas</h1>
            <p className="text-sm text-muted-foreground">Decisiones humanas sobre casos escalados por agentes</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : casos.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay casos pendientes.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {casos.map(caso => (
              <Card key={caso.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="font-display text-lg">
                      {caso.tipo.toUpperCase()} · {caso.cliente_nombre || caso.cliente_email}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {caso.cliente_email}</span>
                      {caso.codigo_pedido && <span>Pedido: <strong>{caso.codigo_pedido}</strong></span>}
                      {caso.agente_nombre && <span>Escalado por: {caso.agente_nombre}</span>}
                      <span>{new Date(caso.created_at).toLocaleString("es-DO")}</span>
                    </div>
                  </div>
                  <Badge variant={caso.estado === "pendiente" ? "default" : "secondary"}>{caso.estado}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/40 p-3 rounded text-sm whitespace-pre-wrap">{caso.descripcion}</div>

                  {caso.evidencias && caso.evidencias.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {caso.evidencias.map((e: any, i: number) => (
                        <a key={i} href={e.url} target="_blank" rel="noreferrer"
                          className="text-xs underline inline-flex items-center gap-1 border px-2 py-1 rounded">
                          <Paperclip className="w-3 h-3" /> {e.name || `Evidencia ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}

                  {caso.estado === "pendiente" ? (
                    <>
                      <Textarea
                        placeholder="Decisión y mensaje al cliente..."
                        value={respuestas[caso.id] || ""}
                        onChange={(e) => setRespuestas({ ...respuestas, [caso.id]: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => resolverCaso(caso.id, "aprobado")}>Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => resolverCaso(caso.id, "rechazado")}>Rechazar</Button>
                      </div>
                    </>
                  ) : (
                    caso.respuesta && (
                      <div className="bg-background border p-3 rounded text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Resolución:</p>
                        {caso.respuesta}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Especialistas;
