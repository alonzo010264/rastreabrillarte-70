import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Newspaper, ArrowLeft, ImageIcon, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Noticia {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido: string;
  categoria: string | null;
  imagen_url: string | null;
  activo: boolean | null;
  created_at: string | null;
  fecha_publicacion: string | null;
  autor_nombre: string | null;
}

const AdminNoticias = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    contenido: "",
    categoria: "",
    imagen_url: "",
    activo: true,
  });
  const { toast } = useToast();

  const fetchNoticias = async () => {
    const { data, error } = await supabase
      .from("noticias")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setNoticias(data as Noticia[]);
    setLoading(false);
  };

  useEffect(() => { fetchNoticias(); }, []);

  const resetForm = () => {
    setForm({ titulo: "", descripcion: "", contenido: "", categoria: "", imagen_url: "", activo: true });
    setEditingId(null);
    setImagePreview(null);
  };

  const handleEdit = (n: Noticia) => {
    setForm({
      titulo: n.titulo,
      descripcion: n.descripcion || "",
      contenido: n.contenido,
      categoria: n.categoria || "",
      imagen_url: n.imagen_url || "",
      activo: n.activo ?? true,
    });
    setImagePreview(n.imagen_url || null);
    setEditingId(n.id);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "La imagen no puede ser mayor a 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('noticias-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('noticias-images').getPublicUrl(fileName);
      
      setForm(prev => ({ ...prev, imagen_url: urlData.publicUrl }));
      setImagePreview(urlData.publicUrl);
      toast({ title: "Imagen subida correctamente" });
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, imagen_url: "" }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.titulo || !form.contenido) {
      toast({ title: "Error", description: "Título y contenido son obligatorios", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre_completo')
      .eq('user_id', user?.id || '')
      .maybeSingle();

    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      contenido: form.contenido,
      categoria: form.categoria || null,
      imagen_url: form.imagen_url || null,
      activo: form.activo,
      autor_id: user?.id,
      autor_nombre: profile?.nombre_completo || 'Admin',
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("noticias").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("noticias").insert(payload));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Noticia actualizada" : "Noticia creada" });
      setDialogOpen(false);
      resetForm();
      fetchNoticias();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("noticias").delete().eq("id", id);
    if (!error) {
      toast({ title: "Noticia eliminada" });
      fetchNoticias();
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    await supabase.from("noticias").update({ activo: !activo }).eq("id", id);
    fetchNoticias();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin-dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Gestión de Noticias</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="mb-6"><Plus className="h-4 w-4 mr-2" /> Nueva Noticia</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Noticia" : "Nueva Noticia"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título de la noticia" />
              </div>
              <div>
                <Label>Descripción corta</Label>
                <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Resumen breve" />
              </div>
              <div>
                <Label>Contenido *</Label>
                <Textarea value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Contenido completo de la noticia" rows={6} />
              </div>
              <div>
                <Label>Categoría</Label>
                <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Actualización, Nuevo servicio" />
              </div>
              <div>
                <Label>Imagen</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {!imagePreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-1"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                    ) : (
                      <><ImageIcon className="h-4 w-4 mr-2" /> Subir imagen desde equipo</>
                    )}
                  </Button>
                ) : (
                  <div className="relative mt-2">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.activo} onCheckedChange={(checked) => setForm({ ...form, activo: checked })} />
                <Label>Publicada</Label>
              </div>
              <Button onClick={handleSave} className="w-full">{editingId ? "Guardar cambios" : "Publicar noticia"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : noticias.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No hay noticias aún. ¡Crea la primera!</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {noticias.map((n) => (
              <Card key={n.id} className={!n.activo ? "opacity-60" : ""}>
                <CardHeader className="flex flex-row items-start gap-4">
                  {n.imagen_url && (
                    <img src={n.imagen_url} alt={n.titulo} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{n.titulo}</CardTitle>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={n.activo ?? false} onCheckedChange={() => toggleActivo(n.id, n.activo ?? false)} />
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(n)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    {n.categoria && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{n.categoria}</span>}
                    {n.descripcion && <p className="text-sm text-muted-foreground mt-1">{n.descripcion}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {n.autor_nombre && <span className="font-medium">{n.autor_nombre} · </span>}
                      {n.created_at ? new Date(n.created_at).toLocaleDateString("es-DO") : ""}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminNoticias;
