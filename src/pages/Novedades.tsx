import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Noticia {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido: string;
  categoria: string | null;
  imagen_url: string | null;
  fecha_publicacion: string | null;
  created_at: string | null;
}

const Novedades = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedNoticia, setSelectedNoticia] = useState<Noticia | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login");
        return;
      }
      setUser(data.user);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchNoticias = async () => {
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });
      if (data) setNoticias(data as Noticia[]);
      setLoading(false);
    };
    fetchNoticias();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novedades BRILLARTE</h1>
            <p className="text-muted-foreground">Mantente al día con nuestras últimas noticias</p>
          </div>
        </div>

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
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{selectedNoticia.contenido}</p>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <p className="text-muted-foreground text-center py-12">Cargando novedades...</p>
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
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    {n.created_at ? new Date(n.created_at).toLocaleDateString("es-DO") : ""}
                  </span>
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
