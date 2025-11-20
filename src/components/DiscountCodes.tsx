import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Calendar } from "lucide-react";

interface CodigoDescuento {
  id: string;
  codigo: string;
  porcentaje_descuento: number;
  activo: boolean;
  fecha_inicio: string;
  fecha_expiracion: string | null;
  usos_maximos: number | null;
  usos_actuales: number;
  descripcion: string | null;
}

export const DiscountCodes = () => {
  const [codigos, setCodigos] = useState<CodigoDescuento[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [codigo, setCodigo] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [usosMaximos, setUsosMaximos] = useState("");
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    loadCodigos();
  }, []);

  const loadCodigos = async () => {
    try {
      const { data, error } = await supabase
        .from('codigos_descuento')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodigos(data || []);
    } catch (error) {
      console.error('Error loading codigos:', error);
      toast.error('Error al cargar códigos');
    }
  };

  const resetForm = () => {
    setCodigo("");
    setPorcentaje("");
    setDescripcion("");
    setFechaExpiracion("");
    setUsosMaximos("");
    setActivo(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigo || !porcentaje) {
      toast.error('Código y porcentaje son obligatorios');
      return;
    }

    try {
      const codigoData = {
        codigo: codigo.toUpperCase(),
        porcentaje_descuento: parseFloat(porcentaje),
        descripcion: descripcion || null,
        fecha_expiracion: fechaExpiracion || null,
        usos_maximos: usosMaximos ? parseInt(usosMaximos) : null,
        activo,
      };

      if (editingId) {
        const { error } = await supabase
          .from('codigos_descuento')
          .update(codigoData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Código actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('codigos_descuento')
          .insert([codigoData]);

        if (error) throw error;
        toast.success('Código creado exitosamente');
      }

      resetForm();
      loadCodigos();
    } catch (error: any) {
      console.error('Error saving codigo:', error);
      if (error.code === '23505') {
        toast.error('Este código ya existe');
      } else {
        toast.error('Error al guardar código');
      }
    }
  };

  const handleEdit = (codigo: CodigoDescuento) => {
    setEditingId(codigo.id);
    setCodigo(codigo.codigo);
    setPorcentaje(codigo.porcentaje_descuento.toString());
    setDescripcion(codigo.descripcion || "");
    setFechaExpiracion(codigo.fecha_expiracion || "");
    setUsosMaximos(codigo.usos_maximos?.toString() || "");
    setActivo(codigo.activo);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este código?')) return;

    try {
      const { error } = await supabase
        .from('codigos_descuento')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Código eliminado');
      loadCodigos();
    } catch (error) {
      console.error('Error deleting codigo:', error);
      toast.error('Error al eliminar código');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          Códigos de Descuento
        </h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Código
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editar Código' : 'Nuevo Código de Descuento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="DESCUENTO10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="porcentaje">Porcentaje de Descuento (%) *</Label>
                  <Input
                    id="porcentaje"
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    value={porcentaje}
                    onChange={(e) => setPorcentaje(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Descuento especial para clientes frecuentes"
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_expiracion">Fecha de Expiración</Label>
                  <Input
                    id="fecha_expiracion"
                    type="datetime-local"
                    value={fechaExpiracion}
                    onChange={(e) => setFechaExpiracion(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="usos_maximos">Usos Máximos</Label>
                  <Input
                    id="usos_maximos"
                    type="number"
                    min="1"
                    value={usosMaximos}
                    onChange={(e) => setUsosMaximos(e.target.value)}
                    placeholder="Dejar vacío para ilimitado"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activo"
                  checked={activo}
                  onCheckedChange={setActivo}
                />
                <Label htmlFor="activo">Código Activo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'} Código
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {codigos.map((codigo) => (
            <Card key={codigo.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-mono text-lg">{codigo.codigo}</span>
                  <Badge variant={codigo.activo ? "default" : "secondary"}>
                    {codigo.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-primary">
                  {codigo.porcentaje_descuento}% OFF
                </p>
                {codigo.descripcion && (
                  <p className="text-sm text-muted-foreground">{codigo.descripcion}</p>
                )}
                {codigo.fecha_expiracion && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Expira: {new Date(codigo.fecha_expiracion).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {codigo.usos_maximos && (
                  <p className="text-xs text-muted-foreground">
                    Usos: {codigo.usos_actuales} / {codigo.usos_maximos}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleEdit(codigo)} size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(codigo.id)}
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
      )}
    </div>
  );
};