import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Check, Truck, ArrowLeft, MapPin, Clock } from "lucide-react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface HistorialEstado { estado: string; fecha: string; descripcion: string; }
interface PedidoOnline {
  id: string;
  codigo_pedido: string;
  total: number;
  subtotal?: number;
  estado: string;
  estado_detallado: string;
  historial_estados: HistorialEstado[];
  direccion_envio: string;
  items: any[];
  created_at: string;
  empresa_envio_id?: string;
  tracking_envio?: string;
  empresas_envio?: { nombre: string; logo_url: string | null } | null;
}

const ESTADOS_PROCESO = [
  { id: 'Pedido Pagado', label: 'Pagado', descripcion: 'Tu pedido fue confirmado correctamente.' },
  { id: 'Pedido Recogido', label: 'Recogido', descripcion: 'Tu pedido fue recogido para preparación.' },
  { id: 'Creando Etiqueta', label: 'Etiqueta', descripcion: 'Estamos creando la etiqueta de envío.' },
  { id: 'Validando Calidad', label: 'Calidad', descripcion: 'Revisando la calidad de tus productos.' },
  { id: 'Inspeccionando Artículos', label: 'Inspección', descripcion: 'Verificando que todo esté correcto.' },
  { id: 'Pedido Enviado', label: 'Enviado', descripcion: 'Tu pedido está en camino.' },
];

const toArr = (v: unknown): any[] => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};
const safeDate = (v?: string | null, fmt = "d 'de' MMMM, yyyy", fb = "—") => {
  if (!v) return fb;
  const d = new Date(v);
  return isValid(d) ? format(d, fmt, { locale: es }) : fb;
};

const RastrearPedidoOnline = () => {
  const { codigoPedido } = useParams<{ codigoPedido: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<PedidoOnline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPedido = async () => {
    if (!codigoPedido) return;
    try {
      const { data, error: err } = await supabase.rpc('get_order_tracking', { p_codigo: codigoPedido });
      if (err) throw err;
      if (!data) { setError('No se encontró el pedido'); return; }
      const p = data as any;
      p.historial_estados = toArr(p.historial_estados).filter((x: any) => x && typeof x === 'object');
      p.items = toArr(p.items).filter((x: any) => x && typeof x === 'object');
      p.total = Number(p.total) || 0;
      setPedido(p as PedidoOnline);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError('No se encontró el pedido');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    loadPedido();
    if (!codigoPedido) return;
    const ch = supabase
      .channel(`tracking-${codigoPedido}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_online', filter: `codigo_pedido=eq.${codigoPedido}` }, () => loadPedido())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoPedido]);

  const estadoIdx = pedido ? ESTADOS_PROCESO.findIndex(e => e.id === pedido.estado_detallado) : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-20 max-w-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 border-2 border-foreground rounded-full flex items-center justify-center">
            <Package className="w-9 h-9 text-foreground" />
          </div>
          <h1 className="font-display text-3xl mb-3 text-foreground">Pedido no encontrado</h1>
          <p className="text-muted-foreground mb-8">No pudimos encontrar un pedido con el código <span className="font-mono font-semibold text-foreground">{codigoPedido}</span></p>
          <Button onClick={() => navigate('/rastrear')} variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background">
            <ArrowLeft className="w-4 h-4 mr-2" /> Buscar otro pedido
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const progressPct = estadoIdx >= 0 ? ((estadoIdx + 1) / ESTADOS_PROCESO.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
        {/* Header card */}
        <div className="border-2 border-foreground bg-background rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Pedido</p>
              <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">{pedido.codigo_pedido}</h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {safeDate(pedido.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Total</p>
              <p className="font-display text-3xl text-foreground">${pedido.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="border border-border rounded-2xl p-6 sm:p-8 mb-8 bg-background">
          <h2 className="font-display text-xl text-foreground mb-6">Estado del envío</h2>

          <div className="relative mb-8">
            <div className="absolute top-4 left-4 right-4 h-px bg-border" />
            <div className="absolute top-4 left-4 h-px bg-foreground transition-all duration-700" style={{ width: `calc((100% - 2rem) * ${progressPct / 100})` }} />
            <div className="relative flex justify-between">
              {ESTADOS_PROCESO.map((e, i) => {
                const done = i <= estadoIdx;
                const current = i === estadoIdx;
                return (
                  <div key={e.id} className="flex flex-col items-center" style={{ width: `${100 / ESTADOS_PROCESO.length}%` }}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${done ? 'bg-foreground border-foreground text-background' : 'bg-background border-border text-muted-foreground'} ${current ? 'ring-4 ring-foreground/10 scale-110' : ''}`}>
                      {done ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                    </div>
                    <p className={`mt-2 text-[10px] sm:text-xs text-center leading-tight font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{e.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <p className="font-display text-lg text-foreground">{pedido.estado_detallado || 'Pedido Pagado'}</p>
            <p className="text-sm text-muted-foreground mt-1">{ESTADOS_PROCESO.find(e => e.id === pedido.estado_detallado)?.descripcion || 'Tu pedido fue confirmado correctamente.'}</p>
          </div>
        </div>

        {/* Envío */}
        {pedido.empresas_envio && pedido.tracking_envio && (
          <div className="border border-border rounded-2xl p-5 mb-8 bg-background flex items-center gap-4">
            <div className="w-11 h-11 rounded-full border border-foreground flex items-center justify-center">
              <Truck className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">Enviado con {pedido.empresas_envio.nombre}</p>
              <p className="text-xs text-muted-foreground">Tracking <span className="font-mono">{pedido.tracking_envio}</span></p>
            </div>
            {pedido.empresas_envio.logo_url && (
              <img src={pedido.empresas_envio.logo_url} alt={pedido.empresas_envio.nombre} className="h-8 object-contain grayscale" />
            )}
          </div>
        )}

        {/* Productos */}
        <div className="border border-border rounded-2xl p-6 mb-8 bg-background">
          <h2 className="font-display text-xl text-foreground mb-5">Productos</h2>
          <div className="space-y-3">
            {pedido.items.map((it: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-3 border border-border rounded-xl">
                {it.imagen ? (
                  <img src={it.imagen} alt={it.nombre} className="w-16 h-16 object-cover rounded-lg border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{it.nombre}</p>
                  <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                    <span>Cant. {it.cantidad}</span>
                    {it.color && <span>· {it.color}</span>}
                    {it.talla && <span>· Talla {it.talla}</span>}
                  </div>
                </div>
                <span className="font-semibold text-sm text-foreground whitespace-nowrap">${(Number(it.precio) * Number(it.cantidad)).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dirección */}
        {pedido.direccion_envio && (
          <div className="border border-border rounded-2xl p-5 mb-8 bg-background flex items-start gap-3">
            <MapPin className="w-5 h-5 text-foreground mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Dirección de envío</p>
              <p className="text-sm text-foreground">{pedido.direccion_envio}</p>
            </div>
          </div>
        )}

        {/* Historial */}
        {pedido.historial_estados.length > 0 && (
          <div className="border border-border rounded-2xl p-6 bg-background">
            <h2 className="font-display text-xl text-foreground mb-5">Historial</h2>
            <div className="space-y-4">
              {[...pedido.historial_estados].reverse().map((h, i) => (
                <div key={i} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? 'bg-foreground' : 'bg-border'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{h.estado}</p>
                    {h.descripcion && <p className="text-xs text-muted-foreground">{h.descripcion}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">{safeDate(h.fecha, "d 'de' MMMM, yyyy · h:mm a", '')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default RastrearPedidoOnline;
