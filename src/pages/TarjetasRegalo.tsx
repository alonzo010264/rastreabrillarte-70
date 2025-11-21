import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Gift, Check, Loader2 } from "lucide-react";

export default function TarjetasRegalo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [codigoCanje, setCodigoCanje] = useState("");
  const [canjeando, setCanjeando] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(false);
  };

  const handleCanjearTarjeta = async () => {
    if (!codigoCanje.trim()) {
      toast.error("Ingresa un código");
      return;
    }

    setCanjeando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Buscar tarjeta
      const { data: tarjeta, error: tarjetaError } = await supabase
        .from('tarjetas_regalo')
        .select('*')
        .eq('codigo', codigoCanje.toUpperCase())
        .maybeSingle();

      if (tarjetaError || !tarjeta) {
        toast.error("Código no válido");
        return;
      }

      if (tarjeta.usado) {
        toast.error("Esta tarjeta ya ha sido canjeada");
        return;
      }

      // Marcar como usada
      const { error: updateError } = await supabase
        .from('tarjetas_regalo')
        .update({
          usado: true,
          user_id_canjeado: user.id,
          fecha_canje: new Date().toISOString()
        })
        .eq('id', tarjeta.id);

      if (updateError) throw updateError;

      // Agregar crédito al usuario usando la función
      await supabase.rpc('update_user_balance', {
        p_user_id: user.id,
        p_monto: tarjeta.monto,
        p_tipo: 'credito',
        p_concepto: `Tarjeta de regalo canjeada: ${tarjeta.codigo}`
      });

      // Notificar
      await supabase.from('notifications').insert({
        user_id: user.id,
        tipo: 'credito',
        titulo: 'Tarjeta Canjeada',
        mensaje: `Has canjeado una tarjeta de regalo por $${tarjeta.monto.toFixed(2)}`
      });

      toast.success(`¡Tarjeta canjeada! Se agregaron $${tarjeta.monto.toFixed(2)} a tu saldo`);
      setCodigoCanje("");
    } catch (error) {
      console.error('Error redeeming card:', error);
      toast.error("Error al canjear tarjeta");
    } finally {
      setCanjeando(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Gift className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Canjear Tarjeta de Regalo</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ingresa tu Código de Tarjeta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="codigo-canje">Código de Tarjeta (15 dígitos)</Label>
                <Input
                  id="codigo-canje"
                  placeholder="XXXXX-XXXXX-XXXXX"
                  value={codigoCanje}
                  onChange={(e) => setCodigoCanje(e.target.value.toUpperCase())}
                  maxLength={17}
                  className="text-lg font-mono text-center"
                />
              </div>
              <Button
                onClick={handleCanjearTarjeta}
                disabled={canjeando}
                className="w-full"
                size="lg"
              >
                {canjeando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Canjeando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Canjear Tarjeta
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-6">
                <p>Al canjear tu tarjeta, el monto se agregará automáticamente a tu saldo</p>
                <p className="mt-2">Podrás usarlo para compras en Brillarte</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
