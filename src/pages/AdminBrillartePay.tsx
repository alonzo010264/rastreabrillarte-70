import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreditCard, Loader2, Plus, DollarSign, Users, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TarjetaBrillarte {
  id: string;
  user_id: string;
  numero_tarjeta: string;
  saldo: number;
  activa: boolean;
  created_at: string;
  profiles?: { nombre_completo: string; correo: string };
}

export default function AdminBrillartePay() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tarjetas, setTarjetas] = useState<TarjetaBrillarte[]>([]);
  const [configSaldo, setConfigSaldo] = useState({ activado: false, id: '' });
  const [creatingCard, setCreatingCard] = useState(false);

  // Form para nueva tarjeta
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData?.role !== 'admin') {
      toast.error('Solo administradores');
      navigate('/');
      return;
    }

    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    // Cargar tarjetas - usando any por tipos pendientes
    const { data: tarjetasData } = await (supabase as any)
      .from('tarjetas_brillarte')
      .select('*')
      .order('created_at', { ascending: false });

    if (tarjetasData) {
      const tarjetasConPerfiles = await Promise.all(
        tarjetasData.map(async (t: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, correo')
            .eq('user_id', t.user_id)
            .single();
          return { ...t, profiles: profile };
        })
      );
      setTarjetas(tarjetasConPerfiles);
    }

    // Cargar config - usando any por tipos pendientes
    const { data: configData } = await (supabase as any)
      .from('config_pagos_saldo')
      .select('*')
      .limit(1)
      .single();

    if (configData) {
      setConfigSaldo({ activado: configData.activado, id: configData.id });
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, nombre_completo, correo')
      .ilike('correo', `%${searchEmail}%`)
      .limit(5);

    setSearchResults(data || []);
  };

  const generateCardNumber = () => {
    const prefix = '5200';
    let number = prefix;
    for (let i = 0; i < 12; i++) {
      number += Math.floor(Math.random() * 10);
    }
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  const handleCreateCard = async () => {
    if (!selectedUserId) {
      toast.error("Selecciona un usuario");
      return;
    }

    setCreatingCard(true);
    try {
      const numero = generateCardNumber();

      const { error } = await (supabase as any)
        .from('tarjetas_brillarte')
        .insert({
          user_id: selectedUserId,
          numero_tarjeta: numero,
          saldo: parseFloat(saldoInicial) || 0
        });

      if (error) throw error;

      toast.success("¡Tarjeta Brillarte creada!");
      setSelectedUserId("");
      setSaldoInicial("0");
      setSearchEmail("");
      setSearchResults([]);
      await loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Error al crear tarjeta");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleToggleConfig = async () => {
    const newValue = !configSaldo.activado;
    
    const { error } = await (supabase as any)
      .from('config_pagos_saldo')
      .update({ activado: newValue })
      .eq('id', configSaldo.id);

    if (error) {
      toast.error("Error al actualizar");
      return;
    }

    setConfigSaldo({ ...configSaldo, activado: newValue });
    toast.success(newValue ? "Pagos con saldo activados" : "Pagos con saldo desactivados");
  };

  const handleUpdateSaldo = async (tarjetaId: string, nuevoSaldo: number) => {
    const { error } = await (supabase as any)
      .from('tarjetas_brillarte')
      .update({ saldo: nuevoSaldo })
      .eq('id', tarjetaId);

    if (error) {
      toast.error("Error al actualizar saldo");
      return;
    }

    toast.success("Saldo actualizado");
    await loadData();
  };

  const handleToggleTarjeta = async (tarjetaId: string, activa: boolean) => {
    const { error } = await (supabase as any)
      .from('tarjetas_brillarte')
      .update({ activa: !activa })
      .eq('id', tarjetaId);

    if (error) {
      toast.error("Error");
      return;
    }

    toast.success(activa ? "Tarjeta desactivada" : "Tarjeta activada");
    await loadData();
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Brillarte Pay</h1>
          </div>

          <Tabs defaultValue="tarjetas">
            <TabsList className="mb-6">
              <TabsTrigger value="tarjetas" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarjetas">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Crear tarjeta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Nueva Tarjeta Brillarte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Buscar usuario por correo</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="correo@ejemplo.com"
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                        />
                        <Button variant="outline" onClick={searchUsers}>
                          Buscar
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <Label>Seleccionar usuario:</Label>
                        {searchResults.map((user) => (
                          <button
                            key={user.user_id}
                            onClick={() => setSelectedUserId(user.user_id)}
                            className={`w-full p-3 text-left rounded-lg border transition ${
                              selectedUserId === user.user_id
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <p className="font-medium">{user.nombre_completo}</p>
                            <p className="text-sm text-muted-foreground">{user.correo}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    <div>
                      <Label>Saldo inicial ($)</Label>
                      <Input
                        type="number"
                        value={saldoInicial}
                        onChange={(e) => setSaldoInicial(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <Button
                      onClick={handleCreateCard}
                      disabled={creatingCard || !selectedUserId}
                      className="w-full"
                    >
                      {creatingCard ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Crear Tarjeta
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de tarjetas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Tarjetas Creadas ({tarjetas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {tarjetas.map((tarjeta) => (
                        <div
                          key={tarjeta.id}
                          className={`border rounded-lg p-4 ${
                            tarjeta.activa ? 'bg-card' : 'bg-muted opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-mono text-lg">{tarjeta.numero_tarjeta}</p>
                              <p className="text-sm text-muted-foreground">
                                {tarjeta.profiles?.nombre_completo}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tarjeta.profiles?.correo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                ${tarjeta.saldo.toFixed(2)}
                              </p>
                              <span className={`text-xs ${tarjeta.activa ? 'text-green-600' : 'text-red-600'}`}>
                                {tarjeta.activa ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Input
                              type="number"
                              placeholder="Nuevo saldo"
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateSaldo(tarjeta.id, parseFloat((e.target as HTMLInputElement).value));
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleTarjeta(tarjeta.id, tarjeta.activa)}
                            >
                              {tarjeta.activa ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Pagos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Pagos con Saldo de Cuenta</h3>
                      <p className="text-sm text-muted-foreground">
                        Permite que los usuarios paguen usando su saldo en cuenta
                      </p>
                    </div>
                    <Switch
                      checked={configSaldo.activado}
                      onCheckedChange={handleToggleConfig}
                    />
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Estado actual:</h4>
                    <p className={configSaldo.activado ? 'text-green-600' : 'text-red-600'}>
                      {configSaldo.activado 
                        ? '✓ Los usuarios pueden pagar con su saldo' 
                        : '✗ Los usuarios deben usar Code Pay o Brillarte Pay'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}
