import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, Minus, Search, ShoppingCart, Trash2, Loader2, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagenes: string[] | null;
  stock: number | null;
  colores?: string[] | null;
  tallas?: string[] | null;
}

interface Profile {
  id: string;
  user_id: string;
  nombre_completo: string;
  correo: string;
  direccion: string | null;
  telefono: string | null;
  codigo_membresia: string | null;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  color?: string;
  talla?: string;
}

export const AdminCrearPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchProducto, setSearchProducto] = useState("");
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productosRes, profilesRes] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, precio, imagenes, stock, colores, tallas')
          .eq('activo', true)
          .eq('disponible', true)
          .order('nombre'),
        supabase
          .from('profiles')
          .select('id, user_id, nombre_completo, correo, direccion, telefono, codigo_membresia')
          .order('nombre_completo')
      ]);

      setProductos(productosRes.data || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderCode = () => {
    // Format: B01-XXXXX
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `B01-${randomNum.toString().padStart(5, '0')}`;
  };

  const filteredProductos = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchProducto.toLowerCase())
  );

  const filteredProfiles = profiles.filter(p => 
    p.nombre_completo.toLowerCase().includes(searchCliente.toLowerCase()) ||
    p.correo.toLowerCase().includes(searchCliente.toLowerCase()) ||
    (p.codigo_membresia && p.codigo_membresia.toLowerCase().includes(searchCliente.toLowerCase()))
  );

  const addToCarrito = (producto: Producto) => {
    const existing = carrito.find(item => item.producto.id === producto.id);
    if (existing) {
      setCarrito(carrito.map(item => 
        item.producto.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, { 
        producto, 
        cantidad: 1,
        color: producto.colores?.[0],
        talla: producto.tallas?.[0]
      }]);
    }
    toast.success(`${producto.nombre} agregado`);
  };

  const updateCantidad = (productoId: string, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.producto.id === productoId) {
        const newCantidad = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: newCantidad };
      }
      return item;
    }));
  };

  const removeFromCarrito = (productoId: string) => {
    setCarrito(carrito.filter(item => item.producto.id !== productoId));
  };

  const updateItemOption = (productoId: string, field: 'color' | 'talla', value: string) => {
    setCarrito(carrito.map(item => {
      if (item.producto.id === productoId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const selectCliente = (profile: Profile) => {
    setSelectedProfile(profile);
    setDireccionEnvio(profile.direccion || "");
    setSearchCliente("");
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  };

  const crearPedido = async () => {
    if (!selectedProfile) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (carrito.length === 0) {
      toast.error('Agrega productos al carrito');
      return;
    }
    if (!direccionEnvio.trim()) {
      toast.error('Ingresa la direccion de envio');
      return;
    }

    setCreatingOrder(true);
    try {
      const codigoPedido = generateOrderCode();
      const subtotal = calcularTotal();
      const total = subtotal;

      const items = carrito.map(item => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio,
        cantidad: item.cantidad,
        color: item.color || null,
        talla: item.talla || null,
        imagen: item.producto.imagenes?.[0] || null
      }));

      const historialInicial = [{
        estado: 'Pedido Pagado',
        fecha: new Date().toISOString(),
        descripcion: 'Pedido creado por administrador'
      }];

      const { error } = await supabase
        .from('pedidos_online')
        .insert({
          codigo_pedido: codigoPedido,
          user_id: selectedProfile.user_id,
          subtotal,
          total,
          items,
          direccion_envio: direccionEnvio,
          estado: 'Pagado',
          estado_detallado: 'Pedido Pagado',
          historial_estados: historialInicial
        });

      if (error) throw error;

      toast.success(`Pedido ${codigoPedido} creado exitosamente`);
      setLastCreatedCode(codigoPedido);
      
      // Reset form
      setCarrito([]);
      setSelectedProfile(null);
      setDireccionEnvio("");

    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Error al crear el pedido');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Crear Pedido para Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lastCreatedCode && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Pedido creado exitosamente</span>
            </div>
            <p className="mt-2 font-mono text-lg font-bold text-foreground">
              Codigo de rastreo: {lastCreatedCode}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Este pedido esta disponible en /manage y el cliente puede rastrearlo en /rastrear-pedido/{lastCreatedCode}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Seleccionar Cliente */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">1. Seleccionar Cliente</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo o codigo..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchCliente && (
                <ScrollArea className="h-48 mt-2 border rounded-lg">
                  {filteredProfiles.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground">No se encontraron clientes</p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredProfiles.slice(0, 10).map(profile => (
                        <button
                          key={profile.id}
                          onClick={() => selectCliente(profile)}
                          className="w-full p-3 text-left rounded-lg hover:bg-muted transition-colors"
                        >
                          <p className="font-medium">{profile.nombre_completo}</p>
                          <p className="text-sm text-muted-foreground">{profile.correo}</p>
                          {profile.codigo_membresia && (
                            <Badge variant="outline" className="mt-1">{profile.codigo_membresia}</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
              
              {selectedProfile && (
                <div className="mt-3 p-4 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{selectedProfile.nombre_completo}</p>
                      <p className="text-sm text-muted-foreground">{selectedProfile.correo}</p>
                      {selectedProfile.telefono && (
                        <p className="text-sm text-muted-foreground">Tel: {selectedProfile.telefono}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProfile(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Direccion de Envio */}
            <div>
              <Label className="text-base font-semibold">2. Direccion de Envio</Label>
              <Input
                className="mt-2"
                placeholder="Direccion completa de envio..."
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
              />
            </div>

            {/* Carrito */}
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Carrito ({carrito.length} productos)
              </Label>
              
              {carrito.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No hay productos en el carrito</p>
              ) : (
                <ScrollArea className="h-64 mt-2 border rounded-lg">
                  <div className="p-3 space-y-3">
                    {carrito.map(item => (
                      <div key={item.producto.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                        {item.producto.imagenes?.[0] && (
                          <img 
                            src={item.producto.imagenes[0]} 
                            alt={item.producto.nombre}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.producto.nombre}</p>
                          <p className="text-sm text-primary font-semibold">
                            RD${item.producto.precio} x {item.cantidad} = RD${item.producto.precio * item.cantidad}
                          </p>
                          
                          <div className="flex gap-2 mt-2">
                            {item.producto.colores && item.producto.colores.length > 0 && (
                              <Select
                                value={item.color}
                                onValueChange={(v) => updateItemOption(item.producto.id, 'color', v)}
                              >
                                <SelectTrigger className="h-7 text-xs w-24">
                                  <SelectValue placeholder="Color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.producto.colores.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {item.producto.tallas && item.producto.tallas.length > 0 && (
                              <Select
                                value={item.talla}
                                onValueChange={(v) => updateItemOption(item.producto.id, 'talla', v)}
                              >
                                <SelectTrigger className="h-7 text-xs w-20">
                                  <SelectValue placeholder="Talla" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.producto.tallas.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCarrito(item.producto.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCantidad(item.producto.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCantidad(item.producto.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {carrito.length > 0 && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-primary">RD${calcularTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={!selectedProfile || carrito.length === 0 || !direccionEnvio.trim() || creatingOrder}
                onClick={crearPedido}
              >
                {creatingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando pedido...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Crear Pedido
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Catalogo de Productos */}
          <div>
            <Label className="text-base font-semibold">3. Agregar Productos</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchProducto}
                onChange={(e) => setSearchProducto(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[500px] mt-3 border rounded-lg">
              <div className="p-3 grid grid-cols-2 gap-3">
                {filteredProductos.map(producto => (
                  <div
                    key={producto.id}
                    className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    {producto.imagenes?.[0] ? (
                      <img 
                        src={producto.imagenes[0]} 
                        alt={producto.nombre}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="font-medium text-sm truncate">{producto.nombre}</p>
                      <p className="text-primary font-semibold">RD${producto.precio}</p>
                      {producto.stock !== null && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Stock: {producto.stock}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => addToCarrito(producto)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCrearPedido;
