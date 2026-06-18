import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import EditarEstadosPedido from "./EditarEstadosPedido";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PedidoCuenta {
  id: string;
  codigo_pedido: string;
  estado: string | null;
  monto: number | null;
  nombre_producto: string | null;
  estados_proceso: any[] | null;
  created_at: string;
  user_id: string | null;
}

export const PedidosCuentaList = () => {
  const [pedidos, setPedidos] = useState<PedidoCuenta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("pedidos_cuenta")
      .select("id, codigo_pedido, estado, monto, nombre_producto, estados_proceso, created_at, user_id")
      .order("created_at", { ascending: false });
    setPedidos((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Pedidos asignados a cuentas (manuales)</CardTitle>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">No hay pedidos asignados</p>
        ) : (
          <div className="space-y-3">
            {pedidos.map(p => (
              <div key={p.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{p.codigo_pedido}</span>
                    <Badge variant="outline">{p.estado || "—"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.nombre_producto || "Pedido personalizado"} · RD${Number(p.monto || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "d 'de' MMM, yyyy", { locale: es })}</p>
                </div>
                <EditarEstadosPedido
                  tabla="pedidos_cuenta"
                  pedidoId={p.id}
                  codigo={p.codigo_pedido}
                  estadosActuales={p.estados_proceso}
                  estadoActual={p.estado}
                  onSaved={load}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PedidosCuentaList;
