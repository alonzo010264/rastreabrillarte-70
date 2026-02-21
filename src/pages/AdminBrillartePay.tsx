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
import { CreditCard, Loader2, Plus, DollarSign, Users, Settings, Lock, Unlock, History, Search, Ban, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TarjetaBrillarte {
  id: string;
  user_id: string;
  nombre_titular: string;
  numero_tarjeta: string;
  cvv: string;
  fecha_expiracion: string;
  saldo: number;
  activa: boolean;
  bloqueada: boolean;
  motivo_bloqueo: string | null;
  created_at: string;
  profiles?: { nombre_completo: string; correo: string };
}

interface Transaccion {
  id: string;
  tarjeta_id: string;
  tipo: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  descripcion: string | null;
  created_at: string;
  tarjeta?: { nombre_titular: string; numero_tarjeta: string };
}

export default function AdminBrillartePay() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tarjetas, setTarjetas] = useState<TarjetaBrillarte[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [configSaldo, setConfigSaldo] = useState({ activado: false, id: '' });
  const [creatingCard, setCreatingCard] = useState(false);

  // Form para nueva tarjeta
  const [nombreTitular, setNombreTitular] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Filtro de transacciones
  const [filtroTarjeta, setFiltroTarjeta] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  // Realtime para transacciones
  useEffect(() => {
    const channel = supabase
      .channel('transacciones-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transacciones_tarjetas_brillarte' },
        () => loadTransacciones()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    await Promise.all([loadTarjetas(), loadTransacciones(), loadConfig()]);
  };

  const loadTarjetas = async () => {
    const { data: tarjetasData } = await supabase
      .from('tarjetas_brillarte' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (tarjetasData) {
      const tarjetasConPerfiles = await Promise.all(
        (tarjetasData as any[]).map(async (t) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nombre_completo, correo')
            .eq('user_id', t.user_id)
            .maybeSingle();
          return { ...t, profiles: profile };
        })
      );
      setTarjetas(tarjetasConPerfiles);
    }
  };

  const loadTransacciones = async () => {
    const { data } = await supabase
      .from('transacciones_tarjetas_brillarte' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const transConTarjetas = await Promise.all(
        (data as any[]).map(async (t) => {
          const tarjeta = tarjetas.find(tj => tj.id === t.tarjeta_id);
          return { ...t, tarjeta: tarjeta ? { nombre_titular: tarjeta.nombre_titular, numero_tarjeta: tarjeta.numero_tarjeta } : null };
        })
      );
      setTransacciones(transConTarjetas);
    }
  };

  const loadConfig = async () => {
    const { data: configData } = await supabase
      .from('config_pagos_saldo' as any)
      .select('*')
      .limit(1)
      .maybeSingle();

    if (configData) {
      setConfigSaldo({ activado: (configData as any).activado, id: (configData as any).id });
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

  // Generadores de datos de tarjeta
  const generateCardNumber = () => {
    const prefix = '5200 42';
    let number = prefix;
    for (let i = 0; i < 10; i++) {
      if (i === 4) number += ' ';
      number += Math.floor(Math.random() * 10);
    }
    return number;
  };

  const generateExpirationDate = () => {
    const now = new Date();
    const year = now.getFullYear() + 5;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${month}/${year.toString().slice(-2)}`;
  };

  const handleCreateCard = async () => {
    if (!selectedUserId || !nombreTitular.trim()) {
      toast.error("Selecciona un usuario e ingresa el nombre del titular");
      return;
    }

    setCreatingCard(true);
    try {
      const numero = generateCardNumber();
      const fechaExp = generateExpirationDate();

      const { error } = await supabase
        .from('tarjetas_brillarte' as any)
        .insert({
          user_id: selectedUserId,
          nombre_titular: nombreTitular.toUpperCase(),
          numero_tarjeta: numero,
          fecha_expiracion: fechaExp,
          saldo: parseFloat(saldoInicial) || 0
        });

      if (error) throw error;

      toast.success("¡Tarjeta Brillarte creada! Número: " + numero);
      setNombreTitular("");
      setSelectedUserId("");
      setSaldoInicial("0");
      setSearchEmail("");
      setSearchResults([]);
      await loadTarjetas();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error("Error al crear tarjeta");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleToggleConfig = async () => {
    const newValue = !configSaldo.activado;
    
    const { error } = await supabase
      .from('config_pagos_saldo' as any)
      .update({ activado: newValue })
      .eq('id', configSaldo.id);

    if (error) {
      toast.error("Error al actualizar");
      return;
    }

    setConfigSaldo({ ...configSaldo, activado: newValue });
    toast.success(newValue ? "Pagos con saldo activados" : "Pagos con saldo desactivados");
  };

  const handleUpdateSaldo = async (tarjetaId: string, nuevoSaldo: number, saldoActual: number) => {
    const { error: updateError } = await supabase
      .from('tarjetas_brillarte' as any)
      .update({ saldo: nuevoSaldo })
      .eq('id', tarjetaId);

    if (updateError) {
      toast.error("Error al actualizar saldo");
      return;
    }

    // Registrar transacción
    const tipo = nuevoSaldo > saldoActual ? 'recarga' : 'ajuste';
    await supabase
      .from('transacciones_tarjetas_brillarte' as any)
      .insert({
        tarjeta_id: tarjetaId,
        tipo: tipo,
        monto: Math.abs(nuevoSaldo - saldoActual),
        saldo_anterior: saldoActual,
        saldo_nuevo: nuevoSaldo,
        descripcion: tipo === 'recarga' ? 'Recarga de saldo por admin' : 'Ajuste de saldo por admin'
      });

    toast.success("Saldo actualizado");
    await loadData();
  };

  const handleToggleBloqueo = async (tarjeta: TarjetaBrillarte) => {
    const nuevoBloqueado = !tarjeta.bloqueada;
    
    const { error } = await supabase
      .from('tarjetas_brillarte' as any)
      .update({ 
        bloqueada: nuevoBloqueado,
        motivo_bloqueo: nuevoBloqueado ? 'Bloqueada por administrador' : null
      })
      .eq('id', tarjeta.id);

    if (error) {
      toast.error("Error");
      return;
    }

    toast.success(nuevoBloqueado ? "Tarjeta bloqueada" : "Tarjeta desbloqueada");
    await loadTarjetas();
  };

  const handleToggleActiva = async (tarjeta: TarjetaBrillarte) => {
    const { error } = await supabase
      .from('tarjetas_brillarte' as any)
      .update({ activa: !tarjeta.activa })
      .eq('id', tarjeta.id);

    if (error) {
      toast.error("Error");
      return;
    }

    toast.success(tarjeta.activa ? "Tarjeta desactivada" : "Tarjeta activada");
    await loadTarjetas();
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'compra': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'recarga': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'devolucion': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  const transaccionesFiltradas = filtroTarjeta 
    ? transacciones.filter(t => t.tarjeta_id === filtroTarjeta)
    : transacciones;

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Brillarte Pay - Administración</h1>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Tarjetas</span>
                </div>
                <p className="text-2xl font-bold">{tarjetas.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Saldo Total</span>
                </div>
                <p className="text-2xl font-bold">${tarjetas.reduce((sum, t) => sum + t.saldo, 0).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Activas</span>
                </div>
                <p className="text-2xl font-bold">{tarjetas.filter(t => t.activa && !t.bloqueada).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-muted-foreground">Bloqueadas</span>
                </div>
                <p className="text-2xl font-bold">{tarjetas.filter(t => t.bloqueada).length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tarjetas">
            <TabsList className="mb-6">
              <TabsTrigger value="tarjetas" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Tarjetas
              </TabsTrigger>
              <TabsTrigger value="historial" className="gap-2">
                <History className="w-4 h-4" />
                Historial
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tarjetas">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Crear tarjeta */}
                <Card className="lg:col-span-1">
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
                        <Button variant="outline" size="icon" onClick={searchUsers}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <Label>Seleccionar usuario:</Label>
                        {searchResults.map((user) => (
                          <button
                            key={user.user_id}
                            onClick={() => {
                              setSelectedUserId(user.user_id);
                              setNombreTitular(user.nombre_completo);
                            }}
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
                      <Label>Nombre del Titular (como aparecerá en la tarjeta)</Label>
                      <Input
                        placeholder="JUAN PEREZ"
                        value={nombreTitular}
                        onChange={(e) => setNombreTitular(e.target.value)}
                        className="uppercase"
                      />
                    </div>

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

                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium mb-1">Se generará automáticamente:</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Número de tarjeta (16 dígitos)</li>
                        <li>• Fecha de expiración (5 años)</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleCreateCard}
                      disabled={creatingCard || !selectedUserId || !nombreTitular.trim()}
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
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Tarjetas Creadas ({tarjetas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {tarjetas.map((tarjeta) => (
                        <div
                          key={tarjeta.id}
                          className={`border rounded-xl p-4 ${
                            tarjeta.bloqueada ? 'bg-red-50 dark:bg-red-950 border-red-200' :
                            !tarjeta.activa ? 'bg-muted opacity-60' : 
                            'bg-gradient-to-br from-primary/5 to-primary/10'
                          }`}
                        >
                          {/* Simulación de tarjeta */}
                          <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white p-4 rounded-lg mb-3 shadow-lg">
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-xs opacity-70">BRILLARTE PAY</span>
                              <CreditCard className="w-8 h-8" />
                            </div>
                            <p className="font-mono text-lg tracking-wider mb-4">{tarjeta.numero_tarjeta}</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-xs opacity-70">TITULAR</p>
                                <p className="font-medium text-sm">{tarjeta.nombre_titular}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs opacity-70">VENCE</p>
                                <p className="font-mono">{tarjeta.fecha_expiracion}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {tarjeta.profiles?.correo}
                              </p>
                              <div className="flex gap-2 mt-1">
                                {tarjeta.bloqueada && (
                                  <Badge variant="destructive">Bloqueada</Badge>
                                )}
                                {!tarjeta.activa && (
                                  <Badge variant="secondary">Inactiva</Badge>
                                )}
                                {tarjeta.activa && !tarjeta.bloqueada && (
                                  <Badge className="bg-green-600">Activa</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary">
                                ${tarjeta.saldo.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">Saldo disponible</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Input
                              type="number"
                              placeholder="Nuevo saldo"
                              className="flex-1 min-w-[120px]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newSaldo = parseFloat((e.target as HTMLInputElement).value);
                                  if (!isNaN(newSaldo)) {
                                    handleUpdateSaldo(tarjeta.id, newSaldo, tarjeta.saldo);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }
                              }}
                            />
                            <Button
                              variant={tarjeta.bloqueada ? "default" : "destructive"}
                              size="sm"
                              onClick={() => handleToggleBloqueo(tarjeta)}
                            >
                              {tarjeta.bloqueada ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                              {tarjeta.bloqueada ? 'Desbloquear' : 'Bloquear'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActiva(tarjeta)}
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

            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Historial de Transacciones
                    </span>
                    <select 
                      className="text-sm border rounded-md px-3 py-1.5"
                      value={filtroTarjeta}
                      onChange={(e) => setFiltroTarjeta(e.target.value)}
                    >
                      <option value="">Todas las tarjetas</option>
                      {tarjetas.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre_titular} - ...{t.numero_tarjeta.slice(-4)}
                        </option>
                      ))}
                    </select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tarjeta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Saldo Anterior</TableHead>
                          <TableHead>Saldo Nuevo</TableHead>
                          <TableHead>Descripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transaccionesFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No hay transacciones registradas
                            </TableCell>
                          </TableRow>
                        ) : (
                          transaccionesFiltradas.map((trans) => {
                            const tarjeta = tarjetas.find(t => t.id === trans.tarjeta_id);
                            return (
                              <TableRow key={trans.id}>
                                <TableCell className="whitespace-nowrap">
                                  {format(new Date(trans.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs">
                                    {tarjeta ? `...${tarjeta.numero_tarjeta.slice(-4)}` : '-'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getTipoColor(trans.tipo)}>
                                    {trans.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell className={trans.tipo === 'compra' ? 'text-red-600' : 'text-green-600'}>
                                  {trans.tipo === 'compra' ? '-' : '+'}${trans.monto.toFixed(2)}
                                </TableCell>
                                <TableCell>${trans.saldo_anterior.toFixed(2)}</TableCell>
                                <TableCell className="font-medium">${trans.saldo_nuevo.toFixed(2)}</TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {trans.descripcion || '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
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
                        Permite que los usuarios paguen usando su saldo en cuenta (créditos de Brillarte)
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
                        ? '✓ Los usuarios pueden pagar con su saldo de cuenta' 
                        : '✗ Los usuarios deben usar Code Pay o Brillarte Pay'}
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-3">Métodos de pago disponibles en la tienda:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span><strong>Code Pay:</strong> Códigos de pago únicos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span><strong>Brillarte Pay:</strong> Tarjetas de crédito Brillarte</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {configSaldo.activado ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Ban className="w-4 h-4 text-red-600" />
                        )}
                        <span><strong>Saldo en Cuenta:</strong> Créditos de Brillarte</span>
                      </li>
                    </ul>
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
