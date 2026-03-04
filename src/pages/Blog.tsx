import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight, ArrowLeft, Newspaper, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Noticia {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido: string;
  categoria: string | null;
  imagen_url: string | null;
  fecha_publicacion: string | null;
  created_at: string | null;
  autor_nombre: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const }
  })
};

const Blog = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Noticia | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("noticias")
        .select("*")
        .eq("activo", true)
        .order("created_at", { ascending: false });
      if (data) setNoticias(data as Noticia[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const categories = [...new Set(noticias.map(n => n.categoria).filter(Boolean))];

  const filtered = noticias.filter(n => {
    const matchSearch = !search || n.titulo.toLowerCase().includes(search.toLowerCase()) || n.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || n.categoria === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/5"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/3"
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Newspaper className="h-14 w-14 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              Blog BRILLARTE
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Noticias, anuncios importantes y todo lo que necesitas saber
            </p>
          </motion.div>
        </div>
      </motion.section>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artículos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!filterCat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCat(null)}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filterCat === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCat(cat === filterCat ? null : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto"
            >
              <Button variant="ghost" onClick={() => setSelected(null)} className="mb-6 group">
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver al blog
              </Button>
              <Card className="overflow-hidden border-0 shadow-xl">
                {selected.imagen_url && (
                  <motion.img
                    layoutId={`img-${selected.id}`}
                    src={selected.imagen_url}
                    alt={selected.titulo}
                    className="w-full h-72 md:h-96 object-cover"
                  />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-3">
                    {selected.categoria && <Badge>{selected.categoria}</Badge>}
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {selected.created_at ? new Date(selected.created_at).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" }) : ""}
                    </span>
                  </div>
                  <CardTitle className="text-3xl leading-tight">{selected.titulo}</CardTitle>
                  {selected.autor_nombre && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                      <User className="h-3.5 w-3.5" /> {selected.autor_nombre}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
                    {selected.contenido}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="py-16 text-center">
                <CardContent>
                  <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {search ? "No se encontraron artículos con esa búsqueda" : "No hay publicaciones todavía. ¡Vuelve pronto!"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((n, i) => (
                <motion.div
                  key={n.id}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer group border hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col"
                    onClick={() => setSelected(n)}
                  >
                    {n.imagen_url ? (
                      <div className="relative overflow-hidden">
                        <motion.img
                          layoutId={`img-${n.id}`}
                          src={n.imagen_url}
                          alt={n.titulo}
                          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {n.categoria && (
                          <Badge className="absolute top-3 left-3 shadow-md">{n.categoria}</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="h-52 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Newspaper className="h-12 w-12 text-primary/30" />
                        {n.categoria && (
                          <Badge className="absolute top-3 left-3">{n.categoria}</Badge>
                        )}
                      </div>
                    )}
                    <CardHeader className="flex-1 flex flex-col">
                      <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {n.titulo}
                      </CardTitle>
                      {n.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{n.descripcion}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {n.created_at ? new Date(n.created_at).toLocaleDateString("es-DO") : ""}
                        </span>
                        <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Ver más <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                      {n.autor_nombre && (
                        <span className="text-xs text-muted-foreground mt-1">{n.autor_nombre}</span>
                      )}
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
