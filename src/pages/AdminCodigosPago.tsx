import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Key, Copy, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CodigoPago {
  id: string;
  codigo: string;
  usado: boolean;
  usado_por: string | null;
  pedido_id: string | null;
  created_at: string;
  usado_at: string | null;
}

const AdminCodigosPago = () => {
  const [codes, setCodes] = useState<CodigoPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
    loadCodes();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('correo')
      .eq('user_id', user.id)
      .single();

    if (profile?.correo !== 'oficial@brillarte.lat') {
      const { data: role } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!role) {
        navigate('/');
        toast.error('No tienes acceso a esta página');
      }
    }
  };

  const loadCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('codigos_pago')
        .select('*')
        .order('usado', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error('Error loading codes:', error);
      toast.error('Error al cargar códigos');
    } finally {
      setLoading(false);
    }
  };

  const ensureCodes = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-payment-codes', {
        body: { action: 'ensure-codes' }
      });

      if (error) throw error;
      
      toast.success(`Códigos actualizados: ${data.codes?.length || 0} disponibles`);
      loadCodes();
    } catch (error) {
      console.error('Error ensuring codes:', error);
      toast.error('Error al generar códigos');
    } finally {
      setRefreshing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const availableCodes = codes.filter(c => !c.usado);
  const usedCodes = codes.filter(c => c.usado);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/perfil" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al perfil
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Key className="w-8 h-8 text-primary" />
                Códigos de Pago
              </h1>
              <p className="text-muted-foreground">
                Gestiona los códigos de pago para Brillarte Shop
              </p>
            </div>
            <Button onClick={ensureCodes} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generar códigos
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Códigos Disponibles</CardTitle>
              <CardDescription>Listos para entregar a clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{availableCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Códigos Usados</CardTitle>
              <CardDescription>Ya utilizados en pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-muted-foreground">{usedCodes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Códigos disponibles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">Códigos Disponibles</CardTitle>
            <CardDescription>
              Copia y comparte estos códigos con los clientes que hayan pagado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableCodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay códigos disponibles. Haz clic en "Generar códigos" para crear nuevos.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCodes.map((code) => (
                  <div 
                    key={code.id} 
                    className="p-4 bg-muted rounded-lg flex items-center justify-between"
                  >
                    <code className="text-lg font-mono font-bold">{code.codigo}</code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyCode(code.codigo)}
                    >
                      {copiedCode === code.codigo ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de códigos usados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Historial de Códigos Usados</CardTitle>
            <CardDescription>
              Registro de todos los códigos que han sido utilizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usedCodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aún no hay códigos usados
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha de Uso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usedCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell>
                        <code className="font-mono">{code.codigo}</code>
                      </TableCell>
                      <TableCell>
                        {code.usado_at 
                          ? format(new Date(code.usado_at), "dd MMM yyyy, HH:mm", { locale: es })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Usado</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default AdminCodigosPago;