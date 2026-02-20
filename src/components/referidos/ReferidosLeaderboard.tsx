import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface LeaderEntry {
  nombre: string;
  puntos: number;
  total_referidos: number;
}

const censurarNombre = (nombre: string): string => {
  if (!nombre || nombre.length <= 2) return "***";
  const parts = nombre.split(" ");
  return parts.map((p) => {
    if (p.length <= 1) return p;
    return p[0] + "*".repeat(p.length - 2) + p[p.length - 1];
  }).join(" ");
};

interface Props {
  tema: "claro" | "oscuro";
}

const ReferidosLeaderboard = ({ tema }: Props) => {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("nombre_completo, puntos_referidos")
      .gt("puntos_referidos", 0)
      .order("puntos_referidos", { ascending: false })
      .limit(10);

    if (data) {
      // Get referido counts
      const mapped: LeaderEntry[] = data.map((p) => ({
        nombre: censurarNombre(p.nombre_completo || "Usuario"),
        puntos: p.puntos_referidos || 0,
        total_referidos: 0,
      }));
      setEntries(mapped);
    }
  };

  const cardClass = tema === "oscuro" ? "bg-neutral-900 border-neutral-800 text-white" : "border";
  const mutedClass = tema === "oscuro" ? "text-neutral-400" : "text-muted-foreground";

  if (entries.length === 0) return null;

  return (
    <Card className={cardClass}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" /> Tabla de Clasificacion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {entries.map((entry, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? (tema === "oscuro" ? "bg-white text-black" : "bg-foreground text-background") :
                  tema === "oscuro" ? "bg-neutral-800 text-neutral-300" : "bg-muted"
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm font-medium">{entry.nombre}</span>
              </div>
              <Badge variant={i === 0 ? "default" : "secondary"} className="font-mono">
                {entry.puntos} pts
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferidosLeaderboard;
