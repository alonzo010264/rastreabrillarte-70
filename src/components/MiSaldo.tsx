import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Transaccion {
  id: string;
  monto: number;
  tipo: 'credito' | 'debito';
  concepto: string;
  saldo_anterior: number;
  saldo_nuevo: number;
  created_at: string;
}

export const MiSaldo = () => {
  const [saldo, setSaldo] = useState<number>(0);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaldo();

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('saldo-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacciones_creditos'
        },
        () => {
          loadSaldo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSaldo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar saldo actual
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setSaldo(profile.saldo || 0);
      }

      // Cargar historial de transacciones
      const { data: transaccionesData, error } = await supabase
        .from('transacciones_creditos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransacciones((transaccionesData as Transaccion[]) || []);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saldo actual */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Saldo Disponible
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">${saldo.toFixed(2)}</p>
          <p className="text-sm opacity-90 mt-2">Créditos disponibles para usar en Brillarte</p>
        </CardContent>
      </Card>

      {/* Historial de transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {transacciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay transacciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transacciones.map((trans) => (
                <div key={trans.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${trans.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                      {trans.tipo === 'credito' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{trans.concepto}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trans.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Saldo anterior: ${trans.saldo_anterior.toFixed(2)} → Nuevo: ${trans.saldo_nuevo.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={trans.tipo === 'credito' ? 'default' : 'secondary'}>
                      {trans.tipo === 'credito' ? '+' : '-'}${trans.monto.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
