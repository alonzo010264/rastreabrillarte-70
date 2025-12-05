import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MultipleImageUpload } from "@/components/MultipleImageUpload";
import { ColorPicker } from "@/components/ColorPicker";
import { DiscountCodes } from "@/components/DiscountCodes";
import { ArrowLeft, Plus, Trash2, Percent, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_original: number | null;
  precio_mayoreo: number | null;
  cantidad_mayoreo: number | null;
  stock: number | null;
  categoria: string | null;
  colores: string[] | null;
  tallas: string[] | null;
  imagenes: string[] | null;
  activo: boolean | null;
  destacado: boolean | null;
  en_oferta: boolean | null;
  porcentaje_descuento: number | null;
  oferta_inicio: string | null;
  oferta_fin: string | null;
  codigo_oferta: string | null;
}

const generateOfferCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'BRILLA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function AdminProductos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioOriginal, setPrecioOriginal] = useState("");
  const [precio, setPrecio] = useState("");
  const [precioMayoreo, setPrecioMayoreo] = useState("");
  const [cantidadMayoreo, setCantidadMayoreo] = useState("");
  const [stock, setStock] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [tallas, setTallas] = useState<string[]>([]);
  const [activo, setActivo] = useState(true);
  const [destacado, setDestacado] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Offer state
  const [enOferta, setEnOferta] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("");
  const [ofertaInicio, setOfertaInicio] = useState("");
  const [ofertaFin, setOfertaFin] = useState("");
  const [codigoOferta, setCodigoOferta] = useState("");

  useEffect(() => {
    loadProductos();
  }, []);

  // Calcular precio automáticamente cuando cambia el descuento o precio original
  useEffect(() => {
    if (enOferta && precioOriginal && porcentajeDescuento) {
      const original = parseFloat(precioOriginal);
      const descuento = parseFloat(porcentajeDescuento);
      if (!isNaN(original) && !isNaN(descuento)) {
        const precioConDescuento = original * (1 - descuento / 100);
        setPrecio(precioConDescuento.toFixed(2));
      }
    }
  }, [enOferta, precioOriginal, porcentajeDescuento]);

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecioOriginal("");
    setPrecio("");
    setPrecioMayoreo("");
    setCantidadMayoreo("");
    setStock("");
    setCategoria("");
    setImagenes([]);
    setColores([]);
    setTallas([]);
    setActivo(true);
    setDestacado(false);
    setEditingId(null);
    setShowForm(false);
    setEnOferta(false);
    setPorcentajeDescuento("");
    setOfertaInicio("");
    setOfertaFin("");
    setCodigoOferta("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre || !precio || imagenes.length === 0) {
      toast.error('Nombre, precio e imágenes son obligatorios');
      return;
    }

    try {
      const productoData = {
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        precio_original: precioOriginal ? parseFloat(precioOriginal) : parseFloat(precio),
        precio_mayoreo: precioMayoreo ? parseFloat(precioMayoreo) : null,
        cantidad_mayoreo: cantidadMayoreo ? parseInt(cantidadMayoreo) : null,
        stock: stock ? parseInt(stock) : 0,
        categoria: categoria || null,
        imagenes,
        colores: colores.length > 0 ? colores : null,
        tallas: tallas.length > 0 ? tallas : null,
        activo,
        destacado,
        en_oferta: enOferta,
        porcentaje_descuento: enOferta && porcentajeDescuento ? parseFloat(porcentajeDescuento) : null,
        oferta_inicio: enOferta && ofertaInicio ? new Date(ofertaInicio).toISOString() : null,
        oferta_fin: enOferta && ofertaFin ? new Date(ofertaFin).toISOString() : null,
        codigo_oferta: enOferta ? (codigoOferta || generateOfferCode()) : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Producto actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productoData]);

        if (error) throw error;
        toast.success('Producto creado exitosamente');
      }

      resetForm();
      loadProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleEdit = (producto: Producto) => {
    setEditingId(producto.id);
    setNombre(producto.nombre);
    setDescripcion(producto.descripcion || "");
    setPrecioOriginal(producto.precio_original?.toString() || producto.precio.toString());
    setPrecio(producto.precio.toString());
    setPrecioMayoreo(producto.precio_mayoreo?.toString() || "");
    setCantidadMayoreo(producto.cantidad_mayoreo?.toString() || "");
    setStock(producto.stock?.toString() || "0");
    setCategoria(producto.categoria || "");
    setImagenes(producto.imagenes || []);
    setColores(producto.colores || []);
    setTallas(producto.tallas || []);
    setActivo(producto.activo ?? true);
    setDestacado(producto.destacado ?? false);
    setEnOferta(producto.en_oferta ?? false);
    setPorcentajeDescuento(producto.porcentaje_descuento?.toString() || "");
    setOfertaInicio(producto.oferta_inicio ? new Date(producto.oferta_inicio).toISOString().slice(0, 16) : "");
    setOfertaFin(producto.oferta_fin ? new Date(producto.oferta_fin).toISOString().slice(0, 16) : "");
    setCodigoOferta(producto.codigo_oferta || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Producto eliminado');
      loadProductos();
    } catch (error) {
      console.error('Error deleting producto:', error);
      toast.error('Error al eliminar producto');
    }
  };

  const addTalla = (talla: string) => {
    if (talla && !tallas.includes(talla)) {
      setTallas([...tallas, talla]);
    }
  };

  const removeTalla = (talla: string) => {
    setTallas(tallas.filter(t => t !== talla));
  };

  const handleActivateOffer = () => {
    setEnOferta(true);
    if (!codigoOferta) {
      setCodigoOferta(generateOfferCode());
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Administrar Productos y Promociones</h1>
      </div>

      <Tabs defaultValue="productos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="codigos">Códigos de Descuento</TabsTrigger>
        </TabsList>

        <TabsContent value="productos">

      {!showForm ? (
        <>
          <Button onClick={() => setShowForm(true)} className="mb-6">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {productos.map((producto) => (
              <Card key={producto.id} className={producto.en_oferta ? 'ring-2 ring-pink-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{producto.nombre}</span>
                    <div className="flex gap-1">
                      {producto.destacado && (
                        <Badge variant="secondary">Destacado</Badge>
                      )}
                      {producto.en_oferta && (
                        <Badge className="bg-pink-500 text-white">
                          {producto.porcentaje_descuento}% OFF
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {producto.imagenes && producto.imagenes[0] && (
                    <img
                      src={producto.imagenes[0]}
                      alt={producto.nombre}
                      className="w-full h-40 object-cover rounded-md mb-4"
                    />
                  )}
                  <div className="space-y-2">
                    {producto.precio_original && producto.precio < producto.precio_original ? (
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-pink-600">${producto.precio}</p>
                        <p className="text-sm line-through text-muted-foreground">${producto.precio_original}</p>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold">${producto.precio}</p>
                    )}
                    {producto.precio_mayoreo && (
                      <p className="text-sm text-muted-foreground">
                        Mayoreo: ${producto.precio_mayoreo} (mín. {producto.cantidad_mayoreo})
                      </p>
                    )}
                    <p className="text-sm">Stock: {producto.stock}</p>
                    {producto.codigo_oferta && (
                      <div className="flex items-center gap-1 text-sm text-pink-600">
                        <Tag className="w-3 h-3" />
                        <span className="font-mono">{producto.codigo_oferta}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleEdit(producto)} size="sm">
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(producto.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nombre">Nombre del Producto *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="precio_original">Precio Original *</Label>
                  <Input
                    id="precio_original"
                    type="number"
                    step="0.01"
                    value={precioOriginal}
                    onChange={(e) => {
                      setPrecioOriginal(e.target.value);
                      if (!enOferta) {
                        setPrecio(e.target.value);
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="precio">Precio Final *</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    disabled={enOferta}
                    required
                  />
                  {enOferta && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculado automáticamente
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Sección de Oferta Especial */}
              <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-pink-500" />
                    <Label className="text-lg font-semibold">Promoción Especial</Label>
                  </div>
                  <Switch
                    checked={enOferta}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleActivateOffer();
                      } else {
                        setEnOferta(false);
                        if (precioOriginal) setPrecio(precioOriginal);
                      }
                    }}
                  />
                </div>

                {enOferta && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="porcentaje">Porcentaje de Descuento</Label>
                        <div className="relative">
                          <Input
                            id="porcentaje"
                            type="number"
                            min="1"
                            max="99"
                            value={porcentajeDescuento}
                            onChange={(e) => setPorcentajeDescuento(e.target.value)}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="codigo">Código de Oferta</Label>
                        <div className="flex gap-2">
                          <Input
                            id="codigo"
                            value={codigoOferta}
                            onChange={(e) => setCodigoOferta(e.target.value.toUpperCase())}
                            placeholder="BRILLA-XXXX"
                            className="font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setCodigoOferta(generateOfferCode())}
                            title="Generar código"
                          >
                            <Tag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="oferta_inicio">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Inicio de Oferta
                        </Label>
                        <Input
                          id="oferta_inicio"
                          type="datetime-local"
                          value={ofertaInicio}
                          onChange={(e) => setOfertaInicio(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="oferta_fin">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Fin de Oferta (Cronómetro)
                        </Label>
                        <Input
                          id="oferta_fin"
                          type="datetime-local"
                          value={ofertaFin}
                          onChange={(e) => setOfertaFin(e.target.value)}
                        />
                      </div>
                    </div>

                    {precioOriginal && porcentajeDescuento && (
                      <div className="bg-background rounded p-3 text-center">
                        <p className="text-sm text-muted-foreground">Precio con descuento:</p>
                        <p className="text-2xl font-bold text-pink-600">
                          ${(parseFloat(precioOriginal) * (1 - parseFloat(porcentajeDescuento) / 100)).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Ahorras: ${(parseFloat(precioOriginal) * parseFloat(porcentajeDescuento) / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precio_mayoreo">Precio Mayoreo</Label>
                  <Input
                    id="precio_mayoreo"
                    type="number"
                    step="0.01"
                    value={precioMayoreo}
                    onChange={(e) => setPrecioMayoreo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cantidad_mayoreo">Cantidad Mínima Mayoreo</Label>
                  <Input
                    id="cantidad_mayoreo"
                    type="number"
                    value={cantidadMayoreo}
                    onChange={(e) => setCantidadMayoreo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej: Bisutería, Accesorios, etc."
                />
              </div>

              <div>
                <Label>Imágenes del Producto *</Label>
                <MultipleImageUpload
                  onImagesUpload={setImagenes}
                  maxImages={5}
                  existingImages={imagenes}
                />
              </div>

              <div>
                <Label>Colores Disponibles</Label>
                <ColorPicker colors={colores} onChange={setColores} />
              </div>

              <div>
                <Label>Tallas Disponibles</Label>
                <div className="flex gap-2 mb-2">
                  {['XS', 'S', 'M', 'L', 'XL'].map((talla) => (
                    <Button
                      key={talla}
                      type="button"
                      variant={tallas.includes(talla) ? "default" : "outline"}
                      size="sm"
                      onClick={() => tallas.includes(talla) ? removeTalla(talla) : addTalla(talla)}
                    >
                      {talla}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activo"
                    checked={activo}
                    onCheckedChange={setActivo}
                  />
                  <Label htmlFor="activo">Producto Activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="destacado"
                    checked={destacado}
                    onCheckedChange={setDestacado}
                  />
                  <Label htmlFor="destacado">Producto Destacado</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'} Producto
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="codigos">
          <DiscountCodes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
