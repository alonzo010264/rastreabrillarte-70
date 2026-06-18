import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Edit, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";

interface Paso { label: string; descripcion?: string }
interface Props {
  tabla: "pedidos_online" | "pedidos_cuenta";
  pedidoId: string;
  codigo: string;
  estadosActuales?: Paso[] | null;
  estadoActual?: string | null;
  onSaved?: () => void;
}

const DEFAULT_PASOS: Paso[] = [
  { label: "Recibido", descripcion: "Tu pedido fue recibido." },
  { label: "En proceso", descripcion: "Estamos preparando tu pedido." },
  { label: "Empacado", descripcion: "Tu pedido fue empacado." },
  { label: "Enviado", descripcion: "Tu pedido esta en camino." },
];

export const EditarEstadosPedido = ({ tabla, pedidoId, codigo, estadosActuales, estadoActual, onSaved }: Props) => {
  const [open, setOpen] = useState(false);
  const [pasos, setPasos] = useState<Paso[]>([]);
  const [actualLabel, setActualLabel] = useState<string>("");
  const [nuevoLabel, setNuevoLabel] = useState("");
  const [nuevoDesc, setNuevoDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const inicial = Array.isArray(estadosActuales) && estadosActuales.length > 0 ? estadosActuales : DEFAULT_PASOS;
      setPasos(inicial.map(p => ({ label: p.label, descripcion: p.descripcion || "" })));
      setActualLabel(estadoActual || inicial[0]?.label || "");
    }
  }, [open, estadosActuales, estadoActual]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pasos.length) return;
    const copy = [...pasos];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setPasos(copy);
  };

  const remove = (i: number) => setPasos(pasos.filter((_, idx) => idx !== i));

  const add = () => {
    if (!nuevoLabel.trim()) return;
    setPasos([...pasos, { label: nuevoLabel.trim(), descripcion: nuevoDesc.trim() }]);
    setNuevoLabel(""); setNuevoDesc("");
  };

  const guardar = async () => {
    if (pasos.length === 0) { toast.error("Agrega al menos un paso"); return; }
    setSaving(true);
    try {
      const labels = pasos.map(p => p.label);
      const estadoElegido = labels.includes(actualLabel) ? actualLabel : labels[0];

      const updateData: any = {
        estados_proceso: pasos,
      };
      if (tabla === "pedidos_online") {
        updateData.estado_detallado = estadoElegido;
      } else {
        updateData.estado = estadoElegido;
      }

      const { error } = await (supabase.from(tabla) as any).update(updateData).eq("id", pedidoId);
      if (error) throw error;

      toast.success("Pasos actualizados");
      setOpen(false);
      onSaved?.();
    } catch (e: any) {
      console.error(e);
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-foreground/30">
          <Edit className="w-4 h-4 mr-2" /> Pasos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar pasos · {codigo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
          {pasos.map((p, i) => (
            <div key={i} className={`border rounded-lg p-3 ${p.label === actualLabel ? "border-foreground bg-muted/40" : "border-border"}`}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-foreground flex items-center justify-center text-xs font-semibold">{i + 1}</div>
                <div className="flex-1">
                  <Input value={p.label} onChange={(e) => { const c = [...pasos]; c[i] = { ...c[i], label: e.target.value }; setPasos(c); }} placeholder="Nombre del paso" />
                  <Input className="mt-2 text-xs" value={p.descripcion || ""} onChange={(e) => { const c = [...pasos]; c[i] = { ...c[i], descripcion: e.target.value }; setPasos(c); }} placeholder="Descripcion (opcional)" />
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)}><ArrowUp className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)}><ArrowDown className="w-3 h-3" /></Button>
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant={p.label === actualLabel ? "default" : "outline"} className="h-7 w-7" title="Marcar como paso actual" onClick={() => setActualLabel(p.label)}><Check className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}

          <div className="border-2 border-dashed border-border rounded-lg p-3 space-y-2">
            <Label className="text-xs">Agregar nuevo paso</Label>
            <Input value={nuevoLabel} onChange={(e) => setNuevoLabel(e.target.value)} placeholder="Ej: Inspeccion final" />
            <Input value={nuevoDesc} onChange={(e) => setNuevoDesc(e.target.value)} placeholder="Descripcion (opcional)" />
            <Button size="sm" onClick={add} variant="outline" className="w-full"><Plus className="w-3 h-3 mr-1" /> Agregar paso</Button>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground mb-2">Paso actual: <span className="font-semibold text-foreground">{actualLabel || "—"}</span></p>
          <Button onClick={guardar} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarEstadosPedido;
