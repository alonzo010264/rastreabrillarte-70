import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Newspaper, Calendar, Plus, ImageIcon, Loader2, X, BadgeCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import verificadoIcon from "@/assets/verificado-icon.png";
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
  fecha_publicacion: string | null;
  created_at: string | null;
  autor_id: string | null;
  autor_nombre: string | null;
}

interface VerifiedUser {
  user_id: string;
  nombre_completo: string;
  avatar_url: string | null;
  identificador: string | null;
}

const Novedades = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ titulo: "", descripcion: "", contenido: "", categoria: "", imagen_url: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login");
        return;
      }
      setUser(data.user);

      // Check if verified
      const { data: profile } = await supabase
        .from("profiles")
        .select("verificado")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setIsVerified(profile?.verificado || false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch noticias
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });
      if (data) setNoticias(data as Noticia[]);

      // Fetch verified users
      const { data: vUsers } = await supabase
        .from("profiles")
        .select("user_id, nombre_completo, avatar_url, identificador")
        .eq("verificado", true)
        .limit(20);
      if (vUsers) setVerifiedUsers(vUsers);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Máximo 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('noticias-images').upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('noticias-images').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, imagen_url: urlData.publicUrl }));
      setImagePreview(urlData.publicUrl);
    } catch (error: any) {
      toast({ title: "Error al subir imagen", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!form.titulo || !form.contenido) {
      toast({ title: "Error", description: "Título y contenido son obligatorios", variant: "destructive" });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre_completo")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase.from("noticias").insert({
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      contenido: form.contenido,
      categoria: form.categoria || null,
      imagen_url: form.imagen_url || null,
      activo: true,
      autor_id: user.id,
      autor_nombre: profile?.nombre_completo || "Usuario verificado",
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Publicación creada!" });
      setDialogOpen(false);
      setForm({ titulo: "", descripcion: "", contenido: "", categoria: "", imagen_url: "" });
      setImagePreview(null);
      // Reload
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });
      if (data) setNoticias(data as Noticia[]);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Novedades BRILLARTE</h1>
              <p className="text-muted-foreground">Mantente al día con nuestras últimas noticias</p>
            </div>
          </div>
          {isVerified && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Publicar</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva Publicación</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Título" />
                  </div>
                  <div>
                    <Label>Descripción corta</Label>
                    <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Resumen" />
                  </div>
                  <div>
                    <Label>Contenido *</Label>
                    <Textarea value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })} placeholder="Escribe tu publicación..." rows={5} />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ej: Actualización" />
                  </div>
                  <div>
                    <Label>Imagen</Label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {!imagePreview ? (
                      <Button type="button" variant="outline" className="w-full mt-1" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                        {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</> : <><ImageIcon className="h-4 w-4 mr-2" /> Subir imagen</>}
                      </Button>
                    ) : (
                      <div className="relative mt-2">
                        <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                        <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2 h-7 w-7 rounded-full p-0" onClick={() => { setImagePreview(null); setForm(p => ({ ...p, imagen_url: "" })); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button onClick={handlePublish} className="w-full">Publicar</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Verified Users Section */}
        {verifiedUsers.length > 0 && !selectedNoticia && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" /> Cuentas Verificadas
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {verifiedUsers.map((vu) => (
                <button
                  key={vu.user_id}
                  onClick={() => navigate(`/perfil/${vu.identificador || vu.user_id}`)}
                  className="flex flex-col items-center gap-1 min-w-[72px] hover:opacity-80 transition"
                >
                  <Avatar className="h-14 w-14 ring-2 ring-primary">
                    <AvatarImage src={vu.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {vu.nombre_completo?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate max-w-[72px]">
                    {vu.identificador ? `@${vu.identificador}` : vu.nombre_completo}
                  </span>
                  <img src={verificadoIcon} alt="Verificado" className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedNoticia ? (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setSelectedNoticia(null)} className="text-primary hover:underline mb-4 text-sm">
              ← Volver a novedades
            </button>
            <Card>
              {selectedNoticia.imagen_url && (
                <img src={selectedNoticia.imagen_url} alt={selectedNoticia.titulo} className="w-full h-64 object-cover rounded-t-lg" />
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {selectedNoticia.categoria && <Badge variant="secondary">{selectedNoticia.categoria}</Badge>}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedNoticia.created_at ? new Date(selectedNoticia.created_at).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" }) : ""}
                  </span>
                </div>
                <CardTitle className="text-2xl">{selectedNoticia.titulo}</CardTitle>
                {selectedNoticia.autor_nombre && (
                  <p className="text-sm text-muted-foreground">Por {selectedNoticia.autor_nombre}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selectedNoticia.contenido}</p>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : noticias.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No hay novedades por ahora. ¡Vuelve pronto!</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {noticias.map((n) => (
              <Card key={n.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedNoticia(n)}>
                {n.imagen_url && (
                  <img src={n.imagen_url} alt={n.titulo} className="w-full h-48 object-cover rounded-t-lg" />
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-1">
                    {n.categoria && <Badge variant="secondary" className="text-xs">{n.categoria}</Badge>}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{n.titulo}</CardTitle>
                  {n.descripcion && <p className="text-sm text-muted-foreground line-clamp-2">{n.descripcion}</p>}
                  <div className="flex items-center justify-between mt-2">
                    {n.autor_nombre && (
                      <span className="text-xs font-medium text-primary">{n.autor_nombre}</span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {n.created_at ? new Date(n.created_at).toLocaleDateString("es-DO") : ""}
                    </span>
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

export default Novedades;
