import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

const SuscribirPedido = () => {
  const [searchParams] = useSearchParams();
  const codigoFromUrl = searchParams.get("codigo") || "";
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState(codigoFromUrl);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo || !nombre || !codigo) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from("suscripciones_pedidos" as any)
        .select("id")
        .eq("correo", correo.toLowerCase())
        .eq("codigo_pedido", codigo.toUpperCase())
        .eq("activo", true)
        .maybeSingle();

      if (existing) {
        toast.info("Ya estás suscrito a las notificaciones de este pedido");
        setSuccess(true);
        return;
      }

      const { error } = await supabase.from("suscripciones_pedidos" as any).insert({
        correo: correo.toLowerCase(),
        nombre: nombre.trim(),
        codigo_pedido: codigo.toUpperCase(),
      });

      if (error) throw error;
      setSuccess(true);
      toast.success("¡Suscripción exitosa! Recibirás notificaciones por correo");
    } catch (err: any) {
      toast.error("Error al suscribirse. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
        <Navigation />
        <PageHeader title="Notificaciones Activadas" subtitle="Recibirás actualizaciones de tu pedido" />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">¡Listo!</h2>
            <p className="text-muted-foreground mb-4">
              Recibirás un correo cada vez que el estado de tu pedido <strong>{codigo}</strong> cambie.
            </p>
            <Button onClick={() => window.location.href = `/rastrear`} className="w-full">
              Rastrear mi Pedido
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      <Navigation />
      <PageHeader title="Notificaciones de Pedido" subtitle="Recibe actualizaciones en tu correo" />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <Bell className="w-12 h-12 mx-auto text-primary mb-3" />
            <h2 className="text-xl font-semibold">Suscríbete a las Notificaciones</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Te enviaremos un correo cada vez que tu pedido cambie de estado
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código de Pedido</label>
              <Input
                placeholder="B01-00000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                className="font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tu Nombre</label>
              <Input
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tu Correo Electrónico</label>
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                  Suscribiendo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Suscribirme a Notificaciones
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default SuscribirPedido;
