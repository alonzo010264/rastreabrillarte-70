import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Calendar, DollarSign } from "lucide-react";

const MiPedidoDetalle = () => {
  const { codigoPedido } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedido = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("pedidos_cuenta")
        .select("*")
        .eq("codigo_pedido", codigoPedido)
        .eq("user_id", user.id)
        .single();

      if (data) setPedido(data);
      setLoading(false);
    };
    fetchPedido();
  }, [codigoPedido, navigate]);

  const estadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case "procesando": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "enviado": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "entregado": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Cargando...</p>
        ) : !pedido ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontró este pedido en tu cuenta.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            {pedido.imagen_url && (
              <img src={pedido.imagen_url} alt={pedido.nombre_producto || "Producto"} className="w-full h-56 object-cover rounded-t-lg" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Pedido {pedido.codigo_pedido}
                </CardTitle>
                <Badge className={estadoColor(pedido.estado)}>{pedido.estado}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pedido.nombre_producto && (
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium text-foreground">{pedido.nombre_producto}</p>
                </div>
              )}
              {pedido.descripcion && (
                <div>
                  <p className="text-sm text-muted-foreground">Descripción</p>
                  <p className="text-foreground">{pedido.descripcion}</p>
                </div>
              )}
              {pedido.monto && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground font-medium">RD$ {Number(pedido.monto).toFixed(2)}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Asignado: {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MiPedidoDetalle;
