import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AsignarPedidoCuenta = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    codigo_pedido: "",
    descripcion: "",
    monto: "",
    nombre_producto: "",
    imagen_url: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const buscarCliente = async () => {
    if (!email) return;
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("correo", email.toLowerCase().trim())
      .single();

    if (error || !data) {
      toast({ title: "No encontrado", description: "No existe una cuenta con ese correo", variant: "destructive" });
      setProfile(null);
    } else {
      setProfile(data);
    }
    setSearching(false);
  };

  const asignarPedido = async () => {
    if (!profile || !form.codigo_pedido) {
      toast({ title: "Error", description: "Busca un cliente y agrega un código de pedido", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("pedidos_cuenta").insert({
      user_id: profile.user_id,
      codigo_membresia: profile.codigo_membresia || "N/A",
      codigo_pedido: form.codigo_pedido,
      descripcion: form.descripcion || null,
      monto: form.monto ? parseFloat(form.monto) : null,
      nombre_producto: form.nombre_producto || null,
      imagen_url: form.imagen_url || null,
      estado: "Procesando",
      detalles: {
        asignado_por: "admin",
        fecha_asignacion: new Date().toISOString(),
      },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Enviar notificación al cliente
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      tipo: "pedido",
      titulo: "📦 Nuevo pedido agregado a tu cuenta",
      mensaje: `Se ha asignado el pedido ${form.codigo_pedido}${form.nombre_producto ? ` - ${form.nombre_producto}` : ""} a tu cuenta.`,
      imagen_url: form.imagen_url || null,
      accion_url: `/mi-pedido/${form.codigo_pedido}`,
    });

    toast({ title: "¡Pedido asignado!", description: `Pedido ${form.codigo_pedido} asignado a ${profile.nombre_completo}` });
    setOpen(false);
    setForm({ codigo_pedido: "", descripcion: "", monto: "", nombre_producto: "", imagen_url: "" });
    setProfile(null);
    setEmail("");
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> Asignar pedido a cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar pedido a cuenta de cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Buscar cliente */}
          <div>
            <Label>Correo del cliente</Label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                onKeyDown={(e) => e.key === "Enter" && buscarCliente()}
              />
              <Button onClick={buscarCliente} disabled={searching} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {profile && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <p className="font-medium text-foreground">{profile.nombre_completo}</p>
                <p className="text-sm text-muted-foreground">{profile.correo}</p>
                {profile.codigo_membresia && (
                  <p className="text-xs text-muted-foreground">Membresía: {profile.codigo_membresia}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datos del pedido */}
          <div>
            <Label>Código de pedido *</Label>
            <Input value={form.codigo_pedido} onChange={(e) => setForm({ ...form, codigo_pedido: e.target.value })} placeholder="B01-XXXXX" />
          </div>
          <div>
            <Label>Nombre del producto</Label>
            <Input value={form.nombre_producto} onChange={(e) => setForm({ ...form, nombre_producto: e.target.value })} placeholder="Ej: Aretes de flores" />
          </div>
          <div>
            <Label>Monto (RD$)</Label>
            <Input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <Label>Descripción / Detalles</Label>
            <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Detalles del pedido..." rows={3} />
          </div>
          <div>
            <Label>URL de imagen del producto</Label>
            <Input value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} placeholder="https://..." />
          </div>

          <Button onClick={asignarPedido} disabled={saving || !profile} className="w-full gap-2">
            <Send className="h-4 w-4" /> {saving ? "Asignando..." : "Asignar y notificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AsignarPedidoCuenta;
