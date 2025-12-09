import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface PedidoOnline {
  id: string;
  codigo_pedido: string;
  total: number;
  subtotal: number;
  descuento: number | null;
  estado: string;
  created_at: string;
  items: any;
}

interface Producto {
  id: string;
  nombre: string;
  stock: number | null;
  precio: number;
  categoria: string | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export default function AdminContabilidad() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoOnline[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stats, setStats] = useState({
    totalVentas: 0,
    totalPedidos: 0,
    pedidosCompletados: 0,
    pedidosPendientes: 0,
    promedioVenta: 0
  });

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('verificado')
      .eq('user_id', user.id)
      .single();

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    const isVerified = profileData?.verificado === true;

    if (!hasAdminRole && !isVerified) {
      navigate('/');
      return;
    }

    await loadData();
  };

  const loadData = async () => {
    try {
      const [pedidosRes, productosRes] = await Promise.all([
        supabase
          .from('pedidos_online')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('productos')
          .select('id, nombre, stock, precio, categoria')
          .eq('activo', true)
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (productosRes.error) throw productosRes.error;

      const pedidosData = pedidosRes.data || [];
      const productosData = productosRes.data || [];

      setPedidos(pedidosData);
      setProductos(productosData);

      // Calcular estadísticas
      const completados = pedidosData.filter(p => p.estado === 'Completado' || p.estado === 'Entregado');
      const pendientes = pedidosData.filter(p => p.estado === 'Recibido' || p.estado === 'Pendiente' || p.estado === 'En proceso');
      const totalVentas = completados.reduce((acc, p) => acc + p.total, 0);

      setStats({
        totalVentas,
        totalPedidos: pedidosData.length,
        pedidosCompletados: completados.length,
        pedidosPendientes: pendientes.length,
        promedioVenta: completados.length > 0 ? totalVentas / completados.length : 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Datos para gráfica de ventas por día (últimos 7 días)
  const getVentasPorDia = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(day => {
      const ventasDelDia = pedidos
        .filter(p => p.created_at.startsWith(day))
        .reduce((acc, p) => acc + p.total, 0);
      
      return {
        dia: new Date(day).toLocaleDateString('es', { weekday: 'short', day: 'numeric' }),
        ventas: ventasDelDia
      };
    });
  };

  // Datos para gráfica de categorías
  const getVentasPorCategoria = () => {
    const categorias: Record<string, number> = {};
    
    pedidos.forEach(pedido => {
      if (Array.isArray(pedido.items)) {
        pedido.items.forEach((item: any) => {
          const cat = item.categoria || 'Sin categoría';
          categorias[cat] = (categorias[cat] || 0) + (item.precio * item.cantidad);
        });
      }
    });

    return Object.entries(categorias).map(([name, value]) => ({ name, value }));
  };

  // Productos con stock bajo
  const productosStockBajo = productos
    .filter(p => (p.stock || 0) < 5)
    .sort((a, b) => (a.stock || 0) - (b.stock || 0));

  // Top productos vendidos
  const getTopProductos = () => {
    const productosVendidos: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    
    pedidos.forEach(pedido => {
      if (Array.isArray(pedido.items)) {
        pedido.items.forEach((item: any) => {
          const id = item.producto_id || item.id;
          if (!productosVendidos[id]) {
            productosVendidos[id] = { nombre: item.nombre, cantidad: 0, total: 0 };
          }
          productosVendidos[id].cantidad += item.cantidad;
          productosVendidos[id].total += item.precio * item.cantidad;
        });
      }
    });

    return Object.values(productosVendidos)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const ventasPorDia = getVentasPorDia();
  const ventasPorCategoria = getVentasPorCategoria();
  const topProductos = getTopProductos();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Contabilidad de la Tienda</h1>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalVentas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              De pedidos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPedidos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pedidosCompletados} completados, {stats.pedidosPendientes} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.promedioVenta.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Por pedido completado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
            <p className="text-xs text-muted-foreground">
              {productosStockBajo.length} con stock bajo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Gráfica de ventas por día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ventas Últimos 7 Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ventasPorDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfica de ventas por categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {ventasPorCategoria.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ventasPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ventasPorCategoria.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos de categorías
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Productos con stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alerta de Stock Bajo
            </CardTitle>
            <CardDescription>Productos con menos de 5 unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {productosStockBajo.length > 0 ? (
              <div className="space-y-3">
                {productosStockBajo.map(producto => (
                  <div key={producto.id} className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div>
                      <p className="font-medium">{producto.nombre}</p>
                      <p className="text-sm text-muted-foreground">${producto.precio}</p>
                    </div>
                    <Badge variant={producto.stock === 0 ? "destructive" : "secondary"}>
                      {producto.stock === 0 ? 'Agotado' : `${producto.stock} unidades`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Todos los productos tienen stock suficiente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top productos vendidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Top Productos Vendidos
            </CardTitle>
            <CardDescription>Productos con mayores ventas</CardDescription>
          </CardHeader>
          <CardContent>
            {topProductos.length > 0 ? (
              <div className="space-y-3">
                {topProductos.map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">{producto.cantidad} vendidos</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">${producto.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay ventas registradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de pedidos recientes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pedidos Recientes</CardTitle>
          <CardDescription>Últimos 10 pedidos realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Código</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.slice(0, 10).map(pedido => (
                  <tr key={pedido.id} className="border-b">
                    <td className="p-2 font-mono text-sm">{pedido.codigo_pedido}</td>
                    <td className="p-2 text-sm">
                      {new Date(pedido.created_at).toLocaleDateString('es', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-2">
                      <Badge variant={
                        pedido.estado === 'Completado' || pedido.estado === 'Entregado' 
                          ? 'default' 
                          : pedido.estado === 'Cancelado' 
                            ? 'destructive' 
                            : 'secondary'
                      }>
                        {pedido.estado}
                      </Badge>
                    </td>
                    <td className="p-2 text-right font-medium">${pedido.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
